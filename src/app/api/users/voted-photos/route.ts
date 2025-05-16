import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Rating from '@/models/Rating';
import PhotoSubmission from '@/models/PhotoSubmission';
import mongoose from 'mongoose';
import { Session } from 'next-auth';

interface PhotoSubmissionDocument {
  _id: mongoose.Types.ObjectId;
  [key: string]: any;
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions) as Session | null;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get userId from query params or use current user
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') || session.user.id;
    
    // Add pagination (defaulting to a high limit to get all photos)
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;
    
    // Connect to database
    await dbConnect();
    
    // Find all ratings by the user
    const ratings = await Rating.find({ user: userId }).lean();
    
    // Get unique photo IDs
    const uniquePhotoIds = new Set<string>();
    ratings.forEach(rating => {
      uniquePhotoIds.add(rating.photo.toString());
    });
    
    const photoIds = Array.from(uniquePhotoIds);
    console.log(`[VOTED-PHOTOS] User ${userId} has ${photoIds.length} unique photos rated`);
    
    // Fetch the actual photo details for each ID
    const votedPhotos = await PhotoSubmission.find({
      _id: { $in: photoIds }
    })
    .populate('competition', 'title')
    .lean() as PhotoSubmissionDocument[];
    
    console.log(`[VOTED-PHOTOS] Found ${votedPhotos.length} out of ${photoIds.length} photos in PhotoSubmission collection`);
    
    // Find missing photo IDs for debugging
    const foundPhotoIds = votedPhotos.map(photo => photo._id.toString());
    const missingPhotoIds = photoIds.filter(id => !foundPhotoIds.includes(id));
    
    if (missingPhotoIds.length > 0) {
      console.log(`[VOTED-PHOTOS] Missing ${missingPhotoIds.length} photos from PhotoSubmission: `, missingPhotoIds);
    }
    
    // Apply pagination to the results
    const paginatedPhotos = votedPhotos.slice(skip, skip + limit);
    
    // Combine rating info with photo details
    const photosWithRatings = paginatedPhotos.map(photo => {
      const userRating = ratings.find(r => r.photo.toString() === photo._id.toString());
      return {
        ...photo,
        userRating: userRating ? userRating.score : null,
      };
    });
    
    return NextResponse.json({
      success: true,
      data: photosWithRatings,
      total: votedPhotos.length,
      count: photosWithRatings.length,
      page,
      limit,
      pages: Math.ceil(votedPhotos.length / limit)
    });
    
  } catch (error: any) {
    console.error('Error fetching voted photos:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 