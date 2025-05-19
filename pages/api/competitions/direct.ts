import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Competition from '@/models/Competition';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    
    // Get data from request body
    const {
      title,
      description,
      theme,
      rules,
      prizes,
      status,
      startDate,
      endDate,
      votingEndDate,
      submissionLimit,
      votingCriteria,
      coverImageUrl, // This now comes as a URL from Cloudinary
      cropX,
      cropY,
      cropWidth,
      cropHeight
    } = req.body;
    
    // Prepare competition data
    const competitionData: any = {
      title,
      description,
      theme,
      rules: rules || '',
      prizes: prizes || '',
      status,
      startDate,
      endDate,
      votingEndDate,
      submissionLimit: Number(submissionLimit) || 5,
      votingCriteria: votingCriteria || '',
      createdBy: session.user.id,
      // Use the pre-uploaded image URL
      coverImage: coverImageUrl,
      // Store crop data if provided
      ...(cropX !== undefined && { cropX: Number(cropX) }),
      ...(cropY !== undefined && { cropY: Number(cropY) }),
      ...(cropWidth !== undefined && { cropWidth: Number(cropWidth) }),
      ...(cropHeight !== undefined && { cropHeight: Number(cropHeight) })
    };
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'theme', 'startDate', 'endDate', 'votingEndDate'];
    for (const field of requiredFields) {
      if (!competitionData[field]) {
        return res.status(400).json({ success: false, message: `Field '${field}' is required` });
      }
    }

    // Create competition in database
    const competition = await Competition.create(competitionData);

    return res.status(201).json({
      success: true,
      message: 'Competition created successfully',
      data: competition
    });
  } catch (error: any) {
    console.error('Error creating competition:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'An error occurred while creating the competition' 
    });
  }
} 