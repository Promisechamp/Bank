import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { notificationsAPI } from '../api';
import {
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Inbox,
  Loader2,
  Trash2,
  X,
} from 'lucide-react';
import { formatDate } from '../utils/helpers';
import { toast } from 'sonner';

/*
|--------------------------------------------------------------------------
| Notification helpers
|--------------------------------------------------------------------------
*/

const getNotificationMeta = (notification) => {
  const type = String(notification?.type || '').toLowerCase();
  const title = String(notification?.title || '').toLowerCase();
  const message = String(notification?.message || '').toLowerCase();

  if (
    type === 'credit' ||
    title.includes('credit') ||
    message.includes('credited')
  ) {
    return {
      label: 'Money in',
      shortLabel: 'Credit',
      icon: '↗',
      accent: 'primary',
      iconClass: 'bg-primary-100 text-primary-700',
      dotClass: 'bg-primary-500',
    };
  }

  if (
    type === 'debit' ||
    title.includes('debit') ||
    message.includes('debited')
  ) {
    return {
      label: 'Money out',
      shortLabel: 'Debit',
      icon: '↘',
      accent: 'red',
      iconClass: 'bg-red-50 text-red-600',
      dotClass: 'bg-red-500',
    };
  }

  if (
    title.includes('message') ||
    type === 'message' ||
    type === 'chat'
  ) {
    return {
      label: 'Message',
      shortLabel: 'Message',
      icon: '•••',
      accent: 'violet',
      iconClass: 'bg-violet-50 text-violet-600',
      dotClass: 'bg-violet-500',
    };
  }

  if (
    title.includes('card') ||
    type === 'card'
  ) {
    return {
      label: 'Card',
      shortLabel: 'Card',
      icon: '▣',
      accent: 'amber',
      iconClass: 'bg-amber-50 text-amber-700',
      dotClass: 'bg-amber-500',
    };
  }

  if (
    type === 'success' ||
    title.includes('successful') ||
    title.includes('success') ||
    title.includes('completed')
  ) {
    return {
      label: 'Completed',
      shortLabel: 'Success',
      icon: '✓',
      accent: 'emerald',
      iconClass: 'bg-emerald-50 text-emerald-600',
      dotClass: 'bg-emerald-500',
    };
  }

  if (
    type === 'warning' ||
    title.includes('warning') ||
    title.includes('alert')
  ) {
    return {
      label: 'Attention',
      shortLabel: 'Alert',
      icon: '!',
      accent: 'orange',
      iconClass: 'bg-orange-50 text-orange-600',
      dotClass: 'bg-orange-500',
    };
  }

  return {
    label: 'Update',
    shortLabel: 'System',
    icon: '✦',
    accent: 'primary',
    iconClass: 'bg-primary-100 text-primary-700',
    dotClass: 'bg-primary-500',
  };
};

/*
|--------------------------------------------------------------------------
| Small animated icon
|--------------------------------------------------------------------------
*/

