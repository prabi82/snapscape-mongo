import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Competition from '@/models/Competition';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('API: Competition with cover upload started');
  
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
    console.log('API: Connected to DB');

    // Parse form data
    console.log('API: Starting to parse form data');
    const formData = await request.formData();
    console.log('API: Form data parsed successfully');
    
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
        console.log(`API: Starting cover image upload to Cloudinary... (${((Date.now() - startTime) / 1000).toFixed(2)}s elapsed)`);
        
        // Get file details before processing
        console.log('API: Cover image file details:', {
          type: coverImageFile.type,
          size: coverImageFile.size,
          name: coverImageFile.name,
          sizeInMB: (coverImageFile.size / (1024 * 1024)).toFixed(2) + ' MB'
        });

        // Validate file size (5MB max)
        if (coverImageFile.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { success: false, message: 'Image size must be less than 5MB' },
            { status: 400 }
          );
        }
        
        console.log(`API: Reading file buffer... (${((Date.now() - startTime) / 1000).toFixed(2)}s elapsed)`);
        const arrayBuffer = await coverImageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        console.log(`API: File buffer created, size: ${(buffer.length / (1024 * 1024)).toFixed(2)} MB (${((Date.now() - startTime) / 1000).toFixed(2)}s elapsed)`);
        
        console.log(`API: Starting Cloudinary upload... (${((Date.now() - startTime) / 1000).toFixed(2)}s elapsed)`);
        const uploadResult = await uploadToCloudinary(buffer, {
          folder: 'snapscape/competitions/covers',
          resource_type: 'image',
          transformation: [
            { quality: 'auto:good' },
            { width: 1200, height: 600, crop: 'fill' },
          ]
        });

        console.log(`API: Cloudinary upload completed (${((Date.now() - startTime) / 1000).toFixed(2)}s elapsed)`);

        if (uploadResult && uploadResult.secure_url) {
          competitionData.coverImage = uploadResult.secure_url;
          console.log('API: Cover image URL set to:', competitionData.coverImage);
        } else {
          console.error('API: No secure_url in Cloudinary upload result');
        }
      } catch (uploadError: any) {
        console.error(`API: Error uploading cover image (${((Date.now() - startTime) / 1000).toFixed(2)}s elapsed):`, uploadError);
        return NextResponse.json(
          { success: false, message: `Error uploading cover image: ${uploadError.message}` },
          { status: 500 }
        );
      }
    } else {
      console.log('API: No cover image file provided');
    }

    // Create competition in database
    console.log(`API: Creating competition in database... (${((Date.now() - startTime) / 1000).toFixed(2)}s elapsed)`);
    const competition = await Competition.create(competitionData);
    console.log(`API: Competition created successfully (${((Date.now() - startTime) / 1000).toFixed(2)}s elapsed)`);

    return NextResponse.json({
      success: true,
      message: 'Competition created successfully',
      data: competition
    });
  } catch (error: any) {
    console.error(`API: Error creating competition with cover (${((Date.now() - startTime) / 1000).toFixed(2)}s elapsed):`, error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred while creating the competition' },
      { status: 500 }
    );
  }
} 