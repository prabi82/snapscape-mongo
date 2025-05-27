import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Competition from '@/models/Competition';
import PhotoSubmission from '@/models/PhotoSubmission';
import Photo from '@/models/Photo';
import Result from '@/models/Result';
import Rating from '@/models/Rating';
import formidable, { File as FormidableFile } from 'formidable';
import fs from 'fs';
import { PassThrough } from 'stream';
import mongoose from 'mongoose';
import { Session } from 'next-auth';

// Add a custom interface for the session user with role
interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

interface ExtendedSession extends Session {
  user?: ExtendedUser;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

// GET a single competition
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // Get the user session for user-specific data
    const session = await getServerSession(authOptions) as ExtendedSession | null;
    const userId = session?.user?.id;

    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Competition ID is required' },
        { status: 400 }
      );
    }

    // Find the competition by ID and populate related data
    const competition = await Competition.findById(id)
      .populate('createdBy', 'name email')
      .exec();

    if (!competition) {
      return NextResponse.json(
        { success: false, message: 'Competition not found' },
        { status: 404 }
      );
    }

    // Get submission count for this competition from both models
    const photoCount = await Photo.countDocuments({ competition: id });
    const submissionCount = await PhotoSubmission.countDocuments({ competition: id });
    
    // Total count is the sum of both models
    const totalSubmissionCount = photoCount + submissionCount;

    // Add submission count to competition data
    const competitionData = competition.toObject();
    competitionData.submissionCount = totalSubmissionCount;

    // Add user-specific data if a user is logged in
    if (userId) {
      // Count the user's submissions for this competition
      const userPhotoCount = await Photo.countDocuments({ 
        competition: id,
        user: userId
      });
      
      const userSubmissionCount = await PhotoSubmission.countDocuments({ 
        competition: id,
        user: userId
      });
      
      // Total user submissions
      const totalUserSubmissions = userPhotoCount + userSubmissionCount;
      
      // Add user-specific data
      competitionData.userSubmissionsCount = totalUserSubmissions;
      competitionData.hasSubmitted = totalUserSubmissions > 0;
      competitionData.canSubmitMore = totalUserSubmissions < competition.submissionLimit;
    } else {
      // Default values if no user is logged in
      competitionData.userSubmissionsCount = 0;
      competitionData.hasSubmitted = false;
      competitionData.canSubmitMore = true;
    }

    // Log the competition data for debugging
    console.log('Competition data:', {
      id: competitionData._id,
      title: competitionData.title,
      hasCoverImage: !!competitionData.coverImage,
      coverImage: competitionData.coverImage,
      submissionCount: competitionData.submissionCount,
      photoCount,
      photoSubmissionCount: submissionCount,
      userSubmissionsCount: competitionData.userSubmissionsCount,
      hasSubmitted: competitionData.hasSubmitted,
      canSubmitMore: competitionData.canSubmitMore
    });

    return NextResponse.json({
      success: true,
      data: competitionData
    });
  } catch (error: any) {
    console.error('Error fetching competition:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred while fetching the competition' },
      { status: 500 }
    );
  }
}

