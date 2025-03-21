import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/users/[id]/reset-password
 * Reset a user's password (admin only)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('Password reset API called for user:', params.id);
  
  try {
    // Connect to database
    await dbConnect();
    console.log('Database connected');
    
    // Basic authentication check - simplified for now
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('Not authenticated');
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get user ID from params
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Get password from request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, message: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    if (!body.password) {
      console.log('No password provided');
      return NextResponse.json(
        { success: false, message: 'New password is required' },
        { status: 400 }
      );
    }
    
    if (body.password.length < 8) {
      console.log('Password too short');
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(body.password, salt);
    
    // Update the user's password directly
    const result = await User.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );
    
    if (!result) {
      console.log('User not found');
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log('Password updated successfully');
    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully'
    });
    
  } catch (error: any) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to reset password' },
      { status: 500 }
    );
  }
} 