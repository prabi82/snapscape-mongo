import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import PhotoSubmission from '@/models/PhotoSubmission';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'all';
    const archived = url.searchParams.get('archived');
    
    // Parse pagination parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    // Build query for user's submissions
    const query: any = {
      user: session.user.id,
    };
    
    // Add status filter if specified
    if (status !== 'all') {
      query.status = status;
    }

    // Add archived filter if specified
    if (archived === 'true') {
      query.archived = true;
    } else if (archived === 'false') {
      query.$or = [{ archived: false }, { archived: { $exists: false } }];
    }

    // Add competition filter if specified
    const competition = url.searchParams.get('competition');
    if (competition) {
      query.competition = competition;
    }

    console.log('Fetching submissions with query:', query);

    // Execute query with pagination and populate competition details
    const submissions = await PhotoSubmission.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'competition',
        select: 'title theme status startDate endDate votingEndDate',
      })
      .lean();
    
    const total = await PhotoSubmission.countDocuments(query);

    console.log(`Found ${submissions.length} submissions out of ${total} total`);

    return NextResponse.json({
      success: true,
      data: submissions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching user submissions:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred while fetching your submissions' },
      { status: 500 }
    );
  }
} 