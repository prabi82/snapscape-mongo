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
    // @ts-ignore - Adding type ignore since 'role' is a custom field we added to the session
    if (session.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only administrators can create competitions' });
    }

    // Get Cloudinary credentials from environment variables - use exact names from Vercel
    // These names match what's shown in the Vercel environment variables screenshot
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // Validate credentials
    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Missing Cloudinary credentials in environment:', {
        hasCloudName: !!cloudName,
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret
      });
      return res.status(500).json({ 
        success: false, 
        message: 'Server configuration error: Missing Cloudinary credentials'
      });
    }

    // Log configurations for debugging (without exposing sensitive data)
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