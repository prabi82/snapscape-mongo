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
    
    console.log('[API DEBUG] /api/submissions GET request URL:', req.url);
    console.log('[API DEBUG] Resolved session user ID:', session?.user?.id);
    
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
    const winnersOnly = url.searchParams.get('winnersOnly') === 'true';
    
    // Build query
    const query: any = {};
    
    if (competitionId) {
      query.competition = competitionId;
      // Specifically log if this is the Munroe Island competition
      if (competitionId === '681c59d3cb7eb5b3d36b0046') { // Munroe Island Comp ID
        console.log('[API DEBUG] Querying for Munroe Island (ID: 681c59d3cb7eb5b3d36b0046)');
      }
    }
    
    if (status) {
      query.status = status;
    }
    
    // By default, only show user's own submissions
    if (!showAll) {
      query.user = session.user.id;
    }
    
    console.log('[API DEBUG] Final PhotoSubmission.find query:', JSON.stringify(query));
    
    // If winnersOnly, fetch all approved submissions for this competition and filter for top 3 ratings
    if (winnersOnly && competitionId) {
      // Fetch all approved submissions for this competition
      const allSubs = await PhotoSubmission.find({ competition: competitionId, status: 'approved' })
        .populate('user', 'name')
        .populate('competition', 'title status')
        .lean();
      // Determine gold, silver, bronze ratings
      const ratings = allSubs.map(sub => sub.averageRating);
      const uniqueSorted = Array.from(new Set(ratings)).sort((a, b) => b - a);
      const gold = uniqueSorted[0] ?? null;
      const silver = uniqueSorted[1] ?? null;
      const bronze = uniqueSorted[2] ?? null;
      // Filter for all winners (ties included)
      const winners = allSubs.filter(sub => sub.averageRating === gold || sub.averageRating === silver || sub.averageRating === bronze);
      return NextResponse.json({
        success: true,
        data: winners,
        pagination: {
          total: winners.length,
          page: 1,
          limit: winners.length,
          pages: 1,
        }
      });
    }
    
    const submissions = await PhotoSubmission.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name')
      .populate('competition', 'title status')
      .lean();
    
    console.log('Found submissions:', submissions.length); // Debug log
    
    // Fetch user ratings for each submission
    const submissionsWithUserRating = await Promise.all(submissions.map(async (sub: any) => {
      try {
        const Rating = (await import('@/models/Rating')).default;
        const userId = session?.user?.id;

        if (!userId) {
          console.warn('[API WARN] User ID not found in session while trying to fetch rating for photo:', sub._id?.toString());
          const subObj = sub.toObject ? sub.toObject() : sub;
          return {
            ...subObj,
            userRating: undefined
          };
        }
        const userIdStr = String(userId);
        
        const rating = await Rating.findOne({ 
          photo: sub._id?.toString(), 
          user: userIdStr 
        });
        
        const subObj = sub.toObject ? sub.toObject() : sub;
        return {
          ...subObj,
          userRating: rating ? rating.score : undefined
        };
      } catch (err) {
        console.error('Error fetching rating for submission:', sub._id?.toString(), err);
        const subObj = sub.toObject ? sub.toObject() : sub;
        return subObj;
      }
    }));
    
    const total = await PhotoSubmission.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      data: submissionsWithUserRating,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      }
    });
  } catch (error: any) {
    console.error('Error in submissions API:', error);
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