import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import PhotoSubmission from '@/models/PhotoSubmission';
import dbConnect from '@/lib/dbConnect';

export async function GET(req: NextRequest) {
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
    
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') || session.user.id;
    
    // Get all approved submissions for the user
    const submissions = await PhotoSubmission.find({
      user: userId,
      status: 'approved'
    })
    .populate('competition', 'title status')
    .lean();
    
    // Get all competitions where the user has submissions
    const competitionIds = [...new Set(submissions.map(sub => sub.competition._id))];
    
    // For each competition, get all submissions and determine winners
    const achievements = await Promise.all(competitionIds.map(async (compId) => {
      const compSubs = await PhotoSubmission.find({
        competition: compId,
        status: 'approved'
      }).lean();
      
      // Get unique ratings and sort them
      const ratings = [...new Set(compSubs.map(sub => sub.averageRating))].sort((a, b) => b - a);
      const gold = ratings[0] ?? null;
      const silver = ratings[1] ?? null;
      const bronze = ratings[2] ?? null;
      
      // Find user's submissions in this competition
      const userSubs = compSubs.filter(sub => sub.user.toString() === userId);
      
      // Determine achievements
      const achievements = userSubs.map(sub => {
        if (sub.averageRating === gold) return { position: 1, rating: sub.averageRating };
        if (sub.averageRating === silver) return { position: 2, rating: sub.averageRating };
        if (sub.averageRating === bronze) return { position: 3, rating: sub.averageRating };
        return null;
      }).filter(Boolean);
      
      return {
        competitionId: compId,
        competitionTitle: compSubs[0]?.competition?.title,
        achievements
      };
    }));
    
    // Calculate total achievements
    const stats = {
      firstPlace: achievements.reduce((sum, comp) => 
        sum + comp.achievements.filter(a => a.position === 1).length, 0),
      secondPlace: achievements.reduce((sum, comp) => 
        sum + comp.achievements.filter(a => a.position === 2).length, 0),
      thirdPlace: achievements.reduce((sum, comp) => 
        sum + comp.achievements.filter(a => a.position === 3).length, 0),
      totalTopThree: achievements.reduce((sum, comp) => 
        sum + comp.achievements.length, 0)
    };
    
    return NextResponse.json({
      success: true,
      data: {
        stats,
        achievements: achievements.filter(comp => comp.achievements.length > 0)
      }
    });
  } catch (error: any) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 