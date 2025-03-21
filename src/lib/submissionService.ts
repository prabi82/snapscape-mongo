import PhotoSubmission from '@/models/PhotoSubmission';
import Competition from '@/models/Competition';
import dbConnect from './dbConnect';

/**
 * Get the count of submissions made by a user
 * @param userId The ID of the user
 * @returns The number of submissions made by the user
 */
export const getSubmissionCountByUser = async (userId: string): Promise<number> => {
  try {
    await dbConnect();
    const count = await PhotoSubmission.countDocuments({ user: userId });
    return count;
  } catch (error) {
    console.error('Error counting user submissions:', error);
    return 0;
  }
};

/**
 * Get the latest submissions made by a user
 * @param userId The ID of the user
 * @param limit The maximum number of submissions to return
 * @returns An array of submissions with competition details
 */
export const getLatestSubmissionsByUser = async (userId: string, limit = 5) => {
  try {
    await dbConnect();
    const submissions = await PhotoSubmission.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('competition', 'title')
      .select('title imageUrl thumbnailUrl competition createdAt');
    
    // Format submissions with competition title
    return submissions.map(submission => {
      const formattedSubmission = submission.toObject();
      if (formattedSubmission.competition) {
        formattedSubmission.competitionTitle = formattedSubmission.competition.title;
        formattedSubmission.competitionId = formattedSubmission.competition._id;
      }
      return formattedSubmission;
    });
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    return [];
  }
}; 