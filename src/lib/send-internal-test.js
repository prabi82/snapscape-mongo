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

// Test email function to send to same domain
async function sendTestEmail() {
  try {
    const info = await transporter.sendMail({
      from: '"SnapScape Test" <info@onlyoman.com>',
      to: 'info@onlyoman.com', // Send to itself for testing
      subject: 'Internal SMTP Test Email',
      text: 'This is an internal test email to verify SMTP settings work for internal delivery',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0c36a; border-radius: 8px; background-color: #f5f5f5;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #1a4d5c;">SnapScape</h1>
          </div>
          <h2 style="color: #1a4d5c; text-align: center; margin-bottom: 20px;">Internal Email Test</h2>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">Hello,</p>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">This is a test email sent from info@onlyoman.com to itself to verify internal mail delivery works.</p>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">Since this email is going to the same domain, it should be delivered even without SPF/DKIM records.</p>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">Current SMTP settings:</p>
          <ul style="color: #333; font-size: 16px; line-height: 1.5;">
            <li>Host: euk-113072.eukservers.com</li>
            <li>Port: 465 (SSL)</li>
            <li>Username: info@onlyoman.com</li>
          </ul>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">Once you receive this, you'll know your SMTP server is working correctly for internal mail.</p>
          <div style="margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            <p>&copy; ${new Date().getFullYear()} SnapScape. All rights reserved.</p>
          </div>
        </div>
      `,
    });
    
    console.log('Message sent: %s', info.messageId);
    console.log('Email sent successfully to info@onlyoman.com');
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