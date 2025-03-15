// This file helps with model imports to prevent build issues on Vercel
import mongoose from 'mongoose';

// Import all models
import User from '../models/User';
import Photo from '../models/Photo';
import Result from '../models/Result';
import Badge, { UserBadge } from '../models/Badge';
import Competition from '../models/Competition';
import PhotoSubmission from '../models/PhotoSubmission';
import Rating from '../models/Rating';
import Notification from '../models/Notification';

// Export models
export {
  User,
  Photo,
  Result,
  Badge,
  UserBadge,
  Competition,
  PhotoSubmission,
  Rating,
  Notification
};

// Helper function to ensure models are loaded
export function ensureModelsAreLoaded() {
  // This function doesn't need to do anything, just being imported
  // is enough to ensure the models are registered
  return {
    userModel: mongoose.models.User || null,
    photoModel: mongoose.models.Photo || null,
    resultModel: mongoose.models.Result || null,
    badgeModel: mongoose.models.Badge || null,
    userBadgeModel: mongoose.models.UserBadge || null,
    competitionModel: mongoose.models.Competition || null,
    photoSubmissionModel: mongoose.models.PhotoSubmission || null,
    ratingModel: mongoose.models.Rating || null,
    notificationModel: mongoose.models.Notification || null
  };
} 