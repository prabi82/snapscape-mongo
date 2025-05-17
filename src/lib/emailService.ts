import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Create a transporter with verified email service configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'euk-113072.eukservers.com',
    port: 465,
    secure: true, // use SSL
    auth: {
      user: 'info@onlyoman.com',
      pass: 'l@fbCMLFA)Uy'
    },
  });
};

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  try {
    const transporter = createTransporter();
    
    const info = await transporter.sendMail({
      from: '"SnapScape" <info@onlyoman.com>',
      to,
      subject,
      html,
    });
    
    console.log(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const sendVerificationEmail = async (email: string, name: string, token: string) => {
  // Determine the base URL (use environment variable if available, otherwise hardcode for now)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0c36a; border-radius: 8px; background-color: #f5f5f5;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${baseUrl}/logo.png" alt="SnapScape Logo" style="width: 150px;">
      </div>
      <h2 style="color: #1a4d5c; text-align: center; margin-bottom: 20px;">Verify Your Email Address</h2>
      <p style="color: #333; font-size: 16px; line-height: 1.5;">Hello ${name},</p>
      <p style="color: #333; font-size: 16px; line-height: 1.5;">Thank you for registering with SnapScape! To complete your registration and get started, please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-image: linear-gradient(to right, #1a4d5c, #2699a6); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; border: 2px solid #e0c36a;">Verify Email Address</a>
      </div>
      <p style="color: #333; font-size: 16px; line-height: 1.5;">If you didn't register for SnapScape, please ignore this email.</p>
      <p style="color: #333; font-size: 16px; line-height: 1.5;">If the button doesn't work, you can also copy and paste the following link into your browser:</p>
      <p style="background-color: #e6f0f3; padding: 10px; border-radius: 4px; word-break: break-all;">${verificationUrl}</p>
      <div style="margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
        <p>&copy; ${new Date().getFullYear()} SnapScape. All rights reserved.</p>
      </div>
    </div>
  `;
  
  return await sendEmail({
    to: email,
    subject: "Verify Your SnapScape Account",
    html,
  });
}; 