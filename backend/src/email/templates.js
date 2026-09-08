// ============================================================
// email/templates.js
// Trustybank — Premium Light Email Templates
// ============================================================

const frontendUrl = (
  process.env.FRONTEND_URL || 'http://localhost:5173'
).replace(/\/$/, '');

const logoUrl = `${frontendUrl}/logo.png`;

// ============================================================
// HELPERS
// ============================================================

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const receiptUrl = (reference) =>
  `${frontendUrl}/receipt/${encodeURIComponent(
    reference || ''
  )}`;

// ============================================================
// SHARED EMAIL SHELL
// ============================================================

const emailShell = ({
  title,
  preheader = '',
  content
}) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <meta
    name="color-scheme"
    content="light"
  />
  <meta
    name="supported-color-schemes"
    content="light"
  />

  <title>${escapeHtml(title)}</title>

  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f4f7fb;
      font-family:
        Arial,
        Helvetica,
        sans-serif;
      color: #172033;
    }

    table {
      border-collapse: collapse;
    }

    img {
      border: 0;
      outline: none;
      text-decoration: none;
    }

    a {
      text-decoration: none;
    }

    .wrapper {
      width: 100%;
      padding: 40px 16px;
      box-sizing: border-box;
    }

    .container {
      width: 100%;
      max-width: 620px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e6ebf2;
      border-radius: 22px;
      overflow: hidden;
      box-shadow:
        0 12px 40px rgba(24, 39, 75, 0.07);
    }

    .header {
      padding: 28px 34px;
      background: #ffffff;
      border-bottom: 1px solid #edf0f5;
    }

    .content {
      padding: 38px 34px;
    }

    .footer {
      padding: 22px 34px;
      background: #fafbfd;
      border-top: 1px solid #edf0f5;
    }

    .eyebrow {
      display: inline-block;
      padding: 7px 11px;
      border-radius: 999px;
      background: #eef5ff;
      color: #2364d2;
      font-size: 11px;
      line-height: 1;
      font-weight: 700;
      letter-spacing: .8px;
    }

    .title {
      margin: 16px 0 10px;
      font-size: 27px;
      line-height: 1.25;
      color: #14213d;
      font-weight: 750;
    }

    .text {
      margin: 0;
      font-size: 15px;
      line-height: 1.7;
      color: #667085;
    }

    .details {
      width: 100%;
      margin-top: 28px;
      border: 1px solid #e7ecf3;
      border-radius: 15px;
      overflow: hidden;
    }

    .details-header {
      padding: 14px 18px;
      background: #f8fafc;
      border-bottom: 1px solid #e7ecf3;
      color: #344054;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: .3px;
    }

    .details-body {
      padding: 8px 18px 14px;
    }

    .label {
      padding: 9px 0;
      color: #667085;
      font-size: 13px;
      vertical-align: top;
    }

    .value {
      padding: 9px 0;
      color: #172033;
      font-size: 13px;
      font-weight: 700;
      text-align: right;
      vertical-align: top;
      word-break: break-word;
    }

    .amount-box {
      margin-top: 26px;
      padding: 24px;
      border: 1px solid #e1e9f4;
      border-radius: 17px;
      background: #fbfdff;
      text-align: center;
    }

    .amount-label {
      margin-bottom: 8px;
      color: #667085;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
    }

    .amount {
      color: #14213d;
      font-size: 32px;
      line-height: 1.2;
      font-weight: 800;
    }

    .status {
      margin-top: 22px;
      padding: 13px 15px;
      border-radius: 12px;
      background: #f0faf5;
      border: 1px solid #d8f0e2;
      color: #24744a;
      font-size: 13px;
      font-weight: 700;
    }

    .button-wrap {
      margin-top: 28px;
      text-align: center;
    }

    .button {
      display: inline-block;
      padding: 13px 22px;
      border-radius: 11px;
      background: #2364d2;
      color: #ffffff !important;
      font-size: 13px;
      font-weight: 700;
    }

    .muted {
      margin: 22px 0 0;
      color: #98a2b3;
      font-size: 12px;
      line-height: 1.65;
    }

    .footer-text {
      margin: 0;
      color: #98a2b3;
      font-size: 11px;
      line-height: 1.6;
    }

    @media only screen and (max-width: 600px) {
      .wrapper {
        padding: 20px 10px;
      }

      .header {
        padding: 23px 22px;
      }

      .content {
        padding: 30px 22px;
      }

      .footer {
        padding: 20px 22px;
      }

      .title {
        font-size: 24px;
      }

      .amount {
        font-size: 28px;
      }
    }
  </style>
