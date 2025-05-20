// Direct Cloudinary credentials test script (TypeScript version)
import { v2 as cloudinary } from 'cloudinary';

/**
 * Main function to test Cloudinary credentials
 * IMPORTANT: NEVER COMMIT ACTUAL CREDENTIALS TO SOURCE CONTROL
 */
async function testCloudinaryDirectly(): Promise<void> {
  // THESE ARE PLACEHOLDERS - REPLACE WHEN TESTING LOCALLY AND NEVER COMMIT ACTUAL VALUES
  const credentials = {
    cloudName: "YOUR_CLOUD_NAME_PLACEHOLDER",
    apiKey: "YOUR_API_KEY_PLACEHOLDER",
    apiSecret: "YOUR_API_SECRET_PLACEHOLDER" 
  };

  console.log("======== CLOUDINARY DIRECT CREDENTIALS TEST ========");
  console.log("Testing with these credentials:");
  console.log(`- Cloud Name: ${credentials.cloudName}`);
  console.log(`- API Key: ${maskString(credentials.apiKey)}`);
  console.log(`- API Secret: ${maskString(credentials.apiSecret)}`);
  console.log("====================================================");

  // Validate input credentials
  const validationResult = validateCredentials(credentials);
  if (!validationResult.valid) {
    console.error(`❌ Credential validation failed: ${validationResult.message}`);
    return;
  }

  // Configure Cloudinary directly with these credentials
  cloudinary.config({
    cloud_name: credentials.cloudName,
    api_key: credentials.apiKey,
    api_secret: credentials.apiSecret,
    secure: true
  });

  // First test: Try to ping the API
  try {
    console.log("\n1️⃣ Testing API connection with ping...");
    const pingResult = await cloudinary.api.ping();
    console.log(`✅ Ping successful: ${JSON.stringify(pingResult)}`);
  } catch (error: any) {
    handleCloudinaryError("ping test", error);
    return; // Stop further tests if ping fails
  }

  // Second test: Try to get account usage
  try {
    console.log("\n2️⃣ Testing API by fetching account usage...");
    const usageResult = await cloudinary.api.usage();
    console.log("✅ Usage fetch successful!");
    console.log("Last month statistics:");
    console.log(`- Bandwidth: ${formatBytes(usageResult.bandwidth.usage)}`);
    console.log(`- Storage: ${formatBytes(usageResult.storage.usage)}`);
    console.log(`- Requests: ${usageResult.requests.usage}`);
  } catch (error: any) {
    handleCloudinaryError("usage test", error);
  }

  // Third test: Try to list upload presets
  try {
    console.log("\n3️⃣ Testing API by listing upload presets...");
    const presetsResult = await cloudinary.api.upload_presets({ max_results: 5 });
    console.log(`✅ Successfully retrieved ${presetsResult.presets?.length || 0} presets`);
  } catch (error: any) {
    handleCloudinaryError("presets test", error);
  }

  console.log("\n======= CLOUDINARY TEST COMPLETE =======");
  console.log("If all tests passed, these credentials are valid!");
  console.log("You should update your Vercel environment variables with these credentials.");
}

/**
 * Utility function to mask a string for display (showing only first 4 and last 2 chars)
 */
function maskString(input: string): string {
  if (!input || input.length < 8) {
    return '[INVALID]';
  }
  return `${input.substring(0, 4)}...${input.substring(input.length - 2)} (${input.length} chars)`;
}

/**
 * Validate the credentials format
 */
function validateCredentials(credentials: { cloudName: string, apiKey: string, apiSecret: string }): { valid: boolean, message?: string } {
  if (!credentials.cloudName || credentials.cloudName === "your-cloud-name") {
    return { valid: true }; // We're using the known cloud name
  }
  
  if (!credentials.apiKey || credentials.apiKey === "REPLACE_WITH_YOUR_ACTUAL_API_KEY") {
    return { valid: false, message: "Please replace the API key placeholder with your actual API key" };
  }
  
  if (!credentials.apiSecret || credentials.apiSecret === "REPLACE_WITH_YOUR_ACTUAL_API_SECRET") {
    return { valid: false, message: "Please replace the API secret placeholder with your actual API secret" };
  }
  
  return { valid: true };
}

/**
 * Handle and display Cloudinary errors in a helpful way
 */
function handleCloudinaryError(testName: string, error: any): void {
  console.error(`❌ ${testName} failed with error:`);
  console.error(`- Name: ${error.name}`);
  console.error(`- Message: ${error.message}`);
  
  // Provide guidance based on common error messages
  if (error.message.includes("authentication required") || error.message.includes("Signature")) {
    console.error("\n🔍 DIAGNOSIS: This looks like an authentication error.");
    console.error("The API key or secret is likely incorrect. Double-check both values.");
  } else if (error.message.includes("resource not found") || error.message.includes("not found")) {
    console.error("\n🔍 DIAGNOSIS: This looks like a resource not found error.");
    console.error("The cloud name might be incorrect, or you might not have access to this resource.");
  } else if (error.message.includes("network") || error.message.includes("ENOTFOUND")) {
    console.error("\n🔍 DIAGNOSIS: This looks like a network connectivity issue.");
    console.error("Check your internet connection or if there are any firewall restrictions.");
  }
  
  console.error("\nDetailed error:", error);
}

/**
 * Format bytes into a human-readable format
 */
function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

// Run the test function
testCloudinaryDirectly().catch(error => {
  console.error("Unhandled error in test:", error);
}); 