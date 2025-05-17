// This is a template file for Gmail SMTP configuration
// Replace the placeholder values with your actual credentials

const nodemailer = require('nodemailer');

// Create a transporter with Gmail configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'YOUR_GMAIL_ADDRESS@gmail.com', // replace with your Gmail address
    pass: 'YOUR_APP_PASSWORD', // replace with your app password (not your regular Gmail password)
  },
});

// Test email configuration
const mailOptions = {
  from: 'YOUR_GMAIL_ADDRESS@gmail.com', // sender address
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