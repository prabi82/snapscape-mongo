import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export async function GET() {
  try {
    // Log environment variables for debugging
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'missing';
    const apiKey = process.env.CLOUDINARY_API_KEY || 'missing';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || 'missing';
    
    console.log('Cloudinary Environment Variables:');
    console.log('CLOUDINARY_CLOUD_NAME:', cloudName);
    console.log('CLOUDINARY_API_KEY:', apiKey?.substring(0, 4) + '...');
    console.log('CLOUDINARY_API_SECRET:', apiSecret?.substring(0, 4) + '...');
    
    // Configure cloudinary with current env vars
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    
    // Test connection by fetching account info
    try {
      // Use a simple ping request to test connectivity
      const result = await new Promise((resolve, reject) => {
        cloudinary.api.ping((error, result) => {
          if (error) reject(error);
          resolve(result);
        });
      });
      
      return NextResponse.json({
        success: true,
        message: 'Cloudinary connection successful',
        config: {
          cloud_name: cloudName,
          api_key_exists: !!apiKey,
          api_secret_exists: !!apiSecret,
        },
        result
      });
    } catch (cloudinaryError: any) {
      console.error('Cloudinary API Error:', cloudinaryError);
      return NextResponse.json({
        success: false,
        message: 'Cloudinary connection failed',
        error: cloudinaryError.message,
        config: {
          cloud_name: cloudName,
          api_key_exists: !!apiKey,
          api_secret_exists: !!apiSecret,
        }
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Server Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Server error',
      error: error.message,
    }, { status: 500 });
  }
} 