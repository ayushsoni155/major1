const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Lazily initializes the nodemailer transporter.
 * If SMTP_USER/SMTP_PASS are not set, falls back to Ethereal (fake SMTP).
 * Ethereal prints a preview URL to console so you can see emails without a real mail server.
 */
async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('[Mailer] Using configured SMTP server:', process.env.SMTP_HOST);
  } else {
    // Create an Ethereal test account on the fly
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('[Mailer] No SMTP configured — using Ethereal fake SMTP');
    console.log('[Mailer] Ethereal user:', testAccount.user);
  }

  return transporter;
}

/**
 * Send a 6-digit OTP email to the user.
 * @param {string} to - Recipient email
 * @param {string} otp  - 6-digit OTP string
 * @param {string} name - User's display name
 */
async function sendOtpEmail(to, otp, name = 'there') {
  const transport = await getTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your RapidBase OTP</title>
    </head>
    <body style="margin:0;padding:0;background:#0a0a0f;font-family:'Inter',system-ui,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 0;">
        <tr><td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background:#13131a;border-radius:16px;border:1px solid #1e1e2e;overflow:hidden;">
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
                <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px;">⚡ RapidBase</div>
                <div style="color:rgba(255,255,255,0.8);font-size:14px;margin-top:4px;">The Open-Source Backend for Rapid Development</div>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:40px 32px;">
                <p style="color:#e2e8f0;font-size:16px;margin:0 0 8px 0;">Hi <strong>${name}</strong>,</p>
                <p style="color:#94a3b8;font-size:14px;margin:0 0 32px 0;">
                  Use the verification code below to complete your sign-up. This code expires in <strong style="color:#6366f1;">10 minutes</strong>.
                </p>
                <!-- OTP Box -->
                <div style="background:#0a0a0f;border:2px solid #6366f1;border-radius:12px;padding:24px;text-align:center;margin-bottom:32px;">
                  <div style="font-size:40px;font-weight:800;letter-spacing:12px;color:#fff;font-family:monospace;">${otp}</div>
                  <div style="color:#64748b;font-size:12px;margin-top:8px;">One-Time Password</div>
                </div>
                <p style="color:#64748b;font-size:12px;margin:0;">
                  If you didn't request this, you can safely ignore this email. Never share this code with anyone.
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background:#0a0a0f;padding:20px 32px;text-align:center;border-top:1px solid #1e1e2e;">
                <p style="color:#475569;font-size:12px;margin:0;">© 2025 RapidBase • The Open-Source Backend for Rapid Development</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  const info = await transport.sendMail({
    from: process.env.SMTP_FROM || '"RapidBase" <noreply@rapidbase.dev>',
    to,
    subject: `${otp} is your RapidBase verification code`,
    html,
    text: `Your RapidBase verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
  });

  // When using Ethereal, print the preview URL
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[Mailer] OTP email preview URL: ${previewUrl}`);
  }

  return info;
}

module.exports = { sendOtpEmail };
