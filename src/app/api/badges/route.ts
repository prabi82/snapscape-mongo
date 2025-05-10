import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
// Use the helper for model imports
import { Badge, UserBadge, Notification, ensureModelsAreLoaded } from '@/lib/model-import-helper';
import dbConnect from '@/lib/dbConnect';

// GET all badges or user badges
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    // Ensure models are loaded
    ensureModelsAreLoaded();
    const session = await getServerSession();
    
    const url = new URL(req.url);
    const userId = url.searchParams.get('user');
    const includeDetails = url.searchParams.get('includeDetails') === 'true';
    
    // If fetching user badges, check authentication
    if (userId && userId === session?.user?.id) {
      // User is viewing their own badges
      const userBadges = await UserBadge.find({ user: userId })
        .sort({ awardedAt: -1 })
        .populate('badge')
        .populate('competition', 'title')
        .populate('photo', 'title');
        
      return NextResponse.json({
        success: true,
        data: userBadges
      });
    } else if (userId) {
      // Public view of user badges (fewer details)
      const userBadges = await UserBadge.find({ user: userId })
        .sort({ awardedAt: -1 })
        .populate('badge', includeDetails ? undefined : 'name icon')
        .populate('photo', 'title');
        
      return NextResponse.json({
        success: true,
        data: userBadges
      });
    } else {
      // Get all badge types
      const badges = await Badge.find().sort({ name: 1 });
      
      return NextResponse.json({
        success: true,
        data: badges
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST create a new badge (admin only) or assign badge to user
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession();
    
    // Check authentication
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { action } = body;
    
    if (action === 'create') {
      // Create new badge type (admin only)
      // In a real implementation, you would check if the user is an admin
      
      // Validate required fields
      const requiredFields = ['name', 'description', 'icon', 'criteria', 'type'];
      for (const field of requiredFields) {
        if (!body[field]) {
          return NextResponse.json(
            { success: false, message: `${field} is required` },
            { status: 400 }
          );
        }
      }
      
      // Create badge
      const badge = await Badge.create(body);
      
      return NextResponse.json(
        { success: true, data: badge },
        { status: 201 }
      );
    } else if (action === 'assign') {
      // Assign badge to user (admin only)
      // In a real implementation, you would check if the user is an admin
      
      // Validate required fields
      const requiredFields = ['user', 'badge'];
      for (const field of requiredFields) {
        if (!body[field]) {
          return NextResponse.json(
            { success: false, message: `${field} is required` },
            { status: 400 }
          );
        }
      }
      
      // Check if badge exists
      const badgeExists = await Badge.exists({ _id: body.badge });
      if (!badgeExists) {
        return NextResponse.json(
          { success: false, message: 'Badge not found' },
          { status: 404 }
        );
      }
      
      // Check if user already has this badge
      const userBadgeExists = await UserBadge.exists({
        user: body.user,
        badge: body.badge,
      });
      
      if (userBadgeExists) {
        return NextResponse.json(
          { success: false, message: 'User already has this badge' },
          { status: 400 }
        );
      }
      
      // Assign badge to user
      const userBadge = await UserBadge.create(body);
      
      // Create notification for the user
      const badge = await Badge.findById(body.badge);
      await (await import('@/models/Notification')).default.create({
        user: body.user,
        title: 'New Badge Awarded!',
        message: `You have been awarded the ${badge.name} badge.`,
        type: 'new_badge',
        relatedBadge: body.badge,
      });
      
      return NextResponse.json(
        { success: true, data: userBadge },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 