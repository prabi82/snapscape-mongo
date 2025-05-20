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

    // Get Cloudinary credentials from environment variables with fallbacks for development/testing
    // IMPORTANT: Replace these with your actual Cloudinary credentials in production environment variables
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dpxuzscso";
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || "569119329184156";
    const apiSecret = process.env.CLOUDINARY_API_SECRET || "mXxpw8ZpwAA3sIcvJeTJ9LtvGS8";

    // Log configurations for debugging
    console.log("Cloudinary configuration check:", {
      cloudName,
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
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