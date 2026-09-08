const nodemailer = require('nodemailer');

// ============================================================
// SMTP CONFIGURATION
// ============================================================

const smtpHost =
  process.env.SMTP_HOST || 'smtp.gmail.com';

const smtpPort =
  Number.parseInt(
    process.env.SMTP_PORT || '587',
    10
  );

const smtpSecure =
  process.env.SMTP_SECURE === 'true';

// ============================================================
// VALIDATE SMTP CONFIGURATION
// ============================================================

if (!process.env.SMTP_USER) {
  console.warn(
    'SMTP_USER is not configured. Email sending may fail.'
  );
}

if (!process.env.SMTP_PASS) {
  console.warn(
    'SMTP_PASS is not configured. Email sending may fail.'
  );
}

// ============================================================
// CREATE TRANSPORTER
// ============================================================

const transporter = nodemailer.createTransport({
  host: smtpHost,

  port: smtpPort,

  // true for port 465
  // false for port 587 / STARTTLS
  secure:
    smtpPort === 465
      ? true
      : smtpSecure,

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ============================================================
// VERIFY SMTP CONNECTION
// ============================================================

const verifyEmailTransporter = async () => {
  try {
    await transporter.verify();

    console.log(
      `Trustybank email server connected: ${smtpHost}:${smtpPort}`
    );

    return true;

  } catch (error) {

    console.error(
      'Trustybank email server connection failed:',
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

  // ----------------------------------------------------------
  // FROM ADDRESS
  // ----------------------------------------------------------

  const from =
    process.env.SMTP_FROM ||
    `"Trustybank" <${process.env.SMTP_USER}>`;

  // ----------------------------------------------------------
  // SEND
  // ----------------------------------------------------------

  try {

    const info =
      await transporter.sendMail({

        from,

        to,

        subject,

        text:
          text ||
          'Please view this email in an HTML-compatible email client.',

        html:
          html || undefined,
      });

    console.log(
      `Trustybank email sent to ${to}: ${info.messageId}`
    );

    return info;

  } catch (error) {

    console.error(
      `Trustybank email send error for ${to}:`,
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