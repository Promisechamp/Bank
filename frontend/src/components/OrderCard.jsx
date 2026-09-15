import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  MapPin,
  Globe,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Truck,
  AlertCircle,
  ChevronDown,
  Copy,
  Check,
  Sparkles,
  LockKeyhole,
  Wallet,
  Clock3,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cardTrackingAPI } from '../api';

const CARD_FEE = 10;

const PRIMARY = {
  50: '#EEF2FF',
  100: '#E0E7FF',
  200: '#C7D2FE',
  300: '#A5B4FC',
  400: '#818CF8',
  500: '#4F46E5',
  600: '#4338CA',
  700: '#3730A3',
  800: '#312E81',
  900: '#1E1B4B',
};

const PAYMENT_CURRENCIES = [
  {
    value: 'BTC',
    label: 'Bitcoin',
    symbol: 'BTC',
    logo: '₿',
    description: 'Bitcoin network',
  },
  {
    value: 'ETH',
    label: 'Ethereum',
    symbol: 'ETH',
    logo: '◆',
    description: 'Ethereum network',
  },
  {
    value: 'USDT',
    label: 'Tether',
    symbol: 'USDT',
    logo: '₮',
    description: 'USDT network',
  },
  {
    value: 'LTC',
    label: 'Litecoin',
    symbol: 'LTC',
    logo: 'Ł',
    description: 'Litecoin network',
  },
  {
    value: 'BCH',
    label: 'Bitcoin Cash',
    symbol: 'BCH',
    logo: '₿',
    description: 'Bitcoin Cash network',
  },
  {
    value: 'XRP',
    label: 'XRP',
    symbol: 'XRP',
    logo: 'X',
    description: 'XRP network',
  },
];

const COUNTRIES = [
  { value: 'NG', label: 'Nigeria', flag: '🇳🇬' },
  { value: 'US', label: 'United States', flag: '🇺🇸' },
  { value: 'GB', label: 'United Kingdom', flag: '🇬🇧' },
  { value: 'CA', label: 'Canada', flag: '🇨🇦' },
  { value: 'GH', label: 'Ghana', flag: '🇬🇭' },
  { value: 'ZA', label: 'South Africa', flag: '🇿🇦' },
  { value: 'KE', label: 'Kenya', flag: '🇰🇪' },
  { value: 'OTHER', label: 'Other', flag: '🌎' },
];

const initialForm = {
  cardholderName: '',
  cardAddress: '',
  cardCity: '',
  cardState: '',
  cardZip: '',
  cardCountry: 'NG',
  paymentCurrency: 'USDT',
};

