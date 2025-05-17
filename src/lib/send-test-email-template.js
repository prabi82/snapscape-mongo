// This is a template file for generic SMTP configuration
// Replace the placeholder values with your actual credentials

const nodemailer = require('nodemailer');

// Create a transporter with SMTP configuration
const transporter = nodemailer.createTransport({
  host: 'YOUR_SMTP_HOST', // e.g., smtp.yourprovider.com
  port: 587, // Common ports are 25, 465, 587
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'YOUR_EMAIL_USERNAME',
    pass: 'YOUR_EMAIL_PASSWORD',
  },
});

// Test email configuration
const mailOptions = {
  from: 'YOUR_EMAIL_ADDRESS', // sender address
  to: 'RECIPIENT_EMAIL@example.com', // recipient address
  subject: 'Test Email from SnapScape',
  text: 'This is a test email from the SnapScape application.',
  html: '<p>This is a test email from the <strong>SnapScape</strong> application.</p>',
};

// Send test email
async function sendTestEmail() {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Execute the function if this file is run directly
if (require.main === module) {
  sendTestEmail()
    .then(() => console.log('Test completed'))
    .catch(err => console.error('Test failed:', err));
}

module.exports = { sendTestEmail }; 