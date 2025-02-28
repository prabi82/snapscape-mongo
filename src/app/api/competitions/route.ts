import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Competition from '@/models/Competition';
import Photo from '@/models/Photo';

// GET all competitions
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Connect to the database
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    
    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;
    
    // Status filter (active, upcoming, voting, completed)
    const statusParam = searchParams.get('status');
    const statusFilter = statusParam ? 
      { status: { $in: statusParam.split(',') } } : 
      {};
    
    // Theme filter
    const theme = searchParams.get('theme');
    const themeFilter = theme ? { theme } : {};
    
    // User participation filter
    const participated = searchParams.get('participated');
    let participatedFilter = {};
    
    if (participated === 'true') {
      // Find competitions where the user has submitted photos
      const userSubmissions = await Photo.distinct('competition', { user: session.user.id });
      participatedFilter = { _id: { $in: userSubmissions } };
    } else if (participated === 'false') {
      // Find competitions where the user has not submitted photos
      const userSubmissions = await Photo.distinct('competition', { user: session.user.id });
      participatedFilter = { _id: { $nin: userSubmissions } };
    }
    
    // Combine all filters
    const filter = {
      ...statusFilter,
      ...themeFilter,
      ...participatedFilter
    };
    
    // Fetch competitions
    const competitions = await Competition.find(filter)
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get submission counts for each competition
    const competitionsWithSubmissionCount = await Promise.all(
      competitions.map(async (competition) => {
        const submissionCount = await Photo.countDocuments({ competition: competition._id });
        
        // Check if the user has submitted to this competition
        const userSubmission = await Photo.findOne({ 
          competition: competition._id, 
          user: session.user.id 
        });
        
        return {
          ...competition,
          submissionCount,
          hasSubmitted: !!userSubmission
        };
      })
    );
    
    // Get total count for pagination
    const totalCompetitions = await Competition.countDocuments(filter);
    
    return NextResponse.json({
      success: true,
      data: competitionsWithSubmissionCount,
      pagination: {
        total: totalCompetitions,
        page,
        limit,
        pages: Math.ceil(totalCompetitions / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching competitions:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch competitions' },
      { status: 500 }
    );
  }
}

// POST create a new competition (admin only)
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession();

    // Check authentication and admin role
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // In a real implementation, you would check if the user is an admin
    // This is just a placeholder, you need to implement proper role checking
    // const isAdmin = await checkIfUserIsAdmin(session.user.email);
    // if (!isAdmin) {
    //   return NextResponse.json(
    //     { success: false, message: 'Not authorized' },
    //     { status: 403 }
    //   );
    // }
    
    const body = await req.json();
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'theme', 'rules', 'startDate', 'endDate', 'submissionLimit'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, message: `${field} is required` },
          { status: 400 }
        );
      }
    }
    
    // Set the createdBy field to the current user's ID
    body.createdBy = session.user.id;
    
    // Create competition
    const competition = await Competition.create(body);
    
    return NextResponse.json(
      { success: true, data: competition },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 