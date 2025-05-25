import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IFeedback extends Document {
  user: mongoose.Types.ObjectId;
  rating: number; // 1-5 star rating
  feedback: string;
  category: 'general' | 'bug' | 'feature_request' | 'improvement' | 'other';
  title: string;
  isAnonymous: boolean;
  status: 'new' | 'reviewed' | 'resolved' | 'closed';
  adminResponse?: string;
  adminResponseDate?: Date;
  adminUser?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  feedback: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  category: {
    type: String,
    enum: ['general', 'bug', 'feature_request', 'improvement', 'other'],
    default: 'general',
  },
  title: {
    type: String,
    required: true,
    maxlength: 200,
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['new', 'reviewed', 'resolved', 'closed'],
    default: 'new',
  },
  adminResponse: {
    type: String,
    maxlength: 1000,
  },
  adminResponseDate: {
    type: Date,
  },
  adminUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Index for efficient querying
FeedbackSchema.index({ user: 1, createdAt: -1 });
FeedbackSchema.index({ status: 1, createdAt: -1 });
FeedbackSchema.index({ rating: 1 });
FeedbackSchema.index({ category: 1 });

const Feedback: Model<IFeedback> = mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', FeedbackSchema);

export default Feedback; 