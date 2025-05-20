import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Competition from '@/models/Competition';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const { id } = params;
    
    // Log debugging information
    console.log('PUT with-cover for competition:', id);
    
    // Check authentication and admin role
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Only administrators can update competitions' },
        { status: 403 }
      );
    }
    
    // Check if competition exists
    const existingCompetition = await Competition.findById(id);
    if (!existingCompetition) {
      return NextResponse.json(
        { success: false, message: 'Competition not found' },
        { status: 404 }
      );
    }
    
    // Parse form data
    const formData = await request.formData();
    
    // Extract competition data
    const updateData: any = {};
    for (const [key, value] of formData.entries()) {
      if (key !== 'coverImage') {
        updateData[key] = value;
      }
    }
    
    // Convert boolean fields from string to proper boolean
    if (typeof updateData.hideOtherSubmissions === 'string') {
      updateData.hideOtherSubmissions = updateData.hideOtherSubmissions === 'true';
    } else if (updateData.hideOtherSubmissions === undefined && existingCompetition.hideOtherSubmissions !== undefined) {
      // If not provided in the form, preserve the existing value
      updateData.hideOtherSubmissions = existingCompetition.hideOtherSubmissions;
    }
    
    // Log the detailed information about the hideOtherSubmissions field
    console.log('hideOtherSubmissions details:', {
      existingValue: existingCompetition.hideOtherSubmissions,
      formValue: formData.get('hideOtherSubmissions'),
      processedValue: updateData.hideOtherSubmissions
    });
    
    // Log the update data for debugging
    console.log('Competition update data:', {
      id,
      ...updateData,
      hasCoverImage: formData.has('coverImage'),
      hideOtherSubmissions: updateData.hideOtherSubmissions
    });
    
    // Handle cover image
    const coverImageFile = formData.get('coverImage') as File;
    if (coverImageFile && coverImageFile.size > 0) {
      try {
        console.log('Starting cover image upload to Cloudinary...');
        console.log('Cover image file details:', {
          type: coverImageFile.type,
          size: coverImageFile.size,
          name: coverImageFile.name
        });
        
        // Validate file size (5MB max)
        if (coverImageFile.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { success: false, message: 'Image size must be less than 5MB' },
            { status: 400 }
          );
        }
        
        const arrayBuffer = await coverImageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const uploadResult = await uploadToCloudinary(buffer, {
          folder: 'snapscape/competitions/covers',
          resource_type: 'image',
          transformation: [
            { quality: 'auto:good' },
            { width: 1200, height: 600, crop: 'fill' },
          ]
        });
        
        console.log('Cloudinary upload result:', uploadResult);
        
        if (uploadResult && uploadResult.secure_url) {
          updateData.coverImage = uploadResult.secure_url;
          console.log('Cover image URL set to:', updateData.coverImage);
        } else {
          console.error('No secure_url in Cloudinary upload result');
        }
      } catch (uploadError: any) {
        console.error('Error uploading cover image:', uploadError);
        return NextResponse.json(
          { success: false, message: `Error uploading cover image: ${uploadError.message}` },
          { status: 500 }
        );
      }
    } else {
      console.log('No new cover image provided, keeping existing cover image');
    }
    
    // Get original competition dates if not provided in the update
    if (!updateData.startDate && existingCompetition.startDate) {
      updateData.startDate = existingCompetition.startDate;
    }
    if (!updateData.endDate && existingCompetition.endDate) {
      updateData.endDate = existingCompetition.endDate;
    }
    if (!updateData.votingEndDate && existingCompetition.votingEndDate) {
      updateData.votingEndDate = existingCompetition.votingEndDate;
    }
    
    // Parse all dates to ensure proper format
    const startDate = new Date(updateData.startDate);
    const endDate = new Date(updateData.endDate);
    const votingEndDate = new Date(updateData.votingEndDate);
    
    // Validate date formats
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || isNaN(votingEndDate.getTime())) {
      return NextResponse.json(
        { success: false, message: 'One or more dates have invalid format' },
        { status: 400 }
      );
    }
    
    // Manually validate date relationships
    if (endDate <= startDate) {
      return NextResponse.json(
        { success: false, message: 'End date must be after start date' },
        { status: 400 }
      );
    }
    
    if (votingEndDate <= endDate) {
      return NextResponse.json(
        { success: false, message: 'Voting end date must be after submission end date' },
        { status: 400 }
      );
    }
    
    // Update the dates with the validated Date objects
    updateData.startDate = startDate;
    updateData.endDate = endDate;
    updateData.votingEndDate = votingEndDate;
    
    console.log('Final update data with parsed dates:', {
      id,
      startDate: updateData.startDate,
      endDate: updateData.endDate,
      votingEndDate: updateData.votingEndDate
    });
    
    // Update competition with new data
    const result = await Competition.updateOne(
      { _id: id },
      { $set: updateData },
      { runValidators: false }
    );
    
    // Force update for hideOtherSubmissions if it's still not working
    if (updateData.hideOtherSubmissions !== undefined) {
      // Direct update with a separate operation to ensure it's saved
      await Competition.updateOne(
        { _id: id },
        { $set: { hideOtherSubmissions: !!updateData.hideOtherSubmissions } },
        { runValidators: false }
      );
      console.log('Forced update of hideOtherSubmissions (with-cover):', !!updateData.hideOtherSubmissions);
    }
    
    // Fetch the updated competition
    const updatedCompetition = await Competition.findById(id);
    
    // Log the updated competition to verify cover image is saved
    console.log('Updated competition:', {
      id: updatedCompetition._id,
      title: updatedCompetition.title,
      hasCoverImage: !!updatedCompetition.coverImage,
      coverImage: updatedCompetition.coverImage,
      hideOtherSubmissions: updatedCompetition.hideOtherSubmissions
    });
    
    return NextResponse.json({
      success: true,
      message: 'Competition updated successfully',
      data: updatedCompetition
    });
  } catch (error: any) {
    console.error('Error updating competition with cover:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred while updating the competition' },
      { status: 500 }
    );
  }
} 