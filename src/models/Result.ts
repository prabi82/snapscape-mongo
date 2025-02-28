import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema({
  competition: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competition',
    required: [true, 'Result must belong to a competition'],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Result must belong to a user'],
  },
  photo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Photo',
    required: [true, 'Result must be associated with a photo'],
  },
  position: {
    type: Number,
    required: [true, 'Please provide a position (ranking)'],
    min: [1, 'Position must be at least 1'],
  },
  finalScore: {
    type: Number,
    required: [true, 'Please provide a final score'],
    min: [0, 'Score must be at least 0'],
    max: [5, 'Score cannot be more than 5'],
  },
  prize: {
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

// Ensure uniqueness: one position per competition, one result per user per competition
resultSchema.index({ competition: 1, position: 1 }, { unique: true });
resultSchema.index({ competition: 1, user: 1 }, { unique: true });
resultSchema.index({ competition: 1, photo: 1 }, { unique: true });

// Create or get the Result model
const Result = mongoose.models.Result || mongoose.model('Result', resultSchema);

export default Result; 