const NotificationGlyph = ({ notification, unread }) => {
  const meta = getNotificationMeta(notification);

  return (
    <div className="relative">
      <motion.div
        initial={false}
        animate={
          unread
            ? {
                scale: [1, 1.03, 1],
              }
            : { scale: 1 }
        }
        transition={
          unread
            ? {
                duration: 2.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : undefined
        }
        className={`
          flex h-11 w-11 shrink-0 items-center justify-center
          rounded-[14px] text-[13px] font-bold
          ring-1 ring-black/[0.03]
          ${meta.iconClass}
        `}
      >
        {meta.icon}
      </motion.div>

      {unread && (
        <span
          className={`
            absolute -right-0.5 -top-0.5
            h-2.5 w-2.5 rounded-full
            border-2 border-white
            ${meta.dotClass}
          `}
        />
      )}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Notification item
|--------------------------------------------------------------------------
*/

const NotificationItem = ({
  notification,
  selected,
  onSelect,
  onClick,
  onMarkRead,
  onDelete,
}) => {
  const unread = !notification.read;
  const meta = getNotificationMeta(notification);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="group relative"
    >
      <div
        className={`
          relative mx-2 my-1.5 overflow-hidden rounded-[18px]
          border transition-all duration-200
          ${
            selected
              ? 'border-primary-200 bg-primary-50/80 shadow-sm'
              : unread
              ? 'border-gray-100 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.035)]'
              : 'border-transparent bg-white hover:border-gray-100 hover:bg-gray-50/70'
          }
        `}
      >
        {/* subtle unread edge */}
        {unread && (
          <div
            className={`
              absolute bottom-3 left-0 top-3 w-[3px]
              rounded-r-full ${meta.dotClass}
            `}
          />
        )}

        <div className="flex gap-3 px-3.5 py-3.5 sm:px-4 sm:py-4">
          {/* Selection */}
          <div className="flex items-start pt-1">
            <button
              type="button"
              aria-label={
                selected
                  ? 'Deselect notification'
                  : 'Select notification'
              }
              onClick={() => onSelect(notification.id)}
              className={`
                flex h-[17px] w-[17px] items-center justify-center
                rounded-[5px] border transition-all
                ${
                  selected
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-gray-300 bg-white text-transparent hover:border-gray-400'
                }
              `}
            >
              {selected && (
                <Check
                  className="h-3 w-3"
                  strokeWidth={3}
                />
              )}
            </button>
          </div>

          {/* Icon */}
          <NotificationGlyph
            notification={notification}
            unread={unread}
          />

          {/* Main content */}
          <button
            type="button"
            onClick={(event) => onClick(notification, event)}
            className="min-w-0 flex-1 text-left outline-none"
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={`
                      text-[9px] font-bold uppercase tracking-[0.12em]
                      ${
                        unread
                          ? 'text-primary-600'
                          : 'text-gray-400'
                      }
                    `}
                  >
                    {meta.label}
                  </span>

                  <span className="h-0.5 w-0.5 rounded-full bg-gray-300" />

                  <span className="flex items-center gap-1 text-[9px] font-medium text-gray-400">
                    <Clock3 className="h-2.5 w-2.5" />
                    {formatDate(notification.created_at)}
                  </span>
                </div>

                <h4
                  className={`
                    truncate pr-2 text-[13px] leading-5
                    tracking-[-0.01em]
                    ${
                      unread
                        ? 'font-bold text-gray-950'
                        : 'font-semibold text-gray-700'
                    }
                  `}
                >
                  {notification.title}
                </h4>

                <p className="mt-1 line-clamp-2 text-[11px] leading-[18px] text-gray-500">
                  {notification.message}
                </p>
              </div>

              {notification.reference_id && (
                <ChevronRight
                  className="
                    mt-5 h-4 w-4 shrink-0 text-gray-300
                    transition-all duration-200
                    group-hover:translate-x-0.5
                    group-hover:text-primary-500
                  "
                />
              )}
            </div>
          </button>

          {/* Actions */}
          <div
            className="
              absolute right-3 top-3
              flex items-center gap-0.5
              rounded-lg border border-gray-100
              bg-white/95 p-0.5 shadow-sm
              opacity-0 backdrop-blur
              transition-opacity duration-200
              group-hover:opacity-100
              focus-within:opacity-100
            "
          >
            {unread && (
              <button
                type="button"
                onClick={() => onMarkRead(notification.id)}
                title="Mark as read"
                className="
                  rounded-md p-1.5 text-gray-400
                  transition hover:bg-primary-50
                  hover:text-primary-600
                "
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => onDelete(notification.id)}
              title="Delete"
              className="
                rounded-md p-1.5 text-gray-400
                transition hover:bg-red-50
                hover:text-red-600
              "
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/*
|--------------------------------------------------------------------------
| Main component
|--------------------------------------------------------------------------
*/

const Notifications = () => {
  const { token } = useAuth();
  const {
    notifications,
    setNotifications,
    markNotificationRead,
  } = useSocket();

  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  const rootRef = useRef(null);
  const panelRef = useRef(null);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const selectedCount = selected.size;

  const allSelected =
    notifications.length > 0 &&
    selectedCount === notifications.length;

  /*
  |--------------------------------------------------------------------------
  | Fetch
  |--------------------------------------------------------------------------
  */

  const fetchNotifications = useCallback(async () => {
    try {
      const authToken = token || localStorage.getItem('token');

      if (!authToken) return;

      const res = await notificationsAPI.get({
        unreadOnly: true,
        limit: 50,
      });

      setNotifications(res.data || []);
    } catch (error) {
      console.error(
        'Failed to fetch notifications:',
        error
      );
    }
  }, [token, setNotifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  /*
  |--------------------------------------------------------------------------
  | Outside click – now checks both the trigger and the panel
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target) &&
        panelRef.current &&
        !panelRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handlePointerDown
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handlePointerDown
      );
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Escape
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscape
      );
    };
  }, [isOpen]);

  /*
  |--------------------------------------------------------------------------
  | Selection
  |--------------------------------------------------------------------------
  */

  const toggleSelect = (id) => {
    setSelected((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
      return;
    }

    setSelected(
      new Set(notifications.map((notification) => notification.id))
    );
  };

  const clearSelection = () => {
    setSelected(new Set());
  };

  /*
  |--------------------------------------------------------------------------
  | Mark read
  |--------------------------------------------------------------------------
  */

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );

      markNotificationRead(id);
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    if (!unreadCount) return;

    setIsMarkingRead(true);

    try {
      await notificationsAPI.markAllRead();

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          read: true,
        }))
      );

      setSelected(new Set());

      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    } finally {
      setIsMarkingRead(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Delete
  |--------------------------------------------------------------------------
  */

  const handleDelete = async (id) => {
    try {
      await notificationsAPI.delete(id);

      setNotifications((previous) =>
        previous.filter(
          (notification) => notification.id !== id
        )
      );

      setSelected((previous) => {
        const next = new Set(previous);
        next.delete(id);
        return next;
      });
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedCount) return;

    setIsDeleting(true);

    try {
      const ids = Array.from(selected);

      if (notificationsAPI.deleteBatch) {
        await notificationsAPI.deleteBatch(ids);
      } else {
        await Promise.all(
          ids.map((id) => notificationsAPI.delete(id))
        );
      }

      setNotifications((previous) =>
        previous.filter(
          (notification) => !selected.has(notification.id)
        )
      );

      setSelected(new Set());

      toast.success(
        `Deleted ${ids.length} notification${
          ids.length === 1 ? '' : 's'
        }`
      );
    } catch (error) {
      toast.error('Failed to delete selected notifications');
    } finally {
      setIsDeleting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Mark selected read
  |--------------------------------------------------------------------------
  */

  const handleMarkSelectedRead = async () => {
    if (!selectedCount) return;

    setIsMarkingRead(true);

    try {
      const ids = Array.from(selected);

      await Promise.all(
        ids.map((id) => notificationsAPI.markRead(id))
      );

      setNotifications((previous) =>
        previous.map((notification) =>
          selected.has(notification.id)
            ? { ...notification, read: true }
            : notification
        )
      );

      setSelected(new Set());

      toast.success(
        `Marked ${ids.length} notification${
          ids.length === 1 ? '' : 's'
        } as read`
      );
    } catch (error) {
      toast.error(
        'Failed to mark selected notifications as read'
      );
    } finally {
      setIsMarkingRead(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Click notification
  |--------------------------------------------------------------------------
  */

  const handleNotificationClick = (
    notification,
    event
  ) => {
    if (
      event.target.closest(
        'button:not([data-notification-content])'
      )
    ) {
      return;
    }

    if (!notification.read) {
      handleMarkRead(notification.id);
    }

    if (notification.reference_id) {
      if (
        notification.type === 'credit' ||
        notification.type === 'debit'
      ) {
        navigate(
          `/transactions/${notification.reference_id}`
        );
      } else if (
        notification.type === 'system' &&
        notification.title?.includes('Card')
      ) {
        navigate(
          `/card-tracking/${notification.reference_id}`
        );
      } else if (
        notification.type === 'system' &&
        notification.title?.includes('Message')
      ) {
        navigate(`/chat/${notification.reference_id}`);
      } else {
        navigate(
          `/admin/transactions/${notification.reference_id}`
        );
      }
    }

    setIsOpen(false);
  };

  /*
  |--------------------------------------------------------------------------
  | Bell toggle
  |--------------------------------------------------------------------------
  */

  const toggleOpen = () => {
    setIsOpen((previous) => !previous);

    if (isOpen) {
      setSelected(new Set());
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div
      ref={rootRef}
      className="relative z-[100]"
    >
      {/* ========================================================
          BELL TRIGGER
      ======================================================== */}

      <button
        type="button"
        onClick={toggleOpen}
        aria-label="Notifications"
        aria-expanded={isOpen}
        className="
          group relative flex h-10 w-10
          items-center justify-center rounded-xl
          border border-transparent
          text-gray-500
          transition-all duration-200
          hover:border-gray-200
          hover:bg-gray-50
          hover:text-gray-800
          focus:outline-none
          focus:ring-2 focus:ring-primary-500/20
        "
      >
        <motion.div
          animate={
            unreadCount > 0
              ? {
                  rotate: [0, -7, 7, -4, 0],
                }
              : { rotate: 0 }
          }
          transition={
            unreadCount > 0
              ? {
                  delay: 1,
                  duration: 0.55,
                  repeat: Infinity,
                  repeatDelay: 7,
                }
              : undefined
          }
        >
          <Bell
            className="h-[19px] w-[19px]"
            strokeWidth={1.8}
          />
        </motion.div>

        {unreadCount > 0 && (
          <>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="
                absolute right-[6px] top-[5px]
                h-2 w-2 rounded-full
                bg-red-500 ring-2 ring-white
              "
            />

            <span
              className="
                absolute -right-1 -top-1
                flex h-[18px] min-w-[18px]
                items-center justify-center
                rounded-full border-2 border-white
                bg-red-500 px-1
                text-[9px] font-bold leading-none text-white
                shadow-sm
              "
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        )}
      </button>

      {/* ========================================================
          PANEL – PORTAL
      ======================================================== */}

      {isOpen &&
        createPortal(
          <motion.div
            ref={panelRef}
            initial={{
              opacity: 0,
              y: 12,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 8,
              scale: 0.985,
            }}
            transition={{
              type: 'spring',
              stiffness: 430,
              damping: 32,
              mass: 0.7,
            }}
            className="
              fixed inset-x-0 bottom-0 z-[100]
              flex max-h-[88vh] flex-col
              overflow-hidden rounded-t-[28px]
              border border-gray-200
              bg-white
              shadow-[0_-30px_80px_-30px_rgba(15,23,42,0.28)]

              sm:inset-x-auto sm:bottom-auto
              sm:top-16 sm:right-4
              sm:h-auto sm:max-h-[min(680px,calc(100vh-100px))]
              sm:w-[430px]
              sm:rounded-[24px]
              sm:shadow-[0_30px_90px_-25px_rgba(15,23,42,0.28)]
            "
          >
            {/* Mobile grab handle */}
            <div className="flex justify-center pt-2.5 sm:hidden">
              <span className="h-1 w-10 rounded-full bg-gray-200" />
            </div>

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="relative shrink-0 border-b border-gray-100">
              {/* Background detail */}
              <div
                className="
                  pointer-events-none absolute
                  -right-20 -top-24
                  h-48 w-48 rounded-full
                  bg-primary-100/50 blur-3xl
                "
              />

              <div className="relative px-5 pb-4 pt-4 sm:px-5 sm:pt-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className="
                        flex h-11 w-11 shrink-0
                        items-center justify-center
                        rounded-[15px]
                        bg-primary-700 text-white
                        shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)]
                      "
                    >
                      <Bell
                        className="h-[19px] w-[19px]"
                        strokeWidth={1.8}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h2
                          className="
                            text-[17px] font-bold
                            tracking-[-0.035em]
                            text-gray-950
                          "
                        >
                          Notifications
                        </h2>

                        {unreadCount > 0 && (
                          <span
                            className="
                              rounded-full
                              bg-primary-100
                              px-2 py-0.5
                              text-[9px] font-bold
                              uppercase tracking-[0.08em]
                              text-primary-700
                            "
                          >
                            {unreadCount} new
                          </span>
                        )}
                      </div>

                      <p
                        className="
                          mt-0.5 text-[10px]
                          font-medium tracking-wide
                          text-gray-400
                        "
                      >
                        Your latest account activity
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close notifications"
                    className="
                      flex h-8 w-8 items-center
                      justify-center rounded-lg
                      text-gray-400
                      transition hover:bg-gray-100
                      hover:text-gray-700
                      sm:hidden
                    "
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* ==================================================
                    TOOLBAR
                ================================================== */}

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      disabled={!notifications.length}
                      className="
                        flex items-center gap-1.5
                        rounded-lg px-2 py-1.5
                        text-[10px] font-semibold
                        text-gray-500
                        transition
                        hover:bg-gray-100
                        hover:text-gray-800
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                      "
                    >
                      <span
                        className={`
                          flex h-3.5 w-3.5
                          items-center justify-center
                          rounded-[4px] border
                          ${
                            allSelected
                              ? 'border-primary-600 bg-primary-600 text-white'
                              : 'border-gray-300 bg-white'
                          }
                        `}
                      >
                        {allSelected && (
                          <Check
                            className="h-2.5 w-2.5"
                            strokeWidth={3}
                          />
                        )}
                      </span>

                      {allSelected
                        ? 'Deselect all'
                        : 'Select all'}
                    </button>

                    {selectedCount > 0 && (
                      <span
                        className="
                          text-[9px] font-medium
                          text-gray-400
                        "
                      >
                        {selectedCount} selected
                      </span>
                    )}
                  </div>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      disabled={isMarkingRead}
                      className="
                        flex items-center gap-1.5
                        rounded-lg px-2.5 py-1.5
                        text-[10px] font-bold
                        text-primary-600
                        transition
                        hover:bg-primary-50
                        disabled:opacity-50
                      "
                    >
                      {isMarkingRead ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}

                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              {/* Selected actions */}
              <AnimatePresence>
                {selectedCount > 0 && (
                  <motion.div
                    initial={{
                      height: 0,
                      opacity: 0,
                    }}
                    animate={{
                      height: 'auto',
                      opacity: 1,
                    }}
                    exit={{
                      height: 0,
                      opacity: 0,
                    }}
                    className="overflow-hidden"
                  >
                    <div
                      className="
                        flex items-center justify-between
                        border-t border-gray-100
                        bg-gray-50/80
                        px-5 py-2.5
                      "
                    >
                      <span
                        className="
                          text-[10px] font-semibold
                          text-gray-500
                        "
                      >
                        Bulk actions
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleMarkSelectedRead}
                          disabled={isMarkingRead}
                          className="
                            rounded-lg px-2.5 py-1.5
                            text-[10px] font-semibold
                            text-primary-600
                            transition hover:bg-primary-50
                            disabled:opacity-50
                          "
                        >
                          {isMarkingRead
                            ? 'Working…'
                            : 'Mark read'}
                        </button>

                        <button
                          type="button"
                          onClick={handleDeleteSelected}
                          disabled={isDeleting}
                          className="
                            rounded-lg px-2.5 py-1.5
                            text-[10px] font-semibold
                            text-red-600
                            transition hover:bg-red-50
                            disabled:opacity-50
                          "
                        >
                          {isDeleting
                            ? 'Deleting…'
                            : 'Delete'}
                        </button>

                        <button
                          type="button"
                          onClick={clearSelection}
                          className="
                            rounded-lg p-1.5
                            text-gray-400
                            transition
                            hover:bg-gray-100
                            hover:text-gray-700
                          "
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ==================================================
                NOTIFICATION LIST
            ================================================== */}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-2">
              {notifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="
                    flex min-h-[340px]
                    flex-col items-center
                    justify-center px-8
                    text-center
                  "
                >
                  <div className="relative mb-5">
                    <div
                      className="
                        flex h-[72px] w-[72px]
                        items-center justify-center
                        rounded-[24px]
                        bg-gray-50
                        ring-1 ring-gray-100
                      "
                    >
                      <Inbox
                        className="h-8 w-8 text-gray-300"
                        strokeWidth={1.4}
                      />
                    </div>

                    <div
                      className="
                        absolute -bottom-1 -right-1
                        flex h-7 w-7
                        items-center justify-center
                        rounded-full
                        border-[3px] border-white
                        bg-primary-100
                        text-primary-600
                      "
                    >
                      <Check
                        className="h-3.5 w-3.5"
                        strokeWidth={3}
                      />
                    </div>
                  </div>

                  <h3
                    className="
                      text-[14px] font-bold
                      tracking-[-0.015em]
                      text-gray-900
                    "
                  >
                    You're all caught up
                  </h3>

                  <p
                    className="
                      mt-1.5 max-w-[245px]
                      text-[11px] leading-5
                      text-gray-400
                    "
                  >
                    There’s nothing new right now.
                    We’ll let you know when something
                    important happens.
                  </p>
                </motion.div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      selected={selected.has(notification.id)}
                      onSelect={toggleSelect}
                      onClick={handleNotificationClick}
                      onMarkRead={handleMarkRead}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* ==================================================
                FOOTER
            ================================================== */}

            <div
              className="
                flex shrink-0 items-center
                justify-between
                border-t border-gray-100
                bg-gray-50/60
                px-5 py-3
              "
            >
              <div className="flex items-center gap-2">
                <span
                  className="
                    h-1.5 w-1.5 rounded-full
                    bg-emerald-500
                  "
                />

                <span
                  className="
                    text-[9px] font-medium
                    tracking-wide text-gray-400
                  "
                >
                  Notifications are up to date
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setSelected(new Set());
                }}
                className="
                  hidden rounded-lg
                  px-2 py-1
                  text-[10px] font-semibold
                  text-gray-500
                  transition
                  hover:bg-white
                  hover:text-gray-800
                  sm:block
                "
              >
                Close
              </button>
            </div>
          </motion.div>,
          document.body
        )}
    </div>
  );
};

export default Notifications;