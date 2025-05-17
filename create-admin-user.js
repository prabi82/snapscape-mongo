require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define MongoDB URI explicitly
const MONGODB_URI = 'mongodb+srv://snap:C4U2QqNfr8OlzNjt@snapscape-mongo.gli1z.mongodb.net/?retryWrites=true&w=majority&appName=snapscape-mongo';

// Define the User schema directly here to avoid import issues
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    provider: {
      type: String,
      default: 'credentials',
    },
    providerId: String,
    verificationToken: String,
    verificationExpiry: Date,
    resetPasswordToken: String,
    resetPasswordExpiry: Date,
  },
  { timestamps: true }
);

// Add password hashing middleware (simplified version)
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model('User', UserSchema);

async function createOrUpdateAdminUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check if admin@admin.com exists
    let adminUser = await User.findOne({ email: 'admin@admin.com' });
    
    if (adminUser) {
      console.log('Admin user found, updating role...');
      
      // Update the role to admin
      adminUser.role = 'admin';
      adminUser.isVerified = true;
      adminUser.isActive = true;
      
      await adminUser.save();
      console.log('Admin user updated successfully!');
    } else {
      console.log('Admin user not found, creating new admin user...');
      
      // Create a new admin user
      adminUser = new User({
        name: 'Admin',
        email: 'admin@admin.com',
        password: 'Admin123!',
        role: 'admin',
        isVerified: true,
        isActive: true
      });
      
      await adminUser.save();
      console.log('New admin user created successfully!');
    }
    
    // Verify the user details
    const verifyUser = await User.findOne({ email: 'admin@admin.com' }).select('+password');
    console.log('Verified admin user:', {
      id: verifyUser._id.toString(),
      name: verifyUser.name,
      email: verifyUser.email,
      role: verifyUser.role,
      isVerified: verifyUser.isVerified,
      isActive: verifyUser.isActive,
      passwordLength: verifyUser.password ? verifyUser.password.length : 0
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createOrUpdateAdminUser(); 