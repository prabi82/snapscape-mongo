import { NextRequest, NextResponse } from "next/server";
import crypto from 'crypto';
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { sendVerificationEmail } from "@/lib/emailService";
import { verifyRecaptcha } from "@/lib/recaptcha";

// Function to generate a random token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { name, email, mobile, country, password, recaptchaToken } = await req.json();
    
    // Basic validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide name, email, and password' },
        { status: 400 }
      );
    }
    
    // Verify reCAPTCHA token
    if (!recaptchaToken) {
      return NextResponse.json(
        { success: false, message: 'reCAPTCHA verification is required' },
        { status: 400 }
      );
    }
    
    const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!isRecaptchaValid) {
      return NextResponse.json(
        { success: false, message: 'reCAPTCHA verification failed. Please try again.' },
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

    // Check if the mobile number is already registered (if provided)
    if (mobile) {
      const existingMobile = await User.findOne({ mobile });
      if (existingMobile) {
        return NextResponse.json(
          { success: false, message: 'Mobile number is already registered' },
          { status: 409 }
        );
      }
    }
    
    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // Token expires in 24 hours
    
    // Create new user with verification token
    const user = await User.create({
      name,
      email,
      mobile,
      country,
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
      mobile: user.mobile,
      country: user.country,
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
    
    // Handle duplicate key errors (added to catch both email and mobile duplicates)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      let message = 'This information is already registered';
      
      if (field === 'email') {
        message = 'Email is already registered';
      } else if (field === 'mobile') {
        message = 'Mobile number is already registered';
      }
      
      return NextResponse.json(
        { success: false, message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: 'Error registering user' },
      { status: 500 }
    );
  }
} 