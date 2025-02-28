import mongoose from 'mongoose';

// Define the badge schema
const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a badge name'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please provide a badge description'],
  },
  icon: {
    type: String,
    required: [true, 'Please provide an icon URL'],
  },
  criteria: {
    type: String,
    required: [true, 'Please provide criteria for earning this badge'],
  },
  type: {
    type: String,
    enum: ['competition_winner', 'participation', 'rating', 'submission', 'special'],
    required: [true, 'Please provide a badge type'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Define the user badge schema (for assigning badges to users)
const userBadgeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide a user ID'],
  },
  badge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge',
    required: [true, 'Please provide a badge ID'],
  },
  awardedAt: {
    type: Date,
    default: Date.now,
  },
  competition: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competition',
  },
  photo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Photo',
  },
}, { timestamps: true });

// Create or get the Badge models
const Badge = mongoose.models.Badge || mongoose.model('Badge', badgeSchema);
const UserBadge = mongoose.models.UserBadge || mongoose.model('UserBadge', userBadgeSchema);

// Export both models
export { Badge, UserBadge };

// Default export for compatibility
export default UserBadge; 