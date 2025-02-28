import mongoose from 'mongoose';

// Define the rating schema
const ratingSchema = new mongoose.Schema({
  score: {
    type: Number,
    required: [true, 'Please provide a rating score'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5'],
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [200, 'Comment cannot be more than 200 characters'],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Rating must belong to a user'],
  },
  photo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Photo',
    required: [true, 'Rating must belong to a photo'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Prevent duplicate ratings (one user can rate a photo only once)
ratingSchema.index({ user: 1, photo: 1 }, { unique: true });

// Static method to calculate average rating for a photo
ratingSchema.statics.calcAverageRatings = async function(photoId) {
  const stats = await this.aggregate([
    {
      $match: { photo: photoId }
    },
    {
      $group: {
        _id: '$photo',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$score' }
      }
    }
  ]);

  // Update photo with calculated stats
  if (stats.length > 0) {
    await mongoose.model('Photo').findByIdAndUpdate(photoId, {
      ratingsCount: stats[0].nRating,
      averageRating: stats[0].avgRating
    });
  } else {
    // If no ratings, set defaults
    await mongoose.model('Photo').findByIdAndUpdate(photoId, {
      ratingsCount: 0,
      averageRating: 0
    });
  }
};

// Call calcAverageRatings after save
ratingSchema.post('save', function() {
  // @ts-ignore: Object is possibly 'undefined'
  this.constructor.calcAverageRatings(this.photo);
});

// Call calcAverageRatings before remove
ratingSchema.pre(/^findOneAnd/, async function(next) {
  // @ts-ignore: Object is possibly 'undefined'
  this.r = await this.findOne();
  next();
});

ratingSchema.post(/^findOneAnd/, async function() {
  // @ts-ignore: Property 'r' does not exist on type 'Query<any, any>'
  await this.r.constructor.calcAverageRatings(this.r.photo);
});

// Create or get the Rating model
const Rating = mongoose.models.Rating || mongoose.model('Rating', ratingSchema);

export default Rating; 