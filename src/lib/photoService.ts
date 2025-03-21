import Photo from '@/models/Photo';
import dbConnect from './dbConnect';

/**
 * Get the count of photos uploaded by a user
 * @param userId The ID of the user
 * @returns The number of photos uploaded by the user
 */
export const getPhotoCountByUser = async (userId: string): Promise<number> => {
  try {
    await dbConnect();
    const count = await Photo.countDocuments({ user: userId });
    return count;
  } catch (error) {
    console.error('Error counting user photos:', error);
    return 0;
  }
};

/**
 * Get the latest photos uploaded by a user
 * @param userId The ID of the user
 * @param limit The maximum number of photos to return
 * @returns An array of photos
 */
export const getLatestPhotosByUser = async (userId: string, limit = 5) => {
  try {
    await dbConnect();
    const photos = await Photo.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('title imageUrl thumbnailUrl createdAt');
    return photos;
  } catch (error) {
    console.error('Error fetching user photos:', error);
    return [];
  }
}; 