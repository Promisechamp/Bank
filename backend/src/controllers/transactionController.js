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
// METADATA ENRICHMENT HELPERS
//
// When a transaction was created BEFORE swift_code/routing_number
// started being persisted into metadata, we fall back to looking
// up the actual account records at read time so the receipt and
// history still render the correct banking codes.
// ============================================================

const parseMetadata = (raw) => {
  if (!raw) return {};

  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  return raw;
};

/**
 * Given the two accounts associated with a transaction (the row's
 * own account + the counterparty), fill in any missing banking
 * codes in the metadata object.
 *
 * Sender vs recipient is decided by `fromAccountId` / `toAccountId`
 * stored in metadata — those are IDENTICAL on both the sender's
 * row and the recipient's row, unlike account_id / counterparty,
 * which swap sides between the two copies.
 *
 * For direct credit/debit (admin credit / admin debit) with no
 * explicit from/to, we infer:
 *   - credit → the row's own account IS the recipient
 *   - debit  → the row's own account IS the sender
 */
const enrichMetadataFromAccounts = (
  metadata,
  sourceAccount,
  counterpartyAccount,
  fromAccountId = null,
  toAccountId = null
) => {
  const base = parseMetadata(metadata);

  // Fall back to metadata's own from/to if caller didn't pass any
  const resolvedFrom =
    fromAccountId || base.fromAccountId || null;

  const resolvedTo =
    toAccountId || base.toAccountId || null;

  let senderAccount = null;
  let recipientAccount = null;

  if (resolvedFrom) {
    if (
      sourceAccount &&
      String(sourceAccount.id) === String(resolvedFrom)
    ) {
      senderAccount = sourceAccount;
    } else if (
      counterpartyAccount &&
      String(counterpartyAccount.id) === String(resolvedFrom)
    ) {
      senderAccount = counterpartyAccount;
    }
  }

  if (resolvedTo) {
    if (
      sourceAccount &&
      String(sourceAccount.id) === String(resolvedTo)
    ) {
      recipientAccount = sourceAccount;
    } else if (
      counterpartyAccount &&
      String(counterpartyAccount.id) === String(resolvedTo)
    ) {
      recipientAccount = counterpartyAccount;
    }
  }

  // If we still don't know who's who (direct credit/debit without
  // explicit from/to), infer from the transaction's own account.
  if (!senderAccount && !recipientAccount) {
    const rawType = String(
      base.transaction_type || ''
    ).toLowerCase();

    if (rawType === 'credit') {
      recipientAccount = sourceAccount || null;
    } else if (rawType === 'debit') {
      senderAccount = sourceAccount || null;
    }
  }

  return {
    ...base,

    /* Sender banking codes */
    senderSwiftCode:
      base.senderSwiftCode ||
      senderAccount?.swift_code ||
      null,

    senderRoutingNumber:
      base.senderRoutingNumber ||
      senderAccount?.routing_number ||
      null,

    senderAccountType:
      base.senderAccountType ||
      senderAccount?.account_type ||
      null,

    /* Recipient banking codes */
    recipientSwiftCode:
      base.recipientSwiftCode ||
      recipientAccount?.swift_code ||
      null,

    recipientRoutingNumber:
      base.recipientRoutingNumber ||
      recipientAccount?.routing_number ||
      null,

    recipientAccountType:
      base.recipientAccountType ||
      recipientAccount?.account_type ||
      null,

    /*
     * Generic fallbacks — the receipt's "Recipient banking
     * details" section reads these. They must ALWAYS point at
     * the RECIPIENT, never the sender.
     */
    swiftCode:
      base.swiftCode ||
      base.swift_code ||
      recipientAccount?.swift_code ||
      null,

    routingNumber:
      base.routingNumber ||
      base.routing_number ||
      recipientAccount?.routing_number ||
      null,

    accountType:
      base.accountType ||
      base.account_type ||
      recipientAccount?.account_type ||
      null,

    accountNumber:
      base.accountNumber ||
      base.account_number ||
      recipientAccount?.account_number ||
      null,

    accountHolder:
      base.accountHolder ||
      base.account_holder ||
      recipientAccount?.profiles?.full_name ||
      null
  };
};

/**
 * Determine credit / debit from a transaction row + its metadata.
 */
