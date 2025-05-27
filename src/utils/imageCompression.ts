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

  // If file is already small enough, return as-is
  if (originalSize <= maxSizeBytes) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      quality: 1
    };
  }

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
        const maxAttempts = 8;

        while (attempts < maxAttempts) {
          const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, file.type, currentQuality);
          });

          if (!blob) {
            reject(new Error('Failed to create blob from canvas'));
            return;
          }

          compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });

          const compressedSize = compressedFile.size;
          console.log(`Attempt ${attempts + 1}: Quality ${currentQuality.toFixed(2)} -> ${(compressedSize / 1024 / 1024).toFixed(2)}MB`);

          // If we've achieved the target size, we're done
          if (compressedSize <= maxSizeBytes) {
            break;
          }

          // If this is our last attempt, use what we have
          if (attempts === maxAttempts - 1) {
            break;
          }

          // Reduce quality more gradually to preserve image quality
          currentQuality = Math.max(0.3, currentQuality * 0.9); // Less aggressive reduction, minimum 30% quality
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