// PUT update a competition (admin only)
export async function PUT(
  req: NextRequest,
  { params: { id } }: { params: { id: string } }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    // Check authentication and admin role
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Find the competition
    const competition = await Competition.findById(id);
    
    if (!competition) {
      return NextResponse.json(
        { success: false, message: 'Competition not found' },
        { status: 404 }
      );
    }

    // Parse multipart form data using formidable
    const form = formidable({ multiples: false });

    const fieldsAndFiles = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
      if (!req.body) {
        return reject(new Error('Request body is null'));
      }
      
      // Create a PassThrough stream
      const passthrough = new PassThrough();
      
      // Pipe the NextRequest body (ReadableStream) to the PassThrough stream
      const reader = req.body.getReader();
      const pump = () => {
        reader.read().then(({ done, value }) => {
          if (done) {
            passthrough.end();
            return;
          }
          passthrough.write(value);
          pump();
        }).catch(err => {
          passthrough.emit('error', err);
          reject(err);
        });
      };
      pump();

      // Add content-type and content-length headers manually if needed by formidable
      // Formidable v3 should ideally infer this or handle it, but this can be a fallback
      const headers = Object.fromEntries(req.headers);
      (passthrough as any).headers = headers; // Attach headers for formidable
      if (headers['content-type']) {
        (passthrough as any).headers['content-type'] = headers['content-type'];
      }
      if (headers['content-length']) {
        (passthrough as any).headers['content-length'] = headers['content-length'];
      }
      
      form.parse(passthrough, (err, fields, files) => {
        if (err) {
          console.error('Formidable parsing error:', err);
          return reject(err);
        }
        resolve({ fields, files });
      });
    });

    const { fields, files } = fieldsAndFiles;

    // Prepare update data
    const updateData: any = {};
    for (const key in fields) {
      if (Object.prototype.hasOwnProperty.call(fields, key)) {
        const value = fields[key];
        // If the field is an array and we expect a string, take the first element
        if (Array.isArray(value) && ['title', 'theme', 'description', 'rules', 'prizes', 'votingCriteria', 'submissionFormat', 'copyrightNotice', 'status'].includes(key)) {
          updateData[key] = value[0];
        } else {
          updateData[key] = value;
        }
      }
    }

    // Convert booleans and numbers specifically
    if (updateData.hideOtherSubmissions !== undefined) {
      updateData.hideOtherSubmissions = String(updateData.hideOtherSubmissions).toLowerCase() === 'true';
    }
    if (updateData.submissionLimit !== undefined) {
      // If submissionLimit is an array (it shouldn't be, but defensive)
      const limitValue = Array.isArray(updateData.submissionLimit) ? updateData.submissionLimit[0] : updateData.submissionLimit;
      updateData.submissionLimit = Number(limitValue);
    }
    // Handle dates
    if (updateData.startDate) updateData.startDate = new Date(Array.isArray(updateData.startDate) ? updateData.startDate[0] : updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(Array.isArray(updateData.endDate) ? updateData.endDate[0] : updateData.endDate);
    if (updateData.votingEndDate) updateData.votingEndDate = new Date(Array.isArray(updateData.votingEndDate) ? updateData.votingEndDate[0] : updateData.votingEndDate);
    
    // The specific handling for status and votingCriteria might be redundant now with the loop,
    // but keeping them for clarity or if specific logic was intended.
    // If fields.status was already processed by the loop:
    // if (fields.status) { 
    //   updateData.status = Array.isArray(fields.status) ? fields.status[0] : fields.status;
    // }
    // if (fields.votingCriteria) {
    //  updateData.votingCriteria = Array.isArray(fields.votingCriteria) ? fields.votingCriteria[0] : fields.votingCriteria;
    // }

    // Log updateData for debugging
    console.log('Updating competition with data:', updateData);

    // Handle cover image upload
    if (files.coverImage) {
      // You may want to upload to cloud storage here, for now just log
      const file = files.coverImage as FormidableFile;
      // TODO: Upload file to cloudinary or your storage, get URL
      // For now, just log file path
      console.log('Received cover image file:', file.filepath);
      // updateData.coverImage = 'URL_FROM_UPLOAD';
      // Handle crop params
      ['cropX', 'cropY', 'cropWidth', 'cropHeight'].forEach((key) => {
        if (fields[key] !== undefined) {
          updateData[key] = Number(fields[key]);
        }
      });
    } else {
      // Remove crop params if no new image
      ['cropX', 'cropY', 'cropWidth', 'cropHeight'].forEach((key) => {
        delete updateData[key];
      });
    }

    // Validate date relationships
    if (updateData.endDate && updateData.startDate && updateData.endDate <= updateData.startDate) {
      return NextResponse.json(
        { success: false, message: 'End date must be after start date' },
        { status: 400 }
      );
    }
    if (updateData.votingEndDate && updateData.endDate && updateData.votingEndDate <= updateData.endDate) {
      return NextResponse.json(
        { success: false, message: 'Voting end date must be after submission end date' },
        { status: 400 }
      );
    }

    // Update the competition
    const result = await Competition.updateOne(
      { _id: id },
      { $set: updateData },
      { runValidators: false }
    );
    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'No changes were made' },
        { status: 400 }
      );
    }
    const updatedCompetition = await Competition.findById(id);
    return NextResponse.json({ success: true, data: updatedCompetition });
  } catch (error: any) {
    console.error('Error updating competition:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred while updating the competition' },
      { status: 500 }
    );
  }
}

