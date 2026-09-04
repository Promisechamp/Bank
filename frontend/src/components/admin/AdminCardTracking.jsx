import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  Truck,
  Package,
  CheckCircle2,
  Clock3,
  XCircle,
  MapPin,
  CalendarDays,
  User,
  X,
  Loader2,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { cardTrackingAPI } from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../Modal';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { toast } from 'sonner';

// ============================================================
// CONSTANTS
// ============================================================

const PAGE_SIZE = 10;

// ============================================================
// HELPERS
// ============================================================

const getStatusConfig = (status) => {
  const configs = {
    order_placed: {
      label: 'Order Placed',
      className: 'bg-primary-50 text-primary-700 border-primary-200',
      icon: <Package size={14} />,
    },
    processing: {
      label: 'Processing',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: <Clock3 size={14} />,
    },
    card_produced: {
      label: 'Card Produced',
      className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: <CheckCircle2 size={14} />,
    },
    dispatched: {
      label: 'Dispatched',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: <Truck size={14} />,
    },
    in_transit: {
      label: 'In Transit',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: <Truck size={14} />,
    },
    out_for_delivery: {
      label: 'Out for Delivery',
      className: 'bg-violet-50 text-violet-700 border-violet-200',
      icon: <Truck size={14} />,
    },
    delivered: {
      label: 'Delivered',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <CheckCircle2 size={14} />,
    },
    exception: {
      label: 'Exception',
      className: 'bg-red-50 text-red-700 border-red-200',
      icon: <AlertCircle size={14} />,
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-red-50 text-red-700 border-red-200',
      icon: <XCircle size={14} />,
    },
  };
  return configs[status] || {
    label: status || 'Unknown',
    className: 'bg-gray-50 text-gray-600 border-gray-200',
    icon: <Clock3 size={14} />,
  };
};

const getStatusLabel = (status) => getStatusConfig(status).label;
const getPaymentStatusConfig = (status) => {
  const configs = {
    paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700' },
    pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700' },
    failed: { label: 'Failed', className: 'bg-red-50 text-red-700' },
    refunded: { label: 'Refunded', className: 'bg-gray-100 text-gray-600' },
  };
  return configs[status] || configs.pending;
};

const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

// ============================================================
// ACTION MENU (reused from TransactionsList)
// ============================================================

const ActionMenu = ({ actions = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (!actions.length) return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        aria-label="Order actions"
        aria-expanded={isOpen}
      >
        <MoreVertical size={18} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full z-50 mt-2 w-52 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
          >
            <div className="py-1">
              {actions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={`${action.label}-${index}`}
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      action.onClick?.();
                    }}
                    className={`flex w-full min-w-0 items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                      action.danger
                        ? 'text-red-600 hover:bg-red-50'
                        : action.success
                        ? 'text-emerald-600 hover:bg-emerald-50'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0" />}
                    <span className="truncate">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================
// STATUS BADGE
// ============================================================

const StatusBadge = ({ status }) => {
  const config = getStatusConfig(status);
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none whitespace-nowrap ${config.className}`}
    >
      {config.icon}
      <span className="truncate">{config.label}</span>
    </span>
  );
};

const PaymentBadge = ({ status }) => {
  const config = getPaymentStatusConfig(status);
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
};

// ============================================================
// STAT CARD
// ============================================================

