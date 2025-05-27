import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import Setting from '../../../models/Setting';

// Public endpoint to get application settings
export async function GET(req: NextRequest) {
  try {
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

    // Return only the settings that should be public
    const publicSettings = {
      enableImageCompressionDisplay: settings.enableImageCompressionDisplay
    };

    return NextResponse.json({
      success: true,
      data: publicSettings
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch settings'
    }, { status: 500 });
  }
} 