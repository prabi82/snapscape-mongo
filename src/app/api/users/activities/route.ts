import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
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
  Notification,
  ensureModelsAreLoaded
} from '@/lib/model-import-helper';
import mongoose from 'mongoose';

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

// Create a cache for photo submissions during a request
const photoSubmissionCache = new Map();

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions) as ExtendedSession;
    
    if (!session?.user?.id) {
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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;
    
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
    
    // Get user notifications
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('relatedCompetition', 'title')
      .lean();
    
    // Find all PhotoSubmission related notifications
    const photoSubmissionIds = notifications
      .filter(n => n.photoModel === 'PhotoSubmission' && n.relatedPhoto)
      .map(n => n.relatedPhoto.toString());
    
    // Only log count information in production, not individual items
    const photoNotifications = notifications.filter(n => 
      n.title === 'Photo Approved' || n.title === 'Photo Not Approved'
    );
    
    // Only log count in production
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Found ${photoNotifications.length} photo approval/rejection notifications`);
    }
    
    // Directly fetch the photo submissions if there are any, but only once
    let photoSubmissionsMap = {};
    if (photoSubmissionIds.length > 0) {
      // Only log count in production
      if (process.env.NODE_ENV !== 'production') {
      console.log(`Fetching ${photoSubmissionIds.length} photo submissions for notifications`);
      }
      
      try {
        // Get PhotoSubmission model
        const PhotoSubmission = mongoose.models.PhotoSubmission;
        
        if (PhotoSubmission) {
          // Check if we already have these items in cache
          const uncachedIds = photoSubmissionIds.filter(id => !photoSubmissionCache.has(id));
          
          // Only fetch the uncached submissions
          if (uncachedIds.length > 0) {
          const photoSubmissions = await PhotoSubmission.find({
              _id: { $in: uncachedIds }
          }).lean();
          
            // Add to cache
            photoSubmissions.forEach(photo => {
              const photoId = (photo._id as mongoose.Types.ObjectId).toString();
              photoSubmissionCache.set(photoId, photo);
            });
          }
          
          // Create a map for all requested submissions from cache
          photoSubmissionsMap = photoSubmissionIds.reduce((map, photoId) => {
            if (photoSubmissionCache.has(photoId)) {
              map[photoId] = photoSubmissionCache.get(photoId);
            }
            return map;
          }, {} as Record<string, any>);
          
          // Only log in development
          if (process.env.NODE_ENV !== 'production') {
          console.log(`Found ${Object.keys(photoSubmissionsMap).length} photo submissions with potential thumbnails`);
          }
        }
      } catch (err) {
        console.error('Error fetching photo submissions for notifications:', err);
      }
    }
      
    const notificationActivities = notifications.map(notification => {
      // Get the photo URL based on the photo model
      let photoUrl: string | null = null;
      
      // First check if there's a direct thumbnail URL stored in the notification
      if (notification.directThumbnailUrl && typeof notification.directThumbnailUrl === 'string') {
        photoUrl = notification.directThumbnailUrl;
      } 
      // Then check if this is a photo approval notification with a related photo
      else if (
        (notification.title === 'Photo Approved' || notification.title === 'Photo Not Approved') && 
        notification.relatedPhoto
      ) {
        const photoId = notification.relatedPhoto.toString();
        const photoSubmission = photoSubmissionsMap[photoId];
        
        if (photoSubmission) {
          if (photoSubmission.thumbnailUrl) {
            photoUrl = photoSubmission.thumbnailUrl;
          } else if (photoSubmission.imageUrl) {
            photoUrl = photoSubmission.imageUrl;
      }
        }
      }
      
      return {
        _id: `notification_${notification._id}`,
        type: 'notification',
        title: notification.title,
        details: notification.message,
        date: notification.createdAt,
        competitionId: notification.relatedCompetition?._id,
        photoUrl: photoUrl,
        read: notification.read
      };
    });
    
    // Only log count in production
    if (process.env.NODE_ENV !== 'production') {
    console.log(`Found ${notifications.length} total notifications, including ${photoNotifications.length} photo approval/rejection notifications`);
    }
    
    // Combine all activities, sort by date, and limit to requested amount
    const allActivities = [
      ...submissionActivities,
      ...badgeActivities,
      ...winActivities,
      ...ratingActivities,
      ...notificationActivities
    ]
    .sort((a, b) => {
      // Ensure we have valid date objects by checking and converting as needed
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      
      // Return newest first (descending order)
      return dateB - dateA;
    })
    .slice(skip, skip + limit);
    
    // Only log count in production
    if (process.env.NODE_ENV !== 'production') {
    console.log(`Returning ${allActivities.length} activities with ${notificationActivities.length} notifications`);
    }
    
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