</head>

<body>

  <div style="
    display:none;
    max-height:0;
    overflow:hidden;
    opacity:0;
    color:transparent;
  ">
    ${escapeHtml(preheader)}
  </div>

  <div class="wrapper">

    <div class="container">

      <!-- HEADER -->

      <div class="header">

        <img
          src="${logoUrl}"
          alt="Trustybank"
          style="
            display:block;
            max-width:175px;
            max-height:50px;
            width:auto;
            height:auto;
          "
        />

      </div>

      <!-- CONTENT -->

      <div class="content">
        ${content}
      </div>

      <!-- FOOTER -->

      <div class="footer">

        <p class="footer-text">
          This is an automated message from Trustybank.
          Please do not reply to this email.
        </p>

        <p class="footer-text" style="margin-top:5px;">
          © ${new Date().getFullYear()} Trustybank. All rights reserved.
        </p>

      </div>

    </div>

  </div>

</body>
</html>
`;

// ============================================================
// DETAIL ROW
// ============================================================

const detailRow = (label, value) => `
<tr>
  <td class="label">
    ${escapeHtml(label)}
  </td>

  <td class="value">
    ${escapeHtml(value)}
  </td>
</tr>
`;

// ============================================================
// RECEIPT BUTTON
// ============================================================

const receiptButton = (reference) => `
<div class="button-wrap">

  <a
    href="${receiptUrl(reference)}"
    class="button"
    target="_blank"
  >
    View transaction receipt
  </a>

