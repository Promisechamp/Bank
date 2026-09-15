const { Resend } = require('resend');

// ============================================================
// RESEND CONFIGURATION
// ============================================================

const resend = new Resend(
  process.env.RESEND_API_KEY
);

// ============================================================
// VALIDATE RESEND CONFIGURATION
// ============================================================

if (!process.env.RESEND_API_KEY) {
  console.warn(
    'RESEND_API_KEY is not configured. Email sending may fail.'
  );
}

if (!process.env.RESEND_FROM_EMAIL) {
  console.warn(
    'RESEND_FROM_EMAIL is not configured. Email sending may fail.'
  );
}

// ============================================================
// VERIFY EMAIL CONFIGURATION
// ============================================================

const verifyEmailTransporter = async () => {
  if (!process.env.RESEND_API_KEY) {
    console.error(
      'Resend verification failed: RESEND_API_KEY is not configured.'
    );

    return false;
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    console.error(
      'Resend verification failed: RESEND_FROM_EMAIL is not configured.'
    );

    return false;
  }

  console.log(
    'Trusty credit union bank email service configured with Resend.'
  );

  return true;
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
    process.env.RESEND_FROM_EMAIL ||
    'Trusty Credit Union <support@trustycreditunion.com>';

  try {

    const { data, error } =
      await resend.emails.send({
  from,
  to,
  //replyTo: 'boontanchimlin2@gmail.com',
  subject,
  text: text ||'Please view this email in an HTML-compatible email client.',
  html: html || undefined,
});

    if (error) {
      console.error(
        `Trusty credit union bank email send error for ${to}:`,
        error
      );

      throw new Error(
        error.message || 'Failed to send email.'
      );
    }

    console.log(
      `Trusty credit union bank email sent to ${to}: ${data?.id || 'unknown'}`
    );

    return data;

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





