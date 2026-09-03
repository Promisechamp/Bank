const { supabase } = require('../db/supabase');
const { generateReference, validateAmount, formatCurrency } = require('../utils/helpers');
const { sendEmail } = require('../email/email');
const { sendNotification } = require('../socket');


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
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
      <h2>Transaction Verification</h2>

      <p>A transfer has been initiated from your account.</p>

      <p>
        <strong>Recipient:</strong>
        ${recipientName}
      </p>

      <p>
        <strong>Amount:</strong>
        ${formatCurrency(amount)}
      </p>

      <p>Your verification code is:</p>

      <div style="
        font-size:32px;
        font-weight:bold;
        letter-spacing:8px;
        padding:20px;
        background:#f5f5f5;
        text-align:center;
        margin:20px 0;
      ">
        ${otp}
      </div>

      <p>This code expires in 10 minutes.</p>

      <p>
        <strong>Reference:</strong> ${reference}
      </p>
    </div>
  `;

  await sendEmail({
    to: toEmail,
    subject: 'Transaction Verification Code',
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
    // SOURCE ACCOUNT
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
    // ACCOUNT STATUS
    //
    // Active  → completes after OTP
    // Frozen  → pending review after OTP
    // Banned  → pending review after OTP
    // --------------------------------------------------------

    const accountStatus =
      String(sourceAccount.status || '').toLowerCase();

    const profileStatus =
      String(sourceAccount.profiles?.status || '').toLowerCase();


    const senderRestricted =
      ['frozen', 'banned'].includes(accountStatus) ||
      ['frozen', 'banned'].includes(profileStatus);


    // --------------------------------------------------------
    // BALANCE CHECK
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
    // RECIPIENT DETAILS
    // --------------------------------------------------------

    if (!recipientAccountNumber) {
      return res.status(400).json({
        success: false,
        error: 'Recipient account number is required.'
      });
    }


    // --------------------------------------------------------
    // FIND RECIPIENT
    // --------------------------------------------------------

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
      .eq('status', 'active')
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
    // PREVENT SAME ACCOUNT
    // --------------------------------------------------------

    if (recipient.id === sourceAccount.id) {
      return res.status(400).json({
        success: false,
        error: 'You cannot transfer money to the same account.'
      });
    }


    // --------------------------------------------------------
    // RECIPIENT NAME VERIFICATION
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
      recipient.profiles?.full_name || recipientName;


    // --------------------------------------------------------
    // GENERATE REFERENCE
    // --------------------------------------------------------

    const reference = generateReference();


    // --------------------------------------------------------
    // GENERATE OTP
    // --------------------------------------------------------

    const otp =
      Math.floor(
        100000 + Math.random() * 900000
      ).toString();


    // --------------------------------------------------------
    // CREATE PENDING TRANSACTION
    //
    // IMPORTANT:
    // No money is moved here.
    // --------------------------------------------------------

    const {
      error: transactionError
    } = await supabase
      .from('transactions')
      .insert([{
        account_id: sourceAccount.id,
        transaction_type: 'transfer',
        amount,
        description:
          description || 'Same bank transfer',
        reference_id: reference,
        counterparty_account: recipient.id,
        status: 'pending',
        metadata: {
          transferType: 'same_bank',
          recipientAccountNumber,
          recipientName: confirmedRecipientName,
          recipientAccountId: recipient.id,
          senderRestricted,
          otpRequired: true
        }
      }]);


    if (transactionError) {
      throw transactionError;
    }


    // --------------------------------------------------------
    // CREATE OTP RECORD
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
          description:
            description || 'Same bank transfer',
          recipientAccountNumber,
          recipientName: confirmedRecipientName
        }
      });


    if (otpError) {
      throw otpError;
    }


    // --------------------------------------------------------
    // SEND OTP
    // --------------------------------------------------------

    await sendOtpEmail(
      req.user.email,
      otp,
      reference,
      amount,
      confirmedRecipientName
    );


    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.json({
      success: true,
      requiresOtp: true,
      reference,
      status: 'pending',
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
// VERIFY OTP AND COMPLETE / SEND TO REVIEW
// ============================================================
const verifyOtpAndComplete = async (req, res, next) => {
  try {
    const { reference, otp } = req.body;

    // --------------------------------------------------------
    // VALIDATION
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
    // ALREADY VERIFIED
    // --------------------------------------------------------

    if (otpRecord.verified) {
      return res.status(400).json({
        success: false,
        error: 'This verification code has already been used.'
      });
    }

    // --------------------------------------------------------
    // EXPIRED
    // --------------------------------------------------------

    if (new Date(otpRecord.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'This verification code has expired.'
      });
    }

    // --------------------------------------------------------
    // VERIFY OTP
    // --------------------------------------------------------

    if (String(otpRecord.otp) !== String(otp)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code.'
      });
    }

    const transferData = otpRecord.data;

    // --------------------------------------------------------
    // GET TRANSACTION
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

    if (transaction.status !== 'pending') {
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

    const accountStatus =
      String(sourceAccount.status || '').toLowerCase();

    const profileStatus =
      String(sourceAccount.profiles?.status || '').toLowerCase();

    const senderRestricted =
      ['frozen', 'banned'].includes(accountStatus) ||
      ['frozen', 'banned'].includes(profileStatus);

    // ========================================================
    // FROZEN / BANNED
    // ========================================================

    if (senderRestricted) {
      // OTP has been correctly verified.
      // Transfer moves to pending_review.
      // NO MONEY MOVES.

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
            reviewSubmittedAt: new Date().toISOString()
          }
        })
        .eq('id', transaction.id)
        .eq('status', 'pending');

      if (reviewError) {
        throw reviewError;
      }

      return res.json({
        success: true,
        reference,
        status: 'pending_review',
        message:
          'OTP verified. Transfer has been submitted for admin review.'
      });
    }

    // ========================================================
    // ACTIVE / UNRESTRICTED
    // ========================================================

    // --------------------------------------------------------
    // BALANCE CHECK AGAIN
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
    // DESTINATION
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
    // SIMULATED PROCESSING DELAY
    // --------------------------------------------------------

    await delay(1000);

    // --------------------------------------------------------
    // CALCULATE BALANCES
    // --------------------------------------------------------

    const amount = Number(transferData.amount);

    const newSourceBalance =
      Number(sourceAccount.balance) - amount;

    const newDestinationBalance =
      Number(destination.balance) + amount;

    // --------------------------------------------------------
    // DEBIT SOURCE
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // CREDIT DESTINATION
    // --------------------------------------------------------

    const {
      error: creditError
    } = await supabase
      .from('accounts')
      .update({
        balance: newDestinationBalance
      })
      .eq('id', destination.id);

    if (creditError) {
      // Restore source balance if credit fails.
      await supabase
        .from('accounts')
        .update({
          balance: sourceAccount.balance
        })
        .eq('id', sourceAccount.id);

      throw creditError;
    }

    // --------------------------------------------------------
    // MARK OTP VERIFIED
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // COMPLETE SENDER TRANSACTION
    // --------------------------------------------------------

    const {
      error: senderTransactionError
    } = await supabase
      .from('transactions')
      .update({
        status: 'completed',
        metadata: {
          ...(transaction.metadata || {}),
          otpVerified: true,
          completedAt: new Date().toISOString()
        }
      })
      .eq('id', transaction.id)
      .eq('status', 'pending');

    if (senderTransactionError) {
      throw senderTransactionError;
    }

    // --------------------------------------------------------
    // CREATE RECIPIENT TRANSACTION
    //
    // IMPORTANT:
    // reference_id is UNIQUE, so the recipient transaction
    // MUST NOT use the same reference as the sender transaction.
    // --------------------------------------------------------

    const recipientReference = `${reference}-CR`;

    const {
      error: recipientTransactionError
    } = await supabase
      .from('transactions')
      .insert([{
        account_id: destination.id,
        transaction_type: 'transfer',
        amount,
        description:
          transferData.description ||
          'Same bank transfer',

        // UNIQUE recipient-side reference
        reference_id: recipientReference,

        counterparty_account: sourceAccount.id,
        status: 'completed',

        metadata: {
          transferType: 'same_bank',

          // Original transfer reference
          transferReference: reference,

          // This is the recipient-side transaction
          direction: 'credit',

          fromAccountId: sourceAccount.id,

          senderName:
            sourceAccount.profiles?.full_name ||
            null,

          senderAccountNumber:
            sourceAccount.account_number ||
            null
        }
      }]);

    if (recipientTransactionError) {
      throw recipientTransactionError;
    }

    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    return res.json({
      success: true,
      reference,
      status: 'completed',
      message: 'Transfer completed successfully.',

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



// ============================================
// TRANSACTION HISTORY
// ============================================
const getTransactionHistory = async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // 1. Verify that the account belongs to the authenticated user
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (accountError) {
      if (accountError.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Account not found' });
      }
      throw accountError;
    }

    // 2. Fetch transactions for that account with pagination
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (txError) throw txError;

    // 3. Get total count for pagination
    const { count, error: countError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);

    if (countError) throw countError;

    // 4. Return response
    res.json({
      success: true,
      transactions,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    next(error);
  }
};


// ============================================
// GET TRANSACTION BY REFERENCE
// ============================================
const getTransactionByReference = async (req, res, next) => {
  try {
    const { referenceId } = req.params;

    // 1. Fetch transaction by reference ID
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('reference_id', referenceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Transaction not found' });
      }
      throw error;
    }

    // 2. Verify the user owns the account associated with this transaction
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('user_id')
      .eq('id', transaction.account_id)
      .single();

    if (accountError) throw accountError;

    if (account.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // 3. Return transaction
    res.json({ success: true, transaction });
  } catch (error) {
    next(error);
  }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  initiateTransfer,
  verifyOtpAndComplete,
		getTransactionHistory,
  getTransactionByReference,
};