</div>
`;

// ============================================================
// CREDIT EMAIL
// ============================================================

const creditEmail = ({
  userName = 'Customer',
  accountNumber = '—',
  amount = '—',
  newBalance = '—',
  description = 'Account credit',
  reference = '—',
  senderName = null,
  senderAccountNumber = null,
  direction = 'received',
  transferType = null
} = {}) => {

  const recipient =
    escapeHtml(userName);

  const sender =
    senderName ||
    'Trustybank';

  const isTransfer =
    direction === 'received' ||
    Boolean(senderName);

  const heading =
    isTransfer
      ? 'Transfer received'
      : 'Your account has been credited';

  const intro =
    isTransfer
      ? `A transfer from ${sender} has been successfully credited to your Trustybank account.`
      : 'A credit has been successfully posted to your Trustybank account.';

  const counterpartyRows = isTransfer
    ? `
      ${detailRow(
        'Sender',
        senderName || '—'
      )}

      ${detailRow(
        'Sender account',
        senderAccountNumber || '—'
      )}
    `
    : '';

  return emailShell({
    title: 'Trustybank — Transfer Received',
    preheader:
      `You received ${amount} in your Trustybank account.`,

    content: `

      <span class="eyebrow">
        ${isTransfer ? 'TRANSFER RECEIVED' : 'ACCOUNT CREDIT'}
      </span>

      <h1 class="title">
        ${heading}
      </h1>

      <p class="text">
        Hello ${recipient},
      </p>

      <p
        class="text"
        style="margin-top:8px;"
      >
        ${intro}
      </p>

      <div class="amount-box">

        <div class="amount-label">
          AMOUNT RECEIVED
        </div>

        <div class="amount">
          ${escapeHtml(amount)}
        </div>

      </div>

      <div class="status">
        Completed successfully
      </div>

      <table
        class="details"
        width="100%"
        cellpadding="0"
        cellspacing="0"
      >

        <tr>
          <td
            colspan="2"
            class="details-header"
          >
            Transaction details
          </td>
        </tr>

        <tbody class="details-body">

          ${counterpartyRows}

          ${detailRow(
            'Account',
            accountNumber
          )}

          ${detailRow(
            'Description',
            description
          )}

          ${detailRow(
            'New balance',
            newBalance
          )}

          ${detailRow(
            'Reference',
            reference
          )}

        </tbody>

      </table>

      ${receiptButton(reference)}

      <p class="muted">
        If you do not recognize this transaction,
        please contact Trustybank through your official
        banking support channel.
      </p>

    `
  });
};

// ============================================================
// DEBIT EMAIL
// ============================================================

const debitEmail = ({
  userName = 'Customer',
  accountNumber = '—',
  amount = '—',
  newBalance = '—',
  description = 'Account debit',
  reference = '—',
  recipientName = null,
  recipientAccountNumber = null,
  direction = 'sent',
  transferType = null
} = {}) => {

  const customer =
    escapeHtml(userName);

  const isTransfer =
    direction === 'sent' ||
    Boolean(recipientName);

  const heading =
    isTransfer
      ? 'Transfer sent'
      : 'Your account has been debited';

  const intro =
    isTransfer
      ? `Your transfer to ${recipientName || 'the recipient'} has been successfully processed.`
      : 'A debit has been successfully posted to your Trustybank account.';

  const counterpartyRows = isTransfer
    ? `
      ${detailRow(
        'Recipient',
        recipientName || '—'
      )}

      ${detailRow(
        'Recipient account',
        recipientAccountNumber || '—'
      )}
    `
    : '';

  return emailShell({
    title: 'Trustybank — Transfer Sent',
    preheader:
      `Your Trustybank account was debited ${amount}.`,

    content: `

      <span class="eyebrow">
        ${isTransfer ? 'TRANSFER SENT' : 'ACCOUNT DEBIT'}
      </span>

      <h1 class="title">
        ${heading}
      </h1>

      <p class="text">
        Hello ${customer},
      </p>

      <p
        class="text"
        style="margin-top:8px;"
      >
        ${intro}
      </p>

      <div class="amount-box">

        <div class="amount-label">
          AMOUNT SENT
        </div>

        <div class="amount">
          ${escapeHtml(amount)}
        </div>

      </div>

      <div class="status">
        Completed successfully
      </div>

      <table
        class="details"
        width="100%"
        cellpadding="0"
        cellspacing="0"
      >

        <tr>
          <td
            colspan="2"
            class="details-header"
          >
            Transaction details
          </td>
        </tr>

        <tbody class="details-body">

          ${counterpartyRows}

          ${detailRow(
            'Account',
            accountNumber
          )}

          ${detailRow(
            'Description',
            description
          )}

          ${detailRow(
            'Remaining balance',
            newBalance
          )}

          ${detailRow(
            'Reference',
            reference
          )}

        </tbody>

      </table>

      ${receiptButton(reference)}

      <p class="muted">
        If you do not recognize this transaction,
        please contact Trustybank through your official
        banking support channel immediately.
      </p>

    `
  });
};

// ============================================================
// TRANSFER EMAIL
// ============================================================

const transferEmail = ({
  userName = 'Customer',
  accountNumber = '—',
  amount = '—',
  newBalance = '—',
  description = 'Bank transfer',
  reference = '—',
  recipientName = null,
  recipientAccountNumber = null,
  senderName = null,
  senderAccountNumber = null,
  direction = null
} = {}) => {

  const received =
    direction === 'received' ||
    Boolean(senderName);

  const sent =
    direction === 'sent' ||
    Boolean(recipientName);

  if (received) {
    return creditEmail({
      userName,
      accountNumber,
      amount,
      newBalance,
      description,
      reference,
      senderName,
      senderAccountNumber,
      direction: 'received',
      transferType: 'same_bank'
    });
  }

  if (sent) {
    return debitEmail({
      userName,
      accountNumber,
      amount,
      newBalance,
      description,
      reference,
      recipientName,
      recipientAccountNumber,
      direction: 'sent',
      transferType: 'same_bank'
    });
  }

  return emailShell({
    title: 'Trustybank — Transfer Completed',
    preheader:
      `Your Trustybank transfer of ${amount} has been completed.`,

    content: `

      <span class="eyebrow">
        TRANSFER COMPLETED
      </span>

      <h1 class="title">
        Transfer completed
      </h1>

      <p class="text">
        Hello ${escapeHtml(userName)},
      </p>

      <p
        class="text"
        style="margin-top:8px;"
      >
        Your transfer has been successfully completed.
      </p>

      <div class="amount-box">

        <div class="amount-label">
          TRANSFER AMOUNT
        </div>

        <div class="amount">
          ${escapeHtml(amount)}
        </div>

      </div>

      <div class="status">
        Completed successfully
      </div>

      <table
        class="details"
        width="100%"
        cellpadding="0"
        cellspacing="0"
      >

        <tr>
          <td
            colspan="2"
            class="details-header"
          >
            Transaction details
          </td>
        </tr>

        <tbody class="details-body">

          ${detailRow(
            'Account',
            accountNumber
          )}

          ${detailRow(
            'Description',
            description
          )}

          ${detailRow(
            'New balance',
            newBalance
          )}

          ${detailRow(
            'Reference',
            reference
          )}

        </tbody>

      </table>

      ${receiptButton(reference)}

    `
  });
};

// ============================================================
// WELCOME EMAIL
// ============================================================

const welcomeEmail = ({
  userName = 'Customer',
  accountNumber = '—',
  accountType = 'Savings',
  balance = '0.00'
} = {}) => {

  return emailShell({
    title: 'Welcome to Trustybank',
    preheader:
      'Your Trustybank account has been created successfully.',

    content: `

      <span class="eyebrow">
        WELCOME TO TRUSTYBANK
      </span>

      <h1 class="title">
        Welcome, ${escapeHtml(userName)}
      </h1>

      <p class="text">
        Your Trustybank account has been successfully
        created. We are pleased to have you with us.
      </p>

      <div class="amount-box">

        <div class="amount-label">
          CURRENT BALANCE
        </div>

        <div class="amount">
          ${escapeHtml(balance)}
        </div>

      </div>

      <table
        class="details"
        width="100%"
        cellpadding="0"
        cellspacing="0"
      >

        <tr>
          <td
            colspan="2"
            class="details-header"
          >
            Account information
          </td>
        </tr>

        <tbody class="details-body">

          ${detailRow(
            'Account number',
            accountNumber
          )}

          ${detailRow(
            'Account type',
            accountType
          )}

          ${detailRow(
            'Account status',
            'Active'
          )}

        </tbody>

      </table>

      <div class="button-wrap">

        <a
          href="${frontendUrl}"
          class="button"
          target="_blank"
        >
          Open Trustybank
        </a>

      </div>

      <p class="muted">
        Keep your account credentials secure and never
        share your password or verification codes with
        anyone.
      </p>

    `
  });
};

// ============================================================
// ADMIN — NEW USER REGISTRATION
// ============================================================

const newUserRegistrationAdminEmail = ({
  adminName = 'Administrator',
  userName = 'New customer',
  userEmail = '—',
  userPhone = '—',
  registrationDate = '—'
} = {}) => {

  return emailShell({
    title: 'Trustybank — New User Registration',
    preheader:
      `${userName} has registered for a Trustybank account.`,

    content: `

      <span class="eyebrow">
        ACCOUNT REGISTRATION
      </span>

      <h1 class="title">
        New customer registration
      </h1>

      <p class="text">
        Hello ${escapeHtml(adminName)},
      </p>

      <p
        class="text"
        style="margin-top:8px;"
      >
        A new customer has successfully registered
        with Trustybank.
      </p>

      <table
        class="details"
        width="100%"
        cellpadding="0"
        cellspacing="0"
      >

        <tr>
          <td
            colspan="2"
            class="details-header"
          >
            Customer information
          </td>
        </tr>

        <tbody class="details-body">

          ${detailRow(
            'Full name',
            userName
          )}

          ${detailRow(
            'Email',
            userEmail
          )}

          ${detailRow(
            'Phone',
            userPhone
          )}

          ${detailRow(
            'Registration date',
            registrationDate
          )}

        </tbody>

      </table>

      <div class="status">
        New account registration received
      </div>

    `
  });
};

// ============================================================
// CARD ORDER EMAIL
// ============================================================

const cardOrderEmail = ({
  userName = 'Customer',
  cardType = 'Debit Card',
  status = 'Processing',
  orderReference = '—',
  orderDate = '—'
} = {}) => {

  return emailShell({
    title: 'Trustybank — Card Order Update',
    preheader:
      `Your Trustybank card order status is ${status}.`,

    content: `

      <span class="eyebrow">
        CARD SERVICES
      </span>

      <h1 class="title">
        Card order update
      </h1>

      <p class="text">
        Hello ${escapeHtml(userName)},
      </p>

      <p
        class="text"
        style="margin-top:8px;"
      >
        Your Trustybank card order has been updated.
      </p>

      <div class="status">
        ${escapeHtml(status)}
      </div>

      <table
        class="details"
        width="100%"
        cellpadding="0"
        cellspacing="0"
      >

        <tr>
          <td
            colspan="2"
            class="details-header"
          >
            Order details
          </td>
        </tr>

        <tbody class="details-body">

          ${detailRow(
            'Card type',
            cardType
          )}

          ${detailRow(
            'Order reference',
            orderReference
          )}

          ${detailRow(
            'Order date',
            orderDate
          )}

          ${detailRow(
            'Status',
            status
          )}

        </tbody>

      </table>

    `
  });
};

// ============================================================
// TRANSFER REJECTED EMAIL
// ============================================================

const transferRejectedEmail = ({
  userName = 'Customer',
  amount = '—',
  reference = '—',
  reason = null
} = {}) => {

  return emailShell({
    title: 'Trustybank — Transfer Rejected',
    preheader:
      `Your Trustybank transfer of ${amount} was rejected.`,

    content: `

      <span
        class="eyebrow"
        style="
          background:#fff4f2;
          color:#c43228;
        "
      >
        TRANSFER REJECTED
      </span>

      <h1 class="title">
        Transfer rejected
      </h1>

      <p class="text">
        Hello ${escapeHtml(userName)},
      </p>

      <p
        class="text"
        style="margin-top:8px;"
      >
        Your transfer could not be completed and has
        been rejected.
      </p>

      <div
        class="amount-box"
        style="
          background:#fffafa;
          border-color:#f1dfdc;
        "
      >

        <div class="amount-label">
          TRANSFER AMOUNT
        </div>

        <div class="amount">
          ${escapeHtml(amount)}
        </div>

      </div>

      <div
        style="
          margin-top:22px;
          padding:15px 16px;
          border-radius:12px;
          background:#fff6f5;
          border:1px solid #f3dedb;
          color:#a7352d;
          font-size:13px;
          line-height:1.6;
        "
      >
        No money was moved from your account.
      </div>

      <table
        class="details"
        width="100%"
        cellpadding="0"
        cellspacing="0"
      >

        <tr>
          <td
            colspan="2"
            class="details-header"
          >
            Transaction details
          </td>
        </tr>

        <tbody class="details-body">

          ${detailRow(
            'Reference',
            reference
          )}

          ${
            reason
              ? detailRow(
                  'Reason',
                  reason
                )
              : ''
          }

          ${detailRow(
            'Status',
            'Rejected'
          )}

        </tbody>

      </table>

      <div class="button-wrap">

        <a
          href="${receiptUrl(reference)}"
          class="button"
          target="_blank"
          style="
            background:#667085;
          "
        >
          View transaction details
        </a>

      </div>

      <p class="muted">
        If you believe this rejection was made in error,
        please contact Trustybank support through your
        official banking channel.
      </p>

    `
  });
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  creditEmail,
  debitEmail,
  transferEmail,
  welcomeEmail,
  newUserRegistrationAdminEmail,
  cardOrderEmail,
  transferRejectedEmail
};