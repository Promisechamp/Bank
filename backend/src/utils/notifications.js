const { supabase } = require('../db/supabase');
const { sendEmail } = require('../email/email');

const {
  creditEmail,
  debitEmail,
  transferEmail,
  welcomeEmail,
  newUserRegistrationAdminEmail,
  cardOrderEmail,
  transferRejectedEmail,
} = require('../email/templates');

const ALLOWED_TYPES = [
  'credit',
  'debit',
  'transfer',
  'system',
  'alert',
];

/**
 * Creates an in-app notification and optionally sends an email.
 *
 * @param {Object|null} io
 * @param {string} userId
 * @param {string} type
 * @param {string} title
 * @param {string} message
 * @param {string|null} referenceId
 * @param {Object|null} emailData
 */
const createAndSendNotification = async (
  io,
  userId,
  type,
  title,
  message,
  referenceId = null,
  emailData = null
) => {
  // ============================================================
  // 1. VALIDATE NOTIFICATION TYPE
  // ============================================================

  if (!ALLOWED_TYPES.includes(type)) {
    console.warn(
      `Invalid notification type: "${type}", defaulting to "system"`
    );

    type = 'system';
  }

  // ============================================================
  // 2. SAVE IN-APP NOTIFICATION
  // ============================================================

  const {
    data: record,
    error,
  } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      reference_id: referenceId,
      read: false,
    })
    .select()
    .single();

  if (error) {
    console.error(
      'Failed to save notification:',
      error.message
    );

    return null;
  }

  // ============================================================
  // 3. REAL-TIME SOCKET NOTIFICATION
  // ============================================================

  if (io) {
    try {
      const roomName = `user:${userId}`;

      io.to(roomName).emit(
        'notification:new',
        record
      );

      console.log(
        `Notification emitted to ${roomName}`
      );

    } catch (socketError) {
      console.error(
        'Notification socket emission failed:',
        socketError
      );
    }
  }

  // ============================================================
  // 4. NO EMAIL DATA = IN-APP ONLY
  // ============================================================

  if (!emailData) {
    return record;
  }

  // ============================================================
  // 5. PREPARE EMAIL
  // ============================================================

  try {
    let userEmail =
      emailData.userEmail;

    let userName =
      emailData.userName;

    // ----------------------------------------------------------
    // Fetch missing user information
    // ----------------------------------------------------------

    if (!userEmail || !userName) {
      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select(
          'email, full_name'
        )
        .eq('id', userId)
        .single();

      if (!profileError && profile) {

        userEmail =
          userEmail ||
          profile.email;

        userName =
          userName ||
          profile.full_name ||
          'Customer';

      } else {
        console.warn(
          'Could not fetch profile for email notification:',
          profileError?.message
        );
      }
    }

    // ----------------------------------------------------------
    // No email address
    // ----------------------------------------------------------

    if (!userEmail) {
      console.warn(
        `No email address found for user ${userId}. Email skipped.`
      );

      return record;
    }

    // ----------------------------------------------------------
    // Build template data
    // ----------------------------------------------------------

    const templateData = {
      ...emailData,

      userName:
        userName || 'Customer',

      userEmail,
    };

    let subject = '';
    let html = '';

    // ==========================================================
    // CREDIT
    // ==========================================================

    if (type === 'credit') {

      subject =
        `Trusty credit union bank — Transfer Received ${templateData.amount}`;

      html =
        creditEmail(templateData);
    }

    // ==========================================================
    // DEBIT
    // ==========================================================

    else if (type === 'debit') {

      subject =
        `Trusty credit union bank — Transfer Sent ${templateData.amount}`;

      html =
        debitEmail(templateData);
    }

    // ==========================================================
    // GENERIC TRANSFER
    // ==========================================================

    else if (type === 'transfer') {

      subject =
        `Trusty credit union bank — Transfer Completed ${templateData.amount}`;

      html =
        transferEmail(templateData);
    }

    // ==========================================================
    // WELCOME
    // ==========================================================

    else if (
      type === 'system' &&
      emailData.template === 'welcome'
    ) {

      subject =
        'Welcome to Trusty credit union bank';

      html =
        welcomeEmail(templateData);
    }

    // ==========================================================
    // ADMIN — NEW USER
    // ==========================================================

    else if (
      type === 'system' &&
      emailData.template === 'admin_new_user'
    ) {

      subject =
        'Trusty credit union bank — New User Registration';

      html =
        newUserRegistrationAdminEmail(
          templateData
        );
    }

    // ==========================================================
    // CARD ORDER
    // ==========================================================

    else if (
      type === 'system' &&
      emailData.template === 'card_order_update'
    ) {

      subject =
        'Trusty credit union bank — Card Order Update';

      html =
        cardOrderEmail(
          templateData
        );
    }

    // ==========================================================
    // TRANSFER REJECTED
    // ==========================================================

    else if (
      type === 'system' &&
      emailData.template === 'transfer_rejected'
    ) {

      subject =
        'Trusty credit union bank — Transfer Rejected';

      html =
        transferRejectedEmail(
          templateData
        );
    }

    // ==========================================================
    // SEND EMAIL
    // ==========================================================

    if (subject && html) {

      try {

        await sendEmail({
          to: userEmail,
          subject,
          html,
        });

        console.log(
          `Email sent successfully to ${userEmail}`
        );

      } catch (emailError) {

        // Email failure should NOT
        // break the transaction/notification.

        console.error(
          `Email send failed for ${userEmail}:`,
          emailError
        );
      }
    }

  } catch (emailError) {

    // Email preparation failure should
    // never break the notification.

    console.error(
      'Email preparation error:',
      emailError
    );
  }

  return record;
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createAndSendNotification,
  ALLOWED_TYPES,
};