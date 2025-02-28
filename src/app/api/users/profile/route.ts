import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    // Check if the user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    await dbConnect();
    
    // Get the user profile without the password field
    const user = await User.findById(session.user.id).select("-password");
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check if the user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    const { name, email } = await request.json();
    
    // Basic validation
    if (!name && !email) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    // If email is being updated, check if it's already in use
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: session.user.id } });
      if (existingUser) {
        return NextResponse.json(
          { error: "Email is already in use" },
          { status: 409 }
        );
      }
    }
    
    // Update user profile
    const updateData = {} as any;
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
} 