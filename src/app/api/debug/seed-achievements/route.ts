import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Result from '@/models/Result';
import PhotoSubmission from '@/models/PhotoSubmission';
import Competition from '@/models/Competition';
import { Session } from 'next-auth';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions) as Session | null;
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Connect to the database
    await dbConnect();
    
    // First, get all user's photos
    const userPhotos = await PhotoSubmission.find({ user: session.user.id })
      .populate('competition')
      .sort({ createdAt: -1 })
      .lean();
    
    if (userPhotos.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No photos found for the user. Please upload some photos first.' },
        { status: 400 }
      );
    }
    
    // Delete any existing results for the user
    await Result.deleteMany({ user: session.user.id });
    
    // Find all competitions to create achievements for
    // Group photos by competition to ensure we don't create duplicates
    const competitionMap = new Map();
    
    userPhotos.forEach(photo => {
      if (photo.competition && !competitionMap.has(photo.competition._id.toString())) {
        competitionMap.set(photo.competition._id.toString(), {
          competitionId: photo.competition._id,
          photoId: photo._id,
          title: photo.competition.title
        });
      }
    });
    
    // Convert to array and take up to 3 competitions
    const competitions = Array.from(competitionMap.values()).slice(0, 3);
    
    if (competitions.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid competitions found in your submissions.' },
        { status: 400 }
      );
    }
    
    // Create achievements for different positions
    const results: mongoose.Document[] = [];
    const positions = [1, 2, 3]; // 1st, 2nd, and 3rd places
    
    // Assign each competition a different position
    for (let i = 0; i < competitions.length; i++) {
      const comp = competitions[i];
      const position = positions[i % positions.length]; // Cycle through positions
      
      // Create a result
      const result = new Result({
        competition: comp.competitionId,
        user: session.user.id,
        photo: comp.photoId,
        position: position,
        finalScore: (6 - position) - Math.random(), // Score based on position (higher for better positions)
        prize: position === 1 ? 'Gold Medal' : position === 2 ? 'Silver Medal' : 'Bronze Medal',
      });
      
      await result.save();
      results.push(result);
    }
    
    return NextResponse.json({
      success: true,
      message: `Created ${results.length} achievement records for user.`,
      data: {
        results
      }
    });
    
  } catch (error: any) {
    console.error('Error seeding achievements:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred while seeding achievements' },
      { status: 500 }
    );
  }
} 