import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import PhotoSubmission from '@/models/PhotoSubmission';
import Competition from '@/models/Competition';
import dbConnect from '@/lib/dbConnect';

// GET photo submissions
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession();
    
    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const url = new URL(req.url);
    const competitionId = url.searchParams.get('competition');
    const showAll = url.searchParams.get('showAll') === 'true';
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Build query
    const query: any = {};
    
    if (competitionId) {
      query.competition = competitionId;
    }
    
    if (status) {
      query.status = status;
    }
    
    // By default, only show user's own submissions
    if (!showAll) {
      query.user = session.user.id;
    }
    
    const submissions = await PhotoSubmission.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name')
      .populate('competition', 'title status');
      
    const total = await PhotoSubmission.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      data: submissions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST create a new photo submission
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession();
    
    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    
    // Validate required fields
    const requiredFields = ['title', 'imageUrl', 'thumbnailUrl', 'competition'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, message: `${field} is required` },
          { status: 400 }
        );
      }
    }
    
    // Check if competition exists and is active
    const competition = await Competition.findById(body.competition);
    if (!competition) {
      return NextResponse.json(
        { success: false, message: 'Competition not found' },
        { status: 404 }
      );
    }
    
    if (competition.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Competition is not active' },
        { status: 400 }
      );
    }
    
    // Check if user has reached the submission limit
    const userSubmissionsCount = await PhotoSubmission.countDocuments({
      user: session.user.id,
      competition: body.competition,
    });
    
    if (userSubmissionsCount >= competition.submissionLimit) {
      return NextResponse.json(
        { 
          success: false, 
          message: `You have reached the submission limit (${competition.submissionLimit}) for this competition` 
        },
        { status: 400 }
      );
    }
    
    // Set the user field to the current user's ID
    body.user = session.user.id;
    
    // Create submission
    const submission = await PhotoSubmission.create(body);
    
    return NextResponse.json(
      { success: true, data: submission },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 