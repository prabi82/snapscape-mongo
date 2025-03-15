// Script to check Cloudinary environment variables in local environment
require('dotenv').config({ path: '.env.local' }); // Load from .env.local

console.log("======== CHECKING CLOUDINARY ENV VARIABLES ========");

// Function to safely display credentials (partially masked)
function displayCredential(name, value) {
  if (!value) {
    console.log(`❌ ${name}: NOT SET`);
    return;
  }
  
  // Mask most of the credential for security
  const masked = value.length > 8 
    ? `${value.substring(0, 4)}...${value.substring(value.length - 2)} (${value.length} chars)`
    : "[TOO SHORT]";
  
  console.log(`✅ ${name}: ${masked}`);
}

// Check each Cloudinary environment variable
displayCredential("CLOUDINARY_CLOUD_NAME", process.env.CLOUDINARY_CLOUD_NAME);
displayCredential("CLOUDINARY_API_KEY", process.env.CLOUDINARY_API_KEY);
displayCredential("CLOUDINARY_API_SECRET", process.env.CLOUDINARY_API_SECRET);

console.log("\n======= ENVIRONMENT FILES CHECK =======");
const fs = require('fs');
const path = require('path');

// Check for various environment files
const envFiles = [
  '.env',
  '.env.local',
  '.env.development',
  '.env.production',
  '.vercel/.env.development.local',
  '.vercel/.env.production.local',
];

envFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}: EXISTS`);
    
    // Read the file and check for Cloudinary variables
    const content = fs.readFileSync(filePath, 'utf8');
    const hasCloudinaryVars = content.includes('CLOUDINARY_');
    
    if (hasCloudinaryVars) {
      console.log(`   Contains Cloudinary variables: YES`);
    } else {
      console.log(`   Contains Cloudinary variables: NO`);
    }
  } else {
    console.log(`❌ ${file}: NOT FOUND`);
  }
});

console.log("\n======= NEXT STEPS =======");
console.log("1. Check if the values above match what you expect");
console.log("2. Ensure the same values are set in your Vercel environment variables");
console.log("3. If there's a mismatch, update your Vercel environment variables");
console.log("4. After updating, redeploy your application");

// Compare with Vercel CLI if available
try {
  console.log("\n======= VERCEL ENV VARS CHECK =======");
  console.log("Run the following command to check environment variables in Vercel:");
  console.log("   npx vercel env ls");
} catch (error) {
  // Silently ignore errors
} 