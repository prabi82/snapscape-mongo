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

    // Get Cloudinary credentials from environment variables
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // Detailed logging for debugging
    console.log("Environment variables check:", {
      NODE_ENV: process.env.NODE_ENV,
      hasCloudName: !!cloudName,
      cloudNameLength: cloudName?.length || 0,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      hasApiSecret: !!apiSecret,
      apiSecretLength: apiSecret?.length || 0
    });

    // Verify that credentials exist
    if (!cloudName || !apiKey || !apiSecret) {
      console.error("Missing Cloudinary environment variables");
      return res.status(500).json({ 
        success: false, 
        message: "Server configuration error: Missing Cloudinary credentials"
      });
    }

    // Initialize Cloudinary
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    });

    // Test Cloudinary configuration
    try {
      // Simple ping to Cloudinary to verify credentials
      const result = await cloudinary.api.ping();
      console.log("Cloudinary ping successful:", result);
    } catch (cloudinaryError) {
      console.error("Cloudinary ping failed:", cloudinaryError);
      return res.status(500).json({
        success: false,
        message: "Cloudinary connection test failed. Please check your credentials."
      });
    }

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