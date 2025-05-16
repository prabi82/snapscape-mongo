import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import mongoose from 'mongoose';
import Rating from "@/models/Rating";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    // Get all ratings from the database
    const allRatings = await Rating.find({}).lean();
    
    // Use a Map to track unique photo+user combinations
    const uniqueKeys = new Map();
    const duplicatesToRemove = [];
    
    // First pass: identify duplicates
    allRatings.forEach((rating: any) => {
      const key = `${rating.user.toString()}-${rating.photo.toString()}`;
      
      if (uniqueKeys.has(key)) {
        // Keep the first occurrence, mark others for removal
        duplicatesToRemove.push(rating._id);
      } else {
        uniqueKeys.set(key, rating);
      }
    });
    
    // Delete duplicate ratings
    const deletionResults = { deletedCount: 0 };
    if (duplicatesToRemove.length > 0) {
      const result = await Rating.deleteMany({ _id: { $in: duplicatesToRemove } });
      deletionResults.deletedCount = result.deletedCount;
    }
    
    // Calculate corrected votes per user
    const votesPerUser = {};
    uniqueKeys.forEach((rating: any) => {
      const userId = rating.user.toString();
      if (!votesPerUser[userId]) {
        votesPerUser[userId] = new Set();
      }
      votesPerUser[userId].add(rating.photo.toString());
    });
    
    // Convert to array for the response
    const userVoteCounts = Object.entries(votesPerUser).map(([userId, photos]) => ({
      userId,
      uniqueVoteCount: (photos as Set<string>).size
    }));
    
    return NextResponse.json({
      success: true,
      message: `Fixed ${deletionResults.deletedCount} duplicate ratings`,
      stats: {
        totalRatingsOriginal: allRatings.length,
        uniqueRatingsAfterFix: uniqueKeys.size,
        duplicatesRemoved: deletionResults.deletedCount
      },
      userVoteCounts
    });
  } catch (error: any) {
    console.error("Error fixing ratings:", error);
    return NextResponse.json(
      { success: false, message: error.message || "An error occurred" },
      { status: 500 }
    );
  }
} 