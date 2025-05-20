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

    // These are temporary demo credentials - replace with your actual Cloudinary credentials
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dhdvcvisi";
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || "871274638732918";
    const apiSecret = process.env.CLOUDINARY_API_SECRET || "wDmk1U-p8wO_aTmOgWfM0JE98qA";

    // Log the configuration for debugging
    console.log("Cloudinary config:", { 
      cloudName,
      apiKeyLength: apiKey?.length || 0,
      apiSecretLength: apiSecret?.length || 0
    });

    // Initialize Cloudinary
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    });

    // Generate a timestamp and signature for the upload
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request({
      timestamp: timestamp,
      folder: 'snapscape/competitions/covers',
      // You can add other upload parameters here if needed
      // For example: transformation: [{ width: 1200, height: 600, crop: 'fill' }]
    }, apiSecret);

    // Return the necessary data for direct upload
    return res.status(200).json({
      success: true,
      signature,
      timestamp,
      cloudName,
      apiKey,
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