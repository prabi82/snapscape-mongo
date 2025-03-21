const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('Starting Next.js build cleanup...');

// Path to .next directory
const nextDir = path.join(process.cwd(), '.next');

// Check if .next directory exists
if (fs.existsSync(nextDir)) {
  console.log('.next directory found, trying to remove it...');

  // On Windows, sometimes there can be permission issues, so we'll use rimraf
  // which is already installed as part of Next.js dependencies
  try {
    // First try to kill any processes that might be locking files
    console.log('Attempting to kill any processes locking the .next directory...');
    exec('taskkill /F /IM node.exe', (error) => {
      // Ignore errors from taskkill as it might not find any processes to kill
      
      console.log('Removing .next directory...');
      
      // Use rimraf through node to avoid dependency issues
      exec('npx rimraf .next', (error, stdout, stderr) => {
        if (error) {
          console.error(`Error removing .next directory: ${error.message}`);
          console.log('Trying alternative approach...');
          
          // Alternative approach using native fs methods
          try {
            // Try to change permissions and remove manually
            const removeDir = (dirPath) => {
              if (fs.existsSync(dirPath)) {
                fs.readdirSync(dirPath).forEach((file) => {
                  const curPath = path.join(dirPath, file);
                  if (fs.lstatSync(curPath).isDirectory()) {
                    // Recurse
                    removeDir(curPath);
                  } else {
                    // Delete file
                    try {
                      fs.unlinkSync(curPath);
                    } catch (e) {
                      console.log(`Could not delete file: ${curPath}`, e);
                    }
                  }
                });
                try {
                  fs.rmdirSync(dirPath);
                } catch (e) {
                  console.log(`Could not remove directory: ${dirPath}`, e);
                }
              }
            };
            
            removeDir(nextDir);
            console.log('Manual cleanup attempted.');
          } catch (fsError) {
            console.error(`Manual cleanup failed: ${fsError.message}`);
            console.log('Please try manually deleting the .next directory or restarting your computer.');
          }
        } else {
          console.log('.next directory successfully removed!');
        }
        
        console.log('Next.js cleanup completed.');
        console.log('You can now restart your Next.js development server with:');
        console.log('npm run dev');
      });
    });
  } catch (e) {
    console.error(`Error during cleanup: ${e.message}`);
  }
} else {
  console.log('.next directory does not exist, no cleanup needed.');
  console.log('You can start your Next.js development server with:');
  console.log('npm run dev');
} 