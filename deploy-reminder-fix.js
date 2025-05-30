#!/usr/bin/env node

/**
 * Deploy Competition Reminder Fix
 * 
 * This script deploys the updated competition reminder system with:
 * - Extended time window (3 PM - 9 PM Oman time)
 * - Multiple cron job schedules
 * - Duplicate prevention
 * 
 * Usage: node deploy-reminder-fix.js
 */

const { execSync } = require('child_process');

console.log('🚀 Deploying Competition Reminder Fix...\n');

try {
  console.log('📦 Building the application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('\n🚀 Deploying to Vercel...');
  execSync('vercel --prod', { stdio: 'inherit' });
  
  console.log('\n✅ Deployment completed successfully!');
  console.log('\n📋 What was deployed:');
  console.log('  ✅ Extended time window: 3 PM - 9 PM Oman time');
  console.log('  ✅ Multiple cron schedules: 11:00, 14:00, 17:00 UTC');
  console.log('  ✅ Duplicate prevention system');
  console.log('  ✅ Emergency bypass functionality');
  
  console.log('\n🔄 Cron Jobs Schedule (UTC):');
  console.log('  • 11:00 UTC = 3:00 PM Oman time');
  console.log('  • 14:00 UTC = 6:00 PM Oman time');
  console.log('  • 17:00 UTC = 9:00 PM Oman time');
  
  console.log('\n⚡ For immediate reminders, use:');
  console.log('  Admin Interface: https://snapscape.app/admin/settings/competition-reminders');
  console.log('  Emergency Bypass: Click "BYPASS: Send Last Day Reminders"');
  
  console.log('\n🎯 Next Steps:');
  console.log('  1. Check Vercel dashboard for active cron jobs');
  console.log('  2. Monitor logs for automated execution');
  console.log('  3. Use emergency bypass if needed for today');
  
} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  console.error('\nTroubleshooting:');
  console.error('1. Make sure you have Vercel CLI installed: npm i -g vercel');
  console.error('2. Make sure you are logged in: vercel login');
  console.error('3. Make sure you are in the correct directory');
  process.exit(1);
} 