const resolveDirection = (transaction, metadata) => {
  const rawType = String(
    transaction.transaction_type || ''
  ).toLowerCase();

  const direction = String(
    metadata?.direction || ''
  ).toLowerCase();

  const isTransfer = rawType === 'transfer';

  const isCredit =
    rawType === 'credit' ||
    (isTransfer &&
      (direction === 'credit' ||
        direction === 'received'));

  const isDebit =
    rawType === 'debit' ||
    (isTransfer &&
      (direction === 'debit' ||
        direction === 'sent'));

  return { isCredit, isDebit };
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
        swift_code,
        routing_number,
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
        swift_code,
        routing_number,
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

      recipientAccountType:
        recipient.account_type || null,

      recipientSwiftCode:
        recipient.swift_code || null,

      recipientRoutingNumber:
        recipient.routing_number || null,

      senderName,

      senderAccountNumber:
        sourceAccount.account_number,

      senderAccountId:
        sourceAccount.id,

      senderBank,

      senderAccountType:
        sourceAccount.account_type || null,

      senderSwiftCode:
        sourceAccount.swift_code || null,

      senderRoutingNumber:
        sourceAccount.routing_number || null,

      accountType:
        recipient.account_type || null,

      swiftCode:
        recipient.swift_code || null,

      routingNumber:
        recipient.routing_number || null,

      accountNumber:
        recipient.account_number || null,

      accountHolder:
        confirmedRecipientName || null,

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

    const otp =
      Math.floor(
        100000 +
        Math.random() * 900000
      ).toString();

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
      await supabase
        .from('transactions')
        .delete()
        .eq(
          'id',
          pendingTransaction.id
        );

      throw otpError;
    }

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
        12000,
        'OTP email delivery timed out'
      );
    } catch (emailError) {
      console.error('OTP email failed:', emailError);

      await supabase
        .from('otp_verifications')
        .delete()
        .eq('reference', reference);

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

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

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

    if (otpRecord.verified) {
      return res.status(400).json({
        success: false,
        error:
          'This verification code has already been used.'
      });
    }

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

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

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

    const attempts =
      Number(metadata.pinAttempts || 0);

    if (attempts >= MAX_PIN_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        error:
          'Too many incorrect PIN attempts. Please try again later or contact support.'
      });
    }

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

// ============================================================
// TRANSACTION HISTORY
// ============================================================

// ============================================================
// TRANSACTION HISTORY
// ============================================================

