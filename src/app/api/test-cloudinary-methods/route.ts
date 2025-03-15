import { NextRequest, NextResponse } from 'next/server';
import { 
  initCloudinaryFromEnv,
  initCloudinaryFromUrl,
  initCloudinaryWithCredentials,
  testCloudinaryConnection
} from '@/lib/cloudinary-init';

// This endpoint allows testing different methods of initializing Cloudinary
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { method, credentials } = data;
    
    console.log(`Testing Cloudinary initialization with method: ${method}`);
    
    let cloudinary;
    let testResult;
    
    // Initialize Cloudinary based on the specified method
    switch (method) {
      case 'env':
        // Use environment variables
        cloudinary = initCloudinaryFromEnv();
        break;
        
      case 'url':
        // Use a Cloudinary URL
        if (!credentials?.url) {
          return NextResponse.json({
            success: false,
            error: 'Missing Cloudinary URL in credentials'
          }, { status: 400 });
        }
        cloudinary = initCloudinaryFromUrl(credentials.url);
        break;
        
      case 'explicit':
        // Use explicit credentials
        if (!credentials?.cloudName || !credentials?.apiKey || !credentials?.apiSecret) {
          return NextResponse.json({
            success: false,
            error: 'Missing explicit Cloudinary credentials'
          }, { status: 400 });
        }
        cloudinary = initCloudinaryWithCredentials({
          cloudName: credentials.cloudName,
          apiKey: credentials.apiKey,
          apiSecret: credentials.apiSecret
        });
        break;
        
      default:
        return NextResponse.json({
          success: false,
          error: `Invalid initialization method: ${method}`
        }, { status: 400 });
    }
    
    // Test the Cloudinary connection
    testResult = await testCloudinaryConnection();
    
    return NextResponse.json({
      success: testResult.success,
      method,
      testResult,
      message: testResult.success 
        ? 'Cloudinary connection successful' 
        : 'Cloudinary connection failed'
    });
  } catch (error: any) {
    console.error('Error testing Cloudinary methods:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

// Provide information about this endpoint
export async function GET() {
  return NextResponse.json({
    endpoint: 'test-cloudinary-methods',
    description: 'Tests different methods for initializing Cloudinary',
    usage: 'Send a POST request with JSON body { "method": "env|url|explicit", "credentials": { ... } }',
    methods: {
      env: 'Uses environment variables (no credentials needed)',
      url: 'Uses a Cloudinary URL (credentials.url required)',
      explicit: 'Uses explicit credentials (credentials.cloudName, credentials.apiKey, credentials.apiSecret required)'
    }
  });
} 