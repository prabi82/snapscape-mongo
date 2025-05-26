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
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      // For security, don't reveal if email exists or not
      return NextResponse.json(
        { 
          success: true, 
          message: 'If an account with that email exists, we have sent a password reset link.' 
        },
        { status: 200 }
      );
    }
    
    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // Token expires in 1 hour
    
    // Update user with reset token
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();
    
    // Send password reset email
    await sendPasswordResetEmail(user.email, user.name, resetToken);
    
    return NextResponse.json(
      {
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, message: 'Error sending password reset email' },
      { status: 500 }
    );
  }
} 