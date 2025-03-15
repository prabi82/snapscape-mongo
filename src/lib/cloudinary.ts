import { v2 as cloudinary } from 'cloudinary';

// Function to get Cloudinary config (called on-demand to ensure latest env vars)
function getCloudinaryConfig() {
  const config = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  };

  // Validate Cloudinary configuration
  if (!config.cloud_name || !config.api_key || !config.api_secret) {
    console.error('Missing Cloudinary configuration. Please check your environment variables.', {
      cloud_name_exists: !!config.cloud_name,
      api_key_exists: !!config.api_key,
      api_secret_exists: !!config.api_secret
    });
  }

  return config;
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
    // Get latest config and configure cloudinary
    const cloudinaryConfig = getCloudinaryConfig();
    
    // Always configure with latest config before each operation
    cloudinary.config({
      cloud_name: cloudinaryConfig.cloud_name || '',
      api_key: cloudinaryConfig.api_key || '',
      api_secret: cloudinaryConfig.api_secret || '',
    });

    // Check if Cloudinary is properly configured
    if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
      return reject(new Error('Cloudinary is not properly configured. Check your environment variables.'));
    }

    console.log('Cloudinary config for upload:', {
      cloud_name: cloudinaryConfig.cloud_name,
      api_key_length: cloudinaryConfig.api_key?.length,
      api_secret_length: cloudinaryConfig.api_secret?.length,
      api_secret_first4: cloudinaryConfig.api_secret?.substring(0, 4),
    });

    const uploadOptions = {
      ...options,
      // Don't use transformation here, it might be causing signature issues
      overwrite: true,
    };

    // Convert buffer to base64 for Cloudinary
    const base64String = `data:image/png;base64,${buffer.toString('base64')}`;

    cloudinary.uploader.upload(
      base64String,
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(error);
        }
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
    // Get latest config and configure cloudinary
    const cloudinaryConfig = getCloudinaryConfig();
    
    // Always configure with latest config before each operation
    cloudinary.config({
      cloud_name: cloudinaryConfig.cloud_name || '',
      api_key: cloudinaryConfig.api_key || '',
      api_secret: cloudinaryConfig.api_secret || '',
    });
    
    // Check if Cloudinary is properly configured
    if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
      return reject(new Error('Cloudinary is not properly configured. Check your environment variables.'));
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
  // Get latest config and configure cloudinary
  const cloudinaryConfig = getCloudinaryConfig();
  
  // Always configure with latest config before each operation
  cloudinary.config({
    cloud_name: cloudinaryConfig.cloud_name || '',
    api_key: cloudinaryConfig.api_key || '',
    api_secret: cloudinaryConfig.api_secret || '',
  });
  
  return cloudinary.url(publicId, transformations);
} 