import { NextRequest, NextResponse } from "next/server";
import crypto from 'crypto';
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { sendVerificationEmail } from "@/lib/emailService";

// Function to generate a random token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { name, email, password } = await req.json();
    
    // Basic validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide name, email, and password' },
        { status: 400 }
      );
    }
    
    // Check if the email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email is already registered' },
        { status: 409 }
      );
    }
    
    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // Token expires in 24 hours
    
    // Create new user with verification token
    const user = await User.create({
      name,
      email,
      password, // Password will be hashed by the User model pre-save hook
      isVerified: false,
      verificationToken,
      verificationExpires,
    });
    
    // Send verification email
    await sendVerificationEmail(email, name, verificationToken);
    
    // Remove sensitive information
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };
    
    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully. Please check your email to verify your account.',
        data: userResponse,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(
        (err: any) => err.message
      );
      return NextResponse.json(
        { success: false, message: validationErrors.join(', ') },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: 'Error registering user' },
      { status: 500 }
    );
  }
} 