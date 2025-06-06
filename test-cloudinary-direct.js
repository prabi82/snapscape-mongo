// Direct Cloudinary credentials test script
const { v2: cloudinary } = require('cloudinary');

// IMPORTANT: NEVER COMMIT ACTUAL CREDENTIALS TO SOURCE CONTROL
// Replace these placeholders with your actual credentials when testing locally
const CLOUD_NAME = "YOUR_CLOUD_NAME_PLACEHOLDER"; 
const API_KEY = "YOUR_API_KEY_PLACEHOLDER";
const API_SECRET = "YOUR_API_SECRET_PLACEHOLDER";

// Configure Cloudinary with direct credentials
cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
  secure: true
});

// Function to test the Cloudinary connection
async function testCloudinaryConnection() {
  console.log("Testing Cloudinary connection with direct credentials:");
  console.log(`Cloud name: ${CLOUD_NAME}`);
  console.log(`API key length: ${API_KEY.length} characters`);
  console.log(`API secret length: ${API_SECRET.length} characters`);
  
  try {
    // Test API connection with ping
    console.log("\nAttempting to ping Cloudinary API...");
    const pingResult = await cloudinary.api.ping();
    
    console.log("\n✅ SUCCESS! Connected to Cloudinary");
    console.log("Ping result:", pingResult);
    
    // Try to fetch some account information as an additional test
    console.log("\nFetching account info...");
    const accountInfo = await cloudinary.api.usage();
    console.log("Account info (last month usage):", {
      bandwidth: accountInfo.bandwidth,
      storage: accountInfo.storage,
      requests: accountInfo.requests,
      resources: accountInfo.resources,
      transformations: accountInfo.transformations
    });
    
  } catch (error) {
    console.error("\n❌ ERROR! Failed to connect to Cloudinary");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    
    // Provide some guidance based on common errors
    if (error.message.includes("authentication required")) {
      console.error("\nPossible cause: Invalid API key or secret");
    } else if (error.message.includes("resource not found")) {
      console.error("\nPossible cause: Invalid cloud name");
    } else if (error.message.includes("network")) {
      console.error("\nPossible cause: Network connectivity issue");
    }
    
    console.error("\nFull error:", error);
  }
}

// Run the test
testCloudinaryConnection(); 