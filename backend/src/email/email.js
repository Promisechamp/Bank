const nodemailer = require('nodemailer');

// ============================================================
// SMTP CONFIGURATION
// ============================================================

const smtpPort = Number(process.env.SMTP_PORT) || 587;
const smtpSecure =
  process.env.SMTP_SECURE === 'true' ||
  smtpPort === 465;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpSecure,
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
    'SMTP_FROM_EMAIL is not configured. Email sending may fail.'
  );
}

if (
  (process.env.SMTP_USER && !process.env.SMTP_PASS) ||
  (!process.env.SMTP_USER && process.env.SMTP_PASS)
) {
  console.warn(
    'SMTP_USER and SMTP_PASS should both be configured together.'
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

  if (!process.env.SMTP_FROM_EMAIL) {
    console.error(
      'SMTP verification failed: SMTP_FROM_EMAIL is not configured.'
    );

    return false;
  }

  if (
    (process.env.SMTP_USER && !process.env.SMTP_PASS) ||
    (!process.env.SMTP_USER && process.env.SMTP_PASS)
  ) {
    console.error(
      'SMTP verification failed: both SMTP_USER and SMTP_PASS must be configured together.'
    );

    return false;
  }

  try {
    await transporter.verify();

    console.log(
      'Trusty credit union bank email service configured with SMTP.'
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
  text
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
    // replyTo: process.env.SMTP_REPLY_TO,
    subject,
    text:
      text ||
      'Please view this email in an HTML-compatible email client.',
  };

  if (html) {
    mailOptions.html = html;
  }

  try {
    const info = await transporter.sendMail(mailOptions);

    console.log(
      `Trusty credit union bank email sent to ${to}: ${
        info.messageId || 'unknown'
      }`
    );

    return info;
  } catch (error) {
    console.error(
      `Trusty credit union bank email send error for ${to}:`,
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