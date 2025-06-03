import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Define a type for the user document
interface IUserDocument extends mongoose.Document {
  name: string;
  email: string;
  mobile?: string;
  country?: string;
  password?: string;
  role: string;
  provider: string;
  providerId: string | null;
  image: string | null;
  isVerified: boolean;
  isActive: boolean;
  verificationToken: string | null;
  verificationExpires: Date | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  notificationPreferences?: {
    competitionReminders: boolean;
    votingOpen: boolean;
    competitionCompleted: boolean;
    newCompetitions: boolean;
    achievementNotifications: boolean;
    weeklyDigest: boolean;
    marketingEmails: boolean;
  };
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Define the user schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    maxlength: [50, 'Name cannot be more than 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email',
    ],
  },
  mobile: {
    type: String,
    trim: true,
    unique: true,
    sparse: true, // This allows null/undefined values and only enforces uniqueness for actual values
  },
  country: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
    required: [
      function(this: IUserDocument) {
        // Only require password for credentials provider (not social logins)
        return !this.provider || this.provider === 'credentials';
      },
      'Please provide a password'
    ],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't return password in queries by default
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'judge'],
    default: 'user',
  },
  // Social provider fields
  provider: {
    type: String,
    enum: ['credentials', 'google', 'facebook', 'apple', null],
    default: 'credentials',
  },
  providerId: {
    type: String,
    default: null,
  },
  image: {
    type: String,
    default: null,
  },
  // User status fields
  isActive: {
    type: Boolean,
    default: true,
  },
  // Email verification fields
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
    default: null,
  },
  verificationExpires: {
    type: Date,
    default: null,
  },
  // Password reset fields
  passwordResetToken: {
    type: String,
    default: null,
  },
  passwordResetExpires: {
    type: Date,
    default: null,
  },
  // Notification preferences
  notificationPreferences: {
    competitionReminders: {
      type: Boolean,
      default: true,
    },
    votingOpen: {
      type: Boolean,
      default: true,
    },
    competitionCompleted: {
      type: Boolean,
      default: true,
    },
    newCompetitions: {
      type: Boolean,
      default: true,
    },
    achievementNotifications: {
      type: Boolean,
      default: true,
    },
    weeklyDigest: {
      type: Boolean,
      default: false,
    },
    marketingEmails: {
      type: Boolean,
      default: false,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Hash password before saving, but only if it's modified and exists
userSchema.pre('save', async function(this: IUserDocument, next) {
  if (!this.isModified('password') || !this.password) {
    next();
    return;
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Add method to compare password
userSchema.methods.comparePassword = async function(this: IUserDocument, candidatePassword: string) {
  return await bcrypt.compare(candidatePassword, this.password || '');
};

// Create or get the User model
const User = mongoose.models.User || mongoose.model<IUserDocument>('User', userSchema);

export default User; 