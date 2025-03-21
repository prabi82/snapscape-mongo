import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
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
    const session = await getServerSession();
    const { id } = params;
    
    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Only allow admins to access any profile, regular users only their own
    if (!session.user.email && id !== session.user.id && session.user.role !== 'admin') {
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
    const session = await getServerSession();
    const { id } = params;
    
    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Only allow users to update their own profile or admins to update any profile
    if (id !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Not authorized to update this profile' },
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
    
    // If admin is updating, allow role changes
    const allowedUpdates = session.user.role === 'admin' 
      ? ['name', 'bio', 'role'] 
      : ['name', 'bio'];
      
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
      message: 'Profile updated successfully',
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