const generateWallet = (currency) => {
  const chars =
    '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  const randomPart = (length) =>
    Array.from(
      { length },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('');

  switch (currency) {
    case 'BTC':
      return `btc-${randomPart(32)}`;
    case 'ETH':
      return `eth-${randomPart(36)}`;
    case 'USDT':
      return `usdt-${randomPart(34)}`;
    case 'LTC':
      return `ltc-${randomPart(32)}`;
    case 'BCH':
      return `bch-${randomPart(32)}`;
    case 'XRP':
      return `xrp-${randomPart(30)}`;
    default:
      return `wallet-${randomPart(36)}`;
  }
};

const OrderCard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState(() => ({
    ...initialForm,
    cardholderName:
      user?.name ||
      user?.full_name ||
      `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
  }));

  const [step, setStep] = useState(1);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [hasExistingOrder, setHasExistingOrder] = useState(false);
  const [checkingOrder, setCheckingOrder] = useState(true);
  const isProcessing = useRef(false);

  const [walletAddress, setWalletAddress] = useState('');
  const [copied, setCopied] = useState(false);

  const selectedCurrency = useMemo(
    () =>
      PAYMENT_CURRENCIES.find(
        (currency) => currency.value === form.paymentCurrency
      ),
    [form.paymentCurrency]
  );

  // Check for existing orders on mount
  useEffect(() => {
  const checkExistingOrder = async () => {
    try {
      const response = await cardTrackingAPI.getMyCards();
						console.log(response)
      // response is { success: true, cards: [...] }
      const cards = response?.cards || [];
      if (cards.length > 0) {
        setHasExistingOrder(true);
      }
    } catch (err) {
      console.error('Error checking existing orders:', err);
      setHasExistingOrder(false);
    } finally {
      setCheckingOrder(false);
    }
  };
  checkExistingOrder();
}, []);

  useEffect(() => {
    if (step === 2 && !walletAddress) {
      setWalletAddress(generateWallet(form.paymentCurrency));
    }
  }, [step, walletAddress, form.paymentCurrency]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError('');
  };

  const handleCurrencyChange = (currency) => {
    setForm((prev) => ({
      ...prev,
      paymentCurrency: currency,
    }));

    setWalletAddress(generateWallet(currency));
    setError('');
  };

  const validateShipping = () => {
    if (!form.cardholderName.trim()) {
      setError('Please enter the cardholder name.');
      return false;
    }

    if (!form.cardAddress.trim()) {
      setError('Please enter your delivery address.');
      return false;
    }

    if (!form.cardCity.trim()) {
      setError('Please enter your city.');
      return false;
    }

    if (!form.cardState.trim()) {
      setError('Please enter your state or province.');
      return false;
    }

    if (!form.cardZip.trim()) {
      setError('Please enter your postal/ZIP code.');
      return false;
    }

    if (!form.cardCountry) {
      setError('Please select your country.');
      return false;
    }

    return true;
  };

  const continueToPayment = () => {
    if (!validateShipping()) return;

    setError('');
    setWalletAddress(generateWallet(form.paymentCurrency));
    setStep(2);
  };

  const regenerateWallet = () => {
    setWalletAddress(generateWallet(form.paymentCurrency));
    setCopied(false);
  };

  const copyWallet = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const placeOrder = async () => {
    // Guards against double ordering
    if (orderPlaced) {
      setError('You have already placed an order. Please track your card.');
      return;
    }
    if (isProcessing.current) return;
    isProcessing.current = true;

    if (!validateShipping()) {
      setStep(1);
      isProcessing.current = false;
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        card_type: 'debit',
        card_brand: 'TRUSTYCDU BANK',
        cardholder_name: form.cardholderName.trim(),
        card_fee: CARD_FEE,
        currency: 'USD',
        payment_currency: form.paymentCurrency,
        payment_status: 'pending',
        shipping_address: form.cardAddress.trim(),
        shipping_city: form.cardCity.trim(),
        shipping_state: form.cardState.trim(),
        shipping_postal_code: form.cardZip.trim(),
        shipping_country: form.cardCountry,
        order_status: 'pending',
        tracking_status: 'order_placed',
        tracking_events: [
          {
            status: 'order_placed',
            title: 'Order placed',
            description: 'Your card order has been received.',
            timestamp: new Date().toISOString(),
          },
        ],
      };

      const response = await cardTrackingAPI.create(payload);

      const createdOrder =
        response?.data ||
        response?.card ||
        response?.order ||
        response;

      setOrder(createdOrder);
      setOrderPlaced(true);

      setStep(3);

      setTimeout(() => {
        setStep(4);
        setLoading(false);
        isProcessing.current = false;
      }, 3000);
    } catch (err) {
      console.error('Card order error:', err);

      const message =
        err?.message ||
        err?.error ||
        err?.data?.message ||
        'Unable to place your card order. Please try again.';

      setError(message);
      setLoading(false);
      isProcessing.current = false;
    }
  };

  const viewTracking = () => {
    if (order?.id) {
      navigate(`/card-tracking/${order.id}`);
    } else {
      navigate('/card-tracking');
    }
  };

  const handleBackToStep1 = () => {
    if (orderPlaced) {
      setError('Order already placed. Please track your card.');
      return;
    }
    setStep(1);
  };

  // Show loading while checking for existing orders
  if (checkingOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // If an existing order exists, show the "already ordered" screen
  if (hasExistingOrder) {
    return (
      <div className="min-h-screen px-0 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* TOP NAV */}
          <div className="mb-7 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur transition hover:bg-white hover:text-slate-900"
            >
              <ArrowLeft size={17} />
              Back
            </button>
            <div className="hidden items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-4 py-2 text-xs font-bold text-indigo-700 shadow-sm sm:flex">
              <ShieldCheck size={15} />
              Secure card ordering
            </div>
          </div>

          {/* HEADER */}
          <div className="mb-8">
            <div className="flex items-start gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
                style={{
                  background:
                    'linear-gradient(135deg, #4F46E5 0%, #312E81 100%)',
                }}
              >
                <CreditCard size={27} />
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                    Premium Card
                  </span>
                  <Sparkles size={14} className="text-indigo-500" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  Your Card Order
                </h1>
                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                  You already have a card order in progress. Track its status below.
                </p>
              </div>
            </div>
          </div>

          {/* REPLACEMENT CONTENT */}
          <div className="overflow-hidden rounded-3xl border border-white/80 bg-white shadow-xl shadow-indigo-100/40 p-8 sm:p-12 text-center">
            <div className="mx-auto max-w-md">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-sm">
                <CheckCircle2 size={42} />
              </div>
              <h2 className="mt-6 text-2xl font-black text-slate-900">
                Card Already Ordered
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                You have already placed an order for a physical card. Please track its delivery progress.
              </p>
              <button
                type="button"
                onClick={() => navigate('/card-tracking')}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5"
                style={{
                  background:
                    'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
                }}
              >
                Track my card
                <ArrowLeft size={17} className="rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- NORMAL ORDER FLOW (unchanged) ----------
  return (
    <div className="min-h-screen px-0 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* TOP NAV */}
        <div className="mb-7 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur transition hover:bg-white hover:text-slate-900"
          >
            <ArrowLeft size={17} />
            Back
          </button>

          <div className="hidden items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-4 py-2 text-xs font-bold text-indigo-700 shadow-sm sm:flex">
            <ShieldCheck size={15} />
            Secure card ordering
          </div>
        </div>

        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-start gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
              style={{
                background:
                  'linear-gradient(135deg, #4F46E5 0%, #312E81 100%)',
              }}
            >
              <CreditCard size={27} />
            </div>

            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                  Premium Card
                </span>

                <Sparkles size={14} className="text-indigo-500" />
              </div>

              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Order your card
              </h1>

              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Get your physical card delivered securely to your preferred
                address.
              </p>
            </div>
          </div>
        </div>

        {/* PROGRESS */}
        <div className="mb-7 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
          <div className="grid grid-cols-4">
            <StepIndicator
              number="1"
              label="Delivery"
              active={step >= 1}
              completed={step > 1}
            />

            <StepIndicator
              number="2"
              label="Payment"
              active={step >= 2}
              completed={step > 2}
            />

            <StepIndicator
              number="3"
              label="Processing"
              active={step >= 3}
              completed={step > 3}
            />

            <StepIndicator
              number="4"
              label="Complete"
              active={step >= 4}
              completed={step >= 4}
            />
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-7 lg:grid-cols-[1fr_370px]">
          {/* MAIN */}
          <div className="overflow-hidden rounded-3xl border border-white/80 bg-white shadow-xl shadow-indigo-100/40">
            {/* STEP 1 */}
            {step === 1 && (
              <div className="p-5 sm:p-8">
                <SectionHeading
                  eyebrow="STEP 01"
                  title="Delivery information"
                  description="Tell us where you would like your physical card delivered."
                />

                <div className="space-y-5">
                  <Input
                    label="Cardholder name"
                    name="cardholderName"
                    value={form.cardholderName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Delivery address
                      <span className="ml-1 text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <MapPin
                        size={18}
                        className="absolute left-4 top-3.5 text-indigo-400"
                      />

                      <input
                        type="text"
                        name="cardAddress"
                        value={form.cardAddress}
                        onChange={handleChange}
                        placeholder="Street address"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                      label="City"
                      name="cardCity"
                      value={form.cardCity}
                      onChange={handleChange}
                      placeholder="City"
                      required
                    />

                    <Input
                      label="State / Province"
                      name="cardState"
                      value={form.cardState}
                      onChange={handleChange}
                      placeholder="State or province"
                      required
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                      label="Postal / ZIP code"
                      name="cardZip"
                      value={form.cardZip}
                      onChange={handleChange}
                      placeholder="Postal code"
                      required
                    />

                    <CustomSelect
                      label="Country"
                      icon={<Globe size={17} />}
                      value={form.cardCountry}
                      options={COUNTRIES}
                      onChange={(value) =>
                        handleChange({
                          target: {
                            name: 'cardCountry',
                            value,
                          },
                        })
                      }
                      renderSelected={(country) => (
                        <>
                          <span className="text-lg">{country?.flag}</span>
                          <span>{country?.label}</span>
                        </>
                      )}
                      renderOption={(country) => (
                        <>
                          <span className="text-lg">{country.flag}</span>
                          <span>{country.label}</span>
                        </>
                      )}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={continueToPayment}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
                  style={{
                    background:
                      'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
                  }}
                >
                  Continue to payment
                  <ArrowLeft size={17} className="rotate-180" />
                </button>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="p-5 sm:p-8">
                <SectionHeading
                  eyebrow="STEP 02"
                  title="Payment"
                  description="Choose the currency for this payment."
                />

                {/* PRICE */}
                <div
                  className="mb-6 rounded-2xl p-5 text-white shadow-lg"
                  style={{
                    background:
                      'linear-gradient(135deg, #1E1B4B 0%, #3730A3 55%, #4F46E5 100%)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
                        Card order fee
                      </p>

                      <p className="mt-1 text-3xl font-black">
                        ${CARD_FEE.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                      <CreditCard size={24} />
                    </div>
                  </div>
                </div>

                {/* CUSTOM CURRENCY SELECT */}
                <CustomSelect
                  label="Payment currency"
                  icon={<Wallet size={17} />}
                  value={form.paymentCurrency}
                  options={PAYMENT_CURRENCIES}
                  onChange={handleCurrencyChange}
                  renderSelected={(currency) => (
                    <>
                      <CurrencyLogo currency={currency} />
                      <div className="text-left">
                        <p className="font-bold text-slate-900">
                          {currency?.label}
                        </p>
                        <p className="text-xs text-slate-400">
                          {currency?.symbol}
                        </p>
                      </div>
                    </>
                  )}
                  renderOption={(currency) => (
                    <>
                      <CurrencyLogo currency={currency} />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900">
                          {currency.label}
                        </p>
                        <p className="text-xs text-slate-400">
                          {currency.description}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-indigo-500">
                        {currency.symbol}
                      </span>
                    </>
                  )}
                />

                {/* WALLET */}
                <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                          <Wallet size={18} />
                        </div>

                        <div>
                          <p className="text-sm font-black text-slate-900">
                            Payment address
                          </p>

                          <p className="text-xs text-slate-500">
                            {selectedCurrency?.label}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={regenerateWallet}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm transition hover:bg-indigo-50"
                      title="Generate another address"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>

                  <div className="mt-4 rounded-xl border border-indigo-100 bg-white p-3">
                    <div className="flex items-center gap-2">
                      <code className="min-w-0 flex-1 break-all text-xs font-semibold leading-5 text-slate-700">
                        {walletAddress}
                      </code>

                      <button
                        type="button"
                        onClick={copyWallet}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition hover:bg-indigo-100"
                        title="Copy address"
                      >
                        {copied ? (
                          <Check size={16} />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* IMPORTANT WARNING */}
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex gap-3">
                      <AlertCircle
                        size={19}
                        className="mt-0.5 shrink-0 text-amber-600"
                      />

                      <div>
                        <p className="text-sm font-black text-amber-900">
                          Crypto address — account specific
                        </p>

                        <p className="mt-1 text-xs leading-5 text-amber-800">
                          This address is generated for this account
                          and this payment only. Sending funds to
                          a different address may result in permanent loss of money.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* NOTICE */}
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex gap-3">
                    <ShieldCheck
                      size={19}
                      className="mt-0.5 shrink-0 text-indigo-600"
                    />

                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Security
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        This payment is protected
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleBackToStep1}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={placeOrder}
                    disabled={loading || orderPlaced}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      background:
                        'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Creating order...
                      </>
                    ) : orderPlaced ? (
                      'Order placed'
                    ) : (
                      <>
                        Place order
                        <ArrowLeft size={17} className="rotate-180" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 - PROCESSING */}
            {step === 3 && (
              <div className="p-8 sm:p-14">
                <div className="mx-auto max-w-md text-center">
                  <div className="relative mx-auto h-24 w-24">
                    <div className="absolute inset-0 animate-ping rounded-full bg-indigo-100" />

                    <div
                      className="relative flex h-24 w-24 items-center justify-center rounded-full text-white shadow-xl"
                      style={{
                        background:
                          'linear-gradient(135deg, #4F46E5 0%, #312E81 100%)',
                      }}
                    >
                      <Loader2 size={38} className="animate-spin" />
                    </div>
                  </div>

                  <div className="mt-7">
                    <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-indigo-600">
                      Processing payment
                    </span>

                    <h2 className="mt-4 text-2xl font-black text-slate-900">
                      Processing your order
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      We are simulating the payment processing and preparing
                      your card order record.
                    </p>
                  </div>

                  <div className="mt-8 space-y-3 text-left">
                    <ProcessingRow
                      icon={<Check size={16} />}
                      title="Order submitted"
                      description="Your card request was received."
                      completed
                    />

                    <ProcessingRow
                      icon={<Loader2 size={16} className="animate-spin" />}
                      title="Processing payment"
                      description="Transaction is protected."
                      active
                    />

                    <ProcessingRow
                      icon={<Clock3 size={16} />}
                      title="Preparing confirmation"
                      description="Waiting for processing to complete."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4 - COMPLETE */}
            {step === 4 && (
              <div className="p-7 sm:p-12">
                <div className="mx-auto max-w-lg text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-sm">
                    <CheckCircle2 size={42} />
                  </div>

                  <div className="mt-6">
                    <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-emerald-700">
                      Order created
                    </span>

                    <h2 className="mt-4 text-2xl font-black text-slate-900">
                      Your card order is confirmed
                    </h2>

                    <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                      Your card order has been successfully created and
                      added to your tracking history.
                    </p>
                  </div>

                  {order?.order_id && (
                    <div className="mt-7 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
                        Order reference
                      </p>

                      <p className="mt-2 font-mono text-lg font-black tracking-wide text-indigo-900">
                        {order.order_id}
                      </p>
                    </div>
                  )}

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm">
                    <div className="flex gap-3">
                      <Truck
                        size={21}
                        className="mt-0.5 shrink-0 text-indigo-600"
                      />

                      <div>
                        <p className="text-sm font-black text-slate-900">
                          Delivery tracking
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          Follow your card order and delivery progress from
                          your card tracking page.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={viewTracking}
                    className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5"
                    style={{
                      background:
                        'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
                    }}
                  >
                    Track my card
                    <ArrowLeft size={17} className="rotate-180" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* PREMIUM CARD / SUMMARY */}
          <aside className="h-fit lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-3xl border border-white/80 bg-white shadow-xl shadow-indigo-100/50">
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
                      Your card
                    </p>

                    <h3 className="mt-1 text-lg font-black text-slate-900">
                      Premium Debit Card
                    </h3>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Sparkles size={17} />
                  </div>
                </div>

                {/* PREMIUM CARD */}
                <div
                  className="group relative mt-5 aspect-[1.58/1] overflow-hidden rounded-2xl p-5 text-white shadow-2xl"
                  style={{
                    background:
                      'linear-gradient(135deg, #1E1B4B 0%, #312E81 42%, #4F46E5 100%)',
                  }}
                >
                  {/* decorative glow */}
                  <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-400/20 blur-2xl" />
                  <div className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-purple-400/20 blur-2xl" />

                  {/* card shine */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />

                  <div className="relative flex items-start justify-between">
                    <div>
                      <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-white/50">
                        Premium
                      </p>

                      <p className="mt-1 text-sm font-black tracking-[0.15em]">
                        TRUSTYCDU BANK
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <div className="h-5 w-5 rounded-full border border-white/40 bg-white/20" />
                      <CreditCard
                        size={22}
                        className="text-white/80"
                      />
                    </div>
                  </div>

                  {/* chip */}
                  <div className="relative mt-8 h-7 w-10 overflow-hidden rounded-md border border-white/20 bg-gradient-to-br from-white/50 to-white/10 shadow-inner">
                    <div className="absolute left-1/2 top-0 h-full w-px bg-white/30" />
                    <div className="absolute left-0 top-1/2 h-px w-full bg-white/30" />
                  </div>

                  <div className="relative mt-4">
                    <p className="font-mono text-sm tracking-[0.22em] text-white/90">
                      •••• •••• •••• ••••
                    </p>
                  </div>

                  <div className="relative mt-4 flex items-end justify-between">
                    <div className="min-w-0">
                      <p className="text-[7px] uppercase tracking-wider text-white/40">
                        Cardholder
                      </p>

                      <p className="mt-1 max-w-[170px] truncate text-[10px] font-bold uppercase tracking-wider">
                        {form.cardholderName || 'YOUR NAME'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[7px] uppercase tracking-wider text-white/40">
                        Type
                      </p>

                      <p className="mt-1 text-[10px] font-bold">
                        DEBIT
                      </p>
                    </div>
                  </div>
                </div>

                {/* SUMMARY */}
                <div className="my-5 h-px bg-slate-100" />

                <div className="space-y-4">
                  <SummaryRow
                    label="Card fee"
                    value={`$${CARD_FEE.toFixed(2)}`}
                  />

                  <SummaryRow
                    label="Payment currency"
                    value={form.paymentCurrency}
                  />

                  <SummaryRow
                    label="Delivery"
                    value="5–7 business days"
                  />

                  <SummaryRow
                    label="Card type"
                    value="Premium Debit"
                  />
                </div>

                <div className="my-5 h-px bg-slate-100" />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900">
                    Total
                  </span>

                  <span className="text-2xl font-black text-indigo-600">
                    ${CARD_FEE.toFixed(2)}
                  </span>
                </div>

                {/* SECURITY */}
                <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                  <div className="flex gap-3">
                    <LockKeyhole
                      size={18}
                      className="mt-0.5 shrink-0 text-indigo-600"
                    />

                    <div>
                      <p className="text-xs font-black text-indigo-900">
                        Secure card information
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-indigo-700/80">
                        Sensitive card authentication information is never
                        stored in the tracking record.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   HELPER COMPONENTS (unchanged)
========================================================= */

const SectionHeading = ({ eyebrow, title, description }) => {
  return (
    <div className="mb-7">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
        {eyebrow}
      </p>

      <h2 className="mt-1.5 text-xl font-black tracking-tight text-slate-900">
        {title}
      </h2>

      <p className="mt-1.5 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
};

const StepIndicator = ({ number, label, active, completed }) => {
  return (
    <div
      className={`relative flex items-center justify-center gap-2 border-b-2 px-2 py-4 transition sm:px-4 ${
        active
          ? 'border-indigo-600 bg-indigo-50/40'
          : 'border-transparent bg-white'
      }`}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition ${
          active
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
            : 'bg-slate-100 text-slate-400'
        }`}
      >
        {completed ? <CheckCircle2 size={16} /> : number}
      </div>

      <span
        className={`hidden text-xs font-bold sm:block ${
          active ? 'text-indigo-700' : 'text-slate-400'
        }`}
      >
        {label}
      </span>
    </div>
  );
};

const Input = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
}) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
      />
    </div>
  );
};

