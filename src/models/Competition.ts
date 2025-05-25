import mongoose from 'mongoose';

// Define the competition schema
const competitionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true,
  },
  theme: {
    type: String,
    required: [true, 'Please provide a theme'],
    trim: true,
    maxlength: [50, 'Theme cannot be more than 50 characters'],
  },
  rules: {
    type: String,
    required: [true, 'Please provide rules'],
    trim: true,
  },
  prizes: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'voting', 'completed'],
    default: 'upcoming',
  },
  hideOtherSubmissions: {
    type: Boolean,
    default: false,
    description: 'If true, users can only see their own submissions during active status'
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide a start date'],
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide an end date'],
    validate: {
      validator: function(this: any, val: Date) {
        return val > this.startDate;
      },
      message: 'End date must be after start date',
    },
  },
  votingEndDate: {
    type: Date,
    validate: {
      validator: function(this: any, val: Date) {
        return val > this.endDate;
      },
      message: 'Voting end date must be after submission end date',
    },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Competition must have an administrator'],
  },
  submissionLimit: {
    type: Number,
    default: 1,
    min: [1, 'Submission limit must be at least 1'],
  },
  votingCriteria: {
    type: String,
    trim: true,
  },
  submissionFormat: {
    type: String,
    trim: true,
    default: 'JPEG, minimum resolution of 700px × 700px, maximum size 25MB',
  },
  coverImage: {
    type: String,
    trim: true,
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

// Virtual for photos submitted to this competition
competitionSchema.virtual('photos', {
  ref: 'Photo',
  foreignField: 'competition',
  localField: '_id',
});

// Virtual for results of this competition
competitionSchema.virtual('results', {
  ref: 'Result',
  foreignField: 'competition',
  localField: '_id',
});

// Create or get the Competition model
const Competition = mongoose.models.Competition || mongoose.model('Competition', competitionSchema);

export default Competition; 