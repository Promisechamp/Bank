import React, { useEffect, useMemo, useState } from 'react';
import { transactionsAPI, accountsAPI } from '../api';
import { formatCurrency, validateAmount } from '../utils/helpers';
import Modal from './Modal';
import { toast } from 'sonner';

import {
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
  Wallet,
  ArrowRight,
  User,
  ShieldCheck,
  Clock,
  Mail,
  LockKeyhole,
  Search,
} from 'lucide-react';


// ============================================================
// FAKE UI DELAY
// ============================================================

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));


// ============================================================
// TRANSFER
// ============================================================

const Transfer = () => {

  // ==========================================================
  // ACCOUNTS
  // ==========================================================

  const [accounts, setAccounts] = useState([]);
  const [fromAccount, setFromAccount] = useState('');

  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);


  // ==========================================================
  // TRANSFER FORM
  // ==========================================================

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [reference, setReference] = useState('');
  const [resultStatus, setResultStatus] = useState('');


  // ==========================================================
  // RECIPIENT
  // ==========================================================

  const [recipientAccountNumber, setRecipientAccountNumber] =
    useState('');

  const [recipientName, setRecipientName] = useState('');

  const [accountCheckLoading, setAccountCheckLoading] =
    useState(false);

  const [accountCheckResult, setAccountCheckResult] =
    useState(null);

  const [accountCheckError, setAccountCheckError] =
    useState('');


  // ==========================================================
  // OTP
  // ==========================================================

  const [otpModalOpen, setOtpModalOpen] = useState(false);

  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  const [otpStep, setOtpStep] = useState('idle');

  const [otpReference, setOtpReference] = useState('');

  const [otpAttempts, setOtpAttempts] = useState(0);


  // ==========================================================
  // INITIALIZATION STEP
  // ==========================================================

  const [initializationStep, setInitializationStep] =
    useState('idle');


  // ==========================================================
  // LOAD ACCOUNTS
  // ==========================================================

  useEffect(() => {
    fetchAccounts();
  }, []);


  // ==========================================================
  // RECIPIENT LOOKUP
  // ==========================================================

  useEffect(() => {

    if (
      recipientAccountNumber.trim().length < 5
    ) {
      setAccountCheckResult(null);
      setAccountCheckError('');
      return;
    }


    const timer = setTimeout(() => {
      checkRecipientAccount(
        recipientAccountNumber.trim()
      );
    }, 600);


    return () => clearTimeout(timer);

  }, [recipientAccountNumber]);


  // ==========================================================
  // FETCH ACCOUNTS
  // ==========================================================

  const fetchAccounts = async () => {

    try {

      setFetching(true);

      const data = await accountsAPI.getAll();

      const loadedAccounts =
        data.accounts || [];

      setAccounts(loadedAccounts);


      if (loadedAccounts.length > 0) {

        setFromAccount(
          loadedAccounts[0].id
        );
      }

    } catch (err) {

      setError(
        'Failed to load your accounts.'
      );

    } finally {

      setFetching(false);
    }
  };


  // ==========================================================
  // CHECK RECIPIENT
  // ==========================================================

  const checkRecipientAccount = async (
    accountNumber
  ) => {

    try {

      setAccountCheckLoading(true);
      setAccountCheckError('');
      setAccountCheckResult(null);


      const response =
        await accountsAPI.checkExists(
          accountNumber
        );
console.log('API response:', response);

      if (
        response?.success &&
        response?.exists
      ) {

        setAccountCheckResult({
          exists: true,
          owner_name:
            response.account.owner_name,
          account_type:
            response.account.account_type,
          account_id:
            response.account.id,
        });


        setRecipientName(
          response.account.owner_name
        );

      } else {

        setAccountCheckResult({
          exists: false
        });

        setRecipientName('');

        setAccountCheckError(
          'Account not found.'
        );
      }

    } catch (err) {

      setAccountCheckError(
        err?.error ||
        'Unable to verify account number.'
      );

    } finally {

      setAccountCheckLoading(false);
    }
  };


  // ==========================================================
  // ACCOUNT HELPERS
  // ==========================================================

  const getAccount = (id) =>
    accounts.find(
      (account) => account.id === id
    );


  const availableBalance = useMemo(() => {

    const account =
      getAccount(fromAccount);

    return account
      ? Number(account.balance || 0)
      : 0;

  }, [fromAccount, accounts]);


  // ==========================================================
  // RESET FORM
  // ==========================================================

  const resetTransferForm = () => {

    setAmount('');
    setDescription('');

    setRecipientAccountNumber('');
    setRecipientName('');

    setAccountCheckResult(null);
    setAccountCheckError('');
  };


  // ==========================================================
  // SUBMIT TRANSFER
  // ==========================================================

  const handleTransferSubmit = async (e) => {

    e.preventDefault();

    setError('');
    setSuccess('');
    setReference('');
    setResultStatus('');


    // --------------------------------------------------------
    // VALIDATE SOURCE
    // --------------------------------------------------------

    if (!fromAccount) {

      setError(
        'Please select an account.'
      );

      return;
    }


    // --------------------------------------------------------
    // VALIDATE RECIPIENT
    // --------------------------------------------------------

    if (
      !recipientAccountNumber
    ) {

      setError(
        'Please enter the recipient account number.'
      );

      return;
    }


    if (
      !accountCheckResult?.exists
    ) {

      setError(
        'Please enter a valid recipient account number.'
      );

      return;
    }


    // --------------------------------------------------------
    // VALIDATE AMOUNT
    // --------------------------------------------------------

    const amountNum =
      Number(amount);


    if (
      !validateAmount(amountNum) ||
      amountNum <= 0
    ) {

      setError(
        'Please enter a valid amount greater than 0.'
      );

      return;
    }


    if (
      amountNum > availableBalance
    ) {

      setError(
        `Insufficient funds. Available balance: ${formatCurrency(
          availableBalance
        )}`
      );

      return;
    }


    // ========================================================
    // BEGIN FAKE INITIALIZATION
    // ========================================================

    setLoading(true);
    setInitializationStep('preparing');

    try {

      // ------------------------------------------------------
      // STEP 1
      // ------------------------------------------------------

      await sleep(500);

      setInitializationStep(
        'verifying_recipient'
      );


      // ------------------------------------------------------
      // STEP 2
      // ------------------------------------------------------

      await sleep(700);

      setInitializationStep(
        'creating_transfer'
      );


      // ------------------------------------------------------
      // STEP 3
      // ACTUAL BACKEND REQUEST
      // ------------------------------------------------------

      const response =
        await transactionsAPI.initiateTransfer({

          fromAccountId:
            fromAccount,

          amount:
            amountNum,

          description:
            description ||
            'Same bank transfer',

          recipientAccountNumber:
            recipientAccountNumber,

          recipientName:
            recipientName,

        });


      if (!response?.success) {

        throw new Error(
          response?.error ||
          'Unable to initiate transfer.'
        );
      }


      // ------------------------------------------------------
      // STEP 4
      // ------------------------------------------------------

      setInitializationStep(
        'sending_otp'
      );

      await sleep(900);


      // ------------------------------------------------------
      // OTP REQUIRED
      // ------------------------------------------------------

      if (response.requiresOtp) {

        setOtpReference(
          response.reference
        );

        setOtpCode('');
        setOtpError('');
        setOtpAttempts(0);

        setOtpStep('sent');

        setOtpModalOpen(true);

        setInitializationStep('idle');

        toast.success(
          'Verification code sent'
        );

      } else {

        // This shouldn't normally happen with
        // the current same-bank backend, but
        // we handle it safely.

        setReference(
          response.reference || ''
        );

        setResultStatus(
          response.status ||
          'completed'
        );

        setSuccess(
          response.message ||
          'Transfer completed successfully.'
        );

        resetTransferForm();

        await fetchAccounts();
      }

    } catch (err) {

      setError(
        err?.error ||
        err?.message ||
        'Transfer initiation failed.'
      );

      setInitializationStep(
        'idle'
      );

    } finally {

      setLoading(false);
    }
  };


  // ==========================================================
  // OTP SUBMIT
  // ==========================================================

  const handleOtpSubmit = async (e) => {

    e.preventDefault();

    setOtpError('');


    // --------------------------------------------------------
    // OTP VALIDATION
    // --------------------------------------------------------

    if (
      !otpCode ||
      otpCode.length !== 6
    ) {

      setOtpError(
        'Enter the 6-digit OTP sent to your email.'
      );

      return;
    }


    setOtpLoading(true);
    setOtpStep('verifying');


    try {

      // ------------------------------------------------------
      // FAKE SECURITY CHECK
      // ------------------------------------------------------

      await sleep(1000);


      const response =
        await transactionsAPI.verifyTransfer({

          reference:
            otpReference,

          otp:
            otpCode,

        });


      // ------------------------------------------------------
      // INVALID OTP
      // ------------------------------------------------------

      if (!response?.success) {

        const nextAttempts =
          otpAttempts + 1;

        setOtpAttempts(
          nextAttempts
        );


        if (
          nextAttempts >= 3
        ) {

          setOtpError(
            'Too many failed attempts. Please try again later.'
          );

          setOtpStep('idle');

          await sleep(500);

          setOtpModalOpen(false);

        } else {

          setOtpError(
            `Invalid OTP. ${
              3 - nextAttempts
            } attempt${
              3 - nextAttempts === 1
                ? ''
                : 's'
            } remaining.`
          );

          setOtpStep('sent');
        }

        return;
      }


      // ======================================================
      // OTP VERIFIED
      // ======================================================

      setOtpStep('processing');

      await sleep(900);


      // ======================================================
      // PENDING REVIEW
      // ======================================================

      if (
        response.status ===
        'pending_review'
      ) {

        setOtpStep(
          'pending_review'
        );

        setReference(
          response.reference ||
          otpReference
        );

        setResultStatus(
          'pending_review'
        );

        toast.success(
          'Transfer submitted for review'
        );

        return;
      }


      // ======================================================
      // COMPLETED
      // ======================================================

      if (
        response.status ===
        'completed'
      ) {

        setOtpStep(
          'completed'
        );

        setReference(
          response.reference ||
          otpReference
        );

        setResultStatus(
          'completed'
        );

        toast.success(
          'Transfer completed'
        );

        await fetchAccounts();

        return;
      }


      // ------------------------------------------------------
      // UNKNOWN STATUS
      // ------------------------------------------------------

      setOtpError(
        'The transfer returned an unexpected status.'
      );

      setOtpStep('sent');

    } catch (err) {

      setOtpError(
        err?.error ||
        err?.message ||
        'Unable to verify this transaction.'
      );

      setOtpStep('sent');

    } finally {

      setOtpLoading(false);
    }
  };


  // ==========================================================
  // CLOSE OTP MODAL
  // ==========================================================

  const closeOtpModal = () => {

    if (
      otpStep === 'verifying' ||
      otpStep === 'processing'
    ) {
      return;
    }


    setOtpModalOpen(false);

    setOtpStep('idle');

    setOtpCode('');
    setOtpError('');

    setOtpReference('');
  };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (fetching) {

    return (
      <div className="flex items-center justify-center h-64">

        <Loader2
          className="h-8 w-8 animate-spin text-primary-600"
        />

      </div>
    );
  }


  // ==========================================================
  // NO ACCOUNTS
  // ==========================================================

  if (accounts.length === 0) {

    return (
      <div className="max-w-2xl mx-auto">

        <div className="card text-center py-12">

          <Wallet
            className="h-12 w-12 text-gray-400 mx-auto mb-4"
          />

          <h3 className="text-lg font-semibold text-gray-900">
            No Accounts Available
          </h3>

          <p className="text-gray-500 mt-2">
            You need an account before you can
            transfer money.
          </p>

        </div>

      </div>
    );
  }


  // ==========================================================
  // MAIN
  // ==========================================================

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">


      {/* ======================================================
          HEADER
          ====================================================== */}

      <div>

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center">

            <Send
              className="h-5 w-5 text-primary-600"
            />

          </div>

          <div>

            <h1 className="text-2xl font-bold text-gray-900">
              Transfer Money
            </h1>

            <p className="text-gray-500 mt-0.5">
              Transfer money to another account
              within the bank.
            </p>

          </div>

        </div>

      </div>


      {/* ======================================================
          SUCCESS
          ====================================================== */}

      {success && (

        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">

          <CheckCircle
            className="h-5 w-5 text-green-600 mt-0.5"
          />

          <div>

            <p className="font-medium text-green-800">
              {success}
            </p>

            {reference && (

              <p className="text-xs text-green-700 mt-1">
                Reference: {reference}
              </p>

            )}

          </div>

        </div>

      )}


      {/* ======================================================
          ERROR
          ====================================================== */}

      {error && (

        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">

          <AlertCircle
            className="h-5 w-5 text-red-600 mt-0.5"
          />

          <p className="text-sm text-red-700">
            {error}
          </p>

        </div>

      )}


      {/* ======================================================
          TRANSFER FORM
          ====================================================== */}

      <form
        onSubmit={handleTransferSubmit}
        className="card space-y-6"
      >


        {/* ====================================================
            FROM ACCOUNT
            ==================================================== */}

        <div>

          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            From Account
          </label>

          <select
            value={fromAccount}
            onChange={(e) =>
              setFromAccount(e.target.value)
            }
            className="input-field"
          >

            {accounts.map((account) => (

              <option
                key={account.id}
                value={account.id}
              >

                {account.account_type} —{' '}
                {formatCurrency(account.balance)}

              </option>

            ))}

          </select>


          <div className="flex justify-between mt-2">

            <p className="text-xs text-gray-500">
              Available balance
            </p>

            <p className="text-xs font-medium text-gray-700">
              {formatCurrency(
                availableBalance
              )}
            </p>

          </div>

        </div>


        {/* ====================================================
            RECIPIENT
            ==================================================== */}

        <div>

          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Recipient Account Number
          </label>

          <div className="relative">

            <input
              type="text"
              inputMode="numeric"
              value={recipientAccountNumber}
              onChange={(e) =>
                 setRecipientAccountNumber(e.target.value)
                }
              className="input-field pr-11"
              placeholder="Enter account number"
              required
            />


            {accountCheckLoading && (

              <Loader2
                className="
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  h-5
                  w-5
                  animate-spin
                  text-primary-600
                "
              />

            )}


            {accountCheckResult?.exists && (

              <CheckCircle
                className="
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  h-5
                  w-5
                  text-green-600
                "
              />

            )}

          </div>


          {/* RECIPIENT FOUND */}

          {accountCheckResult?.exists && (

            <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-4">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">

                  <User
                    className="h-5 w-5 text-green-600"
                  />

                </div>

                <div>

                  <p className="text-sm font-semibold text-green-900">
                    {accountCheckResult.owner_name}
                  </p>

                  <p className="text-xs text-green-700 mt-0.5">
                    {accountCheckResult.account_type}
                  </p>

                </div>

              </div>

            </div>

          )}


          {accountCheckError && (

            <p className="text-sm text-red-600 mt-2">
              {accountCheckError}
            </p>

          )}

        </div>


        {/* ====================================================
            AMOUNT
            ==================================================== */}

        <div>

          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Amount (USD)
          </label>

          <div className="relative">

            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              $
            </span>

            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
              }
              className="input-field pl-8"
              placeholder="0.00"
              required
            />

          </div>

        </div>


        {/* ====================================================
            DESCRIPTION
            ==================================================== */}

        <div>

          <label className="block text-sm font-medium text-gray-700 mb-1.5">

            Description

            <span className="text-gray-400 text-xs ml-1">
              (optional)
            </span>

          </label>

          <input
            type="text"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            className="input-field"
            placeholder="e.g. Payment for services"
          />

        </div>


        {/* ====================================================
            SECURITY MESSAGE
            ==================================================== */}

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">

          <div className="flex gap-3">

            <ShieldCheck
              className="h-5 w-5 text-gray-500 shrink-0"
            />

            <div>

              <p className="text-sm font-medium text-gray-800">
                Transfer verification
              </p>

              <p className="text-xs text-gray-500 mt-1 leading-5">
                After you continue, a verification
                code will be sent to your registered
                email address.
              </p>

            </div>

          </div>

        </div>


        {/* ====================================================
            INITIALIZATION STATUS
            ==================================================== */}

        {loading && (

          <div className="border border-primary-100 bg-primary-50 rounded-xl p-4">

            <div className="space-y-3">


              <InitializationStep
                active={
                  initializationStep ===
                  'preparing'
                }
                completed={[
                  'verifying_recipient',
                  'creating_transfer',
                  'sending_otp'
                ].includes(
                  initializationStep
                )}
                icon={
                  <Wallet className="h-4 w-4" />
                }
                label="Preparing transfer"
              />


              <InitializationStep
                active={
                  initializationStep ===
                  'verifying_recipient'
                }
                completed={[
                  'creating_transfer',
                  'sending_otp'
                ].includes(
                  initializationStep
                )}
                icon={
                  <Search className="h-4 w-4" />
                }
                label="Verifying recipient"
              />


              <InitializationStep
                active={
                  initializationStep ===
                  'creating_transfer'
                }
                completed={
                  initializationStep ===
                  'sending_otp'
                }
                icon={
                  <ArrowRight className="h-4 w-4" />
                }
                label="Creating transfer"
              />


              <InitializationStep
                active={
                  initializationStep ===
                  'sending_otp'
                }
                completed={false}
                icon={
                  <Mail className="h-4 w-4" />
                }
                label="Sending verification code"
              />

            </div>

          </div>

        )}


        {/* ====================================================
            SUBMIT
            ==================================================== */}

        <button
          type="submit"
          disabled={
            loading ||
            accountCheckLoading
          }
          className="btn-primary w-full flex items-center justify-center gap-2"
        >

          {loading ? (

            <Loader2
              className="h-5 w-5 animate-spin"
            />

          ) : (

            <Send
              className="h-5 w-5"
            />

          )}

          {loading
            ? 'Preparing Transfer...'
            : 'Continue'}

        </button>

      </form>


      {/* ======================================================
          OTP MODAL
          ====================================================== */}

      <Modal
        isOpen={otpModalOpen}
        onClose={closeOtpModal}
        title="Verify Transfer"
        size="sm"
        position="center"
        showCloseButton={
          otpStep === 'sent' ||
          otpStep === 'completed' ||
          otpStep === 'pending_review'
        }
        closeOnOutsideClick={false}
      >


        {/* ====================================================
            OTP INPUT
            ==================================================== */}

        {otpStep === 'sent' && (

          <form
            onSubmit={handleOtpSubmit}
            className="space-y-6"
          >

            <div className="text-center">

              <div className="w-14 h-14 bg-primary-50 rounded-2xl mx-auto flex items-center justify-center">

                <Mail
                  className="h-7 w-7 text-primary-600"
                />

              </div>


              <h3 className="font-semibold text-gray-900 mt-4">
                Verify Your Transfer
              </h3>


              <p className="text-sm text-gray-500 mt-2 leading-5">
                We've sent a 6-digit verification
                code to your registered email.
              </p>

            </div>


            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) =>
                  setOtpCode(
                    e.target.value.replace(
                      /\D/g,
                      ''
                    )
                  )
                }
                className="input-field text-center text-2xl font-mono tracking-[0.35em]"
                placeholder="••••••"
                autoFocus
              />


              {otpError && (

                <p className="text-sm text-red-600 mt-2">
                  {otpError}
                </p>

              )}

            </div>


            <button
              type="submit"
              disabled={otpLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >

              {otpLoading ? (

                <Loader2
                  className="h-5 w-5 animate-spin"
                />

              ) : (

                <LockKeyhole
                  className="h-5 w-5"
                />

              )}

              {otpLoading
                ? 'Verifying...'
                : 'Verify Transfer'}

            </button>


            <p className="text-[11px] text-gray-400 text-center">
              Reference: {otpReference}
            </p>

          </form>

        )}


        {/* ====================================================
            VERIFYING
            ==================================================== */}

        {otpStep === 'verifying' && (

          <ProcessingScreen
            icon={
              <LockKeyhole className="h-7 w-7 text-primary-600" />
            }
            title="Verifying OTP"
            message="We're securely validating your verification code."
          />

        )}


        {/* ====================================================
            PROCESSING
            ==================================================== */}

        {otpStep === 'processing' && (

          <ProcessingScreen
            icon={
              <ArrowRight className="h-7 w-7 text-primary-600" />
            }
            title="Processing Transfer"
            message="Your transfer is being processed. Please don't close this window."
          />

        )}


        {/* ====================================================
            COMPLETED
            ==================================================== */}

        {otpStep === 'completed' && (

          <div className="text-center py-5">

            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">

              <CheckCircle
                className="h-9 w-9 text-green-600"
              />

            </div>


            <h3 className="text-xl font-semibold text-gray-900 mt-5">
              Transfer Successful
            </h3>


            <p className="text-sm text-gray-500 mt-2 leading-5">
              Your OTP was verified and the
              transfer has been completed.
            </p>


            <div className="bg-gray-50 rounded-xl p-3 mt-5">

              <p className="text-xs text-gray-500">
                Transaction Reference
              </p>

              <p className="text-sm font-mono font-medium text-gray-900 mt-1">
                {reference}
              </p>

            </div>


            <button
              onClick={() => {
                closeOtpModal();
                resetTransferForm();
              }}
              className="btn-primary w-full mt-5"
            >
              Done
            </button>

          </div>

        )}


        {/* ====================================================
            PENDING REVIEW
            ==================================================== */}

        {otpStep === 'pending_review' && (

          <div className="text-center py-5">

            <div className="w-16 h-16 bg-amber-100 rounded-full mx-auto flex items-center justify-center">

              <Clock
                className="h-9 w-9 text-amber-600"
              />

            </div>


            <h3 className="text-xl font-semibold text-gray-900 mt-5">
              Transfer Pending Review
            </h3>


            <p className="text-sm text-gray-500 mt-2 leading-5">
              Your OTP was verified successfully.
              The transfer now requires admin approval
              before the funds can be moved.
            </p>


            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-5 text-left">

              <div className="flex gap-3">

                <Clock
                  className="h-5 w-5 text-amber-600 shrink-0"
                />

                <div>

                  <p className="text-sm font-medium text-amber-900">
                    Awaiting approval
                  </p>

                  <p className="text-xs text-amber-800 mt-1 leading-5">
                    No money has been moved from
                    your account. The transaction will
                    only be completed if an administrator
                    approves it.
                  </p>

                </div>

              </div>

            </div>


            <div className="bg-gray-50 rounded-xl p-3 mt-4">

              <p className="text-xs text-gray-500">
                Transaction Reference
              </p>

              <p className="text-sm font-mono font-medium text-gray-900 mt-1">
                {reference}
              </p>

            </div>


            <button
              onClick={() => {
                closeOtpModal();
                resetTransferForm();
              }}
              className="btn-primary w-full mt-5"
            >
              Done
            </button>

          </div>

        )}

      </Modal>

    </div>
  );
};


