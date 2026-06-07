const nodemailer = require('nodemailer');

let transporter;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log('Nodemailer SMTP transporter initialized using credentials.');
  } else {
    // Fallback: Create a test account on Ethereal.email
    console.log('No SMTP config found. Generating a temporary test account via Ethereal...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`Ethereal Test account generated! User: ${testAccount.user}`);
    } catch (err) {
      console.error('Failed to create Ethereal test account. Falling back to console logging.', err);
      // In case Ethereal fails, mock transporter that logs mail to console
      transporter = {
        sendMail: async (options) => {
          console.log('--- [MOCK EMAIL CONSOLE LOG] ---');
          console.log(`To: ${options.to}`);
          console.log(`Subject: ${options.subject}`);
          console.log(`HTML: ${options.html}`);
          console.log('---------------------------------');
          return { messageId: 'console-mock-id' };
        }
      };
    }
  }
  return transporter;
};

const sendOtpEmail = async (email, otp) => {
  try {
    const activeTransporter = await getTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Krishna Engineering Works" <krishnaengineeringworks0715@gmail.com>',
      to: email,
      subject: 'Your Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
          <h2 style="color: #4f46e5; text-align: center; margin-bottom: 24px;">Reset Your Password</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password. Use the following 6-digit One-Time Password (OTP) to proceed. This OTP is valid for <strong>5 minutes</strong>.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e1b4b; background-color: #f1f5f9; padding: 12px 24px; border-radius: 8px; border: 1px solid #cbd5e1; display: inline-block;">${otp}</span>
          </div>
          
          <p>If you did not make this request, you can safely ignore this email. Your password will remain unchanged.</p>
          <p>For security, please <strong>do not share this OTP</strong> with anyone.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">This is an automated security transmission.<br/>Powered by Krishna IT Solutions</p>
        </div>
      `
    };

    const info = await activeTransporter.sendMail(mailOptions);
    console.log(`OTP Email Sent to ${email}. Message ID: ${info.messageId}`);
    
    // Ethereal offers preview links
    if (typeof nodemailer.getTestMessageUrl === 'function') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[TESTING ONLY] View email preview in browser: ${previewUrl}`);
        return previewUrl;
      }
    }
    return null;
  } catch (error) {
    console.error('sendOtpEmail error:', error);
    throw new Error('Failed to send OTP verification email');
  }
};

module.exports = {
  sendOtpEmail
};
