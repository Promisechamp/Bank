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
// SMALL SERVER-SIDE DELAY
// ============================================================

const delay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

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
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

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
          alt="Trustybank"
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
          A transfer has been initiated from your Trustybank account.
          Enter the verification code below to continue.
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
          verification code and contact Trustybank immediately.
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
          This is an automated message from Trustybank.
          Please do not reply to this email.
        </p>

      </div>

    </div>

  </div>

</body>
</html>
  `;

  await sendEmail({
    to: toEmail,
    subject: 'Trustybank — Transaction Verification Code',
    html
  });
};

// ============================================================
// INITIATE SAME-BANK TRANSFER
// ============================================================

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
      recipientName
    } = req.body;

    // --------------------------------------------------------
    // VALIDATE AMOUNT
    // --------------------------------------------------------

    if (!validateAmount(amount)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transfer amount.'
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
        *,
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
    // CHECK ACCOUNT RESTRICTION
    // --------------------------------------------------------

    const accountStatus =
      String(sourceAccount.status || '').toLowerCase();

    const profileStatus =
      String(sourceAccount.profiles?.status || '').toLowerCase();

    const senderRestricted =
      ['frozen', 'banned'].includes(accountStatus) ||
      ['frozen', 'banned'].includes(profileStatus);

    // --------------------------------------------------------
    // CHECK BALANCE
    // --------------------------------------------------------

    if (Number(sourceAccount.balance) < Number(amount)) {
      return res.status(400).json({
        success: false,
        error:
          `Insufficient funds. Available: ${formatCurrency(
            sourceAccount.balance
          )}`
      });
    }

    // --------------------------------------------------------
    // VALIDATE RECIPIENT ACCOUNT
    // --------------------------------------------------------

    if (!recipientAccountNumber) {
      return res.status(400).json({
        success: false,
        error: 'Recipient account number is required.'
      });
    }

    const {
      data: recipient,
      error: recipientError
    } = await supabase
      .from('accounts')
      .select(`
        *,
        profiles!user_id(
          full_name,
          email
        )
      `)
      .eq('account_number', recipientAccountNumber)
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
    // SAME ACCOUNT CHECK
    // --------------------------------------------------------

    if (recipient.id === sourceAccount.id) {
      return res.status(400).json({
        success: false,
        error: 'You cannot transfer money to the same account.'
      });
    }

    // --------------------------------------------------------
    // VERIFY RECIPIENT NAME
    // --------------------------------------------------------

    if (
      recipientName &&
      recipient.profiles?.full_name &&
      recipientName.trim().toLowerCase() !==
        recipient.profiles.full_name.trim().toLowerCase()
    ) {
      return res.status(400).json({
        success: false,
        error: 'Recipient name does not match the account.'
      });
    }

    const confirmedRecipientName =
      recipient.profiles?.full_name ||
      recipientName ||
      'Recipient';

    // --------------------------------------------------------
    // GENERATE REFERENCE + OTP
    // --------------------------------------------------------

    const reference = generateReference();

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const transferDescription =
      description || 'Same bank transfer';

    // --------------------------------------------------------
    // SENDER INFO (for metadata)
    // --------------------------------------------------------

    const senderName =
      sourceAccount.profiles?.full_name || 'User';

    const senderBank =
      sourceAccount.bank_name || 'Trustycdu bank';

    // --------------------------------------------------------
    // CREATE PENDING TRANSACTION
    // --------------------------------------------------------

    const {
      error: transactionError
    } = await supabase
      .from('transactions')
      .insert([{
        account_id: sourceAccount.id,
        transaction_type: 'transfer',
        amount,
        description: transferDescription,
        reference_id: reference,
        counterparty_account: recipient.id,
        status: 'pending_review',

        metadata: {
										transferType: 'same_bank',
										direction: 'debit',
								
										// Canonical for Receipt.jsx
										receiverName: confirmedRecipientName,
										receiverBank: 'Trustycdu bank',
										receiverAccountNo: recipient.account_number,
								
										// Kept for backward compatibility
										recipientAccountNumber,
										recipientName: confirmedRecipientName,
										recipientAccountId: recipient.id,
								
										// Sender info (used for display on recipient's receipt)
										senderName,
										senderAccountNumber: sourceAccount.account_number,
										senderBank,
								
										paymentMethod: 'Bank Transfer',
										channel: 'Online Banking',
								
										senderRestricted,
										otpRequired: true
								}
      }]);

    if (transactionError) {
      throw transactionError;
    }

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
        user_id: req.user.id,
        verified: false,

        expires_at:
          new Date(
            Date.now() + 10 * 60 * 1000
          ).toISOString(),

        data: {
          fromAccountId: sourceAccount.id,
          toAccountId: recipient.id,

          amount,

          description: transferDescription,

          recipientAccountNumber,
          recipientName: confirmedRecipientName
        }
      });

    if (otpError) {
      throw otpError;
    }

    // --------------------------------------------------------
    // SEND OTP EMAIL
    // --------------------------------------------------------

    const senderEmail =
      req.user.email ||
      sourceAccount.profiles?.email;

    if (senderEmail) {
      await sendOtpEmail(
        senderEmail,
        otp,
        reference,
        amount,
        confirmedRecipientName
      );
    } else {
      console.warn(
        'No sender email available. OTP email was not sent.'
      );
    }

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.json({
      success: true,
      requiresOtp: true,
      reference,
      status: 'pending_review',

      recipient: {
        accountNumber: recipient.account_number,
        name: confirmedRecipientName
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

const verifyOtpAndComplete = async (req, res, next) => {
  try {
    const {
      reference,
      otp
    } = req.body;

    // --------------------------------------------------------
    // VALIDATE INPUT
    // --------------------------------------------------------

    if (!reference || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Reference and OTP are required.'
      });
    }

    // --------------------------------------------------------
    // GET OTP
    // --------------------------------------------------------

    const {
      data: otpRecord,
      error: otpError
    } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('reference', reference)
      .eq('user_id', req.user.id)
      .single();

    if (otpError) {
      if (otpError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Invalid transaction reference.'
        });
      }

      throw otpError;
    }

    // --------------------------------------------------------
    // OTP ALREADY USED
    // --------------------------------------------------------

    if (otpRecord.verified) {
      return res.status(400).json({
        success: false,
        error: 'This verification code has already been used.'
      });
    }

    // --------------------------------------------------------
    // OTP EXPIRED
    // --------------------------------------------------------

    if (
      new Date(otpRecord.expires_at) <
      new Date()
    ) {
      return res.status(400).json({
        success: false,
        error: 'This verification code has expired.'
      });
    }

    // --------------------------------------------------------
    // OTP MATCH
    // --------------------------------------------------------

    if (
      String(otpRecord.otp) !==
      String(otp)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code.'
      });
    }

    const transferData = otpRecord.data || {};

    // --------------------------------------------------------
    // GET PENDING TRANSACTION
    // --------------------------------------------------------

    const {
      data: transaction,
      error: transactionError
    } = await supabase
      .from('transactions')
      .select('*')
      .eq('reference_id', reference)
      .eq('account_id', transferData.fromAccountId)
      .single();

    if (transactionError) {
      if (transactionError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Transaction record not found.'
        });
      }

      throw transactionError;
    }

    if (transaction.status !== 'pending_review') {
      return res.status(400).json({
        success: false,
        error: 'This transaction has already been processed.'
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
        *,
        profiles!user_id(
          status,
          email,
          full_name
        )
      `)
      .eq('id', transferData.fromAccountId)
      .eq('user_id', req.user.id)
      .single();

    if (sourceError) {
      throw sourceError;
    }

    // --------------------------------------------------------
    // CHECK CURRENT RESTRICTION
    // --------------------------------------------------------

    const accountStatus =
      String(sourceAccount.status || '').toLowerCase();

    const profileStatus =
      String(sourceAccount.profiles?.status || '').toLowerCase();

    const senderRestricted =
      ['frozen', 'banned'].includes(accountStatus) ||
      ['frozen', 'banned'].includes(profileStatus);

    // ========================================================
    // RESTRICTED ACCOUNT
    // ========================================================

    if (senderRestricted) {

      // Mark OTP verified
      const {
        error: verifyError
      } = await supabase
        .from('otp_verifications')
        .update({
          verified: true
        })
        .eq('reference', reference)
        .eq('user_id', req.user.id);

      if (verifyError) {
        throw verifyError;
      }

      // Keep transaction pending
      const {
        error: reviewError
      } = await supabase
        .from('transactions')
        .update({
          status: 'pending_review',

          metadata: {
            ...(transaction.metadata || {}),

            senderRestricted: true,

            restrictionStatus:
              accountStatus === 'banned'
                ? 'banned'
                : 'frozen',

            otpVerified: true,

            reviewSubmittedAt:
              new Date().toISOString()
          }
        })
        .eq('id', transaction.id)
        .eq('status', 'pending_review');

      if (reviewError) {
        throw reviewError;
      }

      // ------------------------------------------------------
      // IN-APP ONLY
      // ------------------------------------------------------

      const io = req.app.get('io');

      await createAndSendNotification(
        io,
        req.user.id,
        'system',
        'Transfer Pending Review',
        `Your transfer of ${formatCurrency(
          transferData.amount
        )} is pending bank review due to account restrictions.`,
        reference
      );

      return res.json({
        success: true,
        reference,
        status: 'pending_review',

        message:
          'OTP verified. Transfer has been submitted for bank review.'
      });
    }

    // ========================================================
    // ACTIVE / UNRESTRICTED ACCOUNT
    // ========================================================

    // --------------------------------------------------------
    // CHECK BALANCE AGAIN
    // --------------------------------------------------------

    if (
      Number(sourceAccount.balance) <
      Number(transferData.amount)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient funds to complete this transfer.'
      });
    }

    // --------------------------------------------------------
    // GET DESTINATION ACCOUNT
    // --------------------------------------------------------

    const {
      data: destination,
      error: destinationError
    } = await supabase
      .from('accounts')
      .select(`
        *,
        profiles!user_id(
          full_name,
          email
        )
      `)
      .eq('id', transferData.toAccountId)
      .eq('status', 'active')
      .single();

    if (destinationError) {
      if (destinationError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Recipient account is no longer available.'
        });
      }

      throw destinationError;
    }

    // --------------------------------------------------------
    // DELAY
    // --------------------------------------------------------

    await delay(1000);

    // --------------------------------------------------------
    // CALCULATE BALANCES
    // --------------------------------------------------------

    const amount =
      Number(transferData.amount);

    const newSourceBalance =
      Number(sourceAccount.balance) -
      amount;

    const newDestinationBalance =
      Number(destination.balance) +
      amount;

    const senderName =
      sourceAccount.profiles?.full_name ||
      'User';

    const recipientName =
      destination.profiles?.full_name ||
      transferData.recipientName ||
      'Recipient';

    const description =
      transferData.description ||
      'Same bank transfer';

    // ========================================================
    // DEBIT SOURCE
    // ========================================================

    const {
      error: debitError
    } = await supabase
      .from('accounts')
      .update({
        balance: newSourceBalance
      })
      .eq('id', sourceAccount.id);

    if (debitError) {
      throw debitError;
    }

    // ========================================================
    // CREDIT DESTINATION
    // ========================================================

    const {
      error: creditError
    } = await supabase
      .from('accounts')
      .update({
        balance: newDestinationBalance
      })
      .eq('id', destination.id);

    if (creditError) {

      // Restore source balance
      await supabase
        .from('accounts')
        .update({
          balance: sourceAccount.balance
        })
        .eq('id', sourceAccount.id);

      throw creditError;
    }

    // ========================================================
    // MARK OTP VERIFIED
    // ========================================================

    const {
      error: verifyError
    } = await supabase
      .from('otp_verifications')
      .update({
        verified: true
      })
      .eq('reference', reference)
      .eq('user_id', req.user.id);

    if (verifyError) {
      throw verifyError;
    }

    // ========================================================
    // COMPLETE SENDER TRANSACTION
    // ========================================================

    const {
      error: senderTransactionError
    } = await supabase
      .from('transactions')
      .update({
        status: 'completed',

        metadata: {
          ...(transaction.metadata || {}),

          transferType: 'same_bank',
          direction: 'debit',

          otpVerified: true,

          completedAt:
            new Date().toISOString()
        }
      })
      .eq('id', transaction.id)
      .eq('status', 'pending_review');

    if (senderTransactionError) {
      throw senderTransactionError;
    }

    // ========================================================
    // CREATE RECIPIENT TRANSACTION
    // ========================================================

    const recipientReference =
      `${reference}-CR`;

    const {
      error: recipientTransactionError
    } = await supabase
      .from('transactions')
      .insert([{
        account_id: destination.id,

        transaction_type: 'transfer',

        amount,

        description,

        reference_id: recipientReference,

        counterparty_account:
          sourceAccount.id,

        status: 'completed',

        metadata: {
          transferType: 'same_bank',

          transferReference: reference,

          direction: 'credit',

          fromAccountId:
            sourceAccount.id,

          senderName,

          senderAccountNumber:
            sourceAccount.account_number
        }
      }]);

    if (recipientTransactionError) {
      throw recipientTransactionError;
    }

    // ========================================================
    // SEND EMAIL + IN-APP NOTIFICATIONS
    // ========================================================

    const io = req.app.get('io');

    // --------------------------------------------------------
    // SENDER
    // debitEmail template
    // --------------------------------------------------------

    await createAndSendNotification(
      io,

      sourceAccount.user_id,

      'debit',

      `Transfer Debited – ${formatCurrency(amount)}`,

      `You transferred ${formatCurrency(
        amount
      )} to ${recipientName}.`,

      reference,

      {
        userName: senderName,

        userEmail:
          sourceAccount.profiles?.email ||
          req.user.email,

        accountNumber:
          sourceAccount.account_number,

        amount:
          formatCurrency(amount),

        newBalance:
          formatCurrency(newSourceBalance),

        description,

        reference,

        transferType: 'same_bank',

        direction: 'sent',

        recipientName,

        recipientAccountNumber:
          destination.account_number
      }
    );

    // --------------------------------------------------------
    // RECIPIENT
    // creditEmail template
    // --------------------------------------------------------

    await createAndSendNotification(
      io,

      destination.user_id,

      'credit',

      `Transfer Credited – ${formatCurrency(amount)}`,

      `You received ${formatCurrency(
        amount
      )} from ${senderName}.`,

      reference,

      {
        userName: recipientName,

        userEmail:
          destination.profiles?.email,

        accountNumber:
          destination.account_number,

        amount:
          formatCurrency(amount),

        newBalance:
          formatCurrency(newDestinationBalance),

        description,

        reference,

        transferType: 'same_bank',

        direction: 'received',

        senderName,

        senderAccountNumber:
          sourceAccount.account_number
      }
    );

    // ========================================================
    // SUCCESS
    // ========================================================

    return res.json({
      success: true,

      reference,

      status: 'completed',

      message:
        'Transfer completed successfully.',

      from_account: {
        id: sourceAccount.id,
        new_balance: newSourceBalance
      },

      to_account: {
        id: destination.id,
        new_balance: newDestinationBalance
      }
    });

  } catch (error) {

    console.error(
      'Verify OTP Error:',
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

    // --------------------------------------------------------
    // VERIFY ACCOUNT OWNERSHIP
    // --------------------------------------------------------

    const {
      data: account,
      error: accountError
    } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (accountError) {

      if (
        accountError.code ===
        'PGRST116'
      ) {
        return res.status(404).json({
          success: false,
          error: 'Account not found'
        });
      }

      throw accountError;
    }

    // --------------------------------------------------------
    // GET TRANSACTIONS
    // --------------------------------------------------------

    const {
      data: transactions,
      error: txError
    } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', {
        ascending: false
      })
      .range(
        parseInt(offset),
        parseInt(offset) +
          parseInt(limit) -
          1
      );

    if (txError) {
      throw txError;
    }

    // --------------------------------------------------------
    // COUNT
    // --------------------------------------------------------

    const {
      count,
      error: countError
    } = await supabase
      .from('transactions')
      .select('*', {
        count: 'exact',
        head: true
      })
      .eq('account_id', accountId);

    if (countError) {
      throw countError;
    }

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.json({
      success: true,

      transactions,

      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset)
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

    console.log(
      'Looking for transaction with reference:',
      referenceId
    );

    // --------------------------------------------------------
    // VALIDATE REFERENCE
    // --------------------------------------------------------

    if (
      !referenceId ||
      referenceId.trim() === ''
    ) {
      return res.status(400).json({
        success: false,
        error: 'Reference ID is required'
      });
    }

    // --------------------------------------------------------
    // QUERY TRANSACTION
    // --------------------------------------------------------

    const {
      data: transaction,
      error
    } = await supabase
      .from('transactions')
      .select(`
        *,
        accounts:account_id (
          id,
          account_number,
          user_id,
          profiles:user_id (
            id,
            full_name,
            email,
            phone
          )
        )
      `)
      .eq(
        'reference_id',
        referenceId
      )
      .single();

    // --------------------------------------------------------
    // DATABASE ERROR
    // --------------------------------------------------------

    if (error) {

      console.error(
        'Supabase error:',
        error
      );

      if (
        error.code ===
        'PGRST116'
      ) {
        return res.status(404).json({
          success: false,
          error:
            'Transaction not found with this reference'
        });
      }

      return res.status(500).json({
        success: false,
        error:
          'Database error occurred while fetching transaction'
      });
    }

    // --------------------------------------------------------
    // NOT FOUND
    // --------------------------------------------------------

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    console.log(
      'Transaction found:',
      transaction.id
    );

    // --------------------------------------------------------
    // PARSE METADATA
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.json({
      success: true,

      transaction: {
        ...transaction,

        amount:
          parseFloat(
            transaction.amount
          ) || 0,

        metadata
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
        'Failed to fetch transaction'
    });
  }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  initiateTransfer,
  verifyOtpAndComplete,
  getTransactionHistory,
  getTransactionByReference
};