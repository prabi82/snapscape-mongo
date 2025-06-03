import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Rating from '@/models/Rating';
import { Types } from 'mongoose';

// Define extended session interface
interface ExtendedSession {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

// Define Rating document interface
interface RatingDocument {
  _id: Types.ObjectId;
  score: number;
  user: Types.ObjectId;
  photo: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// DELETE a rating
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('\n=== RATING DELETE REQUEST START ===');
  
  try {
    // Step 1: Connect to database
    console.log('[RATING DELETE] Step 1: Connecting to database...');
    await dbConnect();
    console.log('[RATING DELETE] Step 1: Database connected ✓');
    
    // Step 2: Get session
    console.log('[RATING DELETE] Step 2: Getting session...');
    const session = await getServerSession(authOptions as any) as ExtendedSession;
    console.log('[RATING DELETE] Step 2: Session result:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userRole: session?.user?.role
    });
    
    // Step 3: Extract ID (await params for Next.js 15)
    const { id } = await params;
    console.log('[RATING DELETE] Step 3: Rating ID:', id);
    
    // Step 4: Authentication check
    console.log('[RATING DELETE] Step 4: Checking authentication...');
    if (!session?.user?.id) {
      console.log('[RATING DELETE] Step 4: FAILED - No session or user ID');
      return NextResponse.json(
        { success: false, message: 'Not authenticated', debug: 'No session or user ID' },
        { status: 401 }
      );
    }
    console.log('[RATING DELETE] Step 4: Authentication passed ✓');
    
    // Step 5: Check if rating exists and belongs to user
    console.log('[RATING DELETE] Step 5: Checking rating existence and ownership...');
    const rating = await Rating.findOne({ _id: id, user: session.user.id }).lean() as RatingDocument | null;
    console.log('[RATING DELETE] Step 5: Query result:', {
      found: !!rating,
      ratingId: rating?._id,
      ratingScore: rating?.score,
      ratingUserId: rating?.user?.toString(),
      ratingPhotoId: rating?.photo?.toString()
    });
    
    if (!rating) {
      console.log('[RATING DELETE] Step 5: FAILED - Rating not found or not authorized');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Rating not found or not authorized',
          debug: `No rating with ID: ${id} for user: ${session.user.id}`
        },
        { status: 404 }
      );
    }
    console.log('[RATING DELETE] Step 5: Rating found and authorized ✓');
    
    // Step 6: Perform deletion using deleteOne
    console.log('[RATING DELETE] Step 6: Performing deletion...');
    const deleteResult = await Rating.deleteOne({ _id: id });
    console.log('[RATING DELETE] Step 6: Deletion result:', {
      deletedCount: deleteResult.deletedCount,
      acknowledged: deleteResult.acknowledged
    });
    
    if (deleteResult.deletedCount === 0) {
      console.log('[RATING DELETE] Step 6: FAILED - No document was deleted');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to delete rating',
          debug: 'deleteOne returned 0 deletedCount'
        },
        { status: 500 }
      );
    }
    
    // Step 7: Verify deletion
    console.log('[RATING DELETE] Step 7: Verifying deletion...');
    const verifyRating = await Rating.findById(id);
    console.log('[RATING DELETE] Step 7: Verification result:', {
      stillExists: !!verifyRating,
      verificationId: verifyRating?._id
    });
    
    if (verifyRating) {
      console.log('[RATING DELETE] Step 7: ERROR - Rating still exists after deletion!');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Rating deletion failed',
          debug: 'Rating still exists after delete operation'
        },
        { status: 500 }
      );
    }
    
    console.log('[RATING DELETE] Step 7: Deletion verified ✓');
    console.log('[RATING DELETE] SUCCESS: Rating deleted successfully');
    console.log('=== RATING DELETE REQUEST END ===\n');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Rating deleted successfully',
      debug: {
        deletedId: id,
        deletedScore: rating.score,
        deletedAt: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('[RATING DELETE] ERROR: Exception occurred:', {
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name
    });
    console.log('=== RATING DELETE REQUEST END (ERROR) ===\n');
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        debug: {
          errorType: error.name,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
} 