const CustomSelect = ({
  label,
  icon,
  value,
  options,
  onChange,
  renderSelected,
  renderOption,
}) => {
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.value === value);

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center gap-3 rounded-xl border bg-slate-50/50 px-4 py-3 text-left outline-none transition ${
          open
            ? 'border-indigo-500 bg-white ring-4 ring-indigo-500/10'
            : 'border-slate-200 hover:border-indigo-200 hover:bg-white'
        }`}
      >
        {icon && (
          <span className="shrink-0 text-indigo-500">
            {icon}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {renderSelected(selected)}
          </div>
        </div>

        <ChevronDown
          size={17}
          className={`shrink-0 text-slate-400 transition ${
            open ? 'rotate-180 text-indigo-500' : ''
          }`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close select"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div className="absolute left-0 right-0 z-40 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-900/10">
            {options.map((option) => {
              const selectedOption = option.value === value;

              return (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                    selectedOption
                      ? 'bg-indigo-50'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {renderOption(option)}

                  {selectedOption && (
                    <Check
                      size={17}
                      className="ml-auto shrink-0 text-indigo-600"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

const CurrencyLogo = ({ currency }) => {
  if (!currency) return null;

  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black text-white shadow-sm"
      style={{
        background:
          'linear-gradient(135deg, #4F46E5 0%, #312E81 100%)',
      }}
    >
      {currency.logo}
    </div>
  );
};

const SummaryRow = ({ label, value }) => {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>

      <span className="text-right font-bold text-slate-900">
        {value}
      </span>
    </div>
  );
};

const ProcessingRow = ({
  icon,
  title,
  description,
  completed = false,
  active = false,
}) => {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 ${
        completed
          ? 'border-emerald-100 bg-emerald-50/50'
          : active
            ? 'border-indigo-100 bg-indigo-50/60'
            : 'border-slate-100 bg-slate-50'
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          completed
            ? 'bg-emerald-100 text-emerald-600'
            : active
              ? 'bg-indigo-100 text-indigo-600'
              : 'bg-slate-200 text-slate-400'
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-black text-slate-900">
          {title}
        </p>

        <p className="mt-0.5 text-[11px] text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
};

export default OrderCard;