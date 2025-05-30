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
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your SnapScape Account</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
        <tr>
          <td align="center" style="padding: 20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border: 2px solid #e0c36a; border-radius: 8px;">
              
              <!-- Logo -->
              <tr>
                <td align="center" style="padding: 20px;">
                  <img src="${baseUrl}/logo.png" alt="SnapScape Logo" width="150" style="display: block; max-width: 150px; height: auto;">
                </td>
              </tr>
              
              <!-- Title -->
              <tr>
                <td align="center" style="padding: 0 20px 20px 20px;">
                  <h2 style="margin: 0; color: #1a4d5c; font-size: 24px; font-weight: bold;">Verify Your Email Address</h2>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 0 20px;">
                  <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 15px 0;">Hello ${name},</p>
                  <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">Thank you for registering with SnapScape! To complete your registration and get started, please verify your email address by clicking the button below:</p>
                </td>
              </tr>
              
              <!-- Button -->
              <tr>
                <td align="center" style="padding: 30px 20px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="background-color: #1a4d5c; border-radius: 8px; border: 2px solid #e0c36a;">
                        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-weight: bold;">Verify Email Address</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Additional info -->
              <tr>
                <td style="padding: 0 20px 20px 20px;">
                  <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 15px 0;">If you didn't register for SnapScape, please ignore this email.</p>
                  <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 15px 0;">If the button doesn't work, you can also copy and paste the following link into your browser:</p>
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #e6f0f3; border-radius: 4px;">
                    <tr>
                      <td style="padding: 10px; word-break: break-all; color: #333333; font-size: 14px;">
                        ${verificationUrl}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td align="center" style="padding: 20px; border-top: 1px solid #dddddd;">
                  <p style="color: #666666; font-size: 14px; margin: 0;">&copy; ${new Date().getFullYear()} SnapScape. All rights reserved.</p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
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
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your SnapScape Password</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
        <tr>
          <td align="center" style="padding: 20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border: 2px solid #e0c36a; border-radius: 8px;">
              
              <!-- Logo -->
              <tr>
                <td align="center" style="padding: 20px;">
                  <img src="${baseUrl}/logo.png" alt="SnapScape Logo" width="150" style="display: block; max-width: 150px; height: auto;">
                </td>
              </tr>
              
              <!-- Title -->
              <tr>
                <td align="center" style="padding: 0 20px 20px 20px;">
                  <h2 style="margin: 0; color: #1a4d5c; font-size: 24px; font-weight: bold;">Reset Your Password</h2>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 0 20px;">
                  <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 15px 0;">Hello ${name},</p>
                  <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">We received a request to reset your password for your SnapScape account. Click the button below to create a new password:</p>
                </td>
              </tr>
              
              <!-- Button -->
              <tr>
                <td align="center" style="padding: 30px 20px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="background-color: #1a4d5c; border-radius: 8px; border: 2px solid #e0c36a;">
                        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-weight: bold;">Reset Password</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Additional info -->
              <tr>
                <td style="padding: 0 20px 20px 20px;">
                  <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 15px 0;">This link will expire in 1 hour for security reasons.</p>
                  <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 15px 0;">If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
                  <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 15px 0;">If the button doesn't work, you can also copy and paste the following link into your browser:</p>
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #e6f0f3; border-radius: 4px;">
                    <tr>
                      <td style="padding: 10px; word-break: break-all; color: #333333; font-size: 14px;">
                        ${resetUrl}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td align="center" style="padding: 20px; border-top: 1px solid #dddddd;">
                  <p style="color: #666666; font-size: 14px; margin: 0;">&copy; ${new Date().getFullYear()} SnapScape. All rights reserved.</p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
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

  // Outlook-compatible HTML using tables and inline styles
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SnapScape Competition Reminder</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
        <tr>
          <td align="center" style="padding: 20px;">
            <!-- Main container -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border: 2px solid #e0c36a; border-radius: 8px;">
              
              <!-- Logo section -->
              <tr>
                <td align="center" style="padding: 20px;">
                  <img src="${baseUrl}/logo.png" alt="SnapScape Logo" width="150" style="display: block; max-width: 150px; height: auto;">
                </td>
              </tr>
              
              <!-- Header section with gradient background -->
              <tr>
                <td style="padding: 0 20px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #1a4d5c; border-radius: 8px;">
                    <tr>
                      <td align="center" style="padding: 20px; color: #ffffff;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #ffffff;">${urgencyText}</h1>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Competition title -->
              <tr>
                <td align="center" style="padding: 20px;">
                  <h2 style="margin: 0; color: #1a4d5c; font-size: 22px; font-weight: bold;">"${competitionTitle}"</h2>
                </td>
              </tr>
              
              <!-- Main content -->
              <tr>
                <td style="padding: 0 20px;">
                  <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 15px 0;">Hello ${name},</p>
                  <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">${messageText}</p>
                </td>
              </tr>
              
              <!-- Competition end date box -->
              <tr>
                <td style="padding: 0 20px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fffbe6; border: 2px solid #e0c36a; border-radius: 8px;">
                    <tr>
                      <td align="center" style="padding: 15px;">
                        <p style="color: #1a4d5c; font-size: 18px; font-weight: bold; margin: 0;">
                          📅 Competition ends: ${formattedEndDate}
                        </p>
                        <p style="color: #666666; font-size: 14px; margin: 5px 0 0 0;">
                          (Oman Time - GMT+4)
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Submit button -->
              <tr>
                <td align="center" style="padding: 30px 20px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="background-color: #1a4d5c; border-radius: 8px; border: 2px solid #e0c36a;">
                        <a href="${competitionUrl}" style="display: inline-block; padding: 15px 30px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                          📸 Submit Your Photos Now
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Tips section -->
              <tr>
                <td style="padding: 0 20px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #e6f0f3; border-radius: 8px;">
                    <tr>
                      <td style="padding: 15px;">
                        <h3 style="color: #1a4d5c; margin: 0 0 10px 0; font-size: 16px;">Quick Submission Tips:</h3>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td style="color: #333333; font-size: 14px; line-height: 1.5;">
                              • Ensure your photos meet the competition requirements<br>
                              • Add compelling titles and descriptions<br>
                              • Check image quality and resolution<br>
                              • Submit early to avoid last-minute technical issues
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Closing message -->
              <tr>
                <td style="padding: 20px;">
                  <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 15px 0;">
                    Good luck with your submissions! We can't wait to see your creative work.
                  </p>
                  <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0;">
                    Best regards,<br>
                    The SnapScape Team
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 20px; border-top: 1px solid #dddddd;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center">
                        <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
                          If you no longer wish to receive competition reminders, you can update your preferences in your account settings.
                        </p>
                        <p style="color: #666666; font-size: 14px; margin: 0;">
                          &copy; ${new Date().getFullYear()} SnapScape. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  
  return await sendEmail({
    to: email,
    subject: subjectText,
    html,
  });
};