const getTransactionHistory = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const { accountId } = req.params;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'Account ID is required.'
      });
    }

    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      100
    );

    const offset = Math.max(
      parseInt(req.query.offset, 10) || 0,
      0
    );

    // ============================================================
    // VERIFY ACCOUNT BELONGS TO CURRENT USER
    // ============================================================

    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, user_id')
      .eq('id', accountId)
      .maybeSingle();

    if (accountError) {
      console.error(
        '[getTransactionHistory] Account lookup error:',
        accountError
      );

      return res.status(500).json({
        success: false,
        message: 'Failed to verify account.'
      });
    }

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.'
      });
    }

    if (String(account.user_id) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this account.'
      });
    }

    // ============================================================
    // FETCH ALL ROWS THE VIEWER COULD SEE
    //
    // We fetch BOTH sides (own rows + counterparty rows). Then we
    // deduplicate in memory: prefer the viewer's own row when it
    // exists, and fall back to the counterparty's row for legacy
    // transfers that never got a -CR copy.
    //
    // Pagination is applied AFTER dedup, so we need to pull a bit
    // more than the caller asked for.
    // ============================================================

    const fetchLimit = Math.min(
      (offset + limit) * 2 + 50,
      5000
    );

    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .or(
        `account_id.eq.${accountId},counterparty_account.eq.${accountId}`
      )
      .order('created_at', { ascending: false })
      .range(0, fetchLimit - 1);

    if (transactionError) {
      console.error(
        '[getTransactionHistory] Transaction lookup error:',
        transactionError
      );

      return res.status(500).json({
        success: false,
        message: 'Failed to fetch transaction history.'
      });
    }

    const allRows = transactions || [];

    // ============================================================
    // BUILD SET OF -CR REFERENCES OWNED BY VIEWER
    // ============================================================

    const viewerOwnedCRRefs = new Set();

    allRows.forEach((tx) => {
      const ref = String(tx.reference_id || '');

      if (
        String(tx.account_id) === String(accountId) &&
        ref.endsWith('-CR')
      ) {
        viewerOwnedCRRefs.add(ref.slice(0, -3));
      }
    });

    // ============================================================
    // FILTER: PICK THE VIEWER'S COPY OF EACH TRANSACTION
    //
    //   - Own rows (account_id = viewer) → always keep
    //   - Counterparty -CR rows          → drop (their copy)
    //   - Counterparty regular rows      → keep ONLY when the
    //                                      viewer has no -CR copy
    //                                      (legacy transfers)
    // ============================================================

    const visibleRows = allRows.filter((tx) => {
      const isOwn =
        String(tx.account_id) === String(accountId);

      if (isOwn) return true;

      const ref = String(tx.reference_id || '');

      if (ref.endsWith('-CR')) {
        // Another party's own copy — never show it to the viewer
        return false;
      }

      // Legacy: sender's row, viewer is the counterparty.
      // If viewer has their own -CR for the same transfer,
      // skip this row (their copy will be shown).
      if (viewerOwnedCRRefs.has(ref)) {
        return false;
      }

      return true;
    });

    // ============================================================
    // PAGINATE AFTER DEDUP
    // ============================================================

    const total = visibleRows.length;

    const paginatedRows = visibleRows.slice(
      offset,
      offset + limit
    );

    // ============================================================
    // BULK-FETCH RELATED ACCOUNTS
    // ============================================================

    const relatedAccountIds = new Set();

    paginatedRows.forEach((tx) => {
      if (tx.account_id) relatedAccountIds.add(String(tx.account_id));
      if (tx.counterparty_account)
        relatedAccountIds.add(String(tx.counterparty_account));
    });

    let accountsMap = new Map();

    if (relatedAccountIds.size > 0) {
      const { data: relatedAccounts, error: relatedError } =
        await supabase
          .from('accounts')
          .select(`
            id,
            account_number,
            account_type,
            swift_code,
            routing_number,
            user_id,
            profiles!user_id(
              full_name,
              email
            )
          `)
          .in('id', Array.from(relatedAccountIds));

      if (relatedError) {
        console.error(
          '[getTransactionHistory] Related accounts lookup error:',
          relatedError
        );
      }

      accountsMap = new Map(
        (relatedAccounts || []).map((a) => [String(a.id), a])
      );
    }

    // ============================================================
    // RESOLVE VIEWER DIRECTION
    //
    // Priority:
    //   1. transaction_type 'credit' / 'debit' → if it's the
    //      viewer's own row, use the type; if it's the
    //      counterparty's row, flip it.
    //   2. metadata.fromAccountId / toAccountId
    //   3. metadata.direction
    //   4. Fallback → debit
    // ============================================================

    const resolveViewerDirection = (tx) => {
      const meta = parseMetadata(tx.metadata);

      const isOwn =
        String(tx.account_id) === String(accountId);

      const rawType = String(
        tx.transaction_type || ''
      ).toLowerCase();

      const fromId =
        meta.fromAccountId ||
        meta.from_account_id ||
        meta.senderAccountId ||
        meta.sender_account_id ||
        null;

      const toId =
        meta.toAccountId ||
        meta.to_account_id ||
        meta.recipientAccountId ||
        meta.recipient_account_id ||
        null;

      // ---- Direct credit / debit ----
      if (rawType === 'credit' || rawType === 'debit') {
        if (isOwn) {
          return rawType;
        }

        // Counterparty's row → flip
        return rawType === 'credit' ? 'debit' : 'credit';
      }

      // ---- Transfer ----
      if (rawType === 'transfer') {
        if (
          fromId &&
          String(fromId) === String(accountId)
        ) {
          return 'debit';
        }

        if (
          toId &&
          String(toId) === String(accountId)
        ) {
          return 'credit';
        }

        // No explicit from/to — fall back to metadata.direction.
        // metadata.direction is the SENDER's perspective, so if
        // the viewer is not the sender, flip it.
        const dir = String(meta.direction || '').toLowerCase();

        const senderFacingDebit =
          dir === 'debit' || dir === 'sent';

        if (isOwn) {
          return senderFacingDebit ? 'debit' : 'credit';
        }

        // Counterparty's row → flip
        return senderFacingDebit ? 'credit' : 'debit';
      }

      // Unknown type — default to debit
      return 'debit';
    };

    // ============================================================
    // FORMAT
    // ============================================================

    const formattedTransactions = paginatedRows.map((transaction) => {
      const viewerDirection = resolveViewerDirection(transaction);

      const parsedMeta = parseMetadata(transaction.metadata);

      const fromId =
        parsedMeta.fromAccountId ||
        parsedMeta.from_account_id ||
        null;

      const toId =
        parsedMeta.toAccountId ||
        parsedMeta.to_account_id ||
        null;

      const enrichFrom =
        fromId ||
        (viewerDirection === 'debit'
          ? transaction.account_id
          : transaction.counterparty_account) ||
        null;

      const enrichTo =
        toId ||
        (viewerDirection === 'credit'
          ? transaction.account_id
          : transaction.counterparty_account) ||
        null;

      const sourceAccount = accountsMap.get(
        String(transaction.account_id)
      );

      const counterpartyAccount = accountsMap.get(
        String(transaction.counterparty_account)
      );

      const enrichedMetadata = enrichMetadataFromAccounts(
        parsedMeta,
        sourceAccount,
        counterpartyAccount,
        enrichFrom,
        enrichTo
      );

      return {
        ...transaction,

        // Legacy UI hints
        direction:
          viewerDirection === 'credit' ? 'received' : 'sent',

        // Canonical 'credit' / 'debit' — the list uses this
        transaction_type: viewerDirection,

        // Matches what the receipt endpoint returns
        viewer_direction: viewerDirection,

        metadata: enrichedMetadata,

        account: sourceAccount || null,
        counterparty: counterpartyAccount || null
      };
    });

    // ============================================================
    // RESPONSE
    // ============================================================

    return res.status(200).json({
      success: true,
      transactions: formattedTransactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + formattedTransactions.length < total
      }
    });
  } catch (error) {
    console.error(
      '[getTransactionHistory] Unexpected error:',
      error
    );

    return next(error);
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
    const { referenceId } = req.params;

    if (!referenceId || referenceId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Reference ID is required.'
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
          account_type,
          swift_code,
          routing_number,
          user_id,
          profiles!user_id(
            full_name,
            email
          )
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

    let counterpartyAccount = null;

    if (transaction.counterparty_account) {
      const { data: cp, error: cpError } = await supabase
        .from('accounts')
        .select(`
          id,
          account_number,
          account_type,
          swift_code,
          routing_number,
          user_id,
          profiles!user_id(
            full_name,
            email
          )
        `)
        .eq('id', transaction.counterparty_account)
        .maybeSingle();

      if (cpError) {
        console.error(
          '[getTransactionByReference] Counterparty lookup error:',
          cpError
        );
      }

      counterpartyAccount = cp || null;
    }

    const parsedMetadata = parseMetadata(transaction.metadata);

    const rawType = String(
      transaction.transaction_type || ''
    ).toLowerCase();

    // --------------------------------------------------------
    // ✅ RESOLVE EFFECTIVE FROM / TO ACCOUNT IDS
    //
    // metadata.fromAccountId / toAccountId are consistent across
    // BOTH the sender's row and the recipient's row.
    //
    // For direct credit / debit there is no explicit from/to,
    // so we infer:
    //   credit → the credited account IS the recipient
    //   debit  → the debited account IS the sender
    // --------------------------------------------------------

    let effectiveFromAccountId =
      parsedMetadata.fromAccountId || null;

    let effectiveToAccountId =
      parsedMetadata.toAccountId || null;

    if (!effectiveFromAccountId && !effectiveToAccountId) {
      if (rawType === 'credit') {
        effectiveToAccountId = transaction.account_id;
      } else if (rawType === 'debit') {
        effectiveFromAccountId = transaction.account_id;
      }
    }

    // --------------------------------------------------------
    // ✅ DETERMINE VIEWER DIRECTION
    //
    // Compare the viewer against the from/to account owners —
    // NOT against account_id / counterparty_account, because
    // those swap sides between the two copies of a transfer.
    // --------------------------------------------------------

    let viewerDirection = null;

    const viewerUserId = req.user?.id;

    if (viewerUserId) {
      const sourceUserId = transaction.accounts?.user_id;
      const counterpartyUserId = counterpartyAccount?.user_id;

      let viewerIsSender = false;
      let viewerIsReceiver = false;

      if (effectiveFromAccountId) {
        if (
          String(transaction.accounts?.id) ===
            String(effectiveFromAccountId) &&
          String(sourceUserId) === String(viewerUserId)
        ) {
          viewerIsSender = true;
        } else if (
          String(counterpartyAccount?.id) ===
            String(effectiveFromAccountId) &&
          String(counterpartyUserId) === String(viewerUserId)
        ) {
          viewerIsSender = true;
        }
      }

      if (effectiveToAccountId) {
        if (
          String(transaction.accounts?.id) ===
            String(effectiveToAccountId) &&
          String(sourceUserId) === String(viewerUserId)
        ) {
          viewerIsReceiver = true;
        } else if (
          String(counterpartyAccount?.id) ===
            String(effectiveToAccountId) &&
          String(counterpartyUserId) === String(viewerUserId)
        ) {
          viewerIsReceiver = true;
        }
      }

      if (viewerIsSender) {
        viewerDirection = 'debit';
      } else if (viewerIsReceiver) {
        viewerDirection = 'credit';
      }
    }

    // --------------------------------------------------------
    // ENRICH METADATA
    // --------------------------------------------------------

    const enrichedMetadata = enrichMetadataFromAccounts(
      parsedMetadata,
      transaction.accounts || null,
      counterpartyAccount,
      effectiveFromAccountId,
      effectiveToAccountId
    );

    return res.json({
      success: true,

      transaction: {
        id: transaction.id,

        transaction_type:
          transaction.transaction_type,

        amount:
          parseFloat(transaction.amount) || 0,

        description:
          transaction.description,

        reference_id:
          transaction.reference_id,

        status:
          transaction.status,

        created_at:
          transaction.created_at,

        viewer_direction: viewerDirection,

        metadata: enrichedMetadata,

        accounts: transaction.accounts || null,

        counterparty_account_details: counterpartyAccount
      }
    });

  } catch (error) {
    console.error(
      'Get Transaction By Reference Error:',
      error
    );

    return res.status(500).json({
      success: false,

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