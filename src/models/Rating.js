import mongoose, { Schema, models, model } from 'mongoose';

const ratingSchema = new Schema(
  {
    photo: {
      type: Schema.Types.ObjectId,
      ref: 'PhotoSubmission',
      required: [true, 'Photo submission is required'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: [1, 'Score must be at least 1'],
      max: [5, 'Score cannot be greater than 5'],
    },
  },
  {
    timestamps: true,
  }
);

// Create a unique compound index to prevent duplicate ratings from the same user
ratingSchema.index({ photo: 1, user: 1 }, { unique: true });

// Add diagnostic function to check for duplicate ratings
ratingSchema.statics.findDuplicateRatings = async function(userId) {
  // Try to find any potential duplicates using aggregation
  const duplicates = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $group: { 
      _id: { photo: "$photo", user: "$user" },
      count: { $sum: 1 },
      ids: { $push: "$_id" }
    }},
    { $match: { count: { $gt: 1 } } }
  ]);
  
  return {
    hasDuplicates: duplicates.length > 0,
    duplicateCount: duplicates.length,
    duplicates
  };
};

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
    await mongoose.model('PhotoSubmission').findByIdAndUpdate(photoId, {
      ratingCount: stats[0].nRating,
      averageRating: stats[0].avgRating
    });
  } else {
    // If no ratings, set defaults
    await mongoose.model('PhotoSubmission').findByIdAndUpdate(photoId, {
      ratingCount: 0,
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

export default models.Rating || model('Rating', ratingSchema); 