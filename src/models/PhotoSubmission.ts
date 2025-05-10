import mongoose from 'mongoose';

// Define the photo submission schema
const photoSubmissionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for your photo'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters'],
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters'],
  },
  imageUrl: {
    type: String,
    required: [true, 'Please provide an image URL'],
  },
  thumbnailUrl: {
    type: String,
    required: [true, 'Please provide a thumbnail URL'],
  },
  cloudinaryPublicId: {
    type: String,
    required: [true, 'Cloudinary public ID is required'],
  },
  competition: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competition',
    required: [true, 'Please provide a competition ID'],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide a user ID'],
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  ratingCount: {
    type: Number,
    default: 0,
  },
  totalRatingSum: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  archived: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Method to update average rating
photoSubmissionSchema.methods.updateAverageRating = function() {
  if (this.ratingCount > 0) {
    this.averageRating = this.totalRatingSum / this.ratingCount;
  } else {
    this.averageRating = 0;
  }
  return this.save();
};

// Create or get the PhotoSubmission model
const PhotoSubmission = mongoose.models.PhotoSubmission || 
  mongoose.model('PhotoSubmission', photoSubmissionSchema);

export default PhotoSubmission; 