require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/snapscape';

// Define a simplified user schema with password
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  isVerified: Boolean,
  isActive: Boolean,
  createdAt: Date
});

// Add password hashing middleware (simplified version)
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

async function ensureAdminUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Create User model
    const User = mongoose.model('User', UserSchema);
    
    // List of users to ensure are admins
    const adminEmails = [
      { email: 'admin@admin.com', name: 'Admin' },
      { email: 'prabi@test.com', name: 'Prabi' }
    ];
    
    for (const adminInfo of adminEmails) {
      const { email, name } = adminInfo;
      let user = await User.findOne({ email });
      
      if (user) {
        console.log(`User found: ${email}, updating role to admin...`);
        
        // Update user to admin role
        user.role = 'admin';
        user.isVerified = true;
        user.isActive = true;
        
        await user.save();
        console.log(`User ${email} updated to admin role successfully!`);
      } else {
        console.log(`User not found: ${email}, creating new admin user...`);
        
        // Create a new admin user
        user = new User({
          name: name,
          email: email,
          password: 'Admin123!', // Default password
          role: 'admin',
          isVerified: true,
          isActive: true
        });
        
        await user.save();
        console.log(`New admin user ${email} created successfully!`);
      }
    }
    
    // Verify all admin users
    const adminUsers = await User.find({ role: 'admin' });
    console.log(`\nVerified: ${adminUsers.length} admin users in system:`);
    
    adminUsers.forEach(admin => {
      console.log({
        id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isVerified: admin.isVerified,
        isActive: admin.isActive
      });
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

ensureAdminUsers(); 