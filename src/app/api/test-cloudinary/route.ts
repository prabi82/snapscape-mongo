import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function GET() {
  try {
    // Check the raw environment variable values (partially masked for security)
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
    const apiKey = process.env.CLOUDINARY_API_KEY || '';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || '';
    
    // Log environment variables for debugging
    console.log("Cloudinary env check:", {
      cloudName: cloudName,
      cloudNameLength: cloudName.length,
      apiKey: apiKey.substring(0, 4) + '...' + (apiKey.length > 4 ? apiKey.substring(apiKey.length - 2) : ''),
      apiKeyLength: apiKey.length,
      apiSecret: apiSecret.substring(0, 4) + '...' + (apiSecret.length > 4 ? apiSecret.substring(apiSecret.length - 2) : ''),
      apiSecretLength: apiSecret.length
    });
    
    // Safe check of environment variables - with additional validation
    const envStatus = {
      cloudName: cloudName ? `Set (${cloudName})` : 'Not set',
      apiKey: apiKey ? `Set (length: ${apiKey.length})` : 'Not set',
      apiSecret: apiSecret ? `Set (length: ${apiSecret.length})` : 'Not set',
    };
    
    // Validate each credential
    const validationProblems = [];
    if (!cloudName) validationProblems.push('Cloud name is missing');
    if (!apiKey) validationProblems.push('API key is missing');
    if (!apiSecret) validationProblems.push('API secret is missing');
    
    if (apiSecret && apiSecret.startsWith('cloudinary://')) {
      validationProblems.push('API secret appears to be in URL format - should be just the secret value');
    }
    
    // Test Cloudinary connection with explicit configuration
    console.log("Testing Cloudinary connection with API ping...");
    let testResult;
    try {
      // Test with a new configuration (bypassing the lib/cloudinary.ts file)
      const tempCloudinary = require('cloudinary').v2;
      tempCloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true
      });
      
      testResult = await tempCloudinary.api.ping();
      console.log("Cloudinary test result:", testResult);
    } catch (pingError) {
      console.error("Cloudinary ping error:", pingError);
      
      // Analyze the error to give better guidance
      let errorHint = '';
      if (pingError.message && pingError.message.includes('authentication required')) {
        errorHint = 'Authentication error - API key or secret might be incorrect';
      } else if (pingError.message && pingError.message.includes('not found')) {
        errorHint = 'Resource not found - Cloud name might be incorrect';
      } else if (pingError.message && pingError.message.includes('network')) {
        errorHint = 'Network error - Check internet connection';
      }
      
      return NextResponse.json({
        success: false,
        envStatus,
        validationProblems,
        error: pingError.message,
        errorName: pingError.name,
        errorHint,
        cloudinaryConfig: {
          cloudName,
        }
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      envStatus,
      validationProblems,
      cloudinaryStatus: testResult.status === 'ok' ? 'Connected' : 'Not connected',
      testResult,
      cloudinaryConfig: {
        cloudName,
      }
    });
  } catch (error: any) {
    console.error("Cloudinary connection error:", error);
    
    return NextResponse.json({
      success: false,
      envStatus: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not set',
        apiKey: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set',
        apiSecret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set',
      },
      error: error.message,
      stack: error.stack,
      errorName: error.name,
      cloudinaryConfig: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      }
    }, { status: 500 });
  }
} 