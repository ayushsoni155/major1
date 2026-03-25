const nodemailer = require('nodemailer');

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    console.log('[Project Mailer] Using configured SMTP:', process.env.SMTP_HOST);
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email', port: 587, secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log('[Project Mailer] Using Ethereal fake SMTP. User:', testAccount.user);
  }
  return transporter;
}

const FROM = process.env.SMTP_FROM || '"RapidBase" <noreply@rapidbase.dev>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost';

const baseTemplate = (body) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>RapidBase</title></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Inter',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#13131a;border-radius:16px;border:1px solid #1e1e2e;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 32px;text-align:center;">
            <div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.5px;">⚡ RapidBase</div>
            <div style="color:rgba(255,255,255,0.75);font-size:13px;margin-top:4px;">The Open-Source Backend for Rapid Development</div>
          </td>
        </tr>
        <tr><td style="padding:36px 32px;">${body}</td></tr>
        <tr>
          <td style="background:#0a0a0f;padding:18px 32px;text-align:center;border-top:1px solid #1e1e2e;">
            <p style="color:#475569;font-size:12px;margin:0;">© 2025 RapidBase • The Open-Source Backend for Rapid Development</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

/**
 * Send project invitation email to invitee.
 */
async function sendInviteEmail({ to, inviteeName, inviterName, projectName, role, acceptUrl, declineUrl }) {
  const transport = await getTransporter();
  const html = baseTemplate(`
    <p style="color:#e2e8f0;font-size:16px;margin:0 0 8px 0;">Hi <strong>${inviteeName || to}</strong>,</p>
    <p style="color:#94a3b8;font-size:14px;margin:0 0 24px 0;">
      <strong style="color:#c4b5fd;">${inviterName}</strong> has invited you to join the project
      <strong style="color:#fff;">${projectName}</strong> as a <strong style="color:#c4b5fd;">${role}</strong>.
    </p>
    <div style="margin-bottom:28px;">
      <a href="${acceptUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;margin-right:12px;">
        ✓ Accept Invitation
      </a>
      <a href="${declineUrl}" style="display:inline-block;background:#1e1e2e;border:1px solid #374151;color:#94a3b8;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px;">
        ✕ Decline
      </a>
    </div>
    <p style="color:#64748b;font-size:12px;margin:0;">This invitation expires in 7 days. If you did not expect this, you can safely ignore it.</p>
  `);

  const info = await transport.sendMail({
    from: FROM, to,
    subject: `You've been invited to join "${projectName}" on RapidBase`,
    html,
    text: `${inviterName} invited you to join "${projectName}" as ${role}.\n\nAccept: ${acceptUrl}\nDecline: ${declineUrl}`,
  });

  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) console.log(`[Project Mailer] Invite email preview: ${preview}`);
  return info;
}

/**
 * Send email to project owner when invitee accepts.
 */
async function sendInviteAcceptedEmail({ to, ownerName, inviteeName, projectName, projectUrl }) {
  const transport = await getTransporter();
  const html = baseTemplate(`
    <p style="color:#e2e8f0;font-size:16px;margin:0 0 8px 0;">Hi <strong>${ownerName}</strong>,</p>
    <p style="color:#94a3b8;font-size:14px;margin:0 0 24px 0;">
      Good news! <strong style="color:#4ade80;">${inviteeName}</strong> has <strong style="color:#4ade80;">accepted</strong> your invitation to join
      <strong style="color:#fff;">${projectName}</strong>.
    </p>
    <a href="${projectUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;">
      View Project →
    </a>
  `);

  const info = await transport.sendMail({
    from: FROM, to,
    subject: `${inviteeName} accepted your invitation to "${projectName}"`,
    html,
    text: `${inviteeName} accepted your invitation to join "${projectName}". View project: ${projectUrl}`,
  });

  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) console.log(`[Project Mailer] Accept email preview: ${preview}`);
  return info;
}

/**
 * Send email to project owner when invitee declines.
 */
async function sendInviteDeclinedEmail({ to, ownerName, inviteeName, projectName }) {
  const transport = await getTransporter();
  const html = baseTemplate(`
    <p style="color:#e2e8f0;font-size:16px;margin:0 0 8px 0;">Hi <strong>${ownerName}</strong>,</p>
    <p style="color:#94a3b8;font-size:14px;margin:0 0 16px 0;">
      <strong style="color:#f87171;">${inviteeName}</strong> has <strong style="color:#f87171;">declined</strong> your invitation to join
      <strong style="color:#fff;">${projectName}</strong>.
    </p>
    <p style="color:#64748b;font-size:13px;">You can invite them again or add a different collaborator from your project's Members page.</p>
  `);

  const info = await transport.sendMail({
    from: FROM, to,
    subject: `${inviteeName} declined your invitation to "${projectName}"`,
    html,
    text: `${inviteeName} declined your invitation to join "${projectName}".`,
  });

  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) console.log(`[Project Mailer] Decline email preview: ${preview}`);
  return info;
}

module.exports = { sendInviteEmail, sendInviteAcceptedEmail, sendInviteDeclinedEmail, FRONTEND_URL };
