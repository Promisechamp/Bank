// orderCard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import Modal from './Modal';
import {
  CheckCircle,
  CreditCard,
		Wifi,
  Truck,
  Sparkles,
  ChevronRight,
  MapPin,
  User,
  Info,
  ArrowRight,
  Loader2,
  PackageCheck,
  Copy,
  Check,
  Lock,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

/* =========================================================
   CRYPTO CURRENCIES
========================================================= */
const CURRENCIES = [
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    logo: 'https://assets.coincap.io/assets/icons/btc@2x.png',
  },
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    logo: 'https://assets.coincap.io/assets/icons/eth@2x.png',
  },
  {
    id: 'usdt',
    name: 'Tether',
    symbol: 'USDT',
    logo: 'https://assets.coincap.io/assets/icons/usdt@2x.png',
  },
  {
    id: 'ltc',
    name: 'Litecoin',
    symbol: 'LTC',
    logo: 'https://assets.coincap.io/assets/icons/ltc@2x.png',
  },
  {
    id: 'bch',
    name: 'Bitcoin Cash',
    symbol: 'BCH',
    logo: 'https://assets.coincap.io/assets/icons/bch@2x.png',
  },
  {
    id: 'xrp',
    name: 'XRP',
    symbol: 'XRP',
    logo: 'https://assets.coincap.io/assets/icons/xrp@2x.png',
  },
];

/* =========================================================
   HELPERS
========================================================= */
const generateDepositAddress = (userId, currencyId) => {
  const seed = `${userId}-${currencyId}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const random = Math.abs(hash);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let address = '';
  const length = 34 + (random % 9);
  for (let i = 0; i < length; i++) {
    address += chars.charAt((random + i * 17) % chars.length);
  }
  return address;
};

const generateCardNumber = (userId = '') => {
  const seed = `${userId}-${Date.now()}-${Math.random()}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const random = Math.abs(hash);
  const part1 = String(4000 + (random % 5000)).padStart(4, '0');
  const part2 = String(1000 + ((random >> 3) % 9000)).padStart(4, '0');
  const part3 = String(1000 + ((random >> 7) % 9000)).padStart(4, '0');
  const part4 = String(1000 + ((random >> 11) % 9000)).padStart(4, '0');
  return `${part1} ${part2} ${part3} ${part4}`;
};

