import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
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
    
    // Only allow admins to run this endpoint
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Only administrators can run this operation' },
        { status: 403 }
      );
    }

    // Connect to the database
    await dbConnect();
    
    // Fix the indexes on the Result collection
    const result = await ensureProperIndexes();
    
    return NextResponse.json({
      success: true,
      message: 'Database indexes fixed successfully',
      data: result
    });
    
  } catch (error: any) {
    console.error('Error fixing database indexes:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred while fixing database indexes' },
      { status: 500 }
    );
  }
}

// Helper function to ensure the proper indexes exist
async function ensureProperIndexes() {
  try {
    // Get the Result collection directly from MongoDB
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    
    const resultCollection = db.collection('results');
    
    // Get all existing indexes
    const existingIndexes = await resultCollection.indexes();
    const indexesBefore = [...existingIndexes];
    
    // Track what we did
    const actions: {
      droppedIndexes: string[];
      createdIndexes: string[];
      existingGoodIndexes: string[];
    } = {
      droppedIndexes: [],
      createdIndexes: [],
      existingGoodIndexes: []
    };
    
    // Check if we need to drop the problematic index
    const problemIndex = existingIndexes.find(idx => 
      idx.key && idx.key.competition === 1 && idx.key.user === 1 && !idx.key.position
    );
    
    if (problemIndex && problemIndex.name) {
      // Drop the problematic index
      await resultCollection.dropIndex(problemIndex.name);
      console.log(`Dropped problematic index: ${problemIndex.name}`);
      actions.droppedIndexes.push(problemIndex.name);
    }
    
    // Ensure our correct indexes exist
    const positionIndex = existingIndexes.find(idx => 
      idx.key && idx.key.competition === 1 && idx.key.position === 1 && idx.key.user === 1
    );
    
    if (!positionIndex) {
      // Create the correct index
      await resultCollection.createIndex(
        { competition: 1, position: 1, user: 1 }, 
        { unique: true, name: 'competition_position_user_unique' }
      );
      console.log('Created correct competition_position_user_unique index');
      actions.createdIndexes.push('competition_position_user_unique');
    } else {
      console.log('Correct position index already exists');
      if (positionIndex.name) {
        actions.existingGoodIndexes.push(positionIndex.name);
      }
    }
    
    // Check for photo index
    const photoIndex = existingIndexes.find(idx => 
      idx.key && idx.key.competition === 1 && idx.key.photo === 1
    );
    
    if (!photoIndex) {
      // Create the photo index
      await resultCollection.createIndex(
        { competition: 1, photo: 1 }, 
        { unique: true, name: 'competition_photo_unique' }
      );
      console.log('Created competition_photo_unique index');
      actions.createdIndexes.push('competition_photo_unique');
    } else {
      console.log('Photo index already exists');
      if (photoIndex.name) {
        actions.existingGoodIndexes.push(photoIndex.name);
      }
    }
    
    // Get the updated indexes
    const updatedIndexes = await resultCollection.indexes();
    
    return {
      indexesBefore,
      indexesAfter: updatedIndexes,
      actions
    };
  } catch (error) {
    console.error('Error ensuring proper indexes:', error);
    throw error;
  }
} 