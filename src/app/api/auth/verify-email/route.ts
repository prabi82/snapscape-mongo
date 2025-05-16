import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { token } = await req.json();
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Verification token is required' },
        { status: 400 }
      );
    }
    
    // Find user with the provided token that hasn't expired
    const user = await User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: new Date() }, // Token must not be expired
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }
    
    // Mark user as verified and clear verification fields
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationExpires = null;
    await user.save();
    
    return NextResponse.json(
      {
        success: true,
        message: 'Email verified successfully! You can now sign in to your account.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Error verifying email' },
      { status: 500 }
    );
  }
} 