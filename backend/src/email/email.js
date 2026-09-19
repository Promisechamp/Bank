const nodemailer = require('nodemailer');

// ============================================================
// SMTP CONFIGURATION
// ============================================================

const smtpPort = Number(process.env.SMTP_PORT) || 587;

const smtpSecure =
  process.env.SMTP_SECURE === 'true' ||
  smtpPort === 465;

const hasSmtpUser = Boolean(process.env.SMTP_USER);
const hasSmtpPass = Boolean(process.env.SMTP_PASS);

const hasCompleteSmtpAuth =
  hasSmtpUser && hasSmtpPass;

const hasPartialSmtpAuth =
  hasSmtpUser !== hasSmtpPass;


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpSecure,

  family: 4,

  auth:
    process.env.SMTP_USER || process.env.SMTP_PASS
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
});

// ============================================================
// VALIDATE SMTP CONFIGURATION
// ============================================================

if (!process.env.SMTP_HOST) {
  console.warn(
    'SMTP_HOST is not configured. Email sending may fail.'
  );
}

if (!process.env.SMTP_FROM_EMAIL) {
  console.warn(
    'SMTP_FROM_EMAIL is not configured. Using the default sender address.'
  );
}

if (hasPartialSmtpAuth) {
  console.warn(
    'SMTP_USER and SMTP_PASS must both be configured together.'
  );
}

// ============================================================
// VERIFY EMAIL CONFIGURATION
// ============================================================

const verifyEmailTransporter = async () => {
  if (!process.env.SMTP_HOST) {
    console.error(
      'SMTP verification failed: SMTP_HOST is not configured.'
    );

    return false;
  }

  if (hasPartialSmtpAuth) {
    console.error(
      'SMTP verification failed: SMTP_USER and SMTP_PASS must both be configured together.'
    );

    return false;
  }

  try {
    await transporter.verify();

    console.log(
      'Trusty Credit Union email service configured successfully with SMTP.'
    );

    return true;
  } catch (error) {
    console.error(
      'SMTP verification failed:',
      error.message
    );

    return false;
  }
};

// ============================================================
// SEND EMAIL
// ============================================================

const sendEmail = async ({
  to,
  subject,
  html,
  text,
}) => {
  if (!to) {
    throw new Error(
      'Email recipient is required.'
    );
  }

  if (!subject) {
    throw new Error(
      'Email subject is required.'
    );
  }

  if (!html && !text) {
    throw new Error(
      'Email must contain html or text content.'
    );
  }

  const from =
    process.env.SMTP_FROM_EMAIL ||
    'Trusty Credit Union <support@trustycreditunion.com>';

  const mailOptions = {
    from,
    to,
    subject,

    text:
      text ||
      'Please view this email in an HTML-compatible email client.',
  };

  if (html) {
    mailOptions.html = html;
  }

  try {
    const info = await transporter.sendMail(
      mailOptions
    );

    console.log(
      `Trusty Credit Union email sent to ${to}: ${
        info.messageId || 'unknown'
      }`
    );

    return info;
  } catch (error) {
    console.error(
      `Trusty Credit Union email send error for ${to}:`,
      error.message
    );

    throw error;
  }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  sendEmail,
  verifyEmailTransporter,
};