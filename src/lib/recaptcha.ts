// Utility functions for handling reCAPTCHA

// Interface for reCAPTCHA v3 response
interface RecaptchaVerificationResult {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  error_codes?: string[];
}

/**
 * Verify a reCAPTCHA token with Google's reCAPTCHA API
 * @param token The reCAPTCHA token to verify
 * @returns Object containing verification result with score for v3
 */
export async function verifyRecaptcha(token: string): Promise<RecaptchaVerificationResult> {
  if (!token) {
    console.error('No token provided to verifyRecaptcha');
    return { success: false };
  }
  
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    if (!secretKey) {
      console.error('RECAPTCHA_SECRET_KEY is not defined in environment variables');
      return { success: false };
    }
    
    console.log('Verifying reCAPTCHA with secret key:', secretKey.substring(0, 5) + '...');
    
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });
    
    const data = await response.json();
    
    // Log the complete response for debugging
    console.log('reCAPTCHA verification response:', JSON.stringify(data));
    
    // Return the complete response for v3, which includes score and action
    return {
      success: data.success || false,
      score: data.score,
      action: data.action,
      challenge_ts: data.challenge_ts,
      hostname: data.hostname,
      error_codes: data.error_codes
    };
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return { success: false };
  }
} 