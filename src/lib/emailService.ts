import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Create a transporter with verified email service configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'euk-113072.eukservers.com',
    port: parseInt(process.env.EMAIL_PORT || '465'),
    secure: true, // use SSL
    auth: {
      user: process.env.EMAIL_USER || 'info@onlyoman.com',
      pass: process.env.EMAIL_PASSWORD || ''
    },
    tls: {
      // Ignore certificate validation issues
      rejectUnauthorized: false
    }
  });
};

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  try {
    console.log(`Attempting to send email to: ${to} with subject: ${subject}`);
    console.log(`Environment check - EMAIL_HOST: ${process.env.EMAIL_HOST ? 'SET' : 'NOT SET'}`);
    console.log(`Environment check - EMAIL_USER: ${process.env.EMAIL_USER ? 'SET' : 'NOT SET'}`);
    console.log(`Environment check - EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET'}`);
    
    // Check if email is configured
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('Email configuration missing. Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD environment variables.');
      return false;
    }
    
    const transporter = createTransporter();
    
    // Verify transporter configuration
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    
    const info = await transporter.sendMail({
      from: `"SnapScape" <${process.env.EMAIL_USER || 'info@onlyoman.com'}>`,
      to,
      subject,
      html,
    });
    
    console.log(`Email sent successfully: ${info.messageId}`);
    console.log(`Email response: ${JSON.stringify(info.response)}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Email error details:', {
      to,
      subject,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Additional debugging for common issues
    if (error instanceof Error) {
      if (error.message.includes('EAUTH')) {
        console.error('Authentication failed. Check EMAIL_USER and EMAIL_PASSWORD.');
      } else if (error.message.includes('ECONNREFUSED')) {
        console.error('Connection refused. Check EMAIL_HOST and EMAIL_PORT.');
      } else if (error.message.includes('ETIMEDOUT')) {
        console.error('Connection timeout. Check network connectivity and EMAIL_HOST.');
      }
    }
    
    return false;
  }
};

export const sendVerificationEmail = async (email: string, name: string, token: string) => {
  // Determine the base URL - try multiple environment variables with appropriate fallbacks
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
  console.log(`Using base URL for verification email: ${baseUrl}`);
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

export const sendPasswordResetEmail = async (email: string, name: string, token: string) => {
  // Determine the base URL - try multiple environment variables with appropriate fallbacks
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
  console.log(`Using base URL for password reset email: ${baseUrl}`);
  const resetUrl = `${baseUrl}/auth/reset-password/confirm?token=${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0c36a; border-radius: 8px; background-color: #f5f5f5;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${baseUrl}/logo.png" alt="SnapScape Logo" style="width: 150px;">
      </div>
      <h2 style="color: #1a4d5c; text-align: center; margin-bottom: 20px;">Reset Your Password</h2>
      <p style="color: #333; font-size: 16px; line-height: 1.5;">Hello ${name},</p>
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
  
  return await sendEmail({
    to: email,
    subject: "Reset Your SnapScape Password",
    html,
  });
};

export const sendCompetitionReminderEmail = async (
  email: string, 
  name: string, 
  competitionTitle: string,
  competitionId: string,
  endDate: string,
  isLastDay: boolean = false
) => {
  // Determine the base URL
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
  console.log(`Using base URL for competition reminder email: ${baseUrl}`);
  const competitionUrl = `${baseUrl}/dashboard/competitions/${competitionId}`;
  
  // Format the end date for display
  const formattedEndDate = new Date(endDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Muscat'
  });
  
  const urgencyText = isLastDay 
    ? "⏰ FINAL HOURS - Competition ends today!"
    : "📅 Competition ending soon - 1 day remaining!";
    
  const subjectText = isLastDay
    ? `🚨 Last Day: "${competitionTitle}" ends today!`
    : `⏰ Reminder: "${competitionTitle}" ends tomorrow!`;
    
  const messageText = isLastDay
    ? "This is your final chance to submit your photos before the competition closes!"
    : "Don't miss out! You have one more day to submit your amazing photos.";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0c36a; border-radius: 8px; background-color: #f5f5f5;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${baseUrl}/logo.png" alt="SnapScape Logo" style="width: 150px;">
      </div>
      
      <div style="background: linear-gradient(135deg, #1a4d5c 0%, #2699a6 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold;">${urgencyText}</h1>
      </div>
      
      <h2 style="color: #1a4d5c; text-align: center; margin-bottom: 20px;">"${competitionTitle}"</h2>
      
      <p style="color: #333; font-size: 16px; line-height: 1.5;">Hello ${name},</p>
      
      <p style="color: #333; font-size: 16px; line-height: 1.5;">${messageText}</p>
      
      <div style="background-color: #fffbe6; border: 2px solid #e0c36a; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="color: #1a4d5c; font-size: 18px; font-weight: bold; margin: 0; text-align: center;">
          📅 Competition ends: ${formattedEndDate}
        </p>
        <p style="color: #666; font-size: 14px; margin: 5px 0 0 0; text-align: center;">
          (Oman Time - GMT+4)
        </p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${competitionUrl}" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #1a4d5c 0%, #2699a6 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; border: 2px solid #e0c36a; font-size: 16px;">
          📸 Submit Your Photos Now
        </a>
      </div>
      
      <div style="background-color: #e6f0f3; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <h3 style="color: #1a4d5c; margin: 0 0 10px 0;">Quick Submission Tips:</h3>
        <ul style="color: #333; margin: 0; padding-left: 20px;">
          <li>Ensure your photos meet the competition requirements</li>
          <li>Add compelling titles and descriptions</li>
          <li>Check image quality and resolution</li>
          <li>Submit early to avoid last-minute technical issues</li>
        </ul>
      </div>
      
      <p style="color: #333; font-size: 16px; line-height: 1.5;">
        Good luck with your submissions! We can't wait to see your creative work.
      </p>
      
      <p style="color: #333; font-size: 16px; line-height: 1.5;">
        Best regards,<br>
        The SnapScape Team
      </p>
      
      <div style="margin-top: 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #ddd; padding-top: 20px;">
        <p>If you no longer wish to receive competition reminders, you can update your preferences in your account settings.</p>
        <p>&copy; ${new Date().getFullYear()} SnapScape. All rights reserved.</p>
      </div>
    </div>
  `;
  
  return await sendEmail({
    to: email,
    subject: subjectText,
    html,
  });
};