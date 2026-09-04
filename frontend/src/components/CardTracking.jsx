import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  CalendarDays,
  CheckCircle2,
  Clock3,
  AlertCircle,
  CreditCard,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  Navigation,
  ShieldCheck,
  ChevronRight,
  CircleDot,
  ExternalLink,
} from 'lucide-react';

import { cardTrackingAPI } from '../api';

const STATUS_ORDER = [
  'order_placed',
  'processing',
  'card_produced',
  'dispatched',
  'in_transit',
  'out_for_delivery',
  'delivered',
];

const STATUS_CONFIG = {
  order_placed: {
    label: 'Order placed',
    shortLabel: 'Placed',
    description: 'Your card order has been received.',
    icon: Package,
  },
  processing: {
    label: 'Processing',
    shortLabel: 'Processing',
    //description: 'Your order is being prepared.',
    description: 'Your payment is pending.',
    icon: Clock3,
  },
  card_produced: {
    label: 'Card produced',
    shortLabel: 'Produced',
    description: 'Your card has been produced and is ready for dispatch.',
    icon: CreditCard,
  },
  dispatched: {
    label: 'Dispatched',
    shortLabel: 'Dispatched',
    description: 'Your card has left our facility.',
    icon: Package,
  },
  in_transit: {
    label: 'In transit',
    shortLabel: 'In transit',
    description: 'Your card is on its way to you.',
    icon: Truck,
  },
  out_for_delivery: {
    label: 'Out for delivery',
    shortLabel: 'Out for delivery',
    description: 'Your card is with the courier for delivery.',
    icon: Navigation,
  },
  delivered: {
    label: 'Delivered',
    shortLabel: 'Delivered',
    description: 'Your card has been delivered.',
    icon: CheckCircle2,
  },
  exception: {
    label: 'Delivery exception',
    shortLabel: 'Exception',
    description: 'There is an issue affecting your delivery.',
    icon: AlertCircle,
  },
  cancelled: {
    label: 'Cancelled',
    shortLabel: 'Cancelled',
    description: 'This card order has been cancelled.',
    icon: AlertCircle,
  },
};

const getCurrentStatus = (order) => {
  if (!order) return 'order_placed';

  if (
    order.order_status === 'cancelled' ||
    order.tracking_status === 'cancelled'
  ) {
    return 'cancelled';
  }

  if (
    order.tracking_status === 'exception' ||
    order.order_status === 'exception'
  ) {
    return 'exception';
  }

  return order.tracking_status || 'order_placed';
};

const getStatusIndex = (status) => {
  const index = STATUS_ORDER.indexOf(status);
  return index === -1 ? 0 : index;
};

const formatDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }) +
    ' · ' +
    date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
};

const formatMoney = (amount, currency = 'USD') => {
  const numericAmount = Number(amount);

  if (Number.isNaN(numericAmount)) return '—';

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    return `${currency} ${numericAmount.toFixed(2)}`;
  }
};

const getPaymentLabel = (status) => {
  switch (status) {
    case 'paid':
      return 'Paid';
    case 'failed':
      return 'Failed';
    case 'refunded':
      return 'Refunded';
    default:
      return 'Pending';
  }
};

