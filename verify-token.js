require('dotenv').config();
const jwt = require('jsonwebtoken');

// This is a simple script to decode a JWT token
// You'll need to paste your token manually when running this

const token = process.argv[2]; // Get token from command line argument

if (!token) {
  console.error('Please provide a token as command line argument');
  console.log('Usage: node verify-token.js YOUR_TOKEN_HERE');
  process.exit(1);
}

try {
  // Try to decode the token without verification (we just want to see its contents)
  const decoded = jwt.decode(token);
  
  console.log('Decoded token:');
  console.log(JSON.stringify(decoded, null, 2));
  
  // Specifically check for role
  if (decoded && decoded.role) {
    console.log(`\nRole found: ${decoded.role}`);
  } else {
    console.log('\nNo role found in token!');
  }
  
} catch (error) {
  console.error('Error decoding token:', error.message);
} 