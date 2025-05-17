const nodemailer = require('nodemailer');

// Create transporter with provided SMTP settings
const transporter = nodemailer.createTransport({
  host: 'euk-113072.eukservers.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: 'info@onlyoman.com',
    pass: 'l@fbCMLFA)Uy'
  }
});

// Test email function to Gmail
async function sendTestEmail() {
  try {
    const info = await transporter.sendMail({
      from: '"SnapScape" <info@onlyoman.com>',
      to: 'prabikrishna@gmail.com',
      subject: 'SnapScape Email Test - SPF/DKIM Configured',
      text: 'This is a test email to verify SPF and DKIM configuration for snapscape.onlyoman.com',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0c36a; border-radius: 8px; background-color: #f5f5f5;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #1a4d5c;">SnapScape</h1>
          </div>
          <h2 style="color: #1a4d5c; text-align: center; margin-bottom: 20px;">SPF/DKIM Configuration Test</h2>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">Hello,</p>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">This is a test email from SnapScape to verify that the SPF and DKIM authentication have been properly configured.</p>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">If you're receiving this email, it means:</p>
          <ul style="color: #333; font-size: 16px; line-height: 1.5;">
            <li>The DNS records for onlyoman.com are correctly set up</li>
            <li>Gmail is accepting emails from our domain</li>
            <li>The email verification system should now work properly</li>
          </ul>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">Thank you for configuring the email authentication!</p>
          <div style="margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            <p>&copy; ${new Date().getFullYear()} SnapScape. All rights reserved.</p>
          </div>
        </div>
      `,
    });
    
    console.log('Message sent: %s', info.messageId);
    console.log('Email sent successfully to prabikrishna@gmail.com');
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Run the test
sendTestEmail()
  .then(() => console.log('Test completed successfully'))
  .catch(err => console.error('Test failed:', err)); 