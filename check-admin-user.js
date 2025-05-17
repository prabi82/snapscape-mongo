require('dotenv').config();
const mongoose = require('mongoose');
const User = mongoose.models.User || mongoose.model('User', require('./src/models/User').schema);

async function checkAdminUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const user = await User.findOne({ email: 'admin@admin.com' });
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (user) {
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
      console.log('Looking for any admin users...');
      const adminUsers = await User.find({ role: 'admin' });
      console.log(`Found ${adminUsers.length} admin users:`);
      adminUsers.forEach(admin => {
        console.log({
          id: admin._id.toString(),
          name: admin.name,
          email: admin.email,
          role: admin.role
        });
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkAdminUser(); 