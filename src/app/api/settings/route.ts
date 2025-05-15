import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import Setting from '../../../models/Setting';

// Public endpoint to get application settings
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    // Get settings document - there should only be one
    let settings = await Setting.findOne({});
    
    // If no settings exist yet, use default values
    if (!settings) {
      return NextResponse.json({
        success: true,
        data: {
          allowNotificationDeletion: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch settings'
    }, { status: 500 });
  }
} 