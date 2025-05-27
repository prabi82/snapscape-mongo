import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import dbConnect from '../../../../lib/dbConnect';
import Setting from '../../../../models/Setting';

// Define a proper session type to fix TypeScript errors
interface ExtendedSession {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
    role?: string;
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as ExtendedSession;
    
    // Check if user is authenticated and is an admin
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized access' 
      }, { status: 403 });
    }

    await dbConnect();
    
    // Get settings document - there should only be one
    let settings = await Setting.findOne({});
    
    // If no settings exist yet, create default settings
    if (!settings) {
      settings = await Setting.create({
        allowNotificationDeletion: true,
        enableImageCompressionDisplay: true
      });
    }

    return NextResponse.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch settings'
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as ExtendedSession;
    
    // Check if user is authenticated and is an admin
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized access' 
      }, { status: 403 });
    }

    const body = await req.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json({
        success: false,
        error: 'Settings data is required'
      }, { status: 400 });
    }

    await dbConnect();
    
    try {
      // Log more information for debugging
      console.log('Attempting to update settings with:', settings);
      
      // Update settings or create if doesn't exist
      const updatedSettings = await Setting.findOneAndUpdate(
        {}, // Empty filter to match the single settings document
        { 
          $set: settings 
        },
        { 
          new: true, // Return the updated document
          upsert: true // Create if doesn't exist
        }
      );
      
      console.log('Settings updated successfully:', updatedSettings);

      return NextResponse.json({
        success: true,
        data: updatedSettings
      });
    } catch (dbError) {
      console.error('MongoDB error:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database error: ' + (dbError instanceof Error ? dbError.message : 'Unknown error')
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update settings: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
} 