const { supabase } = require('../db/supabase');

const {
  generateReference,
  validateAmount,
  formatCurrency
} = require('../utils/helpers');

const { sendEmail } = require('../email/email');

const {
  createAndSendNotification
} = require('../utils/notifications');

// ============================================================
// TIMEOUT HELPER
// ============================================================

const withTimeout = (promise, ms, message) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(message || 'Operation timed out')
          ),
        ms
      )
    )
  ]);

// ============================================================
// PIN HELPERS
// ============================================================

const MAX_PIN_ATTEMPTS = 5;
const PIN_LENGTH = 4; // change to 6 if your PINs are 6 digits

/**
 * Normalize a stored or submitted PIN to a comparable string.
 *
 * Postgres `numeric`/`integer` columns drop leading zeros, so a
 * PIN of "0000" comes back as 0. We left-pad to PIN_LENGTH so
 * both sides line up regardless of the underlying column type.
 */
const normalizePin = (value) => {
  if (value === null || value === undefined) return '';

  const raw = String(value).trim();

  if (!/^\d+$/.test(raw)) return raw;
  if (raw.length >= PIN_LENGTH) return raw;

  return raw.padStart(PIN_LENGTH, '0');
};

// ============================================================
// OTP EMAIL
// ============================================================

const sendOtpEmail = async (
  toEmail,
  otp,
  reference,
  amount,
  recipientName
) => {
  const frontendUrl = (
    process.env.FRONTEND_URL || 'http://localhost:5173'
  ).replace(/\/$/, '');

  const logoUrl = `${frontendUrl}/logo.png`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>Transaction Verification</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f4f7fb;
  font-family:Arial,Helvetica,sans-serif;
  color:#172033;
">

  <div style="
    width:100%;
    padding:40px 16px;
    box-sizing:border-box;
  ">

    <div style="
      max-width:600px;
      margin:0 auto;
      background:#ffffff;
      border:1px solid #e7ebf2;
      border-radius:20px;
      overflow:hidden;
      box-shadow:0 10px 30px rgba(20,40,80,0.06);
    ">

      <!-- HEADER -->

      <div style="
        padding:28px 32px;
        border-bottom:1px solid #edf0f5;
        background:#ffffff;
      ">

        <img
          src="${logoUrl}"
          alt="Trusty credit union bank"
          style="
            display:block;
            max-width:170px;
            max-height:48px;
            width:auto;
            height:auto;
          "
        />

      </div>

      <!-- CONTENT -->

      <div style="padding:36px 32px;">

        <div style="
          display:inline-block;
          padding:7px 11px;
          border-radius:999px;
          background:#eef5ff;
          color:#2364d2;
          font-size:12px;
          font-weight:700;
          letter-spacing:.4px;
          margin-bottom:16px;
        ">
          TRANSACTION VERIFICATION
        </div>

        <h1 style="
          margin:0 0 12px;
          font-size:25px;
          line-height:1.3;
          color:#14213d;
        ">
          Confirm your transfer
        </h1>

        <p style="
          margin:0 0 26px;
          font-size:15px;
          line-height:1.7;
          color:#667085;
        ">
          A transfer has been initiated from your Trusty credit union
          bank account. Enter the verification code below to continue.
        </p>

        <!-- TRANSFER DETAILS -->

        <div style="
          border:1px solid #e8edf4;
          border-radius:14px;
          overflow:hidden;
          margin-bottom:24px;
        ">

          <div style="
            padding:15px 18px;
            background:#f8fafc;
            border-bottom:1px solid #e8edf4;
            font-size:13px;
            font-weight:700;
            color:#344054;
          ">
            Transfer details
          </div>

          <div style="padding:18px;">

            <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
              style="font-size:14px;"
            >

              <tr>
                <td style="
                  padding:7px 0;
                  color:#667085;
                ">
                  Recipient
                </td>

                <td style="
                  padding:7px 0;
                  text-align:right;
                  font-weight:700;
                  color:#172033;
                ">
                  ${recipientName || 'Recipient'}
                </td>
              </tr>

              <tr>
                <td style="
                  padding:7px 0;
                  color:#667085;
                ">
                  Amount
                </td>

                <td style="
                  padding:7px 0;
                  text-align:right;
                  font-weight:700;
                  color:#172033;
                ">
                  ${formatCurrency(amount)}
                </td>
              </tr>

              <tr>
                <td style="
                  padding:7px 0;
                  color:#667085;
                ">
                  Reference
                </td>

                <td style="
                  padding:7px 0;
                  text-align:right;
                  font-weight:700;
                  color:#172033;
                  word-break:break-all;
                ">
                  ${reference}
                </td>
              </tr>

            </table>

          </div>

        </div>

        <!-- OTP -->

        <div style="
          text-align:center;
          border:1px solid #dfe7f2;
          border-radius:16px;
          padding:24px 18px;
          background:#fbfdff;
        ">

          <div style="
            font-size:12px;
            font-weight:700;
            color:#667085;
            letter-spacing:1px;
            margin-bottom:12px;
          ">
            VERIFICATION CODE
          </div>

          <div style="
            font-size:34px;
            line-height:1;
            font-weight:800;
            letter-spacing:9px;
            color:#14213d;
            padding-left:9px;
          ">
            ${otp}
          </div>

          <p style="
            margin:15px 0 0;
            font-size:13px;
            line-height:1.6;
            color:#667085;
          ">
            This code expires in 10 minutes.
          </p>

        </div>

        <p style="
          margin:25px 0 0;
          font-size:13px;
          line-height:1.7;
          color:#667085;
        ">
          If you did not initiate this transfer, do not share this
          verification code and contact Trusty credit union bank
          support immediately.
        </p>

      </div>

      <!-- FOOTER -->

      <div style="
        padding:22px 32px;
        border-top:1px solid #edf0f5;
        background:#fafbfd;
      ">

        <p style="
          margin:0;
          font-size:12px;
          line-height:1.6;
          color:#98a2b3;
        ">
          This is an automated message from Trusty credit union bank.
          Please do not reply to this email.
        </p>

      </div>

    </div>

  </div>

</body>
</html>
  `;

  return sendEmail({
    to: toEmail,
    subject:
      'Trusty credit union bank — Transaction Verification Code',
    html
  });
};

// ============================================================
// INITIATE SAME-BANK TRANSFER
// ============================================================

const initiateTransfer = async (req, res, next) => {
  try {
    const {
      fromAccountId,
      amount,
      description,
      recipientAccountNumber,
      recipientName,
      verificationMethod: rawVerificationMethod
    } = req.body;

    // --------------------------------------------------------
    // NORMALIZE VERIFICATION METHOD
    // --------------------------------------------------------

    const verificationMethod =
      String(rawVerificationMethod || 'otp')
        .toLowerCase() === 'pin'
        ? 'pin'
        : 'otp';

    // --------------------------------------------------------
    // AUTH
    // --------------------------------------------------------

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    // --------------------------------------------------------
    // VALIDATE AMOUNT
    // --------------------------------------------------------

    if (!validateAmount(amount)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transfer amount.'
      });
    }

    const transferAmount = Number(amount);

    if (!Number.isFinite(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Transfer amount must be greater than zero.'
      });
    }

    // --------------------------------------------------------
    // VALIDATE SOURCE ACCOUNT ID
    // --------------------------------------------------------

    if (!fromAccountId) {
      return res.status(400).json({
        success: false,
        error: 'Source account is required.'
      });
    }

    // --------------------------------------------------------
    // VALIDATE RECIPIENT ACCOUNT NUMBER
    // --------------------------------------------------------

    if (
      !recipientAccountNumber ||
      String(recipientAccountNumber).trim() === ''
    ) {
      return res.status(400).json({
        success: false,
        error: 'Recipient account number is required.'
      });
    }

    // --------------------------------------------------------
    // GET SOURCE ACCOUNT
    // --------------------------------------------------------

    const {
      data: sourceAccount,
      error: sourceError
    } = await supabase
      .from('accounts')
      .select(`
        id,
        user_id,
        account_number,
        account_type,
        balance,
        currency,
        status,
        profiles!user_id(
          status,
          email,
          full_name
        )
      `)
      .eq('id', fromAccountId)
      .eq('user_id', req.user.id)
      .single();

    if (sourceError) {
      if (sourceError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Source account not found.'
        });
      }

      throw sourceError;
    }

    // --------------------------------------------------------
    // CHECK SOURCE ACCOUNT STATUS
    // --------------------------------------------------------

    const accountStatus =
      String(sourceAccount.status || '').toLowerCase();

    const profileStatus =
      String(sourceAccount.profiles?.status || '').toLowerCase();

    const senderRestricted =
      accountStatus === 'frozen' ||
      profileStatus === 'frozen' ||
      profileStatus === 'banned';

    if (accountStatus === 'closed') {
      return res.status(400).json({
        success: false,
        error: 'This account is closed and cannot send transfers.'
      });
    }

    // --------------------------------------------------------
    // CHECK BALANCE
    // --------------------------------------------------------

    if (
      Number(sourceAccount.balance) <
      transferAmount
    ) {
      return res.status(400).json({
        success: false,
        error:
          `Insufficient funds. Available: ${formatCurrency(
            sourceAccount.balance
          )}`
      });
    }

    // --------------------------------------------------------
    // GET RECIPIENT
    // --------------------------------------------------------

    const {
      data: recipient,
      error: recipientError
    } = await supabase
      .from('accounts')
      .select(`
        id,
        user_id,
        account_number,
        account_type,
        balance,
        currency,
        status,
        profiles!user_id(
          full_name,
          email,
          status
        )
      `)
      .eq(
        'account_number',
        String(recipientAccountNumber).trim()
      )
      .maybeSingle();

    if (recipientError) {
      throw recipientError;
    }

    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: 'Recipient account could not be found.'
      });
    }

    // --------------------------------------------------------
    // SAME ACCOUNT
    // --------------------------------------------------------

    if (recipient.id === sourceAccount.id) {
      return res.status(400).json({
        success: false,
        error:
          'You cannot transfer money to the same account.'
      });
    }

    // --------------------------------------------------------
    // RECIPIENT ACCOUNT STATUS
    // --------------------------------------------------------

    if (
      String(recipient.status || '').toLowerCase() !==
      'active'
    ) {
      return res.status(400).json({
        success: false,
        error:
          'The recipient account is not available for transfers.'
      });
    }

    const recipientProfileStatus =
      String(
        recipient.profiles?.status || ''
      ).toLowerCase();

    if (
      ['banned', 'frozen'].includes(
        recipientProfileStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        error:
          'The recipient account is not available for transfers.'
      });
    }

    // --------------------------------------------------------
    // VERIFY RECIPIENT NAME
    // --------------------------------------------------------

    const actualRecipientName =
      recipient.profiles?.full_name ||
      '';

    if (
      recipientName &&
      actualRecipientName &&
      String(recipientName)
        .trim()
        .toLowerCase() !==
        actualRecipientName
          .trim()
          .toLowerCase()
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Recipient name does not match the account.'
      });
    }

    const confirmedRecipientName =
      actualRecipientName ||
      recipientName ||
      'Recipient';

    // --------------------------------------------------------
    // GENERATE REFERENCE
    // --------------------------------------------------------

    const reference =
      generateReference();

    const transferDescription =
      description?.trim() ||
      'Same bank transfer';

    // --------------------------------------------------------
    // SENDER INFO
    // --------------------------------------------------------

    const senderName =
      sourceAccount.profiles?.full_name ||
      'User';

    const senderBank =
      'Trusty credit union bank';

    // --------------------------------------------------------
    // BUILD TRANSACTION METADATA
    // --------------------------------------------------------

    const transactionMetadata = {
      transferType:
        'same_bank',

      direction:
        'debit',

      receiverName:
        confirmedRecipientName,

      receiverBank:
        'Trusty credit union bank',

      receiverAccountNo:
        recipient.account_number,

      recipientAccountNumber:
        recipient.account_number,

      recipientName:
        confirmedRecipientName,

      recipientAccountId:
        recipient.id,

      senderName,

      senderAccountNumber:
        sourceAccount.account_number,

      senderBank,

      paymentMethod:
        'Bank Transfer',

      channel:
        'Online Banking',

      senderRestricted,

      verificationMethod,

      otpRequired:
        verificationMethod === 'otp',

      otpVerified:
        false,

      pinRequired:
        verificationMethod === 'pin',

      pinVerified:
        false,

      pinAttempts:
        0,

      fromAccountId:
        sourceAccount.id,

      toAccountId:
        recipient.id
    };

    // --------------------------------------------------------
    // CREATE PENDING TRANSACTION
    // --------------------------------------------------------

    const {
      data: pendingTransaction,
      error: transactionError
    } = await supabase
      .from('transactions')
      .insert([{
        account_id:
          sourceAccount.id,

        transaction_type:
          'transfer',

        amount:
          transferAmount,

        description:
          transferDescription,

        reference_id:
          reference,

        counterparty_account:
          recipient.id,

        status:
          'pending_review',

        metadata:
          transactionMetadata
      }])
      .select('id')
      .single();

    if (transactionError) {
      throw transactionError;
    }

    // ========================================================
    // PIN FLOW
    // ========================================================
    //
    // We do NOT generate an OTP and we do NOT send an email.
    // The frontend will open the PIN modal and call
    // verifyPinAndComplete with { reference, pin }.
    // ========================================================

    if (verificationMethod === 'pin') {
      return res.json({
        success: true,

        requiresPin: true,

        reference,

        status:
          'pending_review',

        recipient: {
          accountNumber:
            recipient.account_number,

          name:
            confirmedRecipientName
        },

        message:
          'Transfer initiated. Enter your transfer PIN to authorize.'
      });
    }

    // ========================================================
    // OTP FLOW
    // ========================================================

    // --------------------------------------------------------
    // GENERATE OTP
    // --------------------------------------------------------

    const otp =
      Math.floor(
        100000 +
        Math.random() * 900000
      ).toString();

    // --------------------------------------------------------
    // STORE OTP
    // --------------------------------------------------------

    const {
      error: otpError
    } = await supabase
      .from('otp_verifications')
      .insert({
        reference,

        otp,

        user_id:
          req.user.id,

        verified:
          false,

        expires_at:
          new Date(
            Date.now() +
            10 * 60 * 1000
          ).toISOString(),

        data: {
          transactionId:
            pendingTransaction.id,

          fromAccountId:
            sourceAccount.id,

          toAccountId:
            recipient.id,

          amount:
            transferAmount,

          description:
            transferDescription,

          recipientAccountNumber:
            recipient.account_number,

          recipientName:
            confirmedRecipientName
        }
      });

    if (otpError) {
      // Roll back the pending transaction; the user can try again.
      await supabase
        .from('transactions')
        .delete()
        .eq(
          'id',
          pendingTransaction.id
        );

      throw otpError;
    }

    // --------------------------------------------------------
    // SEND OTP EMAIL
    // --------------------------------------------------------

    const senderEmail =
      req.user?.email ||
      sourceAccount.profiles?.email;

    if (!senderEmail) {
      await supabase
        .from('otp_verifications')
        .delete()
        .eq(
          'reference',
          reference
        );

      // Keep the transaction pending but enable PIN fallback.
      await supabase
        .from('transactions')
        .update({
          metadata: {
            ...transactionMetadata,
            pinRequired: true,
            otpRequired: false,
            otpSendFailed: true,
            otpFailureReason:
              'Registered email could not be found.',
            otpSendFailedAt: new Date().toISOString()
          }
        })
        .eq(
          'id',
          pendingTransaction.id
        );

      return res.json({
        success: true,
        requiresPin: true,
        otpSendFailed: true,
        reference,
        status: 'pending_review',
        recipient: {
          accountNumber: recipient.account_number,
          name: confirmedRecipientName
        },
        message:
          'We could not send the verification code to your email. Please verify this transfer with your PIN instead.'
      });
    }

    try {
      await withTimeout(
        sendOtpEmail(
          senderEmail,
          otp,
          reference,
          transferAmount,
          confirmedRecipientName
        ),
        12000, // hard cap so we never hang the request
        'OTP email delivery timed out'
      );
    } catch (emailError) {
      console.error('OTP email failed:', emailError);

      // The OTP never reached the user — remove the invalid OTP record.
      await supabase
        .from('otp_verifications')
        .delete()
        .eq('reference', reference);

      // CRITICAL: keep the pending transaction alive and allow PIN
      // fallback with the SAME reference so the user does not have to
      // start over.
      await supabase
        .from('transactions')
        .update({
          metadata: {
            ...transactionMetadata,
            pinRequired: true,
            otpRequired: false,
            otpSendFailed: true,
            otpFailureReason:
              emailError?.message ||
              'OTP email delivery failed.',
            otpSendFailedAt: new Date().toISOString()
          }
        })
        .eq('id', pendingTransaction.id);

      return res.json({
        success: true,
        requiresPin: true,
        otpSendFailed: true,
        reference,
        status: 'pending_review',
        recipient: {
          accountNumber: recipient.account_number,
          name: confirmedRecipientName
        },
        message:
          'We could not send the verification code. You can verify this transfer with your PIN instead.'
      });
    }

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.json({
      success: true,

      requiresOtp:
        true,

      reference,

      status:
        'pending_review',

      recipient: {
        accountNumber:
          recipient.account_number,

        name:
          confirmedRecipientName
      },

      message:
        'Transfer initiated. A verification code has been sent to your registered email.'
    });

  } catch (error) {
    console.error(
      'Initiate Transfer Error:',
      error
    );

    next(error);
  }
};

// ============================================================
// VERIFY OTP AND COMPLETE TRANSFER
// ============================================================

const verifyOtpAndComplete = async (
  req,
  res,
  next
) => {
  try {
    const {
      reference,
      otp
    } = req.body;

    // --------------------------------------------------------
    // AUTH
    // --------------------------------------------------------

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    // --------------------------------------------------------
    // VALIDATE INPUT
    // --------------------------------------------------------

    if (
      !reference ||
      String(reference).trim() === ''
    ) {
      return res.status(400).json({
        success: false,
        error: 'Transaction reference is required.'
      });
    }

    if (
      !otp ||
      String(otp).trim() === ''
    ) {
      return res.status(400).json({
        success: false,
        error: 'Verification code is required.'
      });
    }

    const cleanReference =
      String(reference).trim();

    const cleanOtp =
      String(otp).trim();

    // --------------------------------------------------------
    // GET OTP
    // --------------------------------------------------------

    const {
      data: otpRecord,
      error: otpError
    } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq(
        'reference',
        cleanReference
      )
      .eq(
        'user_id',
        req.user.id
      )
      .maybeSingle();

    if (otpError) {
      throw otpError;
    }

    if (!otpRecord) {
      return res.status(404).json({
        success: false,
        error:
          'Invalid transaction reference.'
      });
    }

    // --------------------------------------------------------
    // OTP ALREADY USED
    // --------------------------------------------------------

    if (otpRecord.verified) {
      return res.status(400).json({
        success: false,
        error:
          'This verification code has already been used.'
      });
    }

    // --------------------------------------------------------
    // OTP EXPIRATION
    // --------------------------------------------------------

    if (
      !otpRecord.expires_at ||
      new Date(
        otpRecord.expires_at
      ).getTime() <= Date.now()
    ) {
      return res.status(400).json({
        success: false,
        error:
          'This verification code has expired.'
      });
    }

    // --------------------------------------------------------
    // OTP MATCH
    // --------------------------------------------------------

    if (
      String(otpRecord.otp) !==
      cleanOtp
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid verification code.'
      });
    }

    const transferData =
      otpRecord.data || {};

    // --------------------------------------------------------
    // REQUIRED OTP DATA
    // --------------------------------------------------------

    if (
      !transferData.fromAccountId ||
      !transferData.toAccountId ||
      !transferData.amount
    ) {
      return res.status(500).json({
        success: false,
        error:
          'This transfer verification record is incomplete.'
      });
    }

    // --------------------------------------------------------
    // GET PENDING TRANSACTION
    // --------------------------------------------------------

    const {
      data: transaction,
      error: transactionError
    } = await supabase
      .from('transactions')
      .select('*')
      .eq(
        'reference_id',
        cleanReference
      )
      .eq(
        'account_id',
        transferData.fromAccountId
      )
      .maybeSingle();

    if (transactionError) {
      throw transactionError;
    }

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error:
          'Transaction record not found.'
      });
    }

    // --------------------------------------------------------
    // TRANSACTION ALREADY PROCESSED
    // --------------------------------------------------------

    if (
      transaction.status !==
      'pending_review'
    ) {
      return res.status(400).json({
        success: false,
        error:
          'This transaction has already been processed.'
      });
    }

    // --------------------------------------------------------
    // GET CURRENT SOURCE ACCOUNT
    // --------------------------------------------------------

    const {
      data: sourceAccount,
      error: sourceError
    } = await supabase
      .from('accounts')
      .select(`
        id,
        user_id,
        account_number,
        account_type,
        balance,
        currency,
        status,
        profiles!user_id(
          status,
          email,
          full_name
        )
      `)
      .eq(
        'id',
        transferData.fromAccountId
      )
      .eq(
        'user_id',
        req.user.id
      )
      .single();

    if (sourceError) {
      if (
        sourceError.code ===
        'PGRST116'
      ) {
        return res.status(404).json({
          success: false,
          error:
            'Source account not found.'
        });
      }

      throw sourceError;
    }

    // --------------------------------------------------------
    // CURRENT ACCOUNT STATUS
    // --------------------------------------------------------

    const accountStatus =
      String(
        sourceAccount.status || ''
      ).toLowerCase();

    const profileStatus =
      String(
        sourceAccount.profiles?.status ||
        ''
      ).toLowerCase();

    const senderRestricted =
      accountStatus === 'frozen' ||
      profileStatus === 'frozen' ||
      profileStatus === 'banned';

    // ========================================================
    // RESTRICTED ACCOUNT
    // ========================================================

    if (senderRestricted) {
      const {
        error: verifyError
      } = await supabase
        .from('otp_verifications')
        .update({
          verified: true
        })
        .eq(
          'reference',
          cleanReference
        )
        .eq(
          'user_id',
          req.user.id
        )
        .eq(
          'verified',
          false
        );

      if (verifyError) {
        throw verifyError;
      }

      const {
        error: reviewError
      } = await supabase
        .from('transactions')
        .update({
          status:
            'pending_review',

          metadata: {
            ...(transaction.metadata || {}),

            senderRestricted:
              true,

            restrictionStatus:
              profileStatus === 'banned'
                ? 'banned'
                : 'frozen',

            otpVerified:
              true,

            reviewSubmittedAt:
              new Date().toISOString()
          }
        })
        .eq(
          'id',
          transaction.id
        )
        .eq(
          'status',
          'pending_review'
        );

      if (reviewError) {
        throw reviewError;
      }

      res.json({
        success: true,

        reference:
          cleanReference,

        status:
          'pending_review',

        message:
          'OTP verified. Transfer has been submitted for bank review.'
      });

      // Fire notification in the background.
      setImmediate(async () => {
        try {
          const io =
            req.app.get('io');

          await createAndSendNotification(
            io,
            req.user.id,
            'system',
            'Transfer Pending Review',
            `Your transfer of ${formatCurrency(
              transferData.amount
            )} is pending bank review due to account restrictions.`,
            cleanReference
          );
        } catch (notifyError) {
          console.error(
            'Pending review notification failed:',
            notifyError
          );
        }
      });

      return;
    }

    // ========================================================
    // NORMAL TRANSFER — ATOMIC RPC
    // ========================================================

    const {
      data: transferResult,
      error: transferError
    } = await supabase.rpc(
      'complete_same_bank_transfer',
      {
        p_reference:
          cleanReference,

        p_user_id:
          req.user.id,

        p_transaction_id:
          transaction.id,

        p_source_account_id:
          transferData.fromAccountId,

        p_destination_account_id:
          transferData.toAccountId,

        p_amount:
          Number(transferData.amount)
      }
    );

    if (transferError) {
      console.error(
        'Atomic transfer RPC error:',
        transferError
      );

      if (
        transferError.message?.includes(
          'INSUFFICIENT_FUNDS'
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            'Insufficient funds to complete this transfer.'
        });
      }

      if (
        transferError.message?.includes(
          'SOURCE_ACCOUNT_NOT_ACTIVE'
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            'Your account is not available for this transfer.'
        });
      }

      if (
        transferError.message?.includes(
          'DESTINATION_ACCOUNT_NOT_ACTIVE'
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            'The recipient account is no longer available.'
        });
      }

      if (
        transferError.message?.includes(
          'TRANSACTION_ALREADY_PROCESSED'
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            'This transaction has already been processed.'
        });
      }

      throw transferError;
    }

    if (!transferResult) {
      throw new Error(
        'Transfer completed without a database result.'
      );
    }

    // --------------------------------------------------------
    // MARK OTP VERIFIED
    // --------------------------------------------------------

    const {
      error: verifyError
    } = await supabase
      .from('otp_verifications')
      .update({
        verified:
          true
      })
      .eq(
        'reference',
        cleanReference
      )
      .eq(
        'user_id',
        req.user.id
      )
      .eq(
        'verified',
        false
      );

    if (verifyError) {
      console.error(
        'OTP verification flag update failed after completed transfer:',
        verifyError
      );
    }

    // --------------------------------------------------------
    // GET FINAL TRANSACTION DATA
    // --------------------------------------------------------

    const {
      data: completedTransaction,
      error: completedTransactionError
    } = await supabase
      .from('transactions')
      .select('*')
      .eq(
        'id',
        transaction.id
      )
      .single();

    if (completedTransactionError) {
      throw completedTransactionError;
    }

    // --------------------------------------------------------
    // FINAL ACCOUNT DATA
    // --------------------------------------------------------

    const {
      data: finalSourceAccount,
      error: finalSourceError
    } = await supabase
      .from('accounts')
      .select(`
        id,
        user_id,
        account_number,
        balance,
        profiles!user_id(
          full_name,
          email
        )
      `)
      .eq(
        'id',
        transferData.fromAccountId
      )
      .single();

    if (finalSourceError) {
      throw finalSourceError;
    }

    const {
      data: finalDestinationAccount,
      error: finalDestinationError
    } = await supabase
      .from('accounts')
      .select(`
        id,
        user_id,
        account_number,
        balance,
        profiles!user_id(
          full_name,
          email
        )
      `)
      .eq(
        'id',
        transferData.toAccountId
      )
      .single();

    if (finalDestinationError) {
      throw finalDestinationError;
    }

    // --------------------------------------------------------
    // DISPLAY DATA
    // --------------------------------------------------------

    const amount =
      Number(transferData.amount);

    const senderName =
      finalSourceAccount.profiles?.full_name ||
      'User';

    const recipientName =
      finalDestinationAccount.profiles?.full_name ||
      transferData.recipientName ||
      'Recipient';

    const description =
      transferData.description ||
      'Same bank transfer';

    const newSourceBalance =
      Number(
        finalSourceAccount.balance
      );

    const newDestinationBalance =
      Number(
        finalDestinationAccount.balance
      );

    // ========================================================
    // SEND RESPONSE FIRST
    // ========================================================

    res.json({
      success:
        true,

      reference:
        cleanReference,

      status:
        'completed',

      message:
        'Transfer completed successfully.',

      from_account: {
        id:
          finalSourceAccount.id,

        new_balance:
          newSourceBalance
      },

      to_account: {
        id:
          finalDestinationAccount.id,

        new_balance:
          newDestinationBalance
      },

      transaction:
        completedTransaction
    });

    // ========================================================
    // NOTIFICATIONS (BACKGROUND)
    // ========================================================

    setImmediate(async () => {
      const io =
        req.app.get('io');

      try {
        await createAndSendNotification(
          io,

          finalSourceAccount.user_id,

          'debit',

          `Transfer Debited – ${formatCurrency(
            amount
          )}`,

          `You transferred ${formatCurrency(
            amount
          )} to ${recipientName}.`,

          cleanReference,

          {
            userName:
              senderName,

            userEmail:
              finalSourceAccount.profiles?.email ||
              req.user.email,

            accountNumber:
              finalSourceAccount.account_number,

            amount:
              formatCurrency(amount),

            newBalance:
              formatCurrency(
                newSourceBalance
              ),

            description,

            reference:
              cleanReference,

            transferType:
              'same_bank',

            direction:
              'sent',

            recipientName,

            recipientAccountNumber:
              finalDestinationAccount.account_number
          }
        );
      } catch (notificationError) {
        console.error(
          'Sender notification failed:',
          notificationError
        );
      }

      try {
        await createAndSendNotification(
          io,

          finalDestinationAccount.user_id,

          'credit',

          `Transfer Credited – ${formatCurrency(
            amount
          )}`,

          `You received ${formatCurrency(
            amount
          )} from ${senderName}.`,

          cleanReference,

          {
            userName:
              recipientName,

            userEmail:
              finalDestinationAccount.profiles?.email,

            accountNumber:
              finalDestinationAccount.account_number,

            amount:
              formatCurrency(amount),

            newBalance:
              formatCurrency(
                newDestinationBalance
              ),

            description,

            reference:
              cleanReference,

            transferType:
              'same_bank',

            direction:
              'received',

            senderName,

            senderAccountNumber:
              finalSourceAccount.account_number
          }
        );
      } catch (notificationError) {
        console.error(
          'Recipient notification failed:',
          notificationError
        );
      }
    });

    return;

  } catch (error) {
    console.error(
      'Verify OTP Error:',
      error
    );

    next(error);
  }
};

// ============================================================
// VERIFY TRANSFER PIN AND COMPLETE TRANSFER
// ============================================================

const verifyPinAndComplete = async (
  req,
  res,
  next
) => {
  try {
    const {
      reference,
      pin
    } = req.body;

    // --------------------------------------------------------
    // AUTH
    // --------------------------------------------------------

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    // --------------------------------------------------------
    // VALIDATE INPUT
    // --------------------------------------------------------

    if (
      !reference ||
      String(reference).trim() === ''
    ) {
      return res.status(400).json({
        success: false,
        error: 'Transaction reference is required.'
      });
    }

    if (
      !pin ||
      String(pin).trim() === ''
    ) {
      return res.status(400).json({
        success: false,
        error: 'Transfer PIN is required.'
      });
    }

    const cleanReference =
      String(reference).trim();

    const cleanPin =
      String(pin).trim();

    if (!/^\d+$/.test(cleanPin)) {
      return res.status(400).json({
        success: false,
        error:
          'Transfer PIN must contain only digits.'
      });
    }

    // --------------------------------------------------------
    // GET PENDING TRANSACTION (ownership checked below)
    // --------------------------------------------------------

    const {
      data: transaction,
      error: transactionError
    } = await supabase
      .from('transactions')
      .select(`
        *,
        accounts:account_id(
          id,
          user_id,
          account_number,
          balance,
          profiles!user_id(
            full_name,
            email,
            status,
            transfer_pin
          )
        )
      `)
      .eq(
        'reference_id',
        cleanReference
      )
      .maybeSingle();

    if (transactionError) {
      throw transactionError;
    }

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error:
          'Transaction record not found.'
      });
    }

    // --------------------------------------------------------
    // OWNERSHIP
    // --------------------------------------------------------

    if (
      transaction.accounts?.user_id !==
      req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error:
          'You are not authorized to verify this transaction.'
      });
    }

    // --------------------------------------------------------
    // STATUS
    // --------------------------------------------------------

    if (
      transaction.status !==
      'pending_review'
    ) {
      return res.status(400).json({
        success: false,
        error:
          'This transaction has already been processed.'
      });
    }

    // --------------------------------------------------------
    // NORMALIZE METADATA
    // --------------------------------------------------------

    let metadata =
      transaction.metadata || {};

    if (
      typeof metadata ===
      'string'
    ) {
      try {
        metadata = JSON.parse(metadata);
      } catch {
        metadata = {};
      }
    }

    // --------------------------------------------------------
    // REQUIRED METADATA
    // --------------------------------------------------------

    if (
      !metadata.fromAccountId ||
      !metadata.toAccountId ||
      !transaction.amount
    ) {
      return res.status(500).json({
        success: false,
        error:
          'This transfer verification record is incomplete.'
      });
    }

    // --------------------------------------------------------
    // ATTEMPT LIMIT
    // --------------------------------------------------------

    const attempts =
      Number(metadata.pinAttempts || 0);

    if (attempts >= MAX_PIN_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        error:
          'Too many incorrect PIN attempts. Please try again later or contact support.'
      });
    }

    // --------------------------------------------------------
    // COMPARE PIN (PLAINTEXT NUMERIC)
    // --------------------------------------------------------

    const storedPin =
      transaction.accounts?.profiles?.transfer_pin;

    if (
      storedPin === null ||
      storedPin === undefined ||
      String(storedPin).trim() === ''
    ) {
      return res.status(400).json({
        success: false,
        error:
          'You have not set a transfer PIN. Please set one in your profile settings.'
      });
    }

    const pinValid =
      normalizePin(storedPin) ===
      normalizePin(cleanPin);

    if (!pinValid) {
      const nextAttempts =
        attempts + 1;

      await supabase
        .from('transactions')
        .update({
          metadata: {
            ...metadata,
            pinAttempts:
              nextAttempts,
            lastPinAttemptAt:
              new Date().toISOString()
          }
        })
        .eq(
          'id',
          transaction.id
        )
        .eq(
          'status',
          'pending_review'
        );

      const remaining =
        Math.max(
          MAX_PIN_ATTEMPTS - nextAttempts,
          0
        );

      return res.status(400).json({
        success: false,
        error:
          remaining > 0
            ? `Incorrect transfer PIN. ${remaining} attempt${
                remaining === 1 ? '' : 's'
              } remaining.`
            : 'Too many incorrect PIN attempts. Please try again later.'
      });
    }

    // --------------------------------------------------------
    // PIN IS VALID — RE-CHECK CURRENT SOURCE ACCOUNT STATE
    // --------------------------------------------------------

    const {
      data: sourceAccount,
      error: sourceError
    } = await supabase
      .from('accounts')
      .select(`
        id,
        user_id,
        account_number,
        account_type,
        balance,
        currency,
        status,
        profiles!user_id(
          status,
          email,
          full_name
        )
      `)
      .eq(
        'id',
        metadata.fromAccountId
      )
      .eq(
        'user_id',
        req.user.id
      )
      .single();

    if (sourceError) {
      if (
        sourceError.code ===
        'PGRST116'
      ) {
        return res.status(404).json({
          success: false,
          error:
            'Source account not found.'
        });
      }

      throw sourceError;
    }

    const accountStatus =
      String(
        sourceAccount.status || ''
      ).toLowerCase();

    const profileStatus =
      String(
        sourceAccount.profiles?.status ||
        ''
      ).toLowerCase();

    const senderRestricted =
      accountStatus === 'frozen' ||
      profileStatus === 'frozen' ||
      profileStatus === 'banned';

    // ========================================================
    // RESTRICTED ACCOUNT
    // ========================================================

    if (senderRestricted) {
      const {
        error: reviewError
      } = await supabase
        .from('transactions')
        .update({
          status:
            'pending_review',

          metadata: {
            ...metadata,

            senderRestricted:
              true,

            restrictionStatus:
              profileStatus === 'banned'
                ? 'banned'
                : 'frozen',

            pinVerified:
              true,

            verificationMethod:
              'pin',

            reviewSubmittedAt:
              new Date().toISOString()
          }
        })
        .eq(
          'id',
          transaction.id
        )
        .eq(
          'status',
          'pending_review'
        );

      if (reviewError) {
        throw reviewError;
      }

      res.json({
        success: true,

        reference:
          cleanReference,

        status:
          'pending_review',

        message:
          'PIN verified. Transfer has been submitted for bank review.'
      });

      setImmediate(async () => {
        try {
          const io =
            req.app.get('io');

          await createAndSendNotification(
            io,
            req.user.id,
            'system',
            'Transfer Pending Review',
            `Your transfer of ${formatCurrency(
              transaction.amount
            )} is pending bank review due to account restrictions.`,
            cleanReference
          );
        } catch (notifyError) {
          console.error(
            'Pending review notification failed:',
            notifyError
          );
        }
      });

      return;
    }

    // ========================================================
    // ATOMIC TRANSFER VIA RPC
    // ========================================================

    const {
      data: transferResult,
      error: transferError
    } = await supabase.rpc(
      'complete_same_bank_transfer',
      {
        p_reference:
          cleanReference,

        p_user_id:
          req.user.id,

        p_transaction_id:
          transaction.id,

        p_source_account_id:
          metadata.fromAccountId,

        p_destination_account_id:
          metadata.toAccountId,

        p_amount:
          Number(transaction.amount)
      }
    );

    if (transferError) {
      console.error(
        'Atomic transfer RPC error:',
        transferError
      );

      if (
        transferError.message?.includes(
          'INSUFFICIENT_FUNDS'
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            'Insufficient funds to complete this transfer.'
        });
      }

      if (
        transferError.message?.includes(
          'SOURCE_ACCOUNT_NOT_ACTIVE'
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            'Your account is not available for this transfer.'
        });
      }

      if (
        transferError.message?.includes(
          'DESTINATION_ACCOUNT_NOT_ACTIVE'
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            'The recipient account is no longer available.'
        });
      }

      if (
        transferError.message?.includes(
          'TRANSACTION_ALREADY_PROCESSED'
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            'This transaction has already been processed.'
        });
      }

      throw transferError;
    }

    if (!transferResult) {
      throw new Error(
        'Transfer completed without a database result.'
      );
    }

    // --------------------------------------------------------
    // MARK PIN VERIFIED IN METADATA
    // --------------------------------------------------------

    const {
      error: verifyError
    } = await supabase
      .from('transactions')
      .update({
        metadata: {
          ...metadata,
          pinVerified:
            true,
          verificationMethod:
            'pin',
          pinVerifiedAt:
            new Date().toISOString()
        }
      })
      .eq(
        'id',
        transaction.id
      );

    if (verifyError) {
      console.error(
        'PIN verification flag update failed after completed transfer:',
        verifyError
      );
    }

    // --------------------------------------------------------
    // FINAL TRANSACTION DATA
    // --------------------------------------------------------

    const {
      data: completedTransaction,
      error: completedTransactionError
    } = await supabase
      .from('transactions')
      .select('*')
      .eq(
        'id',
        transaction.id
      )
      .single();

    if (completedTransactionError) {
      throw completedTransactionError;
    }

    // --------------------------------------------------------
    // FINAL ACCOUNT DATA
    // --------------------------------------------------------

    const {
      data: finalSourceAccount,
      error: finalSourceError
    } = await supabase
      .from('accounts')
      .select(`
        id,
        user_id,
        account_number,
        balance,
        profiles!user_id(
          full_name,
          email
        )
      `)
      .eq(
        'id',
        metadata.fromAccountId
      )
      .single();

    if (finalSourceError) {
      throw finalSourceError;
    }

    const {
      data: finalDestinationAccount,
      error: finalDestinationError
    } = await supabase
      .from('accounts')
      .select(`
        id,
        user_id,
        account_number,
        balance,
        profiles!user_id(
          full_name,
          email
        )
      `)
      .eq(
        'id',
        metadata.toAccountId
      )
      .single();

    if (finalDestinationError) {
      throw finalDestinationError;
    }

    // --------------------------------------------------------
    // DISPLAY DATA
    // --------------------------------------------------------

    const amount =
      Number(transaction.amount);

    const senderName =
      finalSourceAccount.profiles?.full_name ||
      'User';

    const recipientName =
      finalDestinationAccount.profiles?.full_name ||
      metadata.recipientName ||
      'Recipient';

    const description =
      metadata.description ||
      'Same bank transfer';

    const newSourceBalance =
      Number(
        finalSourceAccount.balance
      );

    const newDestinationBalance =
      Number(
        finalDestinationAccount.balance
      );

    // ========================================================
    // SEND RESPONSE FIRST
    // ========================================================

    res.json({
      success: true,

      reference:
        cleanReference,

      status:
        'completed',

      message:
        'Transfer completed successfully.',

      from_account: {
        id:
          finalSourceAccount.id,

        new_balance:
          newSourceBalance
      },

      to_account: {
        id:
          finalDestinationAccount.id,

        new_balance:
          newDestinationBalance
      },

      transaction:
        completedTransaction
    });

    // ========================================================
    // NOTIFICATIONS (BACKGROUND)
    // ========================================================

    setImmediate(async () => {
      const io =
        req.app.get('io');

      try {
        await createAndSendNotification(
          io,

          finalSourceAccount.user_id,

          'debit',

          `Transfer Debited – ${formatCurrency(
            amount
          )}`,

          `You transferred ${formatCurrency(
            amount
          )} to ${recipientName}.`,

          cleanReference,

          {
            userName:
              senderName,

            userEmail:
              finalSourceAccount.profiles?.email ||
              req.user.email,

            accountNumber:
              finalSourceAccount.account_number,

            amount:
              formatCurrency(amount),

            newBalance:
              formatCurrency(
                newSourceBalance
              ),

            description,

            reference:
              cleanReference,

            transferType:
              'same_bank',

            direction:
              'sent',

            recipientName,

            recipientAccountNumber:
              finalDestinationAccount.account_number
          }
        );
      } catch (notificationError) {
        console.error(
          'Sender notification failed:',
          notificationError
        );
      }

      try {
        await createAndSendNotification(
          io,

          finalDestinationAccount.user_id,

          'credit',

          `Transfer Credited – ${formatCurrency(
            amount
          )}`,

          `You received ${formatCurrency(
            amount
          )} from ${senderName}.`,

          cleanReference,

          {
            userName:
              recipientName,

            userEmail:
              finalDestinationAccount.profiles?.email,

            accountNumber:
              finalDestinationAccount.account_number,

            amount:
              formatCurrency(amount),

            newBalance:
              formatCurrency(
                newDestinationBalance
              ),

            description,

            reference:
              cleanReference,

            transferType:
              'same_bank',

            direction:
              'received',

            senderName,

            senderAccountNumber:
              finalSourceAccount.account_number
          }
        );
      } catch (notificationError) {
        console.error(
          'Recipient notification failed:',
          notificationError
        );
      }
    });

    return;

  } catch (error) {
    console.error(
      'Verify PIN Error:',
      error
    );

    next(error);
  }
};

// ============================================================
// TRANSACTION HISTORY
// ============================================================

const getTransactionHistory = async (
  req,
  res,
  next
) => {
  try {
    const {
      accountId
    } = req.params;

    const {
      limit = 50,
      offset = 0
    } = req.query;

    const parsedLimit =
      Math.min(
        Math.max(
          parseInt(limit, 10) || 50,
          1
        ),
        100
      );

    const parsedOffset =
      Math.max(
        parseInt(offset, 10) || 0,
        0
      );

    const {
      data: account,
      error: accountError
    } = await supabase
      .from('accounts')
      .select('id')
      .eq(
        'id',
        accountId
      )
      .eq(
        'user_id',
        req.user.id
      )
      .maybeSingle();

    if (accountError) {
      throw accountError;
    }

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found.'
      });
    }

    const {
      data: transactions,
      error: txError
    } = await supabase
      .from('transactions')
      .select('*')
      .eq(
        'account_id',
        accountId
      )
      .order(
        'created_at',
        {
          ascending: false
        }
      )
      .range(
        parsedOffset,
        parsedOffset +
          parsedLimit -
          1
      );

    if (txError) {
      throw txError;
    }

    const {
      count,
      error: countError
    } = await supabase
      .from('transactions')
      .select(
        '*',
        {
          count:
            'exact',
          head:
            true
        }
      )
      .eq(
        'account_id',
        accountId
      );

    if (countError) {
      throw countError;
    }

    return res.json({
      success:
        true,

      transactions:
        transactions || [],

      pagination: {
        total:
          count || 0,

        limit:
          parsedLimit,

        offset:
          parsedOffset
      }
    });

  } catch (error) {
    console.error(
      'Get Transaction History Error:',
      error
    );

    next(error);
  }
};

// ============================================================
// GET TRANSACTION BY REFERENCE
// PUBLIC RECEIPT ENDPOINT
// ============================================================

const getTransactionByReference = async (
  req,
  res,
  next
) => {
  try {
    const {
      referenceId
    } = req.params;

    if (
      !referenceId ||
      referenceId.trim() === ''
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Reference ID is required.'
      });
    }

    const {
      data: transaction,
      error
    } = await supabase
      .from('transactions')
      .select(`
        id,
        account_id,
        transaction_type,
        amount,
        description,
        reference_id,
        counterparty_account,
        status,
        created_at,
        metadata,
        accounts:account_id(
          id,
          account_number,
          user_id
        )
      `)
      .eq(
        'reference_id',
        referenceId.trim()
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error:
          'Transaction not found with this reference.'
      });
    }

    let metadata =
      transaction.metadata || {};

    if (
      typeof metadata ===
      'string'
    ) {
      try {
        metadata =
          JSON.parse(metadata);
      } catch {
        metadata = {};
      }
    }

    return res.json({
      success:
        true,

      transaction: {
        id:
          transaction.id,

        transaction_type:
          transaction.transaction_type,

        amount:
          parseFloat(
            transaction.amount
          ) || 0,

        description:
          transaction.description,

        reference_id:
          transaction.reference_id,

        status:
          transaction.status,

        created_at:
          transaction.created_at,

        metadata
      }
    });

  } catch (error) {
    console.error(
      'Get Transaction By Reference Error:',
      error
    );

    return res.status(500).json({
      success:
        false,

      error:
        error.message ||
        'Failed to fetch transaction.'
    });
  }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  initiateTransfer,
  verifyOtpAndComplete,
  verifyPinAndComplete,
  getTransactionHistory,
  getTransactionByReference
};