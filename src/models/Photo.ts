import mongoose from 'mongoose';

const photoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters'],
  },
  imageUrl: {
    type: String,
    required: [true, 'Please provide an image URL'],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Photo must belong to a user'],
  },
  competition: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competition',
    required: [true, 'Photo must belong to a competition'],
  },
  averageRating: {
    type: Number,
    default: 0,
    min: [0, 'Rating must be at least 0'],
    max: [5, 'Rating cannot be more than 5'],
    set: (val: number) => Math.round(val * 10) / 10, // Round to 1 decimal place
  },
  ratingsCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for ratings
photoSchema.virtual('ratings', {
  ref: 'Rating',
  foreignField: 'photo',
  localField: '_id',
});

// Create or get the Photo model
const Photo = mongoose.models.Photo || mongoose.model('Photo', photoSchema);

export default Photo; 