import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import PhotoSubmission from '@/models/PhotoSubmission';
import Competition from '@/models/Competition';
import Photo from '@/models/Photo';
import Rating from '@/models/Rating';
import mongoose from 'mongoose';

interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

interface BaseQuery {
  competition: { $exists: boolean; $ne: null };
  user?: string;
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
      photoSubmissions: 0,
      photos: 0,
      ratings: 0,
      votingPoints: 0
    };
    
    // Optional: Get specific user ID from query parameter to clean up for just one user
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    // 1. Get all competition IDs that actually exist
    const validCompetitionIds = await Competition.find({}, { _id: 1 })
      .lean()
      .then(competitions => competitions.map(comp => (comp._id as mongoose.Types.ObjectId).toString()));
    
    console.log(`Found ${validCompetitionIds.length} valid competitions`);
    
    // 2. Find photo submissions with competitions that don't exist anymore
    const baseQuery: BaseQuery = { 
      competition: { $exists: true, $ne: null }
    };
    
    // Add user filter if specified
    if (userId) {
      baseQuery.user = userId;
    }
    
    const orphanedSubmissions = await PhotoSubmission.find(baseQuery)
      .lean();
    
    // Filter to only keep submissions whose competition ID is not in the valid list
    const filteredOrphans = orphanedSubmissions.filter(sub => {
      const competitionId = sub.competition.toString();
      return !validCompetitionIds.includes(competitionId);
    });
    
    console.log(`Found ${filteredOrphans.length} orphaned submissions`);
    
    // Create a list of all orphaned competition IDs (for cleaning up votes)
    const orphanedCompetitionIds = [...new Set(filteredOrphans.map(sub => 
      sub.competition.toString()
    ))];
    
    console.log(`Found ${orphanedCompetitionIds.length} orphaned competition IDs`);
    
    if (filteredOrphans.length === 0 && orphanedCompetitionIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No orphaned submissions found to clean up',
        deleteSummary
      });
    }
    
    // Get IDs of orphaned submissions
    const orphanedIds = filteredOrphans.map(sub => sub._id);
    
    // 3. Delete ratings for orphaned submissions
    console.log('Deleting ratings for orphaned submissions...');
    const ratingDeleteResult = await Rating.deleteMany({ photo: { $in: orphanedIds } });
    console.log('Ratings delete outcome:', ratingDeleteResult);
    deleteSummary.ratings = ratingDeleteResult.deletedCount;
    
    // 4. Find ALL photo submissions from orphaned competitions (to clean up votes)
    if (orphanedCompetitionIds.length > 0) {
      // Find all photo IDs from orphaned competitions
      const allOrphanedPhotoIds = await PhotoSubmission.find(
        { competition: { $in: orphanedCompetitionIds } },
        { _id: 1 }
      )
      .lean()
      .then(docs => docs.map(doc => doc._id));
      
      // Delete all votes/ratings for these photos - this ensures voting points are removed
      console.log(`Deleting all votes for ${allOrphanedPhotoIds.length} photos from orphaned competitions...`);
      const votingPointsResult = await Rating.deleteMany({ 
        photo: { $in: allOrphanedPhotoIds } 
      });
      console.log('Voting points delete outcome:', votingPointsResult);
      deleteSummary.votingPoints = votingPointsResult.deletedCount;
    }
    
    // 5. Delete the orphaned submissions
    console.log('Deleting orphaned submissions...');
    const submissionDeleteResult = await PhotoSubmission.deleteMany({ 
      _id: { $in: orphanedIds } 
    });
    console.log('Submission delete outcome:', submissionDeleteResult);
    deleteSummary.photoSubmissions = submissionDeleteResult.deletedCount;
    
    // 6. Also find and delete orphaned photos from the older model
    console.log('Finding orphaned photos from Photo model...');
    const orphanedPhotos = await Photo.find(baseQuery).lean();
    
    // Filter to only keep photos whose competition ID is not in the valid list
    const filteredOrphanedPhotos = orphanedPhotos.filter(photo => {
      const competitionId = photo.competition.toString();
      return !validCompetitionIds.includes(competitionId);
    });
    
    console.log(`Found ${filteredOrphanedPhotos.length} orphaned photos`);
    
    if (filteredOrphanedPhotos.length > 0) {
      // Get IDs of orphaned photos
      const orphanedPhotoIds = filteredOrphanedPhotos.map(photo => photo._id);
      
      // Delete the orphaned photos
      console.log('Deleting orphaned photos...');
      const photoDeleteResult = await Photo.deleteMany({ 
        _id: { $in: orphanedPhotoIds } 
      });
      console.log('Photo delete outcome:', photoDeleteResult);
      deleteSummary.photos = photoDeleteResult.deletedCount;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Orphaned submissions and voting points cleaned up successfully',
      deleteSummary
    });
    
  } catch (error: any) {
    console.error('Error cleaning up orphaned submissions:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred while cleaning up orphaned submissions' },
      { status: 500 }
    );
  }
} 