import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  Copy,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react';

// ============================================================
// CRYPTO ASSETS
// ============================================================

const CURRENCIES = [
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    logo: 'https://cdn.jsdelivr.net/gh/prasangapokharel/crypto-icons@v1.0.0/crypto/btc.svg',
    network: 'Bitcoin Network',
  },
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    logo: 'https://cdn.jsdelivr.net/gh/prasangapokharel/crypto-icons@v1.0.0/crypto/eth.svg',
    network: 'Ethereum Network',
  },
  {
    id: 'usdt',
    name: 'Tether',
    symbol: 'USDT',
    logo: 'https://cdn.jsdelivr.net/gh/prasangapokharel/crypto-icons@v1.0.0/crypto/usdt.svg',
    network: 'Ethereum Network',
  },
  {
    id: 'ltc',
    name: 'Litecoin',
    symbol: 'LTC',
    logo: 'https://cdn.jsdelivr.net/gh/prasangapokharel/crypto-icons@v1.0.0/crypto/ltc.svg',
    network: 'Litecoin Network',
  },
  {
    id: 'bch',
    name: 'Bitcoin Cash',
    symbol: 'BCH',
    logo: 'https://cdn.jsdelivr.net/gh/prasangapokharel/crypto-icons@v1.0.0/crypto/bch.svg',
    network: 'Bitcoin Cash Network',
  },
  {
    id: 'xrp',
    name: 'XRP',
    symbol: 'XRP',
    logo: 'https://cdn.jsdelivr.net/gh/prasangapokharel/crypto-icons@v1.0.0/crypto/xrp.svg',
    network: 'XRP Ledger',
  },
];

// ============================================================
// DETERMINISTIC ADDRESS
// ============================================================

const generateDepositAddress = (userId, currencyId) => {
  const seed = `${userId}-${currencyId}`;

  let hash = 0;

  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }

  const positiveHash = Math.abs(hash);

  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  const length = 34 + (positiveHash % 9);

  let address = '';

  for (let i = 0; i < length; i++) {
    address += chars.charAt(
      Math.abs(positiveHash + i * 17) % chars.length
    );
  }

  return address;
};

// ============================================================
// ADDRESS DISPLAY
// ============================================================

