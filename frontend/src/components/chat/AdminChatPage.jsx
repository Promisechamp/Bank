// src/components/chat/AdminChatPage.jsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CheckCheck,
  ChevronLeft,
  Circle,
  Clock3,
  Menu,
  MessageCircle,
  MoreHorizontal,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Ticket,
  UserRound,
  X,
} from 'lucide-react';

import { useChat } from './ChatContext';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const normalizeText = (value) =>
  typeof value === 'string'
    ? value.trim()
    : value == null
      ? ''
      : String(value).trim();

const getConversationId = (conversation) =>
  conversation?.id ?? conversation?._id ?? null;

const getMessageId = (message) =>
  message?.id ?? message?._id ?? null;

const getUser = (message) =>
  message?.user ||
  message?.sender ||
  message?.author ||
  message?.created_by ||
  message?.createdBy ||
  {};

const getMessageContent = (message) =>
  normalizeText(
    message?.content ??
      message?.message ??
      message?.text ??
      message?.body ??
      ''
  );

const getMessageDate = (message) =>
  message?.created_at ??
  message?.createdAt ??
  message?.sent_at ??
  message?.sentAt ??
  message?.timestamp ??
  null;

const getConversationTitle = (conversation) =>
  normalizeText(
    conversation?.subject ??
      conversation?.title ??
      conversation?.topic ??
      'No subject'
  );

const getCustomerName = (conversation) =>
  normalizeText(
    conversation?.customer?.full_name ??
      conversation?.customer?.fullName ??
      conversation?.customer?.name ??
      conversation?.customer?.display_name ??
      conversation?.customer?.displayName ??
      conversation?.user?.full_name ??
      conversation?.user?.fullName ??
      conversation?.user?.name ??
      conversation?.user?.display_name ??
      conversation?.user?.displayName ??
      conversation?.requester?.full_name ??
      conversation?.requester?.name ??
      conversation?.sender?.full_name ??
      conversation?.sender?.name ??
      'Customer'
  );

const getCustomerEmail = (conversation) =>
  normalizeText(
    conversation?.customer?.email ??
      conversation?.user?.email ??
      conversation?.requester?.email ??
      ''
  );

const getConversationDate = (conversation) =>
  conversation?.updated_at ??
  conversation?.updatedAt ??
  conversation?.last_message_at ??
  conversation?.lastMessageAt ??
  conversation?.created_at ??
  conversation?.createdAt ??
  null;

const getStatus = (conversation) => {
  const status = String(conversation?.status || 'open').toLowerCase();

  return status === 'closed' ||
    status === 'resolved' ||
    status === 'complete'
    ? 'closed'
    : 'open';
};

const isDeletedMessage = (message) =>
  Boolean(message?.is_deleted || message?.isDeleted || message?.deleted);

const getConversationMessages = (conversation) =>
  Array.isArray(conversation?.messages) ? conversation.messages : [];

const getConversationPreview = (conversation) => {
  const messages = getConversationMessages(conversation);

  const lastMessage = [...messages].reverse().find(Boolean);

  if (isDeletedMessage(lastMessage)) {
    return 'Message deleted';
  }

  return (
    getMessageContent(lastMessage) ||
    normalizeText(
      conversation?.last_message ??
        conversation?.lastMessage ??
        conversation?.preview
    ) ||
    'No messages yet'
  );
};

const getInitials = (name) => {
  const value = normalizeText(name);

  if (!value) return '?';

  const parts = value.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
};

const parseDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const formatTime = (value) => {
  const date = parseDate(value);

  if (!date) return '';

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatQueueDate = (value) => {
  const date = parseDate(value);

  if (!date) return '';

  const now = new Date();

  if (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  ) {
    return formatTime(date);
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
};

const isSameDay = (a, b) => {
  const first = parseDate(a);
  const second = parseDate(b);

  if (!first || !second) return false;

  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
};

const formatDateSeparator = (value) => {
  const date = parseDate(value);

  if (!date) return '';

  const today = new Date();

  if (isSameDay(date, today)) {
    return 'Today';
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year:
      date.getFullYear() === today.getFullYear()
        ? undefined
        : 'numeric',
  });
};

/* -------------------------------------------------------------------------- */
/* Sender detection                                                           */
/* -------------------------------------------------------------------------- */

const getSenderName = (message, fallback = '') => {
  const user = getUser(message);

  return normalizeText(
    message?.sender_name ??
      message?.senderName ??
      message?.author_name ??
      message?.authorName ??
      message?.user_name ??
      message?.userName ??
      message?.display_name ??
      message?.displayName ??
      message?.full_name ??
      message?.fullName ??
      message?.name ??
      user?.full_name ??
      user?.fullName ??
      user?.name ??
      user?.display_name ??
      user?.displayName ??
      user?.username ??
      fallback
  );
};

const getSenderRole = (message) => {
  const user = getUser(message);

  return String(
    message?.sender_role ??
      message?.senderRole ??
      message?.role ??
      user?.role ??
      ''
  ).toLowerCase();
};

const isAdminUser = (user) => {
  const role = String(user?.role || '').toLowerCase();

  return Boolean(
    user?.is_admin ||
      user?.isAdmin ||
      ['admin', 'support', 'staff', 'agent', 'administrator'].includes(role)
  );
};

const isSupportMessage = (message) => {
  if (message?.is_own !== undefined && message?.is_own !== null) {
    return Boolean(message.is_own);
  }

  if (message?.isOwn !== undefined && message?.isOwn !== null) {
    return Boolean(message.isOwn);
  }

  if (message?.is_admin !== undefined && message?.is_admin !== null) {
    return Boolean(message.is_admin);
  }

  if (message?.isAdmin !== undefined && message?.isAdmin !== null) {
    return Boolean(message.isAdmin);
  }

  if (
    message?.sender_is_admin !== undefined &&
    message?.sender_is_admin !== null
  ) {
    return Boolean(message.sender_is_admin);
  }

  if (
    message?.senderIsAdmin !== undefined &&
    message?.senderIsAdmin !== null
  ) {
    return Boolean(message.senderIsAdmin);
  }

  const role = getSenderRole(message);

  if (
    ['admin', 'support', 'staff', 'agent', 'administrator'].includes(role)
  ) {
    return true;
  }

  return isAdminUser(getUser(message));
};

/* -------------------------------------------------------------------------- */
/* UI helpers                                                                  */
/* -------------------------------------------------------------------------- */

const Avatar = ({ name, support = false, size = 'md' }) => {
  const displayName =
    normalizeText(name) || (support ? 'Support' : 'Customer');

  const sizeClass =
    size === 'sm'
      ? 'h-8 w-8 text-[10px]'
      : size === 'lg'
        ? 'h-11 w-11 text-xs'
        : 'h-9 w-9 text-[10px]';

  return (
    <div
      className={[
        'flex shrink-0 items-center justify-center rounded-full font-bold',
        sizeClass,
        support
          ? 'bg-indigo-100 text-indigo-700'
          : 'bg-gray-100 text-gray-600',
      ].join(' ')}
    >
      {getInitials(displayName)}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const closed = status === 'closed';

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold',
        closed
          ? 'bg-gray-100 text-gray-500'
          : 'bg-emerald-50 text-emerald-700',
      ].join(' ')}
    >
      <span
        className={[
          'h-1.5 w-1.5 rounded-full',
          closed ? 'bg-gray-400' : 'bg-emerald-500',
        ].join(' ')}
      />
      {closed ? 'Closed' : 'Open'}
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/* Queue                                                                      */
/* -------------------------------------------------------------------------- */

const QueueRow = ({
  conversation,
  active,
  onClick,
}) => {
  const customerName = getCustomerName(conversation);
  const status = getStatus(conversation);

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group w-full border-b border-gray-100 px-4 py-4 text-left transition-colors',
        active
          ? 'bg-indigo-50/70'
          : 'bg-white hover:bg-gray-50',
      ].join(' ')}
    >
      <div className="flex gap-3">
        <Avatar name={customerName} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p
                className={[
                  'truncate text-sm font-semibold',
                  active ? 'text-indigo-700' : 'text-gray-900',
                ].join(' ')}
              >
                {customerName}
              </p>

              <p className="mt-0.5 truncate text-[11px] text-gray-400">
                {getConversationTitle(conversation)}
              </p>
            </div>

            <span className="shrink-0 text-[10px] text-gray-400">
              {formatQueueDate(getConversationDate(conversation))}
            </span>
          </div>

          <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-500">
            {getConversationPreview(conversation)}
          </p>

          <div className="mt-2.5 flex items-center justify-between">
            <StatusBadge status={status} />

            {conversation?.unread_count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[9px] font-bold text-white">
                {conversation.unread_count > 99
                  ? '99+'
                  : conversation.unread_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

const Queue = ({
  conversations,
  activeConversation,
  loading,
  filter,
  onFilterChange,
  onSelectConversation,
  onRefresh,
}) => {
  const filtered = useMemo(() => {
    const list = Array.isArray(conversations)
      ? conversations
      : [];

    const search = normalizeText(filter).toLowerCase();

    if (!search) return list;

    return list.filter((conversation) => {
      const customerName =
        getCustomerName(conversation).toLowerCase();

      const title =
        getConversationTitle(conversation).toLowerCase();

      const preview =
        getConversationPreview(conversation).toLowerCase();

      return (
        customerName.includes(search) ||
        title.includes(search) ||
        preview.includes(search)
      );
    });
  }, [conversations, filter]);

  return (
    <aside className="flex h-full w-full flex-col bg-white">
      <div className="border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Conversations
            </h2>
            <p className="mt-0.5 text-[11px] text-gray-400">
              {conversations?.length || 0} total conversations
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50"
            aria-label="Refresh conversations"
          >
            <RefreshCw
              className={[
                'h-3.5 w-3.5',
                loading ? 'animate-spin' : '',
              ].join(' ')}
            />
          </button>
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />

          <input
            type="text"
            value={filter}
            onChange={(event) =>
              onFilterChange(event.target.value)
            }
            placeholder="Search conversations..."
            className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && filtered.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading conversations...
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <MessageCircle className="h-5 w-5 text-gray-400" />
            </div>

            <p className="mt-4 text-sm font-semibold text-gray-700">
              No conversations
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-400">
              New customer conversations will appear here.
            </p>
          </div>
        ) : (
          filtered.map((conversation) => {
            const id = getConversationId(conversation);

            return (
              <QueueRow
                key={id || Math.random()}
                conversation={conversation}
                active={
                  id ===
                  getConversationId(activeConversation)
                }
                onClick={() =>
                  id && onSelectConversation(id)
                }
              />
            );
          })
        )}
      </div>
    </aside>
  );
};