const getPaymentBadge = (status) => {
  switch (status) {
    case 'paid':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';

    case 'failed':
      return 'bg-red-50 text-red-700 border-red-200';

    case 'refunded':
      return 'bg-amber-50 text-amber-700 border-amber-200';

    default:
      return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

const getStatusIcon = (status) => {
  return STATUS_CONFIG[status]?.icon || CircleDot;
};

const normalizeOrder = (response) => {
  if (!response) return null;

  if (response.card) return response.card;

  if (response.cards && Array.isArray(response.cards)) {
    return response.cards[0] || null;
  }

  if (response.data?.card) return response.data.card;

  if (response.data?.cards && Array.isArray(response.data.cards)) {
    return response.data.cards[0] || null;
  }

  if (response.data?.id) return response.data;

  if (response.id) return response;

  return null;
};

const getTrackingEvents = (order) => {
  if (!order?.tracking_events) return [];

  if (Array.isArray(order.tracking_events)) {
    return [...order.tracking_events].sort((a, b) => {
      const first = new Date(
        a.timestamp || a.created_at || a.date || 0
      ).getTime();

      const second = new Date(
        b.timestamp || b.created_at || b.date || 0
      ).getTime();

      return second - first;
    });
  }

  return [];
};

const maskLast4 = (last4) => {
  if (!last4) return '•••• •••• •••• ••••';

  return `•••• •••• •••• ${String(last4).slice(-4)}`;
};

function PremiumCard({ order }) {
  const cardholderName =
    order?.cardholder_name ||
    order?.card_holder_name ||
    'CARDHOLDER NAME';

  const expiry = order?.card_expiry || '••/••';

  return (
    <div className="relative w-full max-w-[470px]">
      <div className="absolute -bottom-5 left-8 right-8 h-10 rounded-[28px] bg-black/10 blur-2xl" />

      <div className="relative aspect-[1.586/1] overflow-hidden rounded-[22px] bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 p-7 text-white shadow-2xl shadow-gray-300/60">
        {/* Decorative elements */}
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border border-white/10" />
        <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full border border-white/10" />
        <div className="absolute -bottom-28 -left-24 h-64 w-64 rounded-full bg-white/[0.04]" />

        <div className="absolute right-7 top-7 flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/60">
            Debit
          </span>
        </div>

        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[18px] font-semibold tracking-[0.14em]">
                TRUSTCDU
              </p>
              <p className="mt-1 text-[8px] uppercase tracking-[0.28em] text-white/50">
                Banking card
              </p>
            </div>

            <div className="flex h-10 w-12 items-center justify-center rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-[2px]">
                <span className="h-3 w-3 rounded-[2px] border border-white/50" />
                <span className="h-3 w-3 rounded-[2px] border border-white/50" />
                <span className="h-3 w-3 rounded-[2px] border border-white/50" />
                <span className="h-3 w-3 rounded-[2px] border border-white/50" />
              </div>
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-center gap-3">
              <p className="font-mono text-[18px] tracking-[0.18em] text-white/95 sm:text-[21px]">
                {maskLast4(order?.card_last4)}
              </p>

              <span className="text-white/40">⌁</span>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="mb-1 text-[7px] uppercase tracking-[0.24em] text-white/50">
                  Cardholder
                </p>
                <p className="max-w-[230px] truncate text-[11px] font-medium uppercase tracking-[0.12em]">
                  {cardholderName}
                </p>
              </div>

              <div>
                <p className="mb-1 text-[7px] uppercase tracking-[0.24em] text-white/50">
                  Valid thru
                </p>
                <p className="font-mono text-[11px] tracking-[0.12em]">
                  {expiry}
                </p>
              </div>

              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5 text-white/60">
                  <span className="text-[7px] uppercase tracking-[0.2em]">
                    Contactless
                  </span>
                  <span className="text-lg">)))</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusProgress({ status }) {
  const currentIndex = getStatusIndex(status);

  return (
    <div className="px-1 sm:px-3">
      <div className="relative">
        <div className="absolute left-0 right-0 top-[15px] h-px bg-gray-200" />

        <div
          className="absolute left-0 top-[15px] h-px bg-primary-600 transition-all duration-500"
          style={{
            width:
              currentIndex === 0
                ? '0%'
                : `${(currentIndex / (STATUS_ORDER.length - 1)) * 100}%`,
          }}
        />

        <div className="relative grid grid-cols-7">
          {STATUS_ORDER.map((step, index) => {
            const Icon = getStatusIcon(step);
            const completed = index <= currentIndex;
            const active = index === currentIndex;

            return (
              <div
                key={step}
                className="flex min-w-0 flex-col items-center"
              >
                <div
                  className={[
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white transition-all',
                    completed
                      ? 'border-primary-600 text-primary-600'
                      : 'border-gray-200 text-gray-300',
                    active
                      ? 'ring-4 ring-primary-50'
                      : '',
                  ].join(' ')}
                >
                  {completed && index < currentIndex ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  ) : (
                    <Icon className="h-3.5 w-3.5" />
                  )}
                </div>

                <p
                  className={[
                    'mt-3 hidden text-center text-[10px] font-medium sm:block',
                    completed ? 'text-gray-900' : 'text-gray-400',
                  ].join(' ')}
                >
                  {STATUS_CONFIG[step].shortLabel}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TrackingTimeline({ order, currentStatus }) {
  const events = getTrackingEvents(order);

  const fallbackEvents = STATUS_ORDER
    .slice(0, getStatusIndex(currentStatus) + 1)
    .reverse()
    .map((status, index) => ({
      id: `fallback-${status}`,
      status,
      title: STATUS_CONFIG[status].label,
      description: STATUS_CONFIG[status].description,
      timestamp:
        index === 0
          ? order?.updated_at || order?.created_at
          : null,
      location:
        status === 'in_transit'
          ? order?.current_location
          : null,
    }));

  const timeline = events.length > 0 ? events : fallbackEvents;

  return (
    <div className="relative">
      {timeline.map((event, index) => {
        const status = event.status || currentStatus;
        const Icon = getStatusIcon(status);

        const isLatest = index === 0;
        const timestamp =
          event.timestamp || event.created_at || event.date;

        return (
          <div key={event.id || `${status}-${index}`} className="relative flex gap-4">
            {index < timeline.length - 1 && (
              <div className="absolute bottom-0 left-[15px] top-8 w-px bg-gray-200" />
            )}

            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-white">
              <div
                className={[
                  'flex h-7 w-7 items-center justify-center rounded-full',
                  isLatest
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-500',
                ].join(' ')}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
            </div>

            <div
              className={[
                'min-w-0 flex-1 pb-7',
                index === timeline.length - 1 ? 'pb-0' : '',
              ].join(' ')}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h4
                    className={[
                      'text-sm font-semibold',
                      isLatest ? 'text-gray-950' : 'text-gray-700',
                    ].join(' ')}
                  >
                    {event.title ||
                      STATUS_CONFIG[status]?.label ||
                      'Tracking update'}
                  </h4>

                  {event.description && (
                    <p className="mt-1 max-w-xl text-sm leading-6 text-gray-500">
                      {event.description}
                    </p>
                  )}
                </div>

                {timestamp && (
                  <span className="whitespace-nowrap text-xs text-gray-400">
                    {formatDateTime(timestamp)}
                  </span>
                )}
              </div>

              {event.location && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.location}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DetailRow({ label, value, mono = false }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-gray-100 py-4 last:border-b-0">
      <span className="text-sm text-gray-500">{label}</span>

      <span
        className={[
          'max-w-[65%] text-right text-sm font-medium text-gray-900',
          mono ? 'font-mono' : '',
        ].join(' ')}
      >
        {value || '—'}
      </span>
    </div>
  );
}

export default function CardTracking() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const loadOrder = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError('');

      const response = id
        ? await cardTrackingAPI.adminGetOne(id)
        : await cardTrackingAPI.getMyCards();

      const normalized = normalizeOrder(response);

      if (!normalized) {
        throw new Error('Card order could not be found.');
      }

      setOrder(normalized);
    } catch (err) {
      console.error('Failed to load card order:', err);

      setError(
        err?.message ||
          err?.error ||
          'Unable to load your card tracking information.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const currentStatus = useMemo(
    () => getCurrentStatus(order),
    [order]
  );

  const statusConfig =
    STATUS_CONFIG[currentStatus] || STATUS_CONFIG.order_placed;

  const StatusIcon = statusConfig.icon;

  const isException = currentStatus === 'exception';
  const isCancelled = currentStatus === 'cancelled';

  const trackingNumber = order?.tracking_number;

  const copyTrackingNumber = async () => {
    if (!trackingNumber) return;

    try {
      await navigator.clipboard.writeText(trackingNumber);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (err) {
      console.error('Could not copy tracking number:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 h-5 w-28 animate-pulse rounded bg-gray-100" />

          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              <div className="h-72 animate-pulse rounded-2xl border border-gray-100 bg-gray-50" />
              <div className="h-64 animate-pulse rounded-2xl border border-gray-100 bg-gray-50" />
            </div>

            <div className="h-72 animate-pulse rounded-2xl border border-gray-100 bg-gray-50" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-4">
          <div className="w-full text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <AlertCircle className="h-6 w-6" />
            </div>

            <h1 className="mt-5 text-xl font-semibold text-gray-950">
              Unable to load your order
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              {error ||
                'We could not find the card order you are looking for.'}
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => loadOrder()}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const shippingAddress = [
    order.shipping_address,
    order.shipping_city,
    order.shipping_state,
    order.shipping_postal_code,
    order.shipping_country,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="min-h-screen text-gray-950">
      {/* Header */}
      <header className="border-b border-gray-400 ">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-0 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="group inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-950"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back
          </button>

          <button
            type="button"
            onClick={() => loadOrder(false)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={[
                'h-4 w-4',
                refreshing ? 'animate-spin' : '',
              ].join(' ')}
            />
            Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Order heading */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-gray-400">
              <span>Card order</span>
              <ChevronRight className="h-3 w-3" />
              <span>Tracking</span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">
              Track your card
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Order{' '}
              <span className="font-mono font-medium text-gray-700">
                {order.order_id || order.id}
              </span>
            </p>
          </div>

          <div
            className={[
              'inline-flex w-fit items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold',
              isException
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : isCancelled
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-gray-200 bg-gray-50 text-gray-700',
            ].join(' ')}
          >
            <span
              className={[
                'h-1.5 w-1.5 rounded-full',
                isException
                  ? 'bg-amber-500'
                  : isCancelled
                    ? 'bg-red-500'
                    : 'bg-primary-600',
              ].join(' ')}
            />
            {statusConfig.label}
          </div>
        </div>

        {/* Exception / cancelled */}
        {(isException || isCancelled) && (
          <div
            className={[
              'mb-6 flex gap-3 rounded-xl border p-4',
              isException
                ? 'border-amber-200 bg-amber-50'
                : 'border-red-200 bg-red-50',
            ].join(' ')}
          >
            <AlertCircle
              className={[
                'mt-0.5 h-5 w-5 shrink-0',
                isException ? 'text-amber-600' : 'text-red-600',
              ].join(' ')}
            />

            <div>
              <p
                className={[
                  'text-sm font-semibold',
                  isException ? 'text-amber-900' : 'text-red-900',
                ].join(' ')}
              >
                {statusConfig.label}
              </p>

              <p
                className={[
                  'mt-1 text-sm leading-6',
                  isException ? 'text-amber-800' : 'text-red-800',
                ].join(' ')}
              >
                {statusConfig.description}
              </p>
            </div>
          </div>
        )}

        {/* Main layout */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Left */}
          <div className="min-w-0 space-y-6">
            {/* Current status */}
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-5 sm:px-7">
                <div className="flex items-start justify-between gap-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                      <StatusIcon className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-400">
                        Current status
                      </p>

                      <h2 className="mt-1 text-lg font-semibold text-gray-950">
                        {statusConfig.label}
                      </h2>

                      <p className="mt-1 max-w-xl text-sm leading-6 text-gray-500">
                        {statusConfig.description}
                      </p>
                    </div>
                  </div>

                  {order.updated_at && (
                    <span className="hidden whitespace-nowrap text-xs text-gray-400 sm:block">
                      Updated {formatDateTime(order.updated_at)}
                    </span>
                  )}
                </div>
              </div>

              <div className="px-5 py-7 sm:px-7">
                <StatusProgress status={currentStatus} />
              </div>
            </section>

            {/* Timeline */}
            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-5 sm:px-7">
                <h2 className="text-base font-semibold text-gray-950">
                  Tracking history
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Updates for your card order.
                </p>
              </div>

              <div className="px-5 py-6 sm:px-7 sm:py-7">
                <TrackingTimeline
                  order={order}
                  currentStatus={currentStatus}
                />
              </div>
            </section>

            {/* Delivery details */}
            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-5 sm:px-7">
                <h2 className="text-base font-semibold text-gray-950">
                  Delivery details
                </h2>
              </div>

              <div className="grid gap-0 sm:grid-cols-2 sm:gap-x-10 sm:px-7">
                <div className="flex items-start gap-3 border-b border-gray-100 py-5 sm:border-b-0">
                  <div className="ms-4 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                    <MapPin className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">
                      Delivery address
                    </p>

                    <p className="mt-1 text-sm font-medium leading-6 text-gray-900">
                      {shippingAddress || '—'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-5">
                  <div className="ms-4 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                    <CalendarDays className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">
                      Estimated delivery
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {formatDate(order.estimated_delivery_date)}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right */}
          <aside className="space-y-6">
            {/* Card */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-950">
                    Your card
                  </h2>

                  <p className="mt-1 text-xs text-gray-400">
                    Secure card information
                  </p>
                </div>

                <ShieldCheck className="h-5 w-5 text-primary-600" />
              </div>

              <PremiumCard order={order} />

              <div className="mt-5 flex items-center gap-2 text-xs text-gray-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                Card details are securely masked
              </div>
            </section>

            {/* Shipment */}
            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                    <Truck className="h-4 w-4" />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-gray-950">
                      Shipment
                    </h2>
                    <p className="text-xs text-gray-400">
                      Courier information
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-5">
                <DetailRow
                  label="Courier"
                  value={order.courier_name}
                />

                <div className="border-b border-gray-100 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm text-gray-500">
                      Tracking number
                    </span>

                    {trackingNumber ? (
                      <button
                        type="button"
                        onClick={copyTrackingNumber}
                        className="group flex max-w-[65%] items-center gap-2 text-right"
                        title="Copy tracking number"
                      >
                        <span className="break-all font-mono text-xs font-medium text-gray-900 transition group-hover:text-primary-600">
                          {trackingNumber}
                        </span>

                        {copied ? (
                          <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4 shrink-0 text-gray-400 group-hover:text-primary-600" />
                        )}
                      </button>
                    ) : (
                      <span className="text-sm font-medium text-gray-400">
                        Not available yet
                      </span>
                    )}
                  </div>
                </div>

                <DetailRow
                  label="Current location"
                  value={order.current_location}
                />
              </div>
            </section>

            {/* Order summary */}
            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-5">
                <h2 className="text-sm font-semibold text-gray-950">
                  Order summary
                </h2>
              </div>

              <div className="px-5">
                <DetailRow
                  label="Order reference"
                  value={order.order_id || order.id}
                  mono
                />

                <DetailRow
                  label="Card type"
                  value={order.card_type || 'Debit'}
                />

                <DetailRow
                  label="Card fee"
                  value={formatMoney(
                    order.card_fee,
                    order.currency || 'USD'
                  )}
                />

                <DetailRow
                  label="Payment"
                  value={
                    <span
                      className={[
                        'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
                        getPaymentBadge(order.payment_status),
                      ].join(' ')}
                    >
                      {getPaymentLabel(order.payment_status)}
                    </span>
                  }
                />

                <DetailRow
                  label="Placed"
                  value={formatDate(order.created_at)}
                />
              </div>
            </section>

            {/* Help */}
            <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm">
                  <Navigation className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Need help with your delivery?
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    If your tracking information looks incorrect or your
                    delivery is delayed, contact support for assistance.
                  </p>

                  <button
                    type="button"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 transition hover:text-primary-700"
                  >
                    Contact support
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}