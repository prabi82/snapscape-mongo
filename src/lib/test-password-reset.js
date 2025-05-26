const nodemailer = require('nodemailer');

// Create transporter with the same settings as the app
const transporter = nodemailer.createTransport({
  host: 'euk-113072.eukservers.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: 'info@onlyoman.com',
    pass: 'l@fbCMLFA)Uy'
  },
  tls: {
    // Ignore certificate validation issues
    rejectUnauthorized: false
  }
});

// Test password reset email function
async function testPasswordResetEmail() {
  try {
    console.log('Testing SMTP connection...');
    
    // Verify transporter configuration
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    
    const resetUrl = 'http://localhost:3000/auth/reset-password/confirm?token=test123';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0c36a; border-radius: 8px; background-color: #f5f5f5;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #1a4d5c;">SnapScape</h1>
        </div>
        <h2 style="color: #1a4d5c; text-align: center; margin-bottom: 20px;">Reset Your Password</h2>
        <p style="color: #333; font-size: 16px; line-height: 1.5;">Hello Test User,</p>
        <p style="color: #333; font-size: 16px; line-height: 1.5;">We received a request to reset your password for your SnapScape account. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-image: linear-gradient(to right, #1a4d5c, #2699a6); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; border: 2px solid #e0c36a;">Reset Password</a>
        </div>
        <p style="color: #333; font-size: 16px; line-height: 1.5;">This link will expire in 1 hour for security reasons.</p>
        <p style="color: #333; font-size: 16px; line-height: 1.5;">If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
        <p style="color: #333; font-size: 16px; line-height: 1.5;">If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p style="background-color: #e6f0f3; padding: 10px; border-radius: 4px; word-break: break-all;">${resetUrl}</p>
        <div style="margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
          <p>&copy; ${new Date().getFullYear()} SnapScape. All rights reserved.</p>
        </div>
      </div>
    `;
    
    console.log('Sending test password reset email to prabi@c-dat.co...');
    
    const info = await transporter.sendMail({
      from: '"SnapScape" <info@onlyoman.com>',
      to: 'prabi@c-dat.co',
      subject: 'Test: Reset Your SnapScape Password',
      html: html,
    });
    
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    throw error;
  }
}

// Run the test
testPasswordResetEmail()
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  }); 