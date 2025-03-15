#!/usr/bin/env node

// Script to build a Cloudinary URL from individual components
console.log('=== Cloudinary URL Builder ===');

// Get inputs via command-line arguments
const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log('\nUsage:');
  console.log('  node build-cloudinary-url.js <cloud_name> <api_key> <api_secret>');
  console.log('\nExample:');
  console.log('  node build-cloudinary-url.js my-cloud-name 123456789012345 abcdef123456abcdef123456abcdef12');
  process.exit(0);
}

// Get credentials from arguments or prompt
const cloudName = args[0] || process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = args[1] || process.env.CLOUDINARY_API_KEY;
const apiSecret = args[2] || process.env.CLOUDINARY_API_SECRET;

// Check if we have all the required values
if (!cloudName || !apiKey || !apiSecret) {
  console.error('\nError: Missing required credentials.');
  console.error('Please provide cloud name, API key, and API secret.');
  process.exit(1);
}

console.log('\nBuilding Cloudinary URL with these credentials:');
console.log(`Cloud Name: ${cloudName}`);
console.log(`API Key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)} (${apiKey.length} chars)`);
console.log(`API Secret: ${apiSecret.substring(0, 4)}...${apiSecret.substring(apiSecret.length - 4)} (${apiSecret.length} chars)`);

// Build the Cloudinary URL
const cloudinaryUrl = `cloudinary://${apiKey}:${apiSecret}@${cloudName}`;

console.log('\n=== Cloudinary URL ===');
console.log(cloudinaryUrl);
console.log('\nYou can use this URL in your .env file:');
console.log('CLOUDINARY_URL=' + cloudinaryUrl);
console.log('\nOr you can use the individual components:');
console.log('CLOUDINARY_CLOUD_NAME=' + cloudName);
console.log('CLOUDINARY_API_KEY=' + apiKey);
console.log('CLOUDINARY_API_SECRET=' + apiSecret);

// Suggest next steps
console.log('\n=== Next Steps ===');
console.log('1. Copy one of the above formats to your .env.local file');
console.log('2. Add the same values to your Vercel environment variables');
console.log('3. Restart your Next.js server');
console.log('4. Visit the test page at /test-upload to verify the connection');

// Done!
console.log('\nDone! 🎉'); 