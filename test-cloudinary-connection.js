// Script to test Cloudinary connection
require('dotenv').config({ path: '.env.local' });
const cloudinary = require('cloudinary').v2;

// Configure using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Print configuration being used (with some redaction for security)
console.log('=== Cloudinary Configuration ===');
console.log(`Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
console.log(`API Key: ${process.env.CLOUDINARY_API_KEY.substring(0, 4)}...${process.env.CLOUDINARY_API_KEY.substring(process.env.CLOUDINARY_API_KEY.length - 4)}`);
console.log(`API Secret: ${process.env.CLOUDINARY_API_SECRET.substring(0, 4)}...${process.env.CLOUDINARY_API_SECRET.substring(process.env.CLOUDINARY_API_SECRET.length - 4)}`);

// Test the connection
async function testConnection() {
  try {
    console.log('\n=== Testing Cloudinary Connection ===');
    console.log('Attempting to ping Cloudinary API...');
    
    // Get account info as a simple test
    const result = await cloudinary.api.ping();
    
    console.log('✅ SUCCESS! Connected to Cloudinary');
    console.log('Response:', JSON.stringify(result, null, 2));
    
    // Additional test - try to get usage info
    console.log('\n=== Checking Account Usage ===');
    const usage = await cloudinary.api.usage();
    console.log('Usage info retrieved successfully:');
    console.log(JSON.stringify(usage, null, 2));
    
    return true;
  } catch (error) {
    console.error('❌ ERROR: Failed to connect to Cloudinary');
    console.error('Error details:', error.message);
    if (error.http_code) {
      console.error(`HTTP Status: ${error.http_code}`);
    }
    if (error.error) {
      console.error('API Error:', error.error);
    }
    return false;
  }
}

// Run the test
testConnection()
  .then(success => {
    if (success) {
      console.log('\n=== SUMMARY ===');
      console.log('✅ Cloudinary connection test PASSED');
      console.log('Your Cloudinary credentials are valid and working correctly.');
    } else {
      console.log('\n=== SUMMARY ===');
      console.log('❌ Cloudinary connection test FAILED');
      console.log('Check your credentials and network connection.');
      console.log('\nTROUBLESHOOTING TIPS:');
      console.log('1. Verify your Cloudinary credentials in .env.local');
      console.log('2. Make sure your internet connection is working');
      console.log('3. Check if your Cloudinary account is active');
    }
  })
  .catch(err => {
    console.error('Unexpected error during test:', err);
  }); 