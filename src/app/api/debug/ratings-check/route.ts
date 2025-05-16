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
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    // Get all ratings from the database
    const allRatings = await Rating.find({}).lean();
    
    // Use a Map to track unique photo+user combinations and check for duplicates
    const uniqueKeys = new Map();
    const duplicates = [];
    
    // First pass: identify duplicates
    allRatings.forEach(rating => {
      const key = `${rating.user.toString()}-${rating.photo.toString()}`;
      
      if (uniqueKeys.has(key)) {
        duplicates.push({
          key,
          ids: [uniqueKeys.get(key)._id.toString(), rating._id.toString()],
          user: rating.user.toString(),
          photo: rating.photo.toString(),
        });
      } else {
        uniqueKeys.set(key, rating);
      }
    });
    
    // Calculate votes per user
    const votesPerUser = {};
    allRatings.forEach(rating => {
      const userId = rating.user.toString();
      if (!votesPerUser[userId]) {
        votesPerUser[userId] = new Set();
      }
      votesPerUser[userId].add(rating.photo.toString());
    });
    
    // Convert to array for the response
    const userVoteCounts = Object.entries(votesPerUser).map(([userId, photos]) => ({
      userId,
      uniqueVoteCount: (photos as Set<string>).size,
      voteDetails: Array.from(photos as Set<string>)
    }));
    
    return NextResponse.json({
      success: true,
      message: "Database vote analysis completed",
      stats: {
        totalRatings: allRatings.length,
        uniqueUserPhotoRatings: uniqueKeys.size,
        duplicateCount: duplicates.length
      },
      duplicates: duplicates.slice(0, 10), // Limit to first 10 for display
      userVoteCounts
    });
  } catch (error: any) {
    console.error("Error in rating check endpoint:", error);
    return NextResponse.json(
      { success: false, message: error.message || "An error occurred" },
      { status: 500 }
    );
  }
} 