// ============================================================
// INITIALIZATION STEP
// ============================================================

const InitializationStep = ({
  active,
  completed,
  icon,
  label
}) => {

  return (
    <div className="flex items-center gap-3">

      <div
        className={`
          w-8
          h-8
          rounded-full
          flex
          items-center
          justify-center
          shrink-0
          transition
          ${
            completed
              ? 'bg-green-100 text-green-600'
              : active
                ? 'bg-primary-100 text-primary-600'
                : 'bg-white text-gray-400'
          }
        `}
      >

        {completed ? (

          <CheckCircle
            className="h-4 w-4"
          />

        ) : active ? (

          <Loader2
            className="h-4 w-4 animate-spin"
          />

        ) : (

          icon

        )}

      </div>


      <p
        className={`
          text-sm
          ${
            active
              ? 'font-medium text-primary-700'
              : completed
                ? 'text-green-700'
                : 'text-gray-500'
          }
        `}
      >
        {label}
      </p>

    </div>
  );
};


// ============================================================
// PROCESSING SCREEN
// ============================================================

const ProcessingScreen = ({
  icon,
  title,
  message
}) => (

  <div className="text-center py-8">

    <div className="relative w-16 h-16 mx-auto">

      <div className="absolute inset-0 rounded-full border-4 border-gray-100" />

      <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />

      <div className="absolute inset-0 flex items-center justify-center">
        {icon}
      </div>

    </div>


    <h3 className="text-lg font-semibold text-gray-900 mt-6">
      {title}
    </h3>


    <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto leading-5">
      {message}
    </p>


    <div className="flex justify-center gap-1 mt-5">

      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />

      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />

      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />

    </div>

  </div>
);


export default Transfer;