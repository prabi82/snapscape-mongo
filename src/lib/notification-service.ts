import { Notification } from '@/lib/model-import-helper';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';
import { ensureModelsAreLoaded } from '@/lib/model-import-helper';

interface NotificationData {
  user: string;  // User ID
  title: string;
  message: string;
  type: 'competition' | 'badge' | 'result' | 'system' | 'photo_submission';
  relatedLink?: string;
  relatedCompetition?: string;
  relatedPhoto?: string;
  relatedBadge?: string;
  photoModel?: 'Photo' | 'PhotoSubmission';
  directThumbnailUrl?: string | null; // Direct URL to thumbnail, doesn't require reference lookup
}

/**
 * Creates a new notification in the database
 */
export async function createNotification(data: NotificationData): Promise<any> {
  try {
    await dbConnect();
    console.log(`Creating notification for user ${data.user} with title: "${data.title}"`);
    console.log(`Notification data:`, JSON.stringify({
      user: data.user,
      title: data.title,
      type: data.type,
      relatedPhoto: data.relatedPhoto,
      photoModel: data.photoModel
    }));
    
    const notification = await Notification.create(data);
    console.log(`Notification created successfully with ID: ${notification._id}`);
    return { success: true, notification };
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Creates a notification for when a photo submission status is updated
 */
export async function notifySubmissionStatusUpdate(
  userId: string,
  submissionId: string,
  photoTitle: string, 
  competitionId: string,
  competitionTitle: string,
  status: 'approved' | 'rejected'
): Promise<any> {
  console.log(`Creating notification for user ${userId} for photo "${photoTitle}" (${status})`);
  
  try {
    await dbConnect();
    
    // Ensure we have the correct models
    ensureModelsAreLoaded();
    
    // Get the PhotoSubmission to get its image data
    const PhotoSubmission = mongoose.models.PhotoSubmission;
    if (!PhotoSubmission) {
      throw new Error('PhotoSubmission model not available');
    }
    
    // Find the submission to get its thumbnail - use populate to get more details
    const submission = await PhotoSubmission.findById(submissionId).lean();
    if (!submission) {
      console.warn(`PhotoSubmission ${submissionId} not found when creating notification`);
      throw new Error(`PhotoSubmission ${submissionId} not found`);
    }
    
    // Use type assertion for mongoose document
    const submissionData = submission as any;
    
    // Get the thumbnail URL with proper fallbacks
    let thumbnailUrl: string | null = null;
    
    // Make sure we have valid image URLs - be less strict with validation
    if (submissionData.thumbnailUrl && typeof submissionData.thumbnailUrl === 'string') {
      thumbnailUrl = submissionData.thumbnailUrl;
      const previewUrl = thumbnailUrl || '';
      console.log(`Using thumbnailUrl for notification: ${previewUrl.substring(0, Math.min(50, previewUrl.length))}...`);
    } 
    else if (submissionData.imageUrl && typeof submissionData.imageUrl === 'string') {
      thumbnailUrl = submissionData.imageUrl;
      const previewUrl = thumbnailUrl || '';
      console.log(`Using imageUrl as fallback for notification: ${previewUrl.substring(0, Math.min(50, previewUrl.length))}...`);
    }
    else {
      console.warn(`No valid thumbnail or image URL found for submission ${submissionId}`);
      // Don't set a default placeholder - it's better to show nothing than the wrong image
      thumbnailUrl = null;
    }
    
    // Log detailed information about the image URLs
    console.log('Found submission for notification:', {
      id: submissionData._id?.toString(),
      title: submissionData.title || photoTitle,
      thumbnailUrl: submissionData.thumbnailUrl || 'MISSING',
      imageUrl: submissionData.imageUrl || 'MISSING',
      finalUrlChosen: thumbnailUrl || 'NONE'
    });
    
    const title = status === 'approved' 
      ? 'Photo Approved'
      : 'Photo Not Approved';
      
    const message = status === 'approved'
      ? `Your photo "${photoTitle}" for the competition "${competitionTitle}" has been approved.`
      : `Your photo "${photoTitle}" for the competition "${competitionTitle}" was not approved.`;
    
    const notificationData: NotificationData = {
      user: userId,
      title,
      message,
      type: 'competition',
      relatedLink: `/dashboard/submissions?competition=${competitionId}`,
      relatedCompetition: competitionId,
      relatedPhoto: submissionId,
      photoModel: 'PhotoSubmission',
      directThumbnailUrl: thumbnailUrl // Store thumbnail URL directly in the notification
    };
    
    console.log(`Creating notification with thumbnail URL: ${thumbnailUrl || 'NONE'}`);
      
    return createNotification(notificationData);
  } catch (error: any) {
    console.error('Error creating submission status notification:', error);
    
    // Create a basic notification without photo data as fallback
    const title = status === 'approved' 
      ? 'Photo Approved'
      : 'Photo Not Approved';
      
    const message = status === 'approved'
      ? `Your photo "${photoTitle}" for the competition "${competitionTitle}" has been approved.`
      : `Your photo "${photoTitle}" for the competition "${competitionTitle}" was not approved.`;
    
    return createNotification({
      user: userId,
      title,
      message,
      type: 'competition',
      relatedLink: `/dashboard/submissions?competition=${competitionId}`,
      relatedCompetition: competitionId,
      relatedPhoto: submissionId,
      photoModel: 'PhotoSubmission',
      directThumbnailUrl: null // Explicitly set to null instead of undefined
    });
  }
}

/**
 * Creates a notification for a new competition
 */
export async function notifyNewCompetition(
  userId: string,
  competitionId: string,
  competitionTitle: string
): Promise<any> {
  return createNotification({
    user: userId,
    title: 'New Competition Available',
    message: `A new competition "${competitionTitle}" is now available for submissions.`,
    type: 'competition',
    relatedLink: `/dashboard/competitions/${competitionId}`,
    relatedCompetition: competitionId
  });
}

/**
 * Creates a notification for competition results
 */
export async function notifyCompetitionResults(
  userId: string,
  competitionId: string,
  competitionTitle: string,
  position?: number
): Promise<any> {
  let title = 'Competition Results';
  let message = `Results for "${competitionTitle}" are now available.`;
  
  if (position) {
    if (position === 1) {
      title = 'Congratulations! You Won!';
      message = `You won 1st place in the "${competitionTitle}" competition!`;
    } else if (position === 2) {
      title = 'Congratulations! Second Place!';
      message = `You won 2nd place in the "${competitionTitle}" competition!`;
    } else if (position === 3) {
      title = 'Congratulations! Third Place!';
      message = `You won 3rd place in the "${competitionTitle}" competition!`;
    } else {
      message = `Results for "${competitionTitle}" are now available. You placed ${position}th.`;
    }
  }
  
  return createNotification({
    user: userId,
    title,
    message,
    type: 'result',
    relatedLink: `/dashboard/competitions/${competitionId}/results`,
    relatedCompetition: competitionId
  });
}

/**
 * Creates a notification for competition status change
 */
export async function notifyCompetitionStatusChange(
  userId: string,
  competitionId: string,
  competitionTitle: string,
  newStatus: 'voting' | 'completed'
): Promise<any> {
  let title: string;
  let message: string;
  let relatedLink: string;
  let type: 'competition' | 'result' = 'competition';
  
  if (newStatus === 'voting') {
    title = '🗳️ Voting Open';
    message = `Voting is now open for "${competitionTitle}". Cast your vote for your favorite photos!`;
    relatedLink = `/dashboard/competitions/${competitionId}/view-submissions`;
  } else {
    title = '🏆 Results Available';
    message = `Results for "${competitionTitle}" are now available. Check out the final rankings!`;
    relatedLink = `/dashboard/competitions/${competitionId}/view-submissions?result=1`;
    type = 'result';
  }
  
  return createNotification({
    user: userId,
    title,
    message,
    type,
    relatedLink,
    relatedCompetition: competitionId
  });
}

/**
 * Creates a notification for a new badge earned
 */
export async function notifyBadgeEarned(
  userId: string,
  badgeId: string,
  badgeName: string,
  badgeDescription: string
): Promise<any> {
  return createNotification({
    user: userId,
    title: 'New Badge Earned!',
    message: `You earned the "${badgeName}" badge: ${badgeDescription}`,
    type: 'badge',
    relatedLink: '/dashboard/profile',
    relatedBadge: badgeId
  });
}

/**
 * Creates a system notification
 */
export async function createSystemNotification(
  userId: string,
  title: string,
  message: string,
  link?: string
): Promise<any> {
  return createNotification({
    user: userId,
    title,
    message,
    type: 'system',
    relatedLink: link
  });
}

/**
 * Creates a notification for admins when a new photo is submitted
 */
export async function notifyAdminsOfPhotoSubmission(
  photoId: string,
  photoTitle: string,
  userId: string,
  userName: string,
  competitionId: string,
  competitionTitle: string
): Promise<any> {
  try {
    await dbConnect();
    
    // Find all admin users
    const User = mongoose.models.User;
    if (!User) {
      console.error('User model not available');
      return { success: false, error: 'User model not available' };
    }
    
    const adminUsers = await User.find({ role: 'admin' }, '_id');
    
    if (!adminUsers || adminUsers.length === 0) {
      console.warn('No admin users found to notify about new photo submission');
      return { success: false, error: 'No admin users found' };
    }
    
    console.log(`Found ${adminUsers.length} admins to notify about new photo submission`);
    
    // Create notifications for all admins
    const notificationPromises = adminUsers.map(admin => {
      return createNotification({
        user: admin._id.toString(),
        title: 'New Photo Submission',
        message: `${userName} submitted a photo "${photoTitle}" for the competition "${competitionTitle}".`,
        type: 'photo_submission',
        relatedLink: `/admin/submissions?photo=${photoId}`,
        relatedCompetition: competitionId,
        relatedPhoto: photoId,
        photoModel: 'PhotoSubmission'
      });
    });
    
    // Wait for all notifications to be created
    const results = await Promise.all(notificationPromises);
    
    console.log(`Created ${results.length} admin notifications for new photo submission`);
    
    return { success: true, count: results.length };
  } catch (error: any) {
    console.error('Error creating admin notifications for photo submission:', error);
    return { success: false, error: error.message };
  }
} 