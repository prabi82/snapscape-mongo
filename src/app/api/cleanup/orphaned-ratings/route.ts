import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Rating from '@/models/Rating';
import PhotoSubmission from '@/models/PhotoSubmission';
import Photo from '@/models/Photo';
import mongoose from 'mongoose';

interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Only allow admins to run this cleanup
    if ((session.user as ExtendedUser).role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Only administrators can perform this operation' },
        { status: 403 }
      );
    }
    
    // Connect to the database
    await dbConnect();
    
    // Create a summary object to track what was deleted
    const deleteSummary = {
      orphanedRatings: 0,
      userBreakdown: {} as Record<string, number>
    };
    
    // Optional: Get specific user ID from query parameter to clean up for just one user
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    // 1. Get all valid photo IDs from both PhotoSubmission and Photo models
    console.log('Gathering valid photo IDs...');
    const validPhotoSubmissionIds = await PhotoSubmission.find({}, { _id: 1 })
      .lean()
      .then(docs => docs.map(doc => (doc._id as mongoose.Types.ObjectId).toString()));
    
    const validPhotoIds = await Photo.find({}, { _id: 1 })
      .lean()
      .then(docs => docs.map(doc => (doc._id as mongoose.Types.ObjectId).toString()));
    
    // Combine both sets of valid IDs
    const allValidPhotoIds = new Set([...validPhotoSubmissionIds, ...validPhotoIds]);
    
    console.log(`Found ${allValidPhotoIds.size} valid photos in the database`);
    
    // 2. Find ratings with photos that don't exist anymore
    const baseQuery: any = {};
    
    // Add user filter if specified
    if (userId) {
      baseQuery.user = userId;
    }
    
    // Find all ratings
    const allRatings = await Rating.find(baseQuery).lean();
    console.log(`Found ${allRatings.length} total ratings`);
    
    // Filter to only keep ratings whose photo ID is not in the valid list
    const orphanedRatings = allRatings.filter(rating => {
      const photoId = rating.photo.toString();
      return !allValidPhotoIds.has(photoId);
    });
    
    console.log(`Found ${orphanedRatings.length} orphaned ratings`);
    
    if (orphanedRatings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No orphaned ratings found to clean up',
        deleteSummary
      });
    }
    
    // Group orphaned ratings by user to show breakdown
    const orphanedRatingsByUser = new Map<string, number>();
    
    orphanedRatings.forEach(rating => {
      const userId = rating.user.toString();
      orphanedRatingsByUser.set(userId, (orphanedRatingsByUser.get(userId) || 0) + 1);
    });
    
    // Convert Map to object for response
    orphanedRatingsByUser.forEach((count, userId) => {
      deleteSummary.userBreakdown[userId] = count;
    });
    
    // Get IDs of orphaned ratings
    const orphanedIds = orphanedRatings.map(rating => rating._id);
    
    // Delete the orphaned ratings
    console.log('Deleting orphaned ratings...');
    const ratingDeleteResult = await Rating.deleteMany({ 
      _id: { $in: orphanedIds } 
    });
    
    console.log('Rating delete outcome:', ratingDeleteResult);
    deleteSummary.orphanedRatings = ratingDeleteResult.deletedCount;
    
    return NextResponse.json({
      success: true,
      message: 'Orphaned ratings cleaned up successfully',
      deleteSummary,
      userSummary: Object.entries(deleteSummary.userBreakdown).map(([userId, count]) => ({
        userId,
        ratingsRemoved: count
      }))
    });
    
  } catch (error: any) {
    console.error('Error cleaning up orphaned ratings:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred while cleaning up orphaned ratings' },
      { status: 500 }
    );
  }
} 