#!/usr/bin/env node

/**
 * Urgent Competition Reminder Script
 * 
 * This script sends last day reminders for competitions ending today,
 * bypassing the normal 6 PM time window restriction.
 * 
 * Usage: node send-urgent-reminders.js
 */

const https = require('https');
const http = require('http');

// Configuration
const config = {
  // Change this to your production URL or localhost if running locally
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  // Set to true to use HTTPS, false for HTTP
  useHttps: process.env.NEXT_PUBLIC_BASE_URL?.startsWith('https://') || false
};

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const requestModule = config.useHttps ? https : http;
    
    console.log(`Making request to: ${url}`);
    
    const req = requestModule.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          reject(new Error(`Failed to parse JSON response: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function sendUrgentReminders() {
  console.log('🚨 URGENT: Sending last day competition reminders...');
  console.log(`Using base URL: ${config.baseUrl}`);
  console.log('This will bypass the normal 6 PM time window check.\n');
  
  try {
    // Send last day reminders with bypass flag
    const url = `${config.baseUrl}/api/cron/competition-reminders?type=last_day&bypass=true`;
    
    console.log('Triggering last day reminders...');
    const response = await makeRequest(url);
    
    console.log(`\n📊 Response Status: ${response.statusCode}`);
    console.log('📋 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('\n✅ SUCCESS!');
      console.log(`📧 Emails sent: ${response.data.data?.totalEmailsSent || 0}`);
      console.log(`🔔 Notifications created: ${response.data.data?.totalNotificationsCreated || 0}`);
      console.log(`🏆 Competitions processed: ${response.data.data?.totalCompetitions || 0}`);
      
      if (response.data.data?.competitionResults) {
        console.log('\n🏆 Competition Details:');
        response.data.data.competitionResults.forEach((comp, index) => {
          console.log(`  ${index + 1}. ${comp.competitionTitle}`);
          console.log(`     📧 Emails: ${comp.emailsSent}, 🔔 Notifications: ${comp.notificationsCreated}`);
          if (comp.errors && comp.errors.length > 0) {
            console.log(`     ❌ Errors: ${comp.errors.length}`);
          }
        });
      }
      
      if (response.data.data?.errors && response.data.data.errors.length > 0) {
        console.log('\n⚠️  Errors encountered:');
        response.data.data.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }
    } else {
      console.log('\n❌ FAILED!');
      console.log(`Error: ${response.data.message}`);
      if (response.data.error) {
        console.log(`Details: ${response.data.error}`);
      }
    }
    
  } catch (error) {
    console.error('\n💥 Script Error:', error.message);
    console.error('\nPossible solutions:');
    console.error('1. Make sure your development server is running (npm run dev)');
    console.error('2. Check if the base URL is correct');
    console.error('3. Verify the API endpoint is accessible');
    process.exit(1);
  }
}

// Run the script
console.log('🚀 Starting urgent reminder script...\n');
sendUrgentReminders()
  .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  }); 