import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Feedback from '@/models/Feedback';
import { Session } from 'next-auth';

// GET - Fetch user's feedback
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const feedback = await Feedback.find({ user: session.user.id })
      .populate('adminUser', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: feedback
    });

  } catch (error: any) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Submit new feedback
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { rating, feedback, category, title, isAnonymous } = body;

    // Validation
    if (!rating || !feedback || !title) {
      return NextResponse.json(
        { success: false, message: 'Rating, feedback, and title are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (feedback.length > 2000) {
      return NextResponse.json(
        { success: false, message: 'Feedback must be less than 2000 characters' },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { success: false, message: 'Title must be less than 200 characters' },
        { status: 400 }
      );
    }

    const newFeedback = new Feedback({
      user: session.user.id,
      rating,
      feedback,
      category: category || 'general',
      title,
      isAnonymous: isAnonymous || false,
    });

    await newFeedback.save();

    const populatedFeedback = await Feedback.findById(newFeedback._id)
      .populate('user', 'name email')
      .lean();

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: populatedFeedback
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 