import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';
import { Session } from 'next-auth';

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
    
    // Get the Result collection directly from MongoDB
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    
    const resultCollection = db.collection('results');
    
    // Get all existing indexes
    const existingIndexes = await resultCollection.indexes();
    console.log('Existing indexes:', existingIndexes);
    
    // Drop all indexes except the _id index
    const dropPromises = existingIndexes
      .filter(index => index.name && index.name !== '_id_')
      .map(index => index.name ? resultCollection.dropIndex(index.name) : Promise.resolve());
    
    await Promise.all(dropPromises);
    console.log(`Dropped ${dropPromises.length} indexes`);
    
    // Create new indexes
    await resultCollection.createIndex(
      { competition: 1, position: 1, user: 1 }, 
      { unique: true, name: 'competition_position_user_unique' }
    );
    
    await resultCollection.createIndex(
      { competition: 1, photo: 1 }, 
      { unique: true, name: 'competition_photo_unique' }
    );
    
    // Get the updated indexes
    const updatedIndexes = await resultCollection.indexes();
    
    return NextResponse.json({
      success: true,
      message: 'Indexes rebuilt successfully',
      data: {
        before: existingIndexes,
        after: updatedIndexes
      }
    });
    
  } catch (error: any) {
    console.error('Error rebuilding indexes:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred while rebuilding indexes' },
      { status: 500 }
    );
  }
} 