const generateCardSecurity = (userId = '') => {
  const seed = `${userId}-${Math.random()}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const random = Math.abs(hash);
  const month = String((random % 12) + 1).padStart(2, '0');
  const year = String(27 + (random % 5));
  const cvv = String(100 + (random % 900));
  return { expiry: `${month}/${year}`, cvv };
};

/* =========================================================
   CARD VISUAL
========================================================= */

 
 const DebitCard = ({ user, cardNumber = "5426 •••• •••• 8291", expiry = "12/30", cvv = "389" }) => {
  const holderName = (user?.full_name || user?.name || 'CARD HOLDER').toUpperCase();

  return (
    <div className="relative w-full max-w-[400px] mx-auto aspect-[1.586/1] rounded-[24px] p-6 text-white shadow-2xl overflow-hidden group transition-all duration-500 hover:scale-[1.02] hover:shadow-indigo-500/20">
      
      {/* Rich Indigo Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950 via-indigo-900 to-slate-950" />
      
      {/* Faint Gold Lines / Geometric Accents (SVG Overlay) */}
      <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="goldGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0" />
            <stop offset="50%" stopColor="#fde047" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ca8a04" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Abstract Faint Gold Lines */}
        <path d="M-50 50 Q 200 150 450 50" fill="none" stroke="url(#goldGlow)" strokeWidth="1.5" />
        <path d="M0 220 Q 220 80 440 200" fill="none" stroke="url(#goldGlow)" strokeWidth="1" />
        <path d="M100 -20 Q 300 250 350 280" fill="none" stroke="url(#goldGlow)" strokeWidth="0.75" />
      </svg>

      {/* Glowing Indigo & Gold Ambient Light Sources */}
      <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-indigo-500/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      
      {/* Glassmorphism Border Shell */}
      <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-[1px] border border-indigo-200/15 rounded-[24px]" />

      {/* Card Content Wrapper */}
      <div className="relative z-10 flex h-full flex-col justify-between">
        
        {/* Top Row: Brand & Contactless/Network */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-amber-200 to-amber-400 shadow-sm shadow-amber-300/50" />
            <span className="text-xs font-semibold tracking-[0.25em] text-indigo-200">TRUSTCDU</span>
          </div>
          <div className="flex items-center gap-3 text-indigo-300/80">
            <Wifi className="h-5 w-5 rotate-90" />
            <CreditCard className="h-6 w-6 text-indigo-100" />
          </div>
        </div>

        {/* Middle Row: Gold-accented EMV Chip & Card Number */}
        <div className="space-y-4">
          {/* Realistic Gold EMV Chip */}
          <div className="relative h-9 w-12 rounded-md bg-gradient-to-tr from-amber-300 via-yellow-100 to-amber-400 p-1 shadow-md overflow-hidden border border-amber-500/40">
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-[1px] opacity-40">
              <div className="border border-amber-900 bg-amber-200/50 rounded-[1px]" />
              <div className="border border-amber-900 bg-amber-200/50 rounded-[1px]" />
              <div className="border border-amber-900 bg-amber-200/50 rounded-[1px]" />
              <div className="border border-amber-900 bg-amber-200/50 rounded-[1px]" />
              <div className="border border-amber-900 bg-amber-300 rounded-[1px]" />
              <div className="border border-amber-900 bg-amber-200/50 rounded-[1px]" />
            </div>
          </div>

          <p className="font-mono text-md tracking-[0.2em] text-indigo-50 drop-shadow-md">
            {cardNumber}
          </p>
        </div>

        {/* Bottom Row: Card Holder & Expiry */}
        <div className="flex items-end justify-between">
          <div className="space-y-0.5">
            <p className="text-[9px] font-medium uppercase tracking-widest text-indigo-300/70">Cardholder</p>
            <p className="text-xs font-semibold tracking-wider text-indigo-100 truncate max-w-[200px]">
              {holderName}
            </p>
          </div>
          <div className="space-y-0.5 text-right">
            <p className="text-[9px] font-medium uppercase tracking-widest text-indigo-300/70">Expires</p>
            <p className="text-xs font-semibold font-mono text-indigo-100">{expiry}</p>
          </div>
        </div>

      </div>
    </div>
  );
};





/* =========================================================
   ORDER CARD MAIN COMPONENT
========================================================= */
const OrderCard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Card order state
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardOrderStep, setCardOrderStep] = useState('address');
  const [cardAddress, setCardAddress] = useState('');
  const [cardCity, setCardCity] = useState('');
  const [cardState, setCardState] = useState('');
  const [cardZip, setCardZip] = useState('');
  const [cardCountry, setCardCountry] = useState('US');
  const [cardFee] = useState(10);

  //  data
  const [Card, setCard] = useState(null);

  // Payment modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);
  const [depositAddress, setDepositAddress] = useState('');
  const [copied, setCopied] = useState(false);
  const [paymentStep, setPaymentStep] = useState('idle');
  const [error, setError] = useState('');

  // Pre-fill address from user profile when opening
  const prefillAddress = async () => {
    try {
      const profileData = await authAPI.getProfile();
      if (profileData.success && profileData.profile) {
        const p = profileData.profile;
        setCardAddress(p.address || '');
        setCardCountry(p.country || 'US');
        setCardCity(p.city || '');
        setCardState(p.state || '');
        setCardZip(p.zip || '');
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  const handleOrderCard = () => {
    prefillAddress();
    setCardOrderStep('address');
    setShowCardModal(true);
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!cardAddress || !cardCity || !cardState || !cardZip || !cardCountry) {
      setError('Please complete your shipping address.');
      return;
    }
    setCardOrderStep('review');
  };

  const handleProceedToPayment = () => {
    setShowCardModal(false);
    setPaymentModalOpen(true);
    setPaymentStep('idle');
    setSelectedCurrency(CURRENCIES[0]);
    if (user) {
      setDepositAddress(generateDepositAddress(user.id, CURRENCIES[0].id));
    }
  };

  const handlePaymentMade = () => {
    setPaymentStep('checking');
    // Simulate processing
    setTimeout(() => {
      const security = generateCardSecurity(user?.id);
      setCard({
        number: generateCardNumber(user?.id),
        expiry: security.expiry,
        cvv: security.cvv,
        orderId: `CARD-${Math.floor(100000 + Math.random() * 900000)}`,
      });
      setPaymentStep('done');
    }, 3000);
  };

  const handleCurrencySelect = (currency) => {
    setSelectedCurrency(currency);
    if (user) {
      setDepositAddress(generateDepositAddress(user.id, currency.id));
    }
    setCopied(false);
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(depositAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError('Unable to copy address.');
    }
  };

  const resetCardFlow = () => {
    setShowCardModal(false);
    setPaymentModalOpen(false);
    setPaymentStep('idle');
    setCardOrderStep('address');
    setCopied(false);
    setError('');
  };

  return (
    <>
      {/* =====================================================
          DEBIT CARD SECTION (visible on the page)
      ===================================================== */}
      <section className="relative overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            {/* Card visual */}
            <div className="w-full lg:w-[52%]" id="card">
              <DebitCard
                user={user}
                cardNumber={Card?.number || '5426 •••• •••• 8291'}
                expiry={Card?.expiry || '12/29'}
                cvv={Card?.cvv || '•••'}
              />
              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
                <ShieldCheck className="h-4 w-4" />
                <span>Sample card • No financial data until activated</span>
              </div>
            </div>

            {/* Description & order button */}
            <div className="w-full lg:w-[48%]">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 text-primary-700 px-3 py-1.5 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                Premium Card
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mt-4">
                Your banking card,<br />
                beautifully designed for convenience.
              </h2>
              <p className="text-sm text-gray-500 mt-3 leading-6">
                Order a personalized debit card using your account
                information. The card shown here is for this assignment
                and does not represent a real financial product.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                  <CreditCard className="h-5 w-5 text-gray-700" />
                  <p className="text-xs text-gray-400 mt-3">Card type</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">Debit</p>
                </div>
                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                  <Truck className="h-5 w-5 text-gray-700" />
                  <p className="text-xs text-gray-400 mt-3">Delivery</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">5–7 business days</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-400">Card fee</p>
                  <p className="text-xl font-bold text-gray-900">${cardFee.toFixed(2)}</p>
                </div>
                <button
                  onClick={handleOrderCard}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <CreditCard className="h-5 w-5" />
                  Order Card
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CARD ADDRESS + REVIEW MODAL
      ===================================================== */}
      <Modal
        isOpen={showCardModal}
        onClose={resetCardFlow}
        title={cardOrderStep === 'address' ? 'Shipping Details' : 'Review Card Order'}
        size="md"
        position="bottom"
        showCloseButton
        closeOnOutsideClick={false}
      >
        {cardOrderStep === 'address' && (
          <form onSubmit={handleAddressSubmit} className="space-y-5">
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 flex gap-3">
              <MapPin className="h-5 w-5 text-primary-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Where should we send your card?</p>
                <p className="text-xs text-gray-500 mt-1">
                  Your profile information has been used to pre-fill the form where available.
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Street address</label>
              <input
                type="text"
                value={cardAddress}
                onChange={(e) => setCardAddress(e.target.value)}
                className="input-field"
                placeholder="123 Main Street"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={cardCity}
                  onChange={(e) => setCardCity(e.target.value)}
                  className="input-field"
                  placeholder="City"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  value={cardState}
                  onChange={(e) => setCardState(e.target.value)}
                  className="input-field"
                  placeholder="State"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ZIP / Postal code</label>
                <input
                  type="text"
                  value={cardZip}
                  onChange={(e) => setCardZip(e.target.value)}
                  className="input-field"
                  placeholder="10001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <select
                  value={cardCountry}
                  onChange={(e) => setCardCountry(e.target.value)}
                  className="input-field"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="AU">Australia</option>
                  <option value="NG">Nigeria</option>
                </select>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Card fee</p>
                <p className="text-xs text-gray-400 mt-1">One-time assignment fee</p>
              </div>
              <p className="text-lg font-bold text-gray-900">${cardFee.toFixed(2)}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={resetCardFlow} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1 inline-flex items-center justify-center gap-2">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {cardOrderStep === 'review' && (
          <div className="space-y-5">
            <DebitCard user={user} cardNumber="5426 •••• •••• 8291" expiry="12/29" cvv="•••" />
            <div className="rounded-2xl border border-gray-200 divide-y divide-gray-100">
              <div className="p-4 flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Card holder</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{user?.full_name || 'Card Holder'}</p>
                </div>
              </div>
              <div className="p-4 flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Delivery address</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{cardAddress}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {cardCity}, {cardState} {cardZip}
                  </p>
                  <p className="text-xs text-gray-500">{cardCountry}</p>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <span className="text-sm text-gray-500">Card fee</span>
                <span className="font-bold text-gray-900">${cardFee.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCardOrderStep('address')}
                className="btn-secondary flex-1"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleProceedToPayment}
                className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
              >
                Proceed <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* =====================================================
          PAYMENT MODAL
      ===================================================== */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={resetCardFlow}
        title={
          paymentStep === 'idle'
            ? 'Complete Card Order'
            : paymentStep === 'checking'
            ? 'Processing Order'
            : 'Order Confirmed'
        }
        size="lg"
        position="bottom"
        showCloseButton={paymentStep === 'done'}
        closeOnOutsideClick={false}
      >
        {paymentStep === 'idle' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Amount due</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">${cardFee.toFixed(2)}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary-600" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
                <Lock className="h-3.5 w-3.5" /> Secured payment environment
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Select currency</h3>
                  <p className="text-xs text-gray-400 mt-1">Choose how you would like to make payment.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CURRENCIES.map((currency) => (
                  <button
                    key={currency.id}
                    type="button"
                    onClick={() => handleCurrencySelect(currency)}
                    className={`relative p-4 rounded-2xl border text-left transition-all ${
                      selectedCurrency.id === currency.id
                        ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    {selectedCurrency.id === currency.id && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle className="h-4 w-4 text-primary-600" />
                      </div>
                    )}
                    <img
                      src={currency.logo}
                      alt={currency.name}
                      className="w-9 h-9 object-contain"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    <p className="text-sm font-semibold text-gray-900 mt-3">{currency.symbol}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{currency.name}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Payment address</label>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                  {selectedCurrency.symbol}
                </span>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 flex items-center gap-3">
                <p className="font-mono text-xs sm:text-sm text-gray-700 break-all flex-1">{depositAddress}</p>
                <button
                  type="button"
                  onClick={copyAddress}
                  className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:border-primary-300 transition-colors flex-shrink-0"
                  title="Copy address"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-gray-500" />}
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 flex gap-3">
              <Info className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>

                <p className="text-xs text-amber-700 mt-1 leading-5">
                  Clicking the button below start the payment process.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handlePaymentMade}
              className="btn-primary w-full py-3.5 inline-flex items-center justify-center gap-2"
            >
              <CheckCircle className="h-5 w-5" /> I've completed the  Payment
            </button>
          </div>
        )}

        {paymentStep === 'checking' && (
          <div className="text-center py-10">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-primary-100" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <CreditCard className="h-7 w-7 text-primary-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mt-6">Preparing your card order</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mt-2 leading-6">
              We're checking the payment confirmation and preparing your card order details.
            </p>
            <div className="max-w-sm mx-auto mt-8 space-y-3 text-left">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-600">Order details verified</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-600">Shipping address confirmed</span>
              </div>
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-primary-600 animate-spin" />
                <span className="text-sm text-gray-600">Preparing card order</span>
              </div>
            </div>
          </div>
        )}

        {paymentStep === 'done' && (
          <div className="py-4">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full bg-green-100 animate-pulse" />
                <div className="relative w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                  <PackageCheck className="h-9 w-9 text-green-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mt-6">Your card is on its way</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mt-2 leading-6">
                Your card order has been successfully created. Your card will be with you within
                <span className="font-semibold text-gray-700"> 5–7 business days.</span>
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-5 mt-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Order reference</p>
                  <p className="font-mono font-semibold text-gray-900 mt-1">{Card?.orderId}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="mt-5 pt-5 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                    <Truck className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Estimated delivery</p>
                    <p className="text-xs text-gray-500 mt-0.5">5–7 business days</p>
                  </div>
                </div>
              </div>
            </div>

            {Card && (
              <div className="mt-7">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 text-center">
                  Your card
                </p>
                <DebitCard user={user} cardNumber={Card.number} expiry={Card.expiry} cvv={Card.cvv} />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-7">
              <button
                type="button"
                onClick={() => {
                  resetCardFlow();
                  navigate('/card-tracking');
                }}
                className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
              >
                <Truck className="h-4 w-4" /> Track Card Movement <ArrowRight className="h-4 w-4" />
              </button>
              <button type="button" onClick={resetCardFlow} className="btn-secondary flex-1">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default OrderCard;