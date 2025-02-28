import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../[...nextauth]/route";

export async function POST(request: NextRequest) {
  try {
    // Check if there's an admin already
    await dbConnect();
    const adminCount = await User.countDocuments({ role: "admin" });

    // Only allow this endpoint if there are no admins, or if requested by an existing admin
    if (adminCount > 0) {
      // If admins exist, require admin authentication
      const session = await getServerSession(authOptions);
      if (!session || session.user.role !== "admin") {
        return NextResponse.json(
          { error: "Unauthorized. Only existing admins can create new admins." },
          { status: 403 }
        );
      }
    }

    const { name, email, password } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user with email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Create new admin user
    const admin = new User({
      name,
      email,
      password,
      role: "admin",
    });

    await admin.save();

    // Return success without exposing password
    return NextResponse.json(
      {
        success: true,
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin creation error:", error);
    return NextResponse.json(
      { error: "Something went wrong during admin creation" },
      { status: 500 }
    );
  }
} 