/* -------------------------------------------------------------------------- */
/* Message bubble                                                             */
/* -------------------------------------------------------------------------- */

const MessageBubble = ({
  message,
  customerName,
  previousMessage,
  nextMessage,
}) => {
  const support = isSupportMessage(message);
  const deleted = isDeletedMessage(message);
  const createdAt = getMessageDate(message);

  const fallbackName = support ? 'You' : customerName;

  const senderName =
    getSenderName(message, fallbackName) ||
    fallbackName;

  const previousSupport = previousMessage
    ? isSupportMessage(previousMessage)
    : null;

  const nextSupport = nextMessage
    ? isSupportMessage(nextMessage)
    : null;

  const sameAsPrevious =
    previousMessage && previousSupport === support;

  const sameAsNext =
    nextMessage && nextSupport === support;

  return (
    <div
      className={[
        'flex w-full items-end gap-2',
        support ? 'justify-end' : 'justify-start',
        sameAsPrevious ? 'mt-1.5' : 'mt-4',
      ].join(' ')}
    >
      {!support && (
        <div className="w-8 shrink-0">
          {!sameAsNext && (
            <Avatar
              name={senderName}
              support={false}
              size="sm"
            />
          )}
        </div>
      )}

      <div
        className={[
          'flex max-w-[82%] flex-col sm:max-w-[68%]',
          support ? 'items-end' : 'items-start',
        ].join(' ')}
      >
        {!sameAsPrevious && (
          <div
            className={[
              'mb-1.5 flex items-center gap-2 px-1',
              support ? 'flex-row-reverse' : '',
            ].join(' ')}
          >
            <span className="max-w-[180px] truncate text-[10px] font-semibold text-gray-500">
              {senderName}
            </span>

            {support && (
              <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-indigo-600">
                Support
              </span>
            )}

            <span className="text-[9px] text-gray-400">
              {formatTime(createdAt)}
            </span>
          </div>
        )}

        <div
          className={[
            'relative px-4 py-2.5 text-sm leading-6 shadow-sm',
            support
              ? [
                  'bg-indigo-600 text-white',
                  sameAsPrevious
                    ? 'rounded-2xl rounded-tr-md'
                    : 'rounded-2xl rounded-br-md',
                ].join(' ')
              : [
                  'border border-gray-200 bg-white text-gray-700',
                  sameAsPrevious
                    ? 'rounded-2xl rounded-tl-md'
                    : 'rounded-2xl rounded-bl-md',
                ].join(' '),
          ].join(' ')}
        >
          {deleted ? (
            <p
              className={
                support
                  ? 'italic text-indigo-100'
                  : 'italic text-gray-400'
              }
            >
              This message was deleted.
            </p>
          ) : (
            <p className="whitespace-pre-wrap break-words">
              {getMessageContent(message)}
            </p>
          )}
        </div>

        {!nextMessage && (
          <div
            className={[
              'mt-1 px-1 text-[9px] text-gray-400',
              support ? 'text-right' : 'text-left',
            ].join(' ')}
          >
            {formatTime(createdAt)}
          </div>
        )}
      </div>

      {support && (
        <div className="w-8 shrink-0">
          {!sameAsNext && (
            <Avatar
              name={senderName}
              support
              size="sm"
            />
          )}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Empty state                                                                */
/* -------------------------------------------------------------------------- */

const EmptyConversation = () => (
  <div className="flex h-full min-h-[420px] flex-col items-center justify-center px-6 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
      <MessageCircle className="h-7 w-7 text-indigo-500" />
    </div>

    <h2 className="mt-5 text-base font-bold text-gray-900">
      Select a conversation
    </h2>

    <p className="mt-2 max-w-sm text-xs leading-5 text-gray-400">
      Choose a customer conversation from the left to view
      messages and respond.
    </p>
  </div>
);

/* -------------------------------------------------------------------------- */
/* Chat header                                                                */
/* -------------------------------------------------------------------------- */

const ChatHeader = ({
  conversation,
  onBack,
  onClose,
  onRefresh,
  refreshing,
}) => {
  const customerName = getCustomerName(conversation);
  const email = getCustomerEmail(conversation);
  const status = getStatus(conversation);

  return (
    <header className="flex min-h-[76px] shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 lg:hidden"
          aria-label="Back to conversations"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <Avatar
          name={customerName}
          size="lg"
        />

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-sm font-bold text-gray-900 sm:text-base">
              {customerName}
            </h1>

            <StatusBadge status={status} />
          </div>

          <div className="mt-1 flex min-w-0 items-center gap-2">
            {email ? (
              <span className="truncate text-[10px] text-gray-400 sm:text-xs">
                {email}
              </span>
            ) : (
              <span className="text-[10px] text-gray-400 sm:text-xs">
                Customer conversation
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="hidden h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 sm:flex disabled:opacity-50"
          aria-label="Refresh conversation"
        >
          <RefreshCw
            className={[
              'h-4 w-4',
              refreshing ? 'animate-spin' : '',
            ].join(' ')}
          />
        </button>

        {status === 'open' && (
          <button
            type="button"
            onClick={onClose}
            className="hidden h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 text-[11px] font-semibold text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 sm:flex"
          >
            <CheckCircleIcon />
            Close
          </button>
        )}

        {status === 'closed' && (
          <button
            type="button"
            onClick={onClose}
            className="hidden h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50 sm:flex"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reopen
          </button>
        )}

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          aria-label="More options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};

const CheckCircleIcon = () => (
  <Check className="h-3.5 w-3.5" />
);

/* -------------------------------------------------------------------------- */
/* Reply composer                                                             */
/* -------------------------------------------------------------------------- */

const ReplyBar = ({
  value,
  onChange,
  onSend,
  disabled,
  closed,
}) => {
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();

      if (!disabled && value.trim()) {
        onSend();
      }
    }
  };

  if (closed) {
    return (
      <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-4 sm:px-6">
        <div className="flex items-center justify-center gap-2 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500">
          <CheckCircleIcon />
          This conversation is closed.
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-gray-100 bg-white p-3 sm:p-4">
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2 transition focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a reply..."
          rows={1}
          disabled={disabled}
          className="max-h-32 min-h-[42px] flex-1 resize-none bg-transparent px-2.5 py-2 text-sm leading-5 text-gray-800 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
        />

        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Send message"
        >
          {disabled ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>

      <p className="mx-auto mt-2 hidden max-w-3xl px-2 text-[9px] text-gray-400 sm:block">
        Press Enter to send · Shift + Enter for a new line
      </p>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Main page                                                                  */
/* -------------------------------------------------------------------------- */

export default function AdminChatPage() {
  const {
    conversations = [],
    currentConversation,
    selectConversation,
    loading = false,
    closeConversation,
    fetchConversations,
    sendMessage,
    error,
  } = useChat();

  const [filter, setFilter] = useState('');
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);

  const messagesEndRef = useRef(null);

  const conversationId =
    getConversationId(currentConversation);

  const customerName = currentConversation
    ? getCustomerName(currentConversation)
    : 'Customer';

  const status = currentConversation
    ? getStatus(currentConversation)
    : 'open';

  const messages = useMemo(
    () =>
      currentConversation
        ? getConversationMessages(currentConversation)
        : [],
    [currentConversation]
  );

  useEffect(() => {
    if (!currentConversation) return;

    const timer = window.setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }, 50);

    return () => window.clearTimeout(timer);
  }, [currentConversation, messages.length]);

  useEffect(() => {
    setReply('');
  }, [conversationId]);

  const refreshConversations = async () => {
    if (typeof fetchConversations !== 'function') return;

    try {
      setRefreshing(true);
      await fetchConversations();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSelectConversation = async (id) => {
    if (!id) return;

    await selectConversation(id);
    setQueueOpen(false);
  };

  const handleCloseConversation = async () => {
    if (!conversationId) return;

    await closeConversation(conversationId);
  };

  const handleSend = async () => {
    const trimmed = reply.trim();

    if (!trimmed || !conversationId || sending) {
      return;
    }

    try {
      setSending(true);

      await sendMessage(conversationId, trimmed);

      setReply('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-gray-50 text-gray-900">
      <div className="flex h-full overflow-hidden">
        {/* Desktop queue */}
        <div className="hidden w-[330px] shrink-0 border-r border-gray-200 lg:block">
          <Queue
            conversations={conversations}
            activeConversation={currentConversation}
            loading={loading}
            filter={filter}
            onFilterChange={setFilter}
            onSelectConversation={handleSelectConversation}
            onRefresh={refreshConversations}
          />
        </div>

        {/* Mobile queue drawer */}
        {queueOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close conversation list"
              onClick={() => setQueueOpen(false)}
              className="absolute inset-0 bg-black/20"
            />

            <div className="relative h-full w-[88%] max-w-[360px] shadow-2xl">
              <div className="absolute right-[-44px] top-4">
                <button
                  type="button"
                  onClick={() => setQueueOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-gray-500 shadow-lg"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <Queue
                conversations={conversations}
                activeConversation={currentConversation}
                loading={loading}
                filter={filter}
                onFilterChange={setFilter}
                onSelectConversation={handleSelectConversation}
                onRefresh={refreshConversations}
              />
            </div>
          </div>
        )}

        {/* Chat */}
        <main className="flex min-w-0 flex-1 flex-col bg-[#f7f8fa]">
          {!currentConversation ? (
            <>
              <div className="flex h-[76px] shrink-0 items-center border-b border-gray-100 bg-white px-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => setQueueOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 lg:hidden"
                  aria-label="Open conversations"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <div className="ml-3 lg:ml-0">
                  <p className="text-sm font-bold text-gray-900">
                    Support inbox
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-400">
                    Manage customer conversations
                  </p>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                <EmptyConversation />
              </div>
            </>
          ) : (
            <>
              <ChatHeader
                conversation={currentConversation}
                onBack={() => setQueueOpen(true)}
                onClose={handleCloseConversation}
                onRefresh={refreshConversations}
                refreshing={refreshing}
              />

              {/* Mobile menu */}
              <button
                type="button"
                onClick={() => setQueueOpen(true)}
                className="absolute left-3 top-[22px] z-10 hidden h-9 w-9 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm lg:hidden"
                aria-label="Open conversations"
              >
                <Menu className="h-4 w-4" />
              </button>

              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-4xl px-3 py-5 sm:px-6 sm:py-7">
                  {error && (
                    <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
                      {normalizeText(error)}
                    </div>
                  )}

                  {messages.length === 0 ? (
                    <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                        <MessageCircle className="h-6 w-6 text-gray-400" />
                      </div>

                      <p className="mt-4 text-sm font-semibold text-gray-700">
                        No messages yet
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Start the conversation with {customerName}.
                      </p>
                    </div>
                  ) : (
                    <div className="mx-auto w-full max-w-3xl">
                      {messages.map((message, index) => {
                        const previousMessage =
                          messages[index - 1] || null;

                        const nextMessage =
                          messages[index + 1] || null;

                        const currentDate =
                          getMessageDate(message);

                        const previousDate =
                          getMessageDate(previousMessage);

                        const showDate =
                          currentDate &&
                          (!previousDate ||
                            !isSameDay(
                              currentDate,
                              previousDate
                            ));

                        return (
                          <React.Fragment
                            key={
                              getMessageId(message) ||
                              `message-${index}`
                            }
                          >
                            {showDate && (
                              <div className="my-5 flex items-center gap-3">
                                <div className="h-px flex-1 bg-gray-200" />

                                <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[9px] font-semibold text-gray-400">
                                  {formatDateSeparator(
                                    currentDate
                                  )}
                                </span>

                                <div className="h-px flex-1 bg-gray-200" />
                              </div>
                            )}

                            <MessageBubble
                              message={message}
                              customerName={customerName}
                              previousMessage={
                                previousMessage
                              }
                              nextMessage={nextMessage}
                            />
                          </React.Fragment>
                        );
                      })}

                      <div
                        ref={messagesEndRef}
                        className="h-3"
                      />
                    </div>
                  )}
                </div>
              </div>

              <ReplyBar
                value={reply}
                onChange={setReply}
                onSend={handleSend}
                disabled={sending}
                closed={status === 'closed'}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}