const StatCard = ({ label, value, icon: Icon, tone = 'gray' }) => {
  const tones = {
    gray: {
      card: 'border-gray-200 bg-white',
      label: 'text-gray-400',
      value: 'text-gray-900',
      iconBg: 'bg-gray-50',
      icon: 'text-gray-500',
    },
    amber: {
      card: 'border-amber-200 bg-amber-50/60',
      label: 'text-amber-600',
      value: 'text-amber-700',
      iconBg: 'bg-amber-100',
      icon: 'text-amber-600',
    },
    emerald: {
      card: 'border-emerald-200 bg-emerald-50/60',
      label: 'text-emerald-600',
      value: 'text-emerald-700',
      iconBg: 'bg-emerald-100',
      icon: 'text-emerald-600',
    },
    blue: {
      card: 'border-blue-200 bg-blue-50/60',
      label: 'text-blue-600',
      value: 'text-blue-700',
      iconBg: 'bg-blue-100',
      icon: 'text-blue-600',
    },
  };
  const current = tones[tone] || tones.gray;

  return (
    <div
      className={`min-w-0 overflow-hidden rounded-2xl border p-4 ${current.card}`}
    >
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`truncate text-[11px] font-semibold uppercase tracking-wide ${current.label}`}>
            {label}
          </p>
          <p className={`mt-1 truncate text-xl font-bold sm:text-2xl ${current.value}`} title={String(value)}>
            {value}
          </p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${current.iconBg}`}>
          <Icon className={`h-5 w-5 ${current.icon}`} />
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ORDER CARD
// ============================================================

const OrderCard = ({ order, index, onView, onEdit, onDelete }) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025 }}
      className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50">
              <Truck className="h-5 w-5 text-primary-600" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">
                {order.order_id || '—'}
              </p>
              <p className="text-xs text-gray-400">
                {formatDate(order.created_at)}
              </p>
            </div>
          </div>
        </div>

        <ActionMenu
          actions={[
            { label: 'View Order', icon: Eye, onClick: onView },
            { label: 'Update Tracking', icon: Edit3, onClick: onEdit },

            { label: 'Delete Order', icon: Trash2, danger: true, onClick: onDelete },
          ]}
        />
      </div>

      {/* Customer */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
          <User size={15} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-800">
            {order.cardholder_name || 'Unknown customer'}
          </p>
          <p className="text-xs text-gray-400">
            {order.card_last4 ? `•••• ${order.card_last4}` : 'Card not issued'}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
        <div>
          <p className="text-xs text-gray-400">Destination</p>
          <div className="mt-1 flex items-start gap-1.5">
            <MapPin size={14} className="mt-0.5 shrink-0 text-gray-400" />
            <span className="text-sm text-gray-700">
              {order.shipping_city || '—'}, {order.shipping_country || '—'}
            </span>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-400">Payment</p>
          <PaymentBadge status={order.payment_status} />
        </div>
      </div>

      {/* Tracking */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
        <StatusBadge status={order.tracking_status} />
        {order.tracking_number && (
          <span className="text-xs font-medium text-gray-500">{order.tracking_number}</span>
        )}
      </div>

      <p className="mt-3 text-xs text-gray-400">
        Updated {formatDate(order.updated_at || order.created_at)}
      </p>
    </motion.article>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const AdminCardTracking = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // ============================================================
  // FETCH
  // ============================================================

  const loadOrders = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      const response = await cardTrackingAPI.adminGetAll();
      const data = response?.data || response?.orders || response?.cards || response || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err?.message || err?.error || 'Failed to load card orders.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // ============================================================
  // FILTER & PAGINATION
  // ============================================================

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orders;
    return orders.filter((order) =>
      [
        order.order_id,
        order.cardholder_name,
        order.tracking_number,
        order.courier_name,
        order.shipping_city,
      ]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query))
    );
  }, [orders, search]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // ============================================================
  // STATS
  // ============================================================

  const stats = useMemo(() => {
    let total = orders.length;
    let processing = 0,
      inTransit = 0,
      delivered = 0;
    orders.forEach((order) => {
      const status = order.tracking_status || order.order_status;
      if (status === 'processing' || status === 'order_placed') processing++;
      else if (status === 'in_transit' || status === 'out_for_delivery') inTransit++;
      else if (status === 'delivered') delivered++;
    });
    return { total, processing, inTransit, delivered };
  }, [orders]);

  // ============================================================
  // ACTIONS
  // ============================================================

  const handleView = (order) => {
    navigate(`/admin/card-tracking/${order.id}`);
  };

  const handleEdit = (order) => {
    setSelectedOrder({ ...order, __edit: true });
    setModalOpen(true);
  };

  const handleDelete = async (order) => {
    if (!window.confirm(`Delete order ${order.order_id}? This cannot be undone.`)) return;
    try {
      await cardTrackingAPI.adminDelete(order.id);
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      toast.success('Order deleted.');
    } catch (err) {
      toast.error(err?.message || 'Failed to delete order.');
    }
  };

  const handleModalSave = (updatedOrder) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
    );
    setModalOpen(false);
    setSelectedOrder(null);
    toast.success('Order updated.');
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (loading) {
    return (
      <div className="w-full min-w-0 max-w-full space-y-6 overflow-hidden">
        <div className="space-y-2">
          <div className="h-7 w-40 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded bg-gray-100" />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full min-w-0 max-w-full overflow-hidden space-y-5 sm:space-y-6"
    >
      {/* HEADER */}
      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50">
              <Truck className="h-5 w-5 text-primary-600" />
            </div>
            <span className="truncate text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Logistics
            </span>
          </div>
          <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl">Card Orders</h1>
          <p className="mt-1 max-w-xl text-sm leading-5 text-gray-500">
            Manage physical card orders and tracking statuses.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadOrders(true)}
          disabled={refreshing}
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </header>

      {/* ERROR */}
      {error && (
        <div className="flex min-w-0 items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-red-800">Something went wrong</p>
            <p className="mt-0.5 break-words text-sm leading-5 text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* STATS */}
      <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total Orders" value={stats.total} icon={Package} tone="gray" />
        <StatCard label="Processing" value={stats.processing} icon={Clock3} tone="amber" />
        <StatCard label="In Transit" value={stats.inTransit} icon={Truck} tone="blue" />
        <StatCard label="Delivered" value={stats.delivered} icon={CheckCircle2} tone="emerald" />
      </div>

      {/* SEARCH BAR */}
      <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 sm:p-4">
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders by ID, customer, tracking number..."
              className="block w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>
        {search && (
          <p className="mt-2 px-1 text-[11px] text-gray-400">
            Searching the orders currently loaded on this page.
          </p>
        )}
      </section>

      {/* ORDERS GRID */}
      <div className="min-w-0 space-y-3">
        {paginatedOrders.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
              <Package className="h-7 w-7 text-gray-300" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-gray-900">No orders found</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-5 text-gray-500">
              {search ? 'No orders match your search.' : 'There are no card orders yet.'}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-4 text-sm font-semibold text-primary-600 underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {paginatedOrders.map((order, index) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  index={index}
                  onView={() => handleView(order)}
                  onEdit={() => handleEdit(order)}
                  onDelete={() => handleDelete(order)}
                />
              ))}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex min-w-0 flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="min-w-0 text-xs text-gray-500">
                  Showing{' '}
                  <span className="font-medium text-gray-700">
                    {(currentPage - 1) * PAGE_SIZE + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium text-gray-700">
                    {Math.min(currentPage * PAGE_SIZE, filteredOrders.length)}
                  </span>{' '}
                  of <span className="font-medium text-gray-700">{filteredOrders.length}</span>
                </p>

                <div className="flex min-w-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => p - 1)}
                    disabled={currentPage === 1}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <span className="px-2 text-sm font-medium text-gray-600">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={currentPage === totalPages}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* EDIT MODAL */}
      {selectedOrder && (
        <Modal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedOrder(null);
          }}
          title="Update Tracking"
          size="md"
          position="center"
          showCloseButton
          closeOnOutsideClick={false}
        >
          <EditOrderForm
            order={selectedOrder}
            onSave={handleModalSave}
            onCancel={() => {
              setModalOpen(false);
              setSelectedOrder(null);
            }}
          />
        </Modal>
      )}
    </motion.div>
  );
};

// ============================================================
// EDIT ORDER FORM (used inside modal)
// ============================================================

const EditOrderForm = ({ order, onSave, onCancel }) => {
  const [form, setForm] = useState({
    tracking_status: order.tracking_status || 'order_placed',
    order_status: order.order_status || 'processing',
    payment_status: order.payment_status || 'pending',
    courier_name: order.courier_name || '',
    tracking_number: order.tracking_number || '',
    current_location: order.current_location || '',
    estimated_delivery_date: order.estimated_delivery_date
      ? order.estimated_delivery_date.substring(0, 10)
      : '',
    admin_notes: order.admin_notes || '',
    event_title: '',
    event_description: '',
    event_location: order.current_location || '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');

    try {
      const updatePayload = {
        tracking_status: form.tracking_status,
        order_status: form.order_status,
        payment_status: form.payment_status,
        courier_name: form.courier_name || null,
        tracking_number: form.tracking_number || null,
        current_location: form.current_location || null,
        estimated_delivery_date: form.estimated_delivery_date || null,
        admin_notes: form.admin_notes || null,
      };

      const response = await cardTrackingAPI.adminUpdate(order.id, updatePayload);
      let updatedOrder = response?.data || response?.order || response;
      if (!updatedOrder?.id) updatedOrder = { ...order, ...updatePayload };

      // Add event if provided
      if (form.event_title.trim() || form.event_description.trim()) {
        await cardTrackingAPI.addTrackingEvent(order.id, {
          status: form.tracking_status,
          title: form.event_title.trim() || getStatusLabel(form.tracking_status),
          description: form.event_description.trim() || `Tracking updated to ${getStatusLabel(form.tracking_status)}.`,
          location: form.event_location.trim() || form.current_location || null,
          timestamp: new Date().toISOString(),
        });
      }

      onSave(updatedOrder);
    } catch (err) {
      const msg = err?.message || err?.error || 'Failed to update order.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-w-0 space-y-5">
      {error && (
        <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tracking Status</label>
          <select
            value={form.tracking_status}
            onChange={(e) => updateField('tracking_status', e.target.value)}
            className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          >
            {['order_placed', 'processing', 'card_produced', 'dispatched', 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'cancelled'].map((s) => (
              <option key={s} value={s}>{getStatusLabel(s)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Order Status</label>
          <select
            value={form.order_status}
            onChange={(e) => updateField('order_status', e.target.value)}
            className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          >
            {['pending', 'processing', 'printed', 'shipped', 'delivered', 'cancelled'].map((s) => (
              <option key={s} value={s}>{capitalize(s)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Payment Status</label>
          <select
            value={form.payment_status}
            onChange={(e) => updateField('payment_status', e.target.value)}
            className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          >
            {['pending', 'paid', 'failed', 'refunded'].map((s) => (
              <option key={s} value={s}>{capitalize(s)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Courier</label>
          <input
            type="text"
            value={form.courier_name}
            onChange={(e) => updateField('courier_name', e.target.value)}
            placeholder="e.g. DHL"
            className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Tracking Number</label>
          <input
            type="text"
            value={form.tracking_number}
            onChange={(e) => updateField('tracking_number', e.target.value)}
            placeholder="Enter tracking number"
            className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Current Location</label>
          <input
            type="text"
            value={form.current_location}
            onChange={(e) => updateField('current_location', e.target.value)}
            placeholder="e.g. Lagos Distribution Center"
            className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Estimated Delivery</label>
          <input
            type="date"
            value={form.estimated_delivery_date}
            onChange={(e) => updateField('estimated_delivery_date', e.target.value)}
            className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Admin Notes</label>
          <textarea
            rows={2}
            value={form.admin_notes}
            onChange={(e) => updateField('admin_notes', e.target.value)}
            placeholder="Internal notes"
            className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 resize-none"
          />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700">Add Tracking Event (optional)</p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="text"
            value={form.event_title}
            onChange={(e) => updateField('event_title', e.target.value)}
            placeholder="Event title"
            className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
          <input
            type="text"
            value={form.event_location}
            onChange={(e) => updateField('event_location', e.target.value)}
            placeholder="Event location"
            className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
          <div className="sm:col-span-2">
            <textarea
              rows={2}
              value={form.event_description}
              onChange={(e) => updateField('event_description', e.target.value)}
              placeholder="Event description"
              className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 resize-none"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminCardTracking;