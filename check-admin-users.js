require('dotenv').config();
const mongoose = require('mongoose');

// Define MongoDB URI explicitly
const MONGODB_URI = 'mongodb+srv://snap:C4U2QqNfr8OlzNjt@snapscape-mongo.gli1z.mongodb.net/?retryWrites=true&w=majority&appName=snapscape-mongo';

// Define a simplified user schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  isVerified: Boolean,
  isActive: Boolean,
  createdAt: Date
});

async function checkAdminUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Create User model
    const User = mongoose.model('User', UserSchema);
    
    // Find admin users
    const adminUsers = await User.find({ role: 'admin' });
    console.log(`Found ${adminUsers.length} admin users:`);
    
    adminUsers.forEach(admin => {
      console.log({
        id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isVerified: admin.isVerified,
        isActive: admin.isActive,
        createdAt: admin.createdAt
      });
    });
    
    // Also check specific users
    const specificEmails = ['admin@admin.com', 'prabi@test.com'];
    
    for (const email of specificEmails) {
      const user = await User.findOne({ email });
      
      if (user) {
        console.log(`\nUser with email ${email}:`);
        console.log({
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          isActive: user.isActive,
          createdAt: user.createdAt
        });
      } else {
        console.log(`\nNo user found with email ${email}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkAdminUsers(); 