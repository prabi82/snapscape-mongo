const { execSync } = require('child_process');
const { spawn } = require('child_process');

console.log('🔄 Stopping any running Next.js instances...');

// Function to kill processes on specific ports
function killPortProcess(port) {
  try {
    // For Windows
    execSync(`npx kill-port ${port}`, { stdio: 'inherit' });
    console.log(`✅ Killed process on port ${port}`);
  } catch (error) {
    // If there's no process on that port, that's fine
    console.log(`No process found on port ${port}`);
  }
}

// Kill processes on common Next.js ports
killPortProcess(3000);
killPortProcess(3001);
killPortProcess(3002);

// Add a small delay to ensure processes are fully terminated
console.log('⏳ Waiting for processes to terminate...');
setTimeout(() => {
  console.log('🚀 Starting Next.js development server...');
  // Start the Next.js dev server
  const devProcess = spawn('npm', ['run', 'dev'], { 
    stdio: 'inherit',
    shell: true 
  });

  // Handle process events
  devProcess.on('error', (error) => {
    console.error(`❌ Error starting development server: ${error.message}`);
  });

  // Clean up on exit
  process.on('SIGINT', () => {
    console.log('👋 Shutting down development server...');
    devProcess.kill();
    process.exit(0);
  });
}, 2000); // 2 second delay 