import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import mongoose from 'mongoose';
import Rating from "@/models/Rating";
import PhotoSubmission from "@/models/PhotoSubmission";
import { Session } from "next-auth";

// Extend the Session type to include our custom user properties
interface ExtendedSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

// Define Rating interface to avoid type errors with static methods
interface RatingModel extends mongoose.Model<any> {
  calcAverageRatings: (photoId: mongoose.Types.ObjectId) => Promise<void>;
  findDuplicateRatings: (userId: string) => Promise<{
    hasDuplicates: boolean;
    duplicateCount: number;
    duplicates: any[];
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication - require admin
    const session = await getServerSession(authOptions) as ExtendedSession | null;
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    // Connect to database
    await dbConnect();
    
    // Collect stats for response
    const stats = {
      ratingsBefore: 0,
      orphanedRatingsRemoved: 0,
      duplicateRatingsRemoved: 0,
      ratingsAfter: 0,
      affectedUsers: new Set<string>()
    };
    
    // Step 1: Get all ratings from the database
    const allRatings = await Rating.find({}).lean();
    stats.ratingsBefore = allRatings.length;
    
    // Step 2: Find orphaned ratings (ratings for photos that don't exist)
    const photoIds = new Set(allRatings.map((rating: any) => rating.photo.toString()));
    const validPhotoIds = new Set<string>();
    
    // Check which photos actually exist
    for (const photoId of Array.from(photoIds)) {
      // Use ObjectId to avoid errors with invalid IDs
      try {
        const photoExists = await PhotoSubmission.exists({ 
          _id: new mongoose.Types.ObjectId(photoId) 
        });
        
        if (photoExists) {
          validPhotoIds.add(photoId);
        }
      } catch (error) {
        console.log(`Invalid photo ID format: ${photoId}`);
      }
    }
    
    // Collect orphaned ratings
    const orphanedRatingIds: mongoose.Types.ObjectId[] = [];
    const affectedUsersByOrphaned = new Set<string>();
    
    for (const rating of allRatings) {
      if (!validPhotoIds.has((rating.photo as mongoose.Types.ObjectId).toString())) {
        orphanedRatingIds.push(rating._id as mongoose.Types.ObjectId);
        affectedUsersByOrphaned.add((rating.user as mongoose.Types.ObjectId).toString());
      }
    }
    
    // Delete orphaned ratings
    if (orphanedRatingIds.length > 0) {
      const result = await Rating.deleteMany({ _id: { $in: orphanedRatingIds } });
      stats.orphanedRatingsRemoved = result.deletedCount;
    }
    
    // Add affected users to the main set
    for (const userId of Array.from(affectedUsersByOrphaned)) {
      stats.affectedUsers.add(userId);
    }
    
    // Step 3: Get the remaining ratings and fix duplicates
    const remainingRatings = await Rating.find({}).lean();
    
    // Use a Map to track unique photo+user combinations
    const uniqueKeys = new Map<string, any>();
    const duplicatesToRemove: mongoose.Types.ObjectId[] = [];
    
    // Identify duplicates
    for (const rating of remainingRatings) {
      const key = `${(rating.user as mongoose.Types.ObjectId).toString()}-${(rating.photo as mongoose.Types.ObjectId).toString()}`;
      
      if (uniqueKeys.has(key)) {
        // This is a duplicate - keep the first one
        duplicatesToRemove.push(rating._id as mongoose.Types.ObjectId);
        stats.affectedUsers.add((rating.user as mongoose.Types.ObjectId).toString());
      } else {
        uniqueKeys.set(key, rating);
      }
    }
    
    // Delete duplicate ratings
    if (duplicatesToRemove.length > 0) {
      const result = await Rating.deleteMany({ _id: { $in: duplicatesToRemove } });
      stats.duplicateRatingsRemoved = result.deletedCount;
    }
    
    // Step 4: Recalculate all averages for photos that had ratings changed
    const affectedPhotoIds = new Set<string>([
      ...Array.from(uniqueKeys.values()).map((rating: any) => (rating.photo as mongoose.Types.ObjectId).toString()),
      ...orphanedRatingIds.map(id => {
        const rating = allRatings.find(r => (r._id as mongoose.Types.ObjectId).toString() === id.toString());
        return rating ? (rating.photo as mongoose.Types.ObjectId).toString() : null;
      }).filter(Boolean) as string[]
    ]);
    
    // Update rating counts and averages for affected photos
    const ratingModel = Rating as RatingModel;
    for (const photoId of Array.from(affectedPhotoIds)) {
      try {
        // Use the static method to recalculate
        await ratingModel.calcAverageRatings(new mongoose.Types.ObjectId(photoId));
      } catch (error) {
        console.error(`Error updating photo stats for ${photoId}:`, error);
      }
    }
    
    // Get final count
    stats.ratingsAfter = await Rating.countDocuments();
    
    return NextResponse.json({
      success: true,
      message: 'Cleanup process completed successfully',
      stats: {
        ...stats,
        affectedUsers: Array.from(stats.affectedUsers),
        totalRatingsRemoved: stats.orphanedRatingsRemoved + stats.duplicateRatingsRemoved,
        affectedPhotoCount: affectedPhotoIds.size
      }
    });
  } catch (error: any) {
    console.error("Error cleaning up votes:", error);
    return NextResponse.json(
      { success: false, message: error.message || "An error occurred" },
      { status: 500 }
    );
  }
} 