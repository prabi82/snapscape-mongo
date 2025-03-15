import { v2 as cloudinary } from 'cloudinary';

/**
 * Initialize Cloudinary with environment variables
 * @returns The configured Cloudinary instance
 */
export function initCloudinaryFromEnv() {
  // Get environment variables
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
  const apiKey = process.env.CLOUDINARY_API_KEY || '';
  const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

  // Check if all required variables are present
  if (!cloudName || !apiKey || !apiSecret) {
    console.error('Cloudinary initialization error: Missing environment variables', {
      hasCloudName: Boolean(cloudName),
      hasApiKey: Boolean(apiKey),
      hasApiSecret: Boolean(apiSecret)
    });
    throw new Error('Missing Cloudinary credentials in environment variables');
  }

  // Configure Cloudinary with environment variables
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });

  console.log('Cloudinary initialized from environment variables');
  return cloudinary;
}

/**
 * Initialize Cloudinary with explicit credentials
 * @param credentials The Cloudinary credentials
 * @returns The configured Cloudinary instance
 */
export function initCloudinaryWithCredentials(credentials: {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}) {
  // Check if all required credentials are present
  if (!credentials.cloudName || !credentials.apiKey || !credentials.apiSecret) {
    console.error('Cloudinary initialization error: Missing credentials', {
      hasCloudName: Boolean(credentials.cloudName),
      hasApiKey: Boolean(credentials.apiKey),
      hasApiSecret: Boolean(credentials.apiSecret)
    });
    throw new Error('Missing Cloudinary credentials');
  }

  // Configure Cloudinary with provided credentials
  cloudinary.config({
    cloud_name: credentials.cloudName,
    api_key: credentials.apiKey,
    api_secret: credentials.apiSecret,
    secure: true
  });

  console.log('Cloudinary initialized with explicit credentials');
  return cloudinary;
}

/**
 * Initialize Cloudinary from a Cloudinary URL
 * @param url The Cloudinary URL (cloudinary://API_KEY:API_SECRET@CLOUD_NAME)
 * @returns The configured Cloudinary instance
 */
export function initCloudinaryFromUrl(url: string) {
  if (!url || !url.startsWith('cloudinary://')) {
    throw new Error('Invalid Cloudinary URL format. Must start with cloudinary://');
  }

  try {
    // Configure Cloudinary from URL
    cloudinary.config({
      url: url,
      secure: true
    });

    console.log('Cloudinary initialized from URL');
    return cloudinary;
  } catch (error) {
    console.error('Error initializing Cloudinary from URL:', error);
    throw error;
  }
}

/**
 * Test the Cloudinary connection
 * @returns Promise resolving to the ping result
 */
export async function testCloudinaryConnection() {
  try {
    const result = await cloudinary.api.ping();
    console.log('Cloudinary connection test successful:', result);
    return {
      success: true,
      result
    };
  } catch (error) {
    console.error('Cloudinary connection test failed:', error);
    return {
      success: false,
      error
    };
  }
}

// Default export - use environment variables
export default cloudinary; 