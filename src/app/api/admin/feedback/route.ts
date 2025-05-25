import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Feedback from '@/models/Feedback';
import { Session } from 'next-auth';

// GET - Fetch all feedback (admin only)
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Not authorized - Admin access required' },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const category = url.searchParams.get('category');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build filter query
    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const [feedback, total] = await Promise.all([
      Feedback.find(filter)
        .populate('user', 'name email username')
        .populate('adminUser', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Feedback.countDocuments(filter)
    ]);

    // Calculate statistics
    const stats = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          totalFeedback: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          newFeedback: {
            $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] }
          },
          resolvedFeedback: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        feedback,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: feedback.length,
          totalCount: total
        },
        stats: stats[0] || {
          totalFeedback: 0,
          averageRating: 0,
          newFeedback: 0,
          resolvedFeedback: 0,
          ratingDistribution: []
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching admin feedback:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update feedback status/response (admin only)
export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Not authorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { feedbackId, status, adminResponse } = body;

    if (!feedbackId) {
      return NextResponse.json(
        { success: false, message: 'Feedback ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (adminResponse !== undefined) {
      updateData.adminResponse = adminResponse;
      updateData.adminResponseDate = new Date();
      updateData.adminUser = session.user.id;
    }

    const updatedFeedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      updateData,
      { new: true }
    )
      .populate('user', 'name email username')
      .populate('adminUser', 'name email')
      .lean();

    if (!updatedFeedback) {
      return NextResponse.json(
        { success: false, message: 'Feedback not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback updated successfully',
      data: updatedFeedback
    });

  } catch (error: any) {
    console.error('Error updating feedback:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete feedback (admin only)
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Not authorized - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const feedbackId = searchParams.get('id');

    if (!feedbackId) {
      return NextResponse.json(
        { success: false, message: 'Feedback ID is required' },
        { status: 400 }
      );
    }

    const deletedFeedback = await Feedback.findByIdAndDelete(feedbackId);

    if (!deletedFeedback) {
      return NextResponse.json(
        { success: false, message: 'Feedback not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting feedback:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 