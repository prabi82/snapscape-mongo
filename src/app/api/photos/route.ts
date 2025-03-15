import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Photo from '@/models/Photo';
import Competition from '@/models/Competition';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const url = new URL(request.url);
    const competitionId = url.searchParams.get('competition');
    const userId = url.searchParams.get('user');
    
    // Parse pagination parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    
    if (competitionId) {
      query.competition = competitionId;
    }
    
    // Add user filter if specified
    if (userId) {
      query.user = userId;
    }

    // Execute query with pagination
    const photos = await Photo.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .lean();
    
    const total = await Photo.countDocuments(query);

    // Format the response to match the expected structure
    const formattedPhotos = photos.map(photo => ({
      ...photo,
      status: 'approved', // Photos are considered approved by default
      thumbnailUrl: photo.imageUrl, // Use the same URL for thumbnail
      ratingCount: photo.ratingsCount || 0,
      averageRating: photo.averageRating || 0
    }));

    return NextResponse.json({
      success: true,
      data: formattedPhotos,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred while fetching photos' },
      { status: 500 }
    );
  }
} 