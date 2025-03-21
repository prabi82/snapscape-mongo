const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// List of possible .env files in order of priority (lowest to highest)
const envFiles = [
  '.env',
  '.env.local',
  '.env.development',
  '.env.development.local',
  '.env.production',
  '.env.production.local',
];

console.log('==========================================');
console.log('NEXT.JS ENVIRONMENT FILES CHECK');
console.log('==========================================');

// Check which files exist and load them
envFiles.forEach(file => {
  const filePath = path.resolve(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - EXISTS`);
    
    // Load and print relevant auth variables (without exposing secrets)
    const env = dotenv.parse(fs.readFileSync(filePath));
    
    // Check for auth variables
    const hasNextAuthUrl = !!env.NEXTAUTH_URL;
    const hasNextAuthSecret = !!env.NEXTAUTH_SECRET;
    const hasGoogleClientId = !!env.GOOGLE_CLIENT_ID;
    const hasGoogleClientSecret = !!env.GOOGLE_CLIENT_SECRET;
    
    console.log(`   - NEXTAUTH_URL: ${hasNextAuthUrl ? env.NEXTAUTH_URL : 'Not set'}`);
    console.log(`   - NEXTAUTH_SECRET: ${hasNextAuthSecret ? '[Set]' : 'Not set'}`);
    console.log(`   - GOOGLE_CLIENT_ID: ${hasGoogleClientId ? (env.GOOGLE_CLIENT_ID ? 'Set' : 'Empty string') : 'Not set'}`);
    console.log(`   - GOOGLE_CLIENT_SECRET: ${hasGoogleClientSecret ? (env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Empty string') : 'Not set'}`);
    console.log('');
  } else {
    console.log(`❌ ${file} - DOES NOT EXIST`);
  }
});

console.log('==========================================');
console.log('CURRENT PROCESS.ENV VALUES:');
console.log('==========================================');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
console.log(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || 'Not set'}`);
console.log(`NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? '[Set]' : 'Not set'}`);
console.log(`GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? (process.env.GOOGLE_CLIENT_ID.length > 0 ? 'Set' : 'Empty string') : 'Not set'}`);
console.log(`GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? (process.env.GOOGLE_CLIENT_SECRET.length > 0 ? 'Set' : 'Empty string') : 'Not set'}`);

console.log('');
console.log('==========================================');
console.log('RECOMMENDATIONS:');
console.log('==========================================');

if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === '') {
  console.log('⚠️ You need to add your Google Client ID to your environment variables');
  console.log('   Follow the instructions in .env.development.local to create OAuth credentials');
}

if (!process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET === '') {
  console.log('⚠️ You need to add your Google Client Secret to your environment variables');
  console.log('   Follow the instructions in .env.development.local to create OAuth credentials');
}

console.log('');
console.log('After adding your Google OAuth credentials, restart your Next.js server'); 