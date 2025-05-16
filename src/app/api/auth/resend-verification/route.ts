import { NextRequest, NextResponse } from "next/server";
import crypto from 'crypto';
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { sendVerificationEmail } from "@/lib/emailService";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No user found with this email' },
        { status: 404 }
      );
    }
    
    // If user is already verified
    if (user.isVerified) {
      return NextResponse.json(
        { success: false, message: 'Your email is already verified. Please sign in.' },
        { status: 400 }
      );
    }
    
    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // Token expires in 24 hours
    
    // Update user with new token
    user.verificationToken = verificationToken;
    user.verificationExpires = verificationExpires;
    await user.save();
    
    // Send verification email
    await sendVerificationEmail(user.email, user.name, verificationToken);
    
    return NextResponse.json(
      {
        success: true,
        message: 'Verification email has been resent. Please check your inbox.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Error resending verification email' },
      { status: 500 }
    );
  }
} 