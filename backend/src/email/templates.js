// src/email/templates.js

const baseLayout = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Banking Demo</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background-color: #4F46E5;
      padding: 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px 20px;
      color: #333333;
    }
    .content h2 {
      margin-top: 0;
      color: #4F46E5;
    }
    .content p {
      line-height: 1.6;
    }
    .details {
      background-color: #f8f8f8;
      padding: 15px;
      border-radius: 6px;
      margin: 15px 0;
    }
    .details table {
      width: 100%;
      border-collapse: collapse;
    }
    .details td {
      padding: 6px 0;
    }
    .details .label {
      font-weight: bold;
      width: 40%;
    }
    .footer {
      background-color: #f4f4f4;
      padding: 15px 20px;
      text-align: center;
      color: #888888;
      font-size: 12px;
      border-top: 1px solid #e0e0e0;
    }
    .btn {
      display: inline-block;
      padding: 10px 20px;
      background-color: #4F46E5;
      color: #ffffff;
      text-decoration: none;
      border-radius: 4px;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏦 Banking Demo</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Banking Demo. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

// Credit Email Template
const creditEmail = ({ userName, accountNumber, amount, newBalance, description, reference }) => {
  const content = `
    <h2>Account Credited</h2>
    <p>Hello ${userName},</p>
    <p>Your account <strong>${accountNumber}</strong> has been credited with <strong>${amount}</strong>.</p>
    <div class="details">
      <table>
        <tr><td class="label">New Balance:</td><td><strong>${newBalance}</strong></td></tr>
        <tr><td class="label">Description:</td><td>${description}</td></tr>
        <tr><td class="label">Reference:</td><td>${reference}</td></tr>
      </table>
    </div>
    <p>Thank you for using Banking Demo.</p>
  `;
  return baseLayout(content);
};

// Debit Email Template
const debitEmail = ({ userName, accountNumber, amount, newBalance, description, note, reference }) => {
  const content = `
    <h2>Account Debited</h2>
    <p>Hello ${userName},</p>
    <p>Your account <strong>${accountNumber}</strong> has been debited with <strong>${amount}</strong>.</p>
    <div class="details">
      <table>
        <tr><td class="label">New Balance:</td><td><strong>${newBalance}</strong></td></tr>
        <tr><td class="label">Description:</td><td>${description}</td></tr>
        ${note ? `<tr><td class="label">Note:</td><td>${note}</td></tr>` : ''}
        <tr><td class="label">Reference:</td><td>${reference}</td></tr>
      </table>
    </div>
    <p>Thank you for using Banking Demo.</p>
  `;
  return baseLayout(content);
};

// Transfer Email Template (optional)
const transferEmail = ({ userName, fromAccount, toAccount, amount, newBalance, description, reference }) => {
  const content = `
    <h2>Transfer Completed</h2>
    <p>Hello ${userName},</p>
    <p>A transfer of <strong>${amount}</strong> has been completed.</p>
    <div class="details">
      <table>
        <tr><td class="label">From Account:</td><td>${fromAccount}</td></tr>
        <tr><td class="label">To Account:</td><td>${toAccount}</td></tr>
        <tr><td class="label">New Balance:</td><td><strong>${newBalance}</strong></td></tr>
        <tr><td class="label">Description:</td><td>${description}</td></tr>
        <tr><td class="label">Reference:</td><td>${reference}</td></tr>
      </table>
    </div>
    <p>Thank you for using Banking Demo.</p>
  `;
  return baseLayout(content);
};

module.exports = {
  creditEmail,
  debitEmail,
  transferEmail,
};