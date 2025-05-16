import mongoose from 'mongoose';

// Define the notification schema
const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Notification must belong to a user'],
  },
  title: {
    type: String,
    required: [true, 'Please provide a notification title'],
    trim: true,
  },
  message: {
    type: String,
    required: [true, 'Please provide a notification message'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['competition', 'badge', 'result', 'system', 'photo_submission'],
    default: 'system',
  },
  read: {
    type: Boolean,
    default: false,
  },
  relatedLink: {
    type: String,
    trim: true,
  },
  relatedCompetition: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competition',
  },
  relatedPhoto: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'photoModel', // Use refPath to dynamically set the referenced model
  },
  photoModel: {
    type: String,
    enum: ['Photo', 'PhotoSubmission'],
    default: 'Photo'
  },
  relatedBadge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge',
  },
  directThumbnailUrl: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Create index for efficient queries
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

// Create or get the Notification model
const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification; 