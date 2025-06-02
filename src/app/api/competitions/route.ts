import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Competition from '@/models/Competition';
import Photo from '@/models/Photo';
import PhotoSubmission from '@/models/PhotoSubmission';
import { sendNewCompetitionNotifications } from '@/lib/new-competition-notification-service';

// Define a proper session type to fix TypeScript errors
interface ExtendedSession {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
    role?: string;
  };
}

// GET all competitions
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions as any) as ExtendedSession | null;
    
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
    const limit = parseInt(searchParams.get('limit') || '50', 10);
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
    
    if (participated === 'true' && session.user?.id) {
      // Find competitions where the user has submitted photos
      const userSubmissions = await PhotoSubmission.distinct('competition', { user: session.user.id });
      participatedFilter = { _id: { $in: userSubmissions } };
    } else if (participated === 'false' && session.user?.id) {
      // Find competitions where the user has not submitted photos
      const userSubmissions = await PhotoSubmission.distinct('competition', { user: session.user.id });
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
        // Count submissions from both models
        const photoCount = await Photo.countDocuments({ competition: competition._id });
        const submissionCount = await PhotoSubmission.countDocuments({ competition: competition._id });
        
        // Total count is the sum of both models
        const totalSubmissionCount = photoCount + submissionCount;
        
        // Check if the user has submitted to this competition (only if user ID exists)
        let userPhotoSubmission = null;
        let userSubmission = null;
        
        if (session.user?.id) {
          userPhotoSubmission = await Photo.findOne({ 
            competition: competition._id, 
            user: session.user.id 
          });
          
          userSubmission = await PhotoSubmission.findOne({ 
            competition: competition._id, 
            user: session.user.id 
          });
        }
        
        return {
          ...competition,
          submissionCount: totalSubmissionCount,
          hasSubmitted: !!(userPhotoSubmission || userSubmission)
        };
      })
    );
    
    // Get total count for pagination
    const totalCompetitions = await Competition.countDocuments(filter);
    
    // Log competitions data to help debug submission count issues
    console.log('Competitions data:', competitionsWithSubmissionCount.map(comp => ({
      id: (comp as any)._id,
      title: (comp as any).title,
      submissionCount: (comp as any).submissionCount,
      hasSubmitted: (comp as any).hasSubmitted
    })));
    
    return NextResponse.json({
      success: true,
      data: competitionsWithSubmissionCount,
      meta: {
        total: totalCompetitions,
        page,
        limit,
        pages: Math.ceil(totalCompetitions / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching competitions:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred while fetching competitions' },
      { status: 500 }
    );
  }
}

// POST create a new competition (admin only)
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    // Use authOptions to get the proper session with user ID
    const session = await getServerSession(authOptions as any) as ExtendedSession | null;
    
    console.log('Session in POST competitions:', session);

    // Check authentication and admin role
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // In a real implementation, you would check if the user is an admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Not authorized - admin role required' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    console.log('Competition data received:', body);
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'theme', 'startDate', 'endDate', 'votingEndDate'];
    // Add crop fields if coverImage is present
    if (body.coverImage) { // coverImage here would be the base64 string or a flag indicating a file was sent
      requiredFields.push('cropX', 'cropY', 'cropWidth', 'cropHeight');
    }

    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) { // Check for undefined or null
        // Special handling for crop parameters if coverImage is present but crop values are 0
        if (['cropX', 'cropY', 'cropWidth', 'cropHeight'].includes(field) && body[field] === 0) {
          // Allow 0 for crop parameters
        } else {
          console.error(`Missing required field: ${field}`);
          return NextResponse.json(
            { success: false, message: `${field} is required` },
            { status: 400 }
          );
        }
      }
    }
    
    // Set the createdBy field to the current user's ID
    body.createdBy = session.user.id;
    console.log('Setting createdBy to:', session.user.id);
    
    // Create competition
    const competition = await Competition.create(body);
    console.log('Competition created:', competition);
    
    // Send new competition notifications to all users (async, don't wait for completion)
    try {
      console.log('Sending new competition notifications...');
      const notificationResult = await sendNewCompetitionNotifications(
        competition._id.toString(),
        competition.title,
        competition.description,
        competition.theme,
        competition.startDate.toISOString(),
        competition.endDate.toISOString()
      );
      
      console.log('New competition notification result:', notificationResult);
    } catch (notificationError: any) {
      // Log the error but don't fail the competition creation
      console.error('Error sending new competition notifications:', notificationError);
    }
    
    return NextResponse.json(
      { success: true, data: competition },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating competition:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 