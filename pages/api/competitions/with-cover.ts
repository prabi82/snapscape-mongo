import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Competition from '@/models/Competition';
import { uploadToCloudinary } from '@/lib/cloudinary';
import formidable from 'formidable';
import { promises as fs } from 'fs';

// Set the body parser config to accept large files
export const config = {
  api: {
    bodyParser: false, // Disable the default body parser
    sizeLimit: '10mb',
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Check if user is authenticated and admin
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only administrators can create competitions' });
    }

    await connectDB();

    // Use formidable to parse the multipart form data
    const form = new formidable.IncomingForm({
      maxFileSize: 10 * 1024 * 1024, // 10MB in bytes
      keepExtensions: true,
    });

    // Parse the form data
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Error parsing form data:', err);
          reject(err);
        } else {
          resolve([fields, files]);
        }
      });
    });

    // Prepare competition data
    const competitionData: any = {
      title: fields.title?.[0] || fields.title,
      description: fields.description?.[0] || fields.description,
      theme: fields.theme?.[0] || fields.theme,
      rules: fields.rules?.[0] || fields.rules || '',
      prizes: fields.prizes?.[0] || fields.prizes || '',
      status: fields.status?.[0] || fields.status,
      startDate: fields.startDate?.[0] || fields.startDate,
      endDate: fields.endDate?.[0] || fields.endDate,
      votingEndDate: fields.votingEndDate?.[0] || fields.votingEndDate,
      submissionLimit: Number(fields.submissionLimit?.[0] || fields.submissionLimit) || 5,
      votingCriteria: fields.votingCriteria?.[0] || fields.votingCriteria || '',
      createdBy: session.user.id,
    };
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'theme', 'startDate', 'endDate', 'votingEndDate'];
    for (const field of requiredFields) {
      if (!competitionData[field]) {
        return res.status(400).json({ success: false, message: `Field '${field}' is required` });
      }
    }

    // Upload cover image to Cloudinary if provided
    const coverImageFile = files.coverImage;
    if (coverImageFile) {
      try {
        console.log('Starting cover image upload to Cloudinary...');
        
        // Get the file path from formidable
        const filePath = Array.isArray(coverImageFile) 
          ? coverImageFile[0].filepath 
          : coverImageFile.filepath;
          
        // Read the file from disk
        const fileBuffer = await fs.readFile(filePath);
        
        console.log('Cover image file details:', {
          type: Array.isArray(coverImageFile) ? coverImageFile[0].mimetype : coverImageFile.mimetype,
          size: Array.isArray(coverImageFile) ? coverImageFile[0].size : coverImageFile.size,
          name: Array.isArray(coverImageFile) ? coverImageFile[0].originalFilename : coverImageFile.originalFilename
        });
        
        // Upload to Cloudinary
        const uploadResult = await uploadToCloudinary(fileBuffer, {
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
        return res.status(500).json({ 
          success: false, 
          message: `Error uploading cover image: ${uploadError.message}` 
        });
      }
    } else {
      console.log('No cover image file provided');
    }

    // Create competition in database
    const competition = await Competition.create(competitionData);

    return res.status(201).json({
      success: true,
      message: 'Competition created successfully',
      data: competition
    });
  } catch (error: any) {
    console.error('Error creating competition with cover:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'An error occurred while creating the competition' 
    });
  }
} 