const AddressBox = ({ address, copied, onCopy }) => {
  return (
    <div className="mt-3">
      <div className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 transition-colors hover:border-primary-200 hover:bg-primary-50/40">
        <div className="min-w-0 flex-1">
          <p className="break-all font-mono text-sm leading-6 text-gray-800">
            {address}
          </p>
        </div>

        <button
          type="button"
          onClick={onCopy}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all ${
            copied
              ? 'bg-green-100 text-green-700'
              : 'bg-white text-gray-500 shadow-sm ring-1 ring-gray-200 hover:bg-primary-50 hover:text-primary-600'
          }`}
          title={copied ? 'Copied' : 'Copy address'}
          aria-label={copied ? 'Copied' : 'Copy deposit address'}
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="mt-2 flex items-start gap-2 text-xs text-gray-500">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
        <span>
          This deposit address is assigned to your account. Only send the
          selected cryptocurrency to this address.
        </span>
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const Deposit = () => {
  const { user } = useAuth();

  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);
  const [depositAddress, setDepositAddress] = useState('');
  const [copied, setCopied] = useState(false);

  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false);

  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationStep, setVerificationStep] = useState('idle');

  // ----------------------------------------------------------
  // ADDRESS
  // ----------------------------------------------------------

  useEffect(() => {
    if (!user?.id || !selectedCurrency) return;

    setDepositAddress(
      generateDepositAddress(user.id, selectedCurrency.id)
    );

    setCopied(false);
  }, [user, selectedCurrency]);

  // ----------------------------------------------------------
  // SELECT CURRENCY
  // ----------------------------------------------------------

  const handleCurrencySelect = (currency) => {
    setSelectedCurrency(currency);
    setCurrencyMenuOpen(false);
    setCopied(false);
  };

  // ----------------------------------------------------------
  // COPY
  // ----------------------------------------------------------

  const copyAddress = async () => {
    if (!depositAddress) return;

    try {
      await navigator.clipboard.writeText(depositAddress);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  // ----------------------------------------------------------
  // PAYMENT VERIFICATION
  // ----------------------------------------------------------

  const handlePaymentMade = () => {
    setVerificationModalOpen(true);
    setVerificationStep('checking');

    window.setTimeout(() => {
      setVerificationStep('done');
    }, 5000);
  };

  const closeVerificationModal = () => {
    if (verificationStep === 'checking') return;

    setVerificationModalOpen(false);
    setVerificationStep('idle');
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
            <Wallet className="h-4 w-4" />
            <span>Wallet</span>
            <span className="text-gray-300">/</span>
            <span>Deposit</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Deposit Funds
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Send cryptocurrency to your dedicated deposit address.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Deposit service available
        </div>
      </div>

      {/* ======================================================
          MAIN DEPOSIT CARD
      ====================================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Card Header */}
        <div className="border-b border-gray-100 px-5 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
              <Wallet className="h-5 w-5 text-primary-600" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Deposit cryptocurrency
              </h2>

              <p className="text-sm text-gray-500">
                Select an asset to generate your deposit details.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-7">
          {/* ==================================================
              CURRENCY SELECTOR
          ================================================== */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Deposit asset
            </label>

            <div className="relative">
              <button
                type="button"
                onClick={() => setCurrencyMenuOpen((prev) => !prev)}
                className={`flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-left transition-all ${
                  currencyMenuOpen
                    ? 'border-primary-500 ring-4 ring-primary-500/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-gray-50">
                    <img
                      src={selectedCurrency.logo}
                      alt={selectedCurrency.name}
                      className="h-7 w-7 object-contain"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedCurrency.name}
                      </span>

                      <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-gray-500">
                        {selectedCurrency.symbol}
                      </span>
                    </div>

                    <p className="mt-0.5 text-xs text-gray-500">
                      {selectedCurrency.network}
                    </p>
                  </div>
                </div>

                <ChevronDown
                  className={`h-5 w-5 text-gray-400 transition-transform ${
                    currencyMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {currencyMenuOpen && (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                  <div className="max-h-80 overflow-y-auto p-1.5">
                    {CURRENCIES.map((currency) => {
                      const active = currency.id === selectedCurrency.id;

                      return (
                        <button
                          key={currency.id}
                          type="button"
                          onClick={() => handleCurrencySelect(currency)}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition-colors ${
                            active
                              ? 'bg-primary-50'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-100 bg-white">
                              <img
                                src={currency.logo}
                                alt={currency.name}
                                className="h-6 w-6 object-contain"
                              />
                            </div>

                            <div>
                              <p
                                className={`text-sm font-semibold ${
                                  active
                                    ? 'text-primary-700'
                                    : 'text-gray-900'
                                }`}
                              >
                                {currency.name}
                              </p>

                              <p className="text-xs text-gray-500">
                                {currency.symbol} · {currency.network}
                              </p>
                            </div>
                          </div>

                          {active && (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600">
                              <Check className="h-3.5 w-3.5 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ==================================================
              SELECTED ASSET SUMMARY
          ================================================== */}

          <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-100">
                <img
                  src={selectedCurrency.logo}
                  alt={selectedCurrency.name}
                  className="h-8 w-8 object-contain"
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedCurrency.name}
                </p>

                <p className="text-xs text-gray-500">
                  {selectedCurrency.symbol} · {selectedCurrency.network}
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Your deposit address
                  </p>

                  <p className="mt-0.5 text-xs text-gray-500">
                    Send only {selectedCurrency.symbol} to this address.
                  </p>
                </div>

                <span className="hidden rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-green-700 sm:block">
                  Dedicated
                </span>
              </div>

              <AddressBox
                address={depositAddress}
                copied={copied}
                onCopy={copyAddress}
              />
            </div>
          </div>

          {/* ==================================================
              WARNING
          ================================================== */}

          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>

            <div>
              <p className="text-sm font-semibold text-amber-900">
                Check the network before sending
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-800">
                Sending an unsupported asset or using the wrong network may
                result in permanent loss of funds. Make sure the asset and
                network selected by your wallet match the details shown above.
              </p>
            </div>
          </div>

          {/* ==================================================
              PAYMENT PROCESS
          ================================================== */}

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-600">
                01
              </div>

              <p className="text-sm font-semibold text-gray-900">
                Select asset
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Choose the cryptocurrency you want to deposit.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-600">
                02
              </div>

              <p className="text-sm font-semibold text-gray-900">
                Send funds
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Send your funds to the dedicated address shown above.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-600">
                03
              </div>

              <p className="text-sm font-semibold text-gray-900">
                Confirm payment
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Notify the system after sending your payment for verification.
              </p>
            </div>
          </div>

          {/* ==================================================
              ACTION
          ================================================== */}

          <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <ShieldCheck className="h-4 w-4 text-gray-400" />
              <span>Payment confirmation is processed securely.</span>
            </div>

            <button
              type="button"
              onClick={handlePaymentMade}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary-500/20 active:scale-[0.99]"
            >
              <CheckCircle2 className="h-4 w-4" />
              I have made the payment
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================
          VERIFICATION MODAL
      ====================================================== */}

      <Modal
        isOpen={verificationModalOpen}
        onClose={closeVerificationModal}
        title="Payment Verification"
        size="sm"
        position="center"
        showCloseButton={verificationStep === 'done'}
        closeOnOutsideClick={false}
      >
        <div className="px-1 py-5 text-center">
          {verificationStep === 'checking' && (
            <>
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900">
                Checking payment
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                We are checking the payment status in the background. This
                process may take a few moments.
              </p>

              <div className="mx-auto mt-5 flex max-w-xs items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-left">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gray-400" />

                <p className="text-xs text-gray-500">
                  Do not close or submit the payment again.
                </p>
              </div>
            </>
          )}

          {verificationStep === 'done' && (
            <>
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900">
                Payment submitted for verification
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                Your payment notification has been received and is being
                checked in the background.
              </p>

              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-left">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />

                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      What happens next?
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Once the transaction receives the required network
                      confirmations, your balance will be updated.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={closeVerificationModal}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                <Check className="h-4 w-4" />
                Understood
              </button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Deposit;