import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
// Use the helper for model imports
import { 
  Photo, 
  Rating, 
  Badge, 
  UserBadge, 
  Result, 
  Competition,
  ensureModelsAreLoaded
} from '@/lib/model-import-helper';

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
    
    // Ensure models are loaded
    ensureModelsAreLoaded();
    
    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    // Get recent submissions
    const submissions = await Photo.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('competition', 'title')
      .lean();
      
    const submissionActivities = submissions.map(submission => ({
      _id: `submission_${submission._id}`,
      type: 'submission',
      title: `You submitted a photo to "${submission.competition?.title || 'a competition'}"`,
      date: submission.createdAt,
      photoUrl: submission.imageUrl,
      competitionId: submission.competition?._id
    }));
    
    // Get recent badges earned
    const badges = await UserBadge.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('badge')
      .lean();
      
    const badgeActivities = badges.map(userBadge => ({
      _id: `badge_${userBadge._id}`,
      type: 'badge',
      title: `You earned the ${userBadge.badge?.name || 'unknown'} badge`,
      date: userBadge.awardedAt || userBadge.createdAt,
      details: userBadge.badge?.description
    }));
    
    // Get recent competition wins
    const wins = await Result.find({ user: userId, position: { $lte: 3 } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('competition', 'title')
      .populate('photo', 'imageUrl')
      .lean();
      
    const winActivities = wins.map(win => {
      const positionText = win.position === 1 ? '1st place' : win.position === 2 ? '2nd place' : '3rd place';
      return {
        _id: `win_${win._id}`,
        type: 'win',
        title: `You won ${positionText} in "${win.competition?.title || 'a competition'}"`,
        date: win.createdAt,
        photoUrl: win.photo?.imageUrl,
        competitionId: win.competition?._id
      };
    });
    
    // Get recent ratings given
    const ratings = await Rating.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('photo')
      .populate({
        path: 'photo',
        populate: {
          path: 'competition',
          select: 'title _id'
        }
      })
      .lean();
      
    const ratingActivities = ratings.map(rating => ({
      _id: `rating_${rating._id}`,
      type: 'rating',
      title: `You rated a photo ${rating.score}/5`,
      date: rating.createdAt,
      photoUrl: rating.photo?.imageUrl,
      competitionId: rating.photo?.competition?._id
    }));
    
    // Combine all activities, sort by date, and limit to requested amount
    const allActivities = [
      ...submissionActivities,
      ...badgeActivities,
      ...winActivities,
      ...ratingActivities
    ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
    
    return NextResponse.json({
      success: true,
      data: allActivities
    });
    
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user activities' },
      { status: 500 }
    );
  }
} 