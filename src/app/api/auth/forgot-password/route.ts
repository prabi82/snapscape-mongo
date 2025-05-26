import { NextRequest, NextResponse } from "next/server";
import crypto from 'crypto';
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { sendPasswordResetEmail } from "@/lib/emailService";

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
    
    console.log(`Password reset requested for email: ${email}`);
    
    // Check if email environment variables are set and not empty
    const emailConfigured = process.env.EMAIL_HOST && 
                           process.env.EMAIL_USER && 
                           process.env.EMAIL_PASSWORD &&
                           process.env.EMAIL_HOST.trim() !== '' &&
                           process.env.EMAIL_USER.trim() !== '' &&
                           process.env.EMAIL_PASSWORD.trim() !== '';
    
    console.log(`Email service configured: ${emailConfigured ? 'YES' : 'NO'}`);
    console.log(`EMAIL_HOST: ${process.env.EMAIL_HOST ? 'SET' : 'NOT SET'}`);
    console.log(`EMAIL_USER: ${process.env.EMAIL_USER ? 'SET' : 'NOT SET'}`);
    console.log(`EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET'}`);
    
    if (!emailConfigured) {
      console.error('Email service not configured - missing environment variables');
      return NextResponse.json(
        { success: false, message: 'Email service is not configured. Please contact support.' },
        { status: 500 }
      );
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`No user found with email: ${email}`);
      // For security, don't reveal if email exists or not
      return NextResponse.json(
        { success: true, message: 'If an account with that email exists, a password reset link has been sent.' },
        { status: 200 }
      );
    }
    
    console.log(`User found: ${user._id}, generating reset token`);
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Save reset token to user
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();
    
    console.log(`Reset token saved for user ${user._id}, expires at: ${resetExpires}`);
    
    // Send password reset email
    try {
      const emailSent = await sendPasswordResetEmail(email, user.name, resetToken);
      
      if (emailSent) {
        console.log(`Password reset email sent successfully to: ${email}`);
        return NextResponse.json(
          { success: true, message: 'Password reset email sent successfully' },
          { status: 200 }
        );
      } else {
        console.error(`Failed to send password reset email to: ${email}`);
        return NextResponse.json(
          { success: false, message: 'Failed to send password reset email. Please try again later.' },
          { status: 500 }
        );
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return NextResponse.json(
        { success: false, message: 'Failed to send password reset email. Please try again later.' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 