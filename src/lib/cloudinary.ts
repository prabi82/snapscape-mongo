import { v2 as cloudinary } from 'cloudinary';

// Keep track of initialization status
let isInitialized = false;

// Configure Cloudinary once at startup
function initializeCloudinary() {
  try {
    // Get the credentials from environment variables
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
    const apiKey = process.env.CLOUDINARY_API_KEY || '';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || '';
    
    // Log availability of credentials (not the actual values for security)
    console.log('Cloudinary initialization check:', {
      hasCloudName: Boolean(cloudName),
      cloudNameLength: cloudName.length,
      hasApiKey: Boolean(apiKey),
      apiKeyLength: apiKey.length,
      hasApiSecret: Boolean(apiSecret),
      apiSecretLength: apiSecret.length
    });
    
    // Validate credentials
    if (!cloudName || !apiKey || !apiSecret) {
      console.warn('⚠️ Missing Cloudinary credentials in environment variables');
      return false;
    }
    
    // Check for common format issues
    if (apiSecret.includes('cloudinary://')) {
      console.warn('⚠️ API Secret appears to be in URL format - should be just the secret value');
      // Try to extract the secret from the URL
      try {
        const url = new URL(apiSecret);
        const extractedSecret = url.password;
        if (extractedSecret) {
          console.log('Attempting to extract secret from URL format');
          cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: extractedSecret,
            secure: true
          });
          isInitialized = true;
          return true;
        }
      } catch (e) {
        console.error('Failed to parse API secret as URL:', e);
      }
    }
    
    // Regular initialization
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    });
    
    console.log('✅ Cloudinary initialized successfully');
    isInitialized = true;
    return true;
  } catch (error) {
    console.error('❌ Error initializing Cloudinary:', error);
    return false;
  }
}

// Try to initialize Cloudinary right away
initializeCloudinary();

/**
 * Check if Cloudinary is configured correctly by performing a simple API call
 * @returns Promise that resolves to a boolean indicating if Cloudinary is working
 */
export async function verifyCloudinaryConnection(): Promise<boolean> {
  try {
    // Ensure Cloudinary is initialized
    if (!isInitialized) {
      const success = initializeCloudinary();
      if (!success) {
        return false;
      }
    }
    
    // Test the connection with a ping
    const result = await cloudinary.api.ping();
    return result && result.status === 'ok';
  } catch (error) {
    console.error('Cloudinary verification failed:', error);
    return false;
  }
}

/**
 * Upload an image to Cloudinary
 * 
 * @param buffer The image buffer to upload
 * @param options Additional upload options
 * @returns Promise with the upload result
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  options: any = {}
): Promise<any> {
  return new Promise((resolve, reject) => {
    // Ensure Cloudinary is initialized
    if (!isInitialized) {
      const success = initializeCloudinary();
      if (!success) {
        return reject(new Error('Cloudinary is not properly configured. Check your environment variables.'));
      }
    }

    // Log Cloudinary configuration (but not the actual secrets)
    console.log('Cloudinary upload configuration:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      options: {
        folder: options.folder,
        public_id: options.public_id,
      }
    });

    // Basic upload options
    const uploadOptions = {
      ...options,
      overwrite: true,
      resource_type: 'auto'
    };

    // Convert buffer to base64 data URI (works better than raw buffers)
    const base64Data = buffer.toString('base64');
    const dataURI = `data:image/jpeg;base64,${base64Data}`;

    // Use simple upload method
    cloudinary.uploader.upload(
      dataURI,
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(error);
        }
        console.log('Upload successful, result:', {
          public_id: result.public_id,
          url: result.secure_url,
          format: result.format,
          resource_type: result.resource_type
        });
        return resolve(result);
      }
    );
  });
}

/**
 * Delete an image from Cloudinary
 * 
 * @param publicId The public ID of the image to delete
 * @returns Promise with the deletion result
 */
export async function deleteFromCloudinary(publicId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    // Ensure Cloudinary is initialized
    if (!isInitialized) {
      const success = initializeCloudinary();
      if (!success) {
        return reject(new Error('Cloudinary is not properly configured. Check your environment variables.'));
      }
    }

    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error('Cloudinary delete error:', error);
        return reject(error);
      }
      return resolve(result);
    });
  });
}

/**
 * Generate a Cloudinary URL with transformations
 * 
 * @param publicId The public ID of the image
 * @param transformations The transformations to apply
 * @returns The transformed image URL
 */
export function getCloudinaryUrl(
  publicId: string,
  transformations: Record<string, any> = {}
): string {
  // Ensure Cloudinary is initialized
  if (!isInitialized) {
    initializeCloudinary();
  }
  
  return cloudinary.url(publicId, transformations);
}

// Re-export the Cloudinary instance
export default cloudinary; 