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

// Test email function to specified recipient
async function sendTestEmail() {
  try {
    const info = await transporter.sendMail({
      from: '"SnapScape Test" <info@onlyoman.com>',
      to: 'prabikrishna@gmail.com',
      subject: 'SnapScape Email Verification Test',
      text: 'This is a test email to verify SMTP settings for SnapScape email verification system',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0c36a; border-radius: 8px; background-color: #f5f5f5;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #1a4d5c;">SnapScape</h1>
          </div>
          <h2 style="color: #1a4d5c; text-align: center; margin-bottom: 20px;">Email Configuration Test</h2>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">Hello,</p>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">This is a test email from SnapScape to verify that the email verification system is properly configured.</p>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">If you received this email, the SMTP settings are working correctly:</p>
          <ul style="color: #333; font-size: 16px; line-height: 1.5;">
            <li>SMTP Server: euk-113072.eukservers.com</li>
            <li>Port: 465 (SSL)</li>
            <li>Username: info@onlyoman.com</li>
          </ul>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">The email verification system is now ready to use.</p>
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