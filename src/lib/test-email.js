const nodemailer = require('nodemailer');

// Create transporter with provided SMTP settings
const transporter = nodemailer.createTransport({
  host: 'euk-113072.eukservers.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: 'info@snapscape.onlyoman.com',
    pass: '@17@}b^OJFr}'
  }
});

// Test email function
async function testEmail() {
  try {
    const info = await transporter.sendMail({
      from: '"SnapScape Test" <info@snapscape.onlyoman.com>',
      to: 'info@snapscape.onlyoman.com', // Send to self for testing
      subject: 'SMTP Test Email',
      text: 'This is a test email to verify SMTP settings',
      html: '<p>This is a test email to verify SMTP settings</p>',
    });
    
    console.log('Message sent: %s', info.messageId);
    console.log('Email sent successfully!');
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Run the test
testEmail()
  .then(() => console.log('Test completed successfully'))
  .catch(err => console.error('Test failed:', err)); 