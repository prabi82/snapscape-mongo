/**
 * Image compression utility for client-side image processing
 * Compresses images above 3MB threshold while maintaining high quality
 */

interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  quality?: number;
  initialQuality?: number;
  alwaysKeepResolution?: boolean;
}

interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  quality: number;
}

/**
 * Compresses an image file to meet size requirements
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxSizeMB = 8, // Default to 8MB for good balance (can be overridden)
    maxWidthOrHeight = 3840, // Support 4K resolution (3840x2160)
    quality: targetQuality = 0.85, // Slightly higher quality
    initialQuality = 0.95, // Start with higher quality
    alwaysKeepResolution = false
  } = options;

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  const originalSize = file.size;

  // Always compress if this function is called - the caller decides when to compress
  // We don't return early here since the caller already determined compression is needed

  console.log(`Starting compression: ${(originalSize / 1024 / 1024).toFixed(2)}MB -> target: ${maxSizeMB}MB`);

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = async () => {
      try {
        let { width, height } = img;
        let currentQuality = initialQuality;

        // Calculate optimal dimensions - preserve high resolution for desktop viewing
        if (!alwaysKeepResolution && (width > maxWidthOrHeight || height > maxWidthOrHeight)) {
          const ratio = Math.min(maxWidthOrHeight / width, maxWidthOrHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
          console.log(`Resizing from ${img.width}x${img.height} to ${width}x${height} for better desktop viewing`);
        } else {
          console.log(`Keeping original resolution: ${width}x${height} for optimal quality`);
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Try different quality levels to achieve target size
        let compressedFile: File | null = null;
        let attempts = 0;
        const maxAttempts = 10;
        
        // For files over 3MB, we want to achieve meaningful compression
        // Target around 60-80% of original size for good balance
        const targetSizeBytes = Math.min(maxSizeBytes, originalSize * 0.7); // Target 70% of original or maxSize, whichever is smaller

        while (attempts < maxAttempts) {
          // For PNG files, convert to JPEG for better compression
          const outputType = file.type === 'image/png' ? 'image/jpeg' : file.type;
          
          const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, outputType, currentQuality);
          });

          if (!blob) {
            reject(new Error('Failed to create blob from canvas'));
            return;
          }

          // Update filename extension if we converted PNG to JPEG
          const fileName = file.type === 'image/png' && outputType === 'image/jpeg' 
            ? file.name.replace(/\.png$/i, '.jpg')
            : file.name;
            
          compressedFile = new File([blob], fileName, {
            type: outputType,
            lastModified: Date.now(),
          });

          const compressedSize = compressedFile.size;
          console.log(`Attempt ${attempts + 1}: Quality ${currentQuality.toFixed(2)} -> ${(compressedSize / 1024 / 1024).toFixed(2)}MB (target: ${(targetSizeBytes / 1024 / 1024).toFixed(2)}MB)`);

          // If we've achieved the target size, we're done
          if (compressedSize <= targetSizeBytes) {
            break;
          }

          // If this is our last attempt, use what we have
          if (attempts === maxAttempts - 1) {
            break;
          }

          // Reduce quality more aggressively to achieve meaningful compression
          currentQuality = Math.max(0.4, currentQuality * 0.85); // More aggressive reduction, minimum 40% quality
          attempts++;
        }

        if (!compressedFile) {
          reject(new Error('Failed to compress image'));
          return;
        }

        const result: CompressionResult = {
          file: compressedFile,
          originalSize,
          compressedSize: compressedFile.size,
          compressionRatio: compressedFile.size / originalSize,
          quality: currentQuality
        };

        console.log(`Compression complete: ${(originalSize / 1024 / 1024).toFixed(2)}MB -> ${(result.compressedSize / 1024 / 1024).toFixed(2)}MB (${Math.round(result.compressionRatio * 100)}% of original)`);

        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Validates if a file is a supported image type
 */
export function isValidImageType(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Gets image dimensions without loading the full image
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image for dimension check'));
    };
    img.src = URL.createObjectURL(file);
  });
} 