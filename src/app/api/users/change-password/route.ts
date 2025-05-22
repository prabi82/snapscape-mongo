import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Session } from "next-auth";
import bcrypt from "bcryptjs";

// Define a type for our extended session
interface ExtendedSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check if the user is authenticated
    // @ts-ignore - Ignore type error here
    const session = await getServerSession(authOptions) as ExtendedSession | null;
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { currentPassword, newPassword } = body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }
    
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long" },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    // Get user with password included
    const user = await User.findById(session.user.id).select("+password");
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Check if the user is using OAuth (social login)
    if (user.provider && user.provider !== 'credentials' && !user.password) {
      return NextResponse.json(
        { error: "Password cannot be changed for accounts using social login" },
        { status: 400 }
      );
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password || '');
    
    if (!isMatch) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    return NextResponse.json(
      { success: true, message: "Password updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
} 