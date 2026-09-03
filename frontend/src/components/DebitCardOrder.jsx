import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  Check,
  CheckCircle,
  ChevronDown,
  Clock3,
  CreditCard,
  ExternalLink,
  Wallet,
  Globe2,
  ShieldCheck,
} from 'lucide-react';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* -------------------------------------------------------------------------- */
/* Custom Select                                                              */
/* -------------------------------------------------------------------------- */

const CustomSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  disabled = false,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  return (
    <div
      className={`relative ${className}`}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="input-field flex w-full items-center justify-between text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white p-1.5 shadow-xl">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                  isSelected
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span>{option.label}</span>
                  {isSelected && <Check className="h-4 w-4" />}
                </div>
                {option.description && (
                  <p className="mt-0.5 text-xs text-gray-400">
                    {option.description}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Step progress                                                              */
/* -------------------------------------------------------------------------- */

const StepProgress = ({ current, labels }) => (
  <div className="mb-1">
    <div className="flex gap-1.5">
      {labels.map((label, i) => (
        <div
          key={label}
          className={`h-1 flex-1 rounded-full transition-colors ${
            i <= current ? 'bg-primary-600' : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
    <div className="mt-2.5 flex items-baseline justify-between">
      <span className="text-sm font-semibold text-gray-900">
        {labels[current]}
      </span>
      <span className="text-xs text-gray-400">
        {current + 1} of {labels.length}
      </span>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/* Info Banner                                                                */
/* -------------------------------------------------------------------------- */

const InfoBanner = ({ icon: Icon, title, children, tone = 'gray' }) => {
  const tones = {
    gray: 'border-gray-200 bg-gray-50 text-gray-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    blue: 'border-primary-100 bg-primary-50 text-primary-900',
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <div className="flex gap-3">
        <div className="mt-0.5 shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          <div className="mt-1 text-xs leading-5 opacity-80">{children}</div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Processing Screen                                                          */
/* -------------------------------------------------------------------------- */

const ProcessingScreen = ({ icon, title, message }) => (
  <div className="flex min-h-[340px] flex-col items-center justify-center py-10 text-center">
    <div className="relative h-14 w-14">
      <div className="absolute inset-0 rounded-full border-4 border-primary-100" />
      <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      <div className="absolute inset-0 flex items-center justify-center">
        {icon}
      </div>
    </div>
    <h3 className="mt-6 text-lg font-semibold text-gray-900">{title}</h3>
    <p className="mx-auto mt-2 max-w-xs text-sm leading-5 text-gray-500">
      {message}
    </p>
  </div>
);

/* -------------------------------------------------------------------------- */
/* Branded Debit Card                                                         */
/* -------------------------------------------------------------------------- */

const DemoDebitCard = ({ name }) => {
  const cardholderName = (name || 'CARDHOLDER NAME')
    .trim()
    .toUpperCase()
    .slice(0, 24);

  return (
    <div className="relative mx-auto aspect-[1.586/1] w-full max-w-[380px] overflow-hidden rounded-[22px] bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 p-5 text-white shadow-[0_20px_45px_-16px_rgba(0,0,0,0.4)] sm:p-6">
      <div className="pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full bg-white/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-14 h-48 w-48 rounded-full bg-black/10 blur-3xl" />
      <div className="pointer-events-none absolute right-6 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full border border-white/10" />

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-white/55">
              Your Bank
            </p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
              Debit
            </p>
          </div>
          <CreditCard className="h-5 w-5 text-white/80" />
        </div>

        <div>
          <div className="mb-4 h-8 w-11 rounded-md border border-white/25 bg-gradient-to-br from-gray-100 via-gray-300 to-gray-400" />

          {/* Card number: flex-distributed so it always fits the card width,
              instead of a single nbsp-spaced string that could clip. */}
          <div className="flex items-center justify-between pr-1">
            {['5426', '••••', '••••', '8291'].map((group, i) => (
              <span
                key={i}
                className="font-mono text-[13px] font-medium text-white sm:text-[15px]"
              >
                {group}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[7px] font-medium uppercase tracking-[0.2em] text-white/50">
              Cardholder
            </p>
            <p
              className="mt-1 truncate text-[11px] font-semibold tracking-[0.1em] text-white"
              title={cardholderName}
            >
              {cardholderName}
            </p>
          </div>
          <div className="shrink-0">
            <p className="text-[7px] font-medium uppercase tracking-[0.2em] text-white/50">
              Valid thru
            </p>
            <p className="mt-1 text-xs font-semibold tracking-[0.1em] text-white">
              12/30
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Main Debit Card Order                                                      */
/* -------------------------------------------------------------------------- */

const STEP_LABELS = ['Choose your card', 'Delivery'];

const CARD_FEATURES = [
  { icon: Wallet, text: 'No monthly card fee' },
  { icon: Globe2, text: 'Fee-free spending abroad' },
  { icon: ShieldCheck, text: 'Freeze and unfreeze instantly in the app' },
];

const DebitCardOrder = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const userName = user?.full_name || '';

  const [cardStep, setCardStep] = useState('choose');
  const [cardType] = useState('standard');
  const [cardDelivery, setCardDelivery] = useState('branch');
  const [cardOrderReference, setCardOrderReference] = useState('');

  const continueCardOrder = async () => {
    if (cardStep === 'choose') {
      setCardStep('details');
      return;
    }

    if (cardStep === 'details') {
      setCardStep('processing');
      await sleep(1600);

      const reference = `CARD-${Date.now().toString(36).toUpperCase()}`;
      setCardOrderReference(reference);
      setCardStep('success');
    }
  };

  const closeCardModal = () => {
    if (cardStep === 'processing') return;
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeCardModal}
      title="Order debit card"
      size="lg"
      position="center"
      showCloseButton={cardStep !== 'processing'}
      closeOnOutsideClick={false}
    >
      {/* ------------------------------------------------------------------ */}
      {/* STEP 1                                                             */}
      {/* ------------------------------------------------------------------ */}

      {cardStep === 'choose' && (
        <div className="mx-auto w-full max-w-2xl space-y-6">
          <StepProgress current={0} labels={STEP_LABELS} />

          <div className="rounded-2xl border border-primary-100 bg-primary-50/40 p-6 sm:p-8">
            <DemoDebitCard name={userName} />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900">
              Standard Debit
            </p>
            <p className="mt-1 text-sm leading-5 text-gray-500">
              Your everyday card for spending, online payments and ATM
              withdrawals.
            </p>

            <ul className="mt-4 space-y-2.5">
              {CARD_FEATURES.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex items-center gap-2.5 text-sm text-gray-700"
                >
                  <Icon className="h-4 w-4 shrink-0 text-primary-600" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end border-t border-gray-100 pt-6">
            <button
              type="button"
              onClick={continueCardOrder}
              className="btn-primary inline-flex min-w-[150px] items-center justify-center gap-2"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* STEP 2                                                             */}
      {/* ------------------------------------------------------------------ */}

      {cardStep === 'details' && (
        <div className="mx-auto w-full max-w-lg space-y-6">
          <StepProgress current={1} labels={STEP_LABELS} />

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Delivery method
            </label>
            <CustomSelect
              value={cardDelivery}
              onChange={setCardDelivery}
              options={[
                {
                  value: 'branch',
                  label: 'Branch pickup',
                  description: 'Collect your card from a branch',
                },
                {
                  value: 'delivery',
                  label: 'Address delivery',
                  description: 'Delivered to your registered address',
                },
              ]}
            />
          </div>

          <InfoBanner icon={Clock3} title="Estimated arrival" tone="blue">
            Your card will be with you in <strong>5–7 business days</strong>{' '}
            after the simulated order is placed.
          </InfoBanner>

          <div className="flex justify-between gap-3 border-t border-gray-100 pt-6">
            <button
              type="button"
              onClick={() => setCardStep('choose')}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={continueCardOrder}
              className="btn-primary inline-flex items-center gap-2"
            >
              Place card order
              <CreditCard className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* PROCESSING                                                         */}
      {/* ------------------------------------------------------------------ */}

      {cardStep === 'processing' && (
        <ProcessingScreen
          icon={<CreditCard className="h-6 w-6 text-primary-600" />}
          title="Placing your card order"
          message="We're preparing your simulated card request and generating your order reference."
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SUCCESS                                                            */}
      {/* ------------------------------------------------------------------ */}

      {cardStep === 'success' && (
        <div className="mx-auto w-full max-w-lg py-4">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="mt-5 text-xl font-bold tracking-tight text-gray-950">
              Your card is on the way
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
              Order placed successfully. Your card will arrive in 5–7
              business days.
            </p>
          </div>

          <div className="mt-7 rounded-2xl border border-gray-200 bg-gray-50/60 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Order reference</span>
              <span className="font-mono text-sm font-semibold text-gray-900">
                {cardOrderReference}
              </span>
            </div>

            <div className="my-4 border-t border-dashed border-gray-300" />

            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">Card type</dt>
                <dd className="font-medium text-gray-900">Standard Debit</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">Delivery</dt>
                <dd className="font-medium text-gray-900">
                  {cardDelivery === 'branch'
                    ? 'Branch pickup'
                    : 'Address delivery'}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">Cardholder</dt>
                <dd className="max-w-[60%] truncate font-medium text-gray-900">
                  {userName || 'Cardholder'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                toast.info(
                  `Card movement tracking reference: ${cardOrderReference}`
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4" />
              Track card movement
            </button>
            <button type="button" onClick={closeCardModal} className="btn-primary">
              Done
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default DebitCardOrder;