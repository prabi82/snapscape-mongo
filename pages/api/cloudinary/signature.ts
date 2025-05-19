import { NextApiRequest, NextApiResponse } from 'next';
import { v2 as cloudinary } from 'cloudinary';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    // Initialize Cloudinary (should already be initialized in your app)
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });

    // Generate a timestamp and signature for the upload
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request({
      timestamp: timestamp,
      folder: 'snapscape/competitions/covers',
      // You can add other upload parameters here if needed
      // For example: transformation: [{ width: 1200, height: 600, crop: 'fill' }]
    }, process.env.CLOUDINARY_API_SECRET || '');

    // Return the necessary data for direct upload
    return res.status(200).json({
      success: true,
      signature,
      timestamp,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      folder: 'snapscape/competitions/covers'
    });
  } catch (error: any) {
    console.error('Error generating Cloudinary signature:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'An error occurred while generating signature' 
    });
  }
} 