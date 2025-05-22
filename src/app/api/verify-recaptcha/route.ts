import { NextRequest, NextResponse } from "next/server";
import { verifyRecaptcha } from "@/lib/recaptcha";

export async function POST(req: NextRequest) {
  try {
    const { token, action } = await req.json();
    
    console.log(`Received reCAPTCHA verification request for action: ${action}`);
    
    if (!token) {
      console.error('Missing reCAPTCHA token in request');
      return NextResponse.json(
        { success: false, message: 'reCAPTCHA token is required' },
        { status: 400 }
      );
    }
    
    // Verify the token with Google's reCAPTCHA service
    console.log('Verifying token with Google...');
    const result = await verifyRecaptcha(token);
    
    console.log('Verification result:', JSON.stringify(result));
    
    // During development, we'll accept responses even if Google verification fails
    // due to domain restrictions (localhost not being in the allowed domains)
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!result.success) {
      console.error('reCAPTCHA verification failed with result:', JSON.stringify(result));
      
      // Allow failed verification in development environment
      if (isDevelopment) {
        console.log('Development environment detected - bypassing reCAPTCHA verification for testing');
        // Simulate a successful verification with a good score
        result.success = true;
        result.score = 0.9;
      } else {
        return NextResponse.json(
          { success: false, message: 'reCAPTCHA verification failed' },
          { status: 400 }
        );
      }
    }
    
    // For v3, we need to check the score and action
    if (result.score !== undefined) {
      // Minimum acceptable score (0.0 to 1.0, where 1.0 is very likely a good interaction)
      const minScore = isDevelopment ? 0.1 : 0.5; // Lower threshold in development
      
      console.log(`reCAPTCHA score: ${result.score} (min required: ${minScore})`);
      
      if (result.score < minScore) {
        console.warn(`reCAPTCHA score too low: ${result.score} for action: ${action}`);
        return NextResponse.json(
          { success: false, message: 'Security verification failed due to suspicious activity' },
          { status: 400 }
        );
      }
      
      // Verify that the action matches what we expect
      console.log(`Checking action match: expected ${action}, got ${result.action}`);
      
      if (!isDevelopment && action && result.action && result.action !== action) {
        console.warn(`reCAPTCHA action mismatch: expected ${action}, got ${result.action}`);
        return NextResponse.json(
          { success: false, message: 'Security verification failed due to action mismatch' },
          { status: 400 }
        );
      }
    }
    
    console.log('reCAPTCHA verification successful!');
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Error verifying reCAPTCHA' },
      { status: 500 }
    );
  }
} 