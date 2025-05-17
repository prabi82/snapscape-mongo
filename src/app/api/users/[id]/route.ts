import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';
import { getPhotoCountByUser } from '@/lib/photoService';
import { getSubmissionCountByUser } from '@/lib/submissionService';

// GET user by ID (profile)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const { id } = params;
    
    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Only allow admins to access any profile, regular users only their own
    if (id !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Not authorized to view this profile' },
        { status: 403 }
      );
    }
    
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get additional user stats
    const photoCount = await getPhotoCountByUser(id);
    const submissionCount = await getSubmissionCountByUser(id);
    
    const userData = {
      ...user.toObject(),
      photoCount,
      submissionCount
    };
    
    return NextResponse.json({ success: true, user: userData });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// PUT update user profile
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const { id } = params;
    
    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Only allow admins to update any profile
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Not authorized to update this user' },
        { status: 403 }
      );
    }
    
    const user = await User.findById(id);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    const body = await req.json();
    
    // Fields that admins can update
    const allowedUpdates = ['name', 'bio', 'role', 'isActive', 'isVerified'];
    const updates: any = {};
    
    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
    
    return NextResponse.json({ 
      success: true, 
      message: 'User updated successfully',
      user: updatedUser 
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const { id } = params;
    
    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Only allow admins to delete users
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Not authorized to delete users' },
        { status: 403 }
      );
    }
    
    // Don't allow deleting self
    if (id === session.user.id) {
      return NextResponse.json(
        { success: false, message: 'You cannot delete your own account' },
        { status: 400 }
      );
    }
    
    const user = await User.findById(id);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Delete the user
    await User.findByIdAndDelete(id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
} 