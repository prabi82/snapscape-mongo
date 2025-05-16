/**
 * This script fixes the 3rd place achievement for Munroe Island competition
 * Run with: node src/scripts/fix-munroe-achievements.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;

// Models (simplified to avoid TypeScript issues)
const ResultSchema = new mongoose.Schema({
  competition: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competition',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  photo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Photo',
    required: true,
  },
  position: {
    type: Number,
    required: true,
    min: 1,
  },
  finalScore: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
  },
  prize: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Define models
const Result = mongoose.model('Result', ResultSchema);
const Competition = mongoose.model('Competition', {});
const PhotoSubmission = mongoose.model('PhotoSubmission', {});

// Target user ID - Prabi Krishna's ID
const TARGET_USER_ID = '67c1916a48fe2d9d967bf10e';

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get the Munroe Island competition
    const competition = await Competition.findOne({
      title: 'Munroe Island'
    });
    
    if (!competition) {
      console.error('Munroe Island competition not found');
      process.exit(1);
    }
    
    const competitionId = competition._id.toString();
    console.log(`Found Munroe Island competition: ${competitionId}`);
    
    // Get all approved submissions for this competition
    const submissions = await PhotoSubmission.find({
      competition: competitionId,
      status: 'approved'
    })
    .populate('user')
    .sort({ averageRating: -1, ratingCount: -1 })
    .lean();
    
    // Map the rankings
    const rankedSubmissions = submissions.map((submission, index) => ({
      ...submission,
      rank: index + 1
    }));
    
    // Get user's submissions with rankings
    const userSubmissions = rankedSubmissions.filter(s => 
      s.user && s.user._id && s.user._id.toString() === TARGET_USER_ID
    );
    
    console.log(`Found ${userSubmissions.length} submissions for Prabi Krishna in Munroe Island`);
    
    // Display user submissions
    userSubmissions.forEach(sub => {
      console.log(`Rank: ${sub.rank}, Rating: ${sub.averageRating || 'unknown'}, Photo ID: ${sub._id}`);
    });
    
    // Delete existing results for this competition for this user
    const deleteResult = await Result.deleteMany({
      competition: competitionId,
      user: TARGET_USER_ID
    });
    console.log(`Deleted ${deleteResult.deletedCount} existing results`);
    
    const results = [];
    
    // Create results for each position (1st, 2nd, 3rd)
    for (let position = 1; position <= 3; position++) {
      // Find submissions with this exact rank
      const positionSubmissions = userSubmissions.filter(s => s.rank === position);
      
      if (positionSubmissions.length > 0) {
        // Use the best one by rating
        const bestSubmission = positionSubmissions.sort((a, b) => 
          ((b.averageRating || 0) - (a.averageRating || 0))
        )[0];
        
        console.log(`Creating result for rank ${position} in Munroe Island`);
        
        const result = new Result({
          competition: competitionId,
          user: TARGET_USER_ID,
          photo: bestSubmission._id.toString(),
          position: position,
          finalScore: bestSubmission.averageRating || 0,
          prize: position === 1 ? 'Gold Medal' : 
                 position === 2 ? 'Silver Medal' : 'Bronze Medal',
        });
        
        await result.save();
        results.push(result);
      } else if (position === 3) {
        // Special case for 3rd place: If we didn't find an exact rank 3,
        // find the next best submission after 1st and 2nd place
        
        // Get photos already used for 1st and 2nd place
        const usedPhotoIds = results.map(r => r.photo.toString());
        
        // Find remaining submissions not used for higher positions
        const availableSubmissions = userSubmissions.filter(s => 
          !usedPhotoIds.includes(s._id.toString())
        );
        
        if (availableSubmissions.length > 0) {
          // Sort by rank (lower is better)
          const bestSubmission = availableSubmissions.sort((a, b) => a.rank - b.rank)[0];
          
          console.log(`Creating 3rd place result using submission with rank ${bestSubmission.rank} in Munroe Island`);
          
          const result = new Result({
            competition: competitionId,
            user: TARGET_USER_ID,
            photo: bestSubmission._id.toString(),
            position: 3,
            finalScore: bestSubmission.averageRating || 0,
            prize: 'Bronze Medal',
          });
          
          await result.save();
          results.push(result);
        }
      }
    }
    
    // Get all achievements after fix
    const allResults = await Result.find({
      user: TARGET_USER_ID
    })
    .populate('competition')
    .sort({ position: 1 })
    .lean();
    
    // Count achievements by position
    const firstPlace = allResults.filter(r => r.position === 1).length;
    const secondPlace = allResults.filter(r => r.position === 2).length;
    const thirdPlace = allResults.filter(r => r.position === 3).length;
    
    console.log('');
    console.log('=== Achievement Stats After Fix ===');
    console.log(`First Place: ${firstPlace}`);
    console.log(`Second Place: ${secondPlace}`);
    console.log(`Third Place: ${thirdPlace}`);
    console.log(`Total: ${firstPlace + secondPlace + thirdPlace}`);
    console.log('');
    console.log('Fix completed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
main(); 