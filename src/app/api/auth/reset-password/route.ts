import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { token, password } = await req.json();
    
    console.log(`Password reset confirmation attempt with token: ${token ? 'PROVIDED' : 'MISSING'}`);
    
    if (!token || !password) {
      console.log('Missing token or password in reset request');
      return NextResponse.json(
        { success: false, message: 'Token and password are required' },
        { status: 400 }
      );
    }
    
    if (password.length < 6) {
      console.log('Password too short in reset request');
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }
    
    console.log('Searching for user with reset token...');
    
    // Find user with this reset token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() } // Token must not be expired
    });
    
    if (!user) {
      console.log('No user found with valid reset token or token expired');
      return NextResponse.json(
        { success: false, message: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }
    
    console.log(`User found for password reset: ${user._id} (${user.email})`);
    
    // Set the new password (let the User model's pre-save hook handle hashing)
    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    
    console.log('Saving user with new password (will be hashed by pre-save hook)...');
    await user.save();
    
    console.log(`Password reset completed successfully for user: ${user.email}`);
    
    return NextResponse.json(
      {
        success: true,
        message: 'Password has been reset successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, message: 'Error resetting password' },
      { status: 500 }
    );
  }
} 