// DELETE a competition (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('DELETE request received for competition:', params.id);
  
  try {
    const { id } = params;
    
    if (!id) {
      console.log('Missing ID parameter');
      return NextResponse.json(
        { success: false, message: 'Competition ID is required' },
        { status: 400 }
      );
    }
    
    // Basic DB connection test
    console.log('Connecting to MongoDB...');
    try {
      await connectDB();
      console.log('MongoDB connection successful');
    } catch (dbError: any) {
      console.error('MongoDB connection failed:', dbError);
      return NextResponse.json(
        { success: false, message: 'Database connection failed', error: dbError.message },
        { status: 500 }
      );
    }
    
    console.log('Checking if competition exists:', id);
    try {
      // Just verify the competition exists
      const exists = await Competition.exists({ _id: id });
      console.log('Competition exists check result:', exists);
      
      if (!exists) {
        return NextResponse.json(
          { success: false, message: 'Competition not found' },
          { status: 404 }
        );
      }
      
      // Create a summary object to track what was deleted
      const deleteSummary = {
        results: 0,
        photoSubmissions: 0,
        photos: 0,
        ratings: 0,
        votingPoints: 0,
        competition: 0
      };
      
      // 1. First, delete all Result records (achievements) associated with this competition
      console.log('Deleting competition results/achievements...');
      const resultDeleteResult = await Result.deleteMany({ competition: id });
      console.log('Results delete outcome:', resultDeleteResult);
      deleteSummary.results = resultDeleteResult.deletedCount;
      
      // 2. Get IDs of all photo submissions for this competition before deleting them
      console.log('Finding photo submission IDs...');
      const photoSubmissionIds = await PhotoSubmission.find(
        { competition: id },
        { _id: 1 }
      ).lean().then(docs => docs.map(doc => doc._id));
      
      console.log(`Found ${photoSubmissionIds.length} photo submission IDs to process`);
      
      // 3. Delete ratings for these submissions (these count as voting points)
      if (photoSubmissionIds.length > 0) {
        console.log('Deleting ratings for submissions...');
        const ratingDeleteResult = await Rating.deleteMany({ photo: { $in: photoSubmissionIds } });
        console.log('Ratings delete outcome:', ratingDeleteResult);
        deleteSummary.ratings = ratingDeleteResult.deletedCount;
        
        // These also count as voting points (1 point per vote cast)
        deleteSummary.votingPoints = ratingDeleteResult.deletedCount;
      }
      
      // 4. Delete the photo submissions
      console.log('Deleting photo submissions...');
      const photoSubmissionDeleteResult = await PhotoSubmission.deleteMany({ competition: id });
      console.log('Photo submissions delete outcome:', photoSubmissionDeleteResult);
      deleteSummary.photoSubmissions = photoSubmissionDeleteResult.deletedCount;
      
      // 5. Find and delete photos linked to this competition (from older model)
      console.log('Deleting photos linked to this competition...');
      const photoDeleteResult = await Photo.deleteMany({ competition: id });
      console.log('Photos delete outcome:', photoDeleteResult);
      deleteSummary.photos = photoDeleteResult.deletedCount;
      
      // 6. Finally, delete the competition itself
      console.log('Deleting competition...');
      const competitionDeleteResult = await Competition.deleteOne({ _id: id });
      console.log('Competition delete result:', competitionDeleteResult);
      deleteSummary.competition = competitionDeleteResult.deletedCount;
      
      if (competitionDeleteResult.deletedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'Failed to delete competition' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Competition and all related data deleted successfully',
        deleteSummary
      });
    } catch (error: any) {
      console.error('MongoDB operation error:', error);
      // Detailed error info for debugging
      return NextResponse.json({
        success: false,
        message: 'MongoDB operation failed',
        error: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Unhandled error in DELETE handler:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred', error: error.toString() },
      { status: 500 }
    );
  }
} 