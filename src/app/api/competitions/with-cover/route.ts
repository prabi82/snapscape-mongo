import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Competition from '@/models/Competition';
import { uploadToCloudinary } from '@/lib/cloudinary';

export const runtime = 'nodejs';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and admin
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Only administrators can create competitions' },
        { status: 403 }
      );
    }

    await connectDB();

    // Parse form data
    const formData = await request.formData();
    
    // Extract cover image file
    const coverImageFile = formData.get('coverImage') as File;
    
    // Prepare competition data
    const competitionData: any = {
      title: formData.get('title'),
      description: formData.get('description'),
      theme: formData.get('theme'),
      rules: formData.get('rules') || '',
      prizes: formData.get('prizes') || '',
      status: formData.get('status'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      votingEndDate: formData.get('votingEndDate'),
      submissionLimit: Number(formData.get('submissionLimit')) || 5,
      votingCriteria: formData.get('votingCriteria') || '',
      createdBy: session.user.id,
    };
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'theme', 'startDate', 'endDate', 'votingEndDate'];
    for (const field of requiredFields) {
      if (!competitionData[field]) {
        return NextResponse.json(
          { success: false, message: `Field '${field}' is required` },
          { status: 400 }
        );
      }
    }

    // Upload cover image to Cloudinary if provided
    if (coverImageFile) {
      try {
        console.log('Starting cover image upload to Cloudinary...');
        const arrayBuffer = await coverImageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        console.log('Cover image file details:', {
          type: coverImageFile.type,
          size: coverImageFile.size,
          name: coverImageFile.name
        });
        
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
          competitionData.coverImage = uploadResult.secure_url;
          console.log('Cover image URL set to:', competitionData.coverImage);
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
      console.log('No cover image file provided');
    }

    // Create competition in database
    const competition = await Competition.create(competitionData);

    return NextResponse.json({
      success: true,
      message: 'Competition created successfully',
      data: competition
    });
  } catch (error: any) {
    console.error('Error creating competition with cover:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred while creating the competition' },
      { status: 500 }
    );
  }
} 