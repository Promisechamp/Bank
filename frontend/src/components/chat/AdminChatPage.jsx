// src/components/chat/AdminChatPage.jsx
// Clean admin inbox: support messages always on the RIGHT, optimistic sends,
// single scroll region, mobile-safe height (visualViewport + dvh).

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  Menu,
  MessageCircle,
  MoreHorizontal,
  RefreshCw,
  Search,
  Send,
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
  message?.id ?? message?._id ?? message?.message_id ?? null;

const getUser = (message) =>
  message?.user ||
  message?.sender ||
  message?.author ||
  message?.created_by ||
  message?.createdBy ||
  message?.sender_user ||
  message?.senderUser ||
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
  if (isDeletedMessage(lastMessage)) return 'Message deleted';
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
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
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
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
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
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
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
  if (isSameDay(date, today)) return 'Today';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
};

const makeLocalId = () =>
  `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const PENDING_MATCH_WINDOW_MS = 2 * 60 * 1000;

/* -------------------------------------------------------------------------- */
/* Sender detection — admin / support ALWAYS renders on the right             */
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
      user?.user_role ??
      user?.userRole ??
      user?.type ??
      ''
  ).toLowerCase();
};

const isAdminUser = (user) => {
  const role = String(user?.role || user?.user_role || user?.type || '').toLowerCase();
  return Boolean(
    user?.is_admin ||
      user?.isAdmin ||
      user?.is_staff ||
      user?.isStaff ||
      user?.is_support ||
      user?.isSupport ||
      ['admin', 'support', 'staff', 'agent', 'administrator'].includes(role)
  );
};

/**
 * Support / admin messages go on the RIGHT in the admin inbox.
 * Prefer explicit flags; fall back to role / user object.
 * Optimistic local messages are marked is_own / is_admin.
 */
const isSupportMessage = (message) => {
  if (!message) return false;

  // Optimistic local send from admin UI
  if (message.__local === true) return true;
  if (message.is_own === true || message.isOwn === true) return true;

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

  const direction = String(message?.direction || message?.sender_type || message?.senderType || '').toLowerCase();
  if (
    direction === 'outbound' ||
    direction === 'outgoing' ||
    direction === 'admin' ||
    direction === 'support'
  ) {
    return true;
  }

  const role = getSenderRole(message);
  if (['admin', 'support', 'staff', 'agent', 'administrator'].includes(role)) {
    return true;
  }

  return isAdminUser(getUser(message));
};

/* -------------------------------------------------------------------------- */
/* UI primitives                                                              */
/* -------------------------------------------------------------------------- */

const Avatar = ({ name, support = false, size = 'md' }) => {
  const displayName = normalizeText(name) || (support ? 'Support' : 'Customer');
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
        closed ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-700',
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

const QueueRow = ({ conversation, active, onClick }) => {
  const customerName = getCustomerName(conversation);
  const status = getStatus(conversation);

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group w-full border-b border-gray-100 px-4 py-4 text-left transition-colors',
        active ? 'bg-indigo-50/70' : 'bg-white hover:bg-gray-50',
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
    const list = Array.isArray(conversations) ? conversations : [];
    const search = normalizeText(filter).toLowerCase();
    if (!search) return list;
    return list.filter((conversation) => {
      const customerName = getCustomerName(conversation).toLowerCase();
      const title = getConversationTitle(conversation).toLowerCase();
      const preview = getConversationPreview(conversation).toLowerCase();
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
            <h2 className="text-sm font-bold text-gray-900">Conversations</h2>
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
              className={['h-3.5 w-3.5', loading ? 'animate-spin' : ''].join(
                ' '
              )}
            />
          </button>
        </div>
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={filter}
            onChange={(event) => onFilterChange(event.target.value)}
            placeholder="Search conversations..."
            className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
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
                active={id === getConversationId(activeConversation)}
                onClick={() => id && onSelectConversation(id)}
              />
            );
          })
        )}
      </div>
    </aside>
  );
};

/* -------------------------------------------------------------------------- */
/* Message bubble — support ALWAYS on the right                               */
/* -------------------------------------------------------------------------- */

const MessageBubble = ({
  message,
  customerName,
  previousMessage,
  nextMessage,
}) => {
  // In admin UI: support/admin = right side
  const support = isSupportMessage(message);
  const deleted = isDeletedMessage(message);
  const createdAt = getMessageDate(message);
  const sending = message?.__status === 'sending';
  const failed = message?.__status === 'failed';

  const fallbackName = support ? 'You' : customerName;
  const senderName = getSenderName(message, fallbackName) || fallbackName;

  const previousSupport = previousMessage
    ? isSupportMessage(previousMessage)
    : null;
  const nextSupport = nextMessage ? isSupportMessage(nextMessage) : null;

  const sameAsPrevious = previousMessage && previousSupport === support;
  const sameAsNext = nextMessage && nextSupport === support;

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
            <Avatar name={senderName} support={false} size="sm" />
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
            sending ? 'opacity-70' : '',
            failed ? 'ring-1 ring-rose-300' : '',
          ].join(' ')}
        >
          {deleted ? (
            <p
              className={
                support ? 'italic text-indigo-100' : 'italic text-gray-400'
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

        {!sameAsNext && (
          <div
            className={[
              'mt-1 flex items-center gap-1.5 px-1 text-[9px] text-gray-400',
              support ? 'justify-end' : 'justify-start',
            ].join(' ')}
          >
            <span>{formatTime(createdAt)}</span>
            {sending && <span className="italic">Sending…</span>}
            {failed && (
              <span className="font-semibold text-rose-500">Failed</span>
            )}
          </div>
        )}
      </div>

      {support && (
        <div className="w-8 shrink-0">
          {!sameAsNext && (
            <Avatar name={senderName} support size="sm" />
          )}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Empty / header / composer                                                  */
/* -------------------------------------------------------------------------- */

const EmptyConversation = () => (
  <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-6 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
      <MessageCircle className="h-7 w-7 text-indigo-500" />
    </div>
    <h2 className="mt-5 text-base font-bold text-gray-900">
      Select a conversation
    </h2>
    <p className="mt-2 max-w-sm text-xs leading-5 text-gray-400">
      Choose a customer conversation from the left to view messages and respond.
    </p>
  </div>
);

const CheckCircleIcon = () => <Check className="h-3.5 w-3.5" />;

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
    <header className="flex min-h-[64px] shrink-0 items-center justify-between border-b border-gray-100 bg-white px-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 lg:hidden"
          aria-label="Back to conversations"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <Avatar name={customerName} size="lg" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-sm font-bold text-gray-900 sm:text-base">
              {customerName}
            </h1>
            <StatusBadge status={status} />
          </div>
          <div className="mt-0.5 flex min-w-0 items-center gap-2">
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
            className={['h-4 w-4', refreshing ? 'animate-spin' : ''].join(' ')}
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

const ReplyBar = ({ value, onChange, onSend, disabled, closed }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  };

  if (closed) {
    return (
      <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center justify-center gap-2 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500">
          <CheckCircleIcon />
          This conversation is closed.
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-gray-100 bg-white p-3 sm:p-4 safe-area-pb">
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2 transition focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a reply..."
          rows={1}
          disabled={disabled}
          className="max-h-[120px] min-h-[42px] flex-1 resize-none overflow-y-auto bg-transparent px-2.5 py-2 text-sm leading-5 text-gray-800 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
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
      <p className="mx-auto mt-1.5 hidden max-w-3xl px-2 text-[9px] text-gray-400 sm:block">
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

  // Optimistic messages keyed by conversation id
  const [pendingByConversation, setPendingByConversation] = useState({});

  const messagesEndRef = useRef(null);
  const scrollRef = useRef(null);
  const rootRef = useRef(null);

  const conversationId = getConversationId(currentConversation);
  const customerName = currentConversation
    ? getCustomerName(currentConversation)
    : 'Customer';
  const status = currentConversation
    ? getStatus(currentConversation)
    : 'open';

  // Merge server messages + pending optimistics for display
  const pendingForCurrent =
    (conversationId != null && pendingByConversation[conversationId]) || [];

  const messages = useMemo(() => {
    const existing = currentConversation
      ? getConversationMessages(currentConversation)
      : [];
    if (pendingForCurrent.length === 0) return existing;
    return [...existing, ...pendingForCurrent];
  }, [currentConversation, pendingForCurrent]);

  // Prune pending once server copy appears
  useEffect(() => {
    if (conversationId == null) return;
    const existing = currentConversation
      ? getConversationMessages(currentConversation)
      : [];

    setPendingByConversation((prev) => {
      const currentPending = prev[conversationId];
      if (!currentPending?.length) return prev;

      const stillPending = currentPending.filter((pending) => {
        if (pending.__status === 'failed') return true;
        return !existing.some((m) => {
          if (!isSupportMessage(m)) return false;
          if (getMessageContent(m) !== pending.content) return false;
          const t1 = parseDate(getMessageDate(m));
          const t2 = parseDate(pending.created_at);
          if (!t1 || !t2) return true;
          return Math.abs(t1.getTime() - t2.getTime()) < PENDING_MATCH_WINDOW_MS;
        });
      });

      if (stillPending.length === currentPending.length) return prev;
      return { ...prev, [conversationId]: stillPending };
    });
  }, [currentConversation, conversationId]);

  // Keep composer visible above mobile keyboard (visualViewport)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const root = rootRef.current;
    if (!root) return;

    const sync = () => {
      const vv = window.visualViewport;
      // Cap height to visible viewport so keyboard doesn't cover composer
      root.style.height = `${vv.height}px`;
    };

    sync();
    window.visualViewport.addEventListener('resize', sync);
    window.visualViewport.addEventListener('scroll', sync);
    return () => {
      window.visualViewport.removeEventListener('resize', sync);
      window.visualViewport.removeEventListener('scroll', sync);
      if (root) root.style.height = '';
    };
  }, []);

  // Auto-scroll to bottom when messages change (only if near bottom or first load)
  useEffect(() => {
    if (!currentConversation) return;
    const el = scrollRef.current;
    const nearBottom =
      !el ||
      el.scrollHeight - el.scrollTop - el.clientHeight < 180;

    if (nearBottom) {
      const timer = window.setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: messages.length > 1 ? 'smooth' : 'auto',
          block: 'end',
        });
      }, 40);
      return () => window.clearTimeout(timer);
    }
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

  const addPending = useCallback((cid, message) => {
    setPendingByConversation((prev) => ({
      ...prev,
      [cid]: [...(prev[cid] || []), message],
    }));
  }, []);

  const updatePending = useCallback((cid, id, patch) => {
    setPendingByConversation((prev) => ({
      ...prev,
      [cid]: (prev[cid] || []).map((m) =>
        m.id === id ? { ...m, ...patch } : m
      ),
    }));
  }, []);

  const handleSend = async () => {
    const trimmed = reply.trim();
    if (!trimmed || !conversationId || sending) return;

    const localId = makeLocalId();
    const createdAt = new Date().toISOString();

    // Optimistic bubble on the RIGHT (support)
    addPending(conversationId, {
      id: localId,
      conversation_id: conversationId,
      content: trimmed,
      message: trimmed,
      created_at: createdAt,
      is_own: true,
      is_admin: true,
      __local: true,
      __status: 'sending',
    });

    setReply('');
    setSending(true);

    try {
      await sendMessage(conversationId, trimmed);
      updatePending(conversationId, localId, { __status: 'sent' });
    } catch (err) {
      console.error('Failed to send message:', err);
      updatePending(conversationId, localId, { __status: 'failed' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      ref={rootRef}
      className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-gray-50 text-gray-900"
      style={{ height: '100dvh' }}
    >
      <div className="flex min-h-0 flex-1 overflow-hidden">
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

        {/* Chat pane — only this column scrolls its middle section */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#f7f8fa]">
          {!currentConversation ? (
            <>
              <div className="flex h-[64px] shrink-0 items-center border-b border-gray-100 bg-white px-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => setQueueOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 lg:hidden"
                  aria-label="Open conversations"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="ml-3 lg:ml-0">
                  <p className="text-sm font-bold text-gray-900">Support inbox</p>
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

              {/* ONLY scrollable region */}
              <div
                ref={scrollRef}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
              >
                <div className="mx-auto w-full max-w-4xl px-3 py-4 sm:px-6 sm:py-6">
                  {error && (
                    <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
                      {normalizeText(error)}
                    </div>
                  )}

                  {messages.length === 0 ? (
                    <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
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
                        const previousMessage = messages[index - 1] || null;
                        const nextMessage = messages[index + 1] || null;
                        const currentDate = getMessageDate(message);
                        const previousDate = getMessageDate(previousMessage);
                        const showDate =
                          currentDate &&
                          (!previousDate ||
                            !isSameDay(currentDate, previousDate));

                        return (
                          <React.Fragment
                            key={
                              getMessageId(message) || `message-${index}`
                            }
                          >
                            {showDate && (
                              <div className="my-5 flex items-center gap-3">
                                <div className="h-px flex-1 bg-gray-200" />
                                <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[9px] font-semibold text-gray-400">
                                  {formatDateSeparator(currentDate)}
                                </span>
                                <div className="h-px flex-1 bg-gray-200" />
                              </div>
                            )}
                            <MessageBubble
                              message={message}
                              customerName={customerName}
                              previousMessage={previousMessage}
                              nextMessage={nextMessage}
                            />
                          </React.Fragment>
                        );
                      })}
                      <div ref={messagesEndRef} className="h-2" />
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
