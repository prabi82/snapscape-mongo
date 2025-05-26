import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { token } = await req.json();
    
    if (!token) {
      return NextResponse.json(
        { valid: false, message: 'Token is required' },
        { status: 400 }
      );
    }
    
    // Find user with this reset token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() } // Token must not be expired
    });
    
    if (!user) {
      return NextResponse.json(
        { valid: false, message: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { valid: true, message: 'Token is valid' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify reset token error:', error);
    return NextResponse.json(
      { valid: false, message: 'Error verifying token' },
      { status: 500 }
    );
  }
} 