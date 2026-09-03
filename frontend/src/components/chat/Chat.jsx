import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Headphones,
  Loader2,
  Menu,
  MessageCircle,
  MessageSquare,
  Plus,
  Search,
  Send,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';

import { useChat } from './ChatContext';

// ================================================================
// Chat.jsx — single-file support chat
// Design goals:
// - One page/component file only
// - Calm, professional financial-product feel
// - Fewer badges / less visual noise
// - Robust API-shape normalization
// - Separate loading/sending/creating states
// - Safer message ownership detection
// - Optimistic message rendering
// - Retry failed messages
// - Unread indicators
// - Smarter auto-scroll
// ================================================================

// ================================================================
// Shared helpers
// ================================================================

const getConversationId = (conversation) =>
  conversation?.id ?? conversation?._id ?? null;

const getMessageId = (message) =>
  message?.id ?? message?._id ?? null;

const normalizeText = (value) =>
  typeof value === 'string' ? value : value == null ? '' : String(value);

const getUser = (message) =>
  message?.user || message?.sender || message?.author || {};

const isAdminUser = (user) =>
  Boolean(
    user?.is_admin ||
      user?.role === 'admin' ||
      user?.role === 'support' ||
      user?.role === 'staff'
  );

const isDeletedMessage = (message) =>
  Boolean(message?.is_deleted || message?.deleted);

const getMessageContent = (message) =>
  normalizeText(message?.content ?? message?.message ?? '');

const getMessageDate = (message) =>
  message?.created_at ?? message?.sent_at ?? message?.timestamp ?? null;

const getConversationTitle = (conversation) =>
  normalizeText(
    conversation?.subject ?? conversation?.title ?? 'Support conversation'
  );

const getConversationDate = (conversation) =>
  conversation?.updated_at ??
  conversation?.last_message_at ??
  conversation?.created_at ??
  null;

const getStatus = (conversation) => {
  const status = String(conversation?.status || 'open').toLowerCase();
  return status === 'closed' || status === 'resolved' ? 'closed' : 'open';
};

const getConversationPreview = (conversation) => {
  const messages = Array.isArray(conversation?.messages)
    ? conversation.messages
    : [];

  const lastMessage = [...messages]
    .reverse()
    .find(Boolean);

  if (isDeletedMessage(lastMessage)) return 'Message deleted';

  return (
    normalizeText(
      lastMessage?.content ??
        lastMessage?.message ??
        conversation?.last_message ??
        conversation?.preview
    ) || 'No messages yet'
  );
};

const getInitials = (user) => {
  const name = normalizeText(user?.full_name ?? user?.name);
  if (!name) return 'U';

  return name
    .split(/\s+/)
    .filter(Boolean)
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
    year:
      date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
};

const formatConversationDate = (value) => {
  const date = parseDate(value);
  if (!date) return '';

  const now = new Date();

  if (isSameDay(date, now)) {
    return formatTime(date);
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
};

const getUnreadCount = (conversation) => {
  const count =
    conversation?.unread_count ??
    conversation?.unreadCount ??
    conversation?.unread_messages ??
    conversation?.unreadMessages ??
    0;

  const parsed = Number(count);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const getExplicitOwnValue = (message) => {
  if (message?.is_own !== undefined && message?.is_own !== null) {
    return Boolean(message.is_own);
  }

  if (message?.isOwn !== undefined && message?.isOwn !== null) {
    return Boolean(message.isOwn);
  }

  if (
    message?.from_current_user !== undefined &&
    message?.from_current_user !== null
  ) {
    return Boolean(message.from_current_user);
  }

  return null;
};

const getOwnMessage = (message, isAdmin, senderIsAdmin) => {
  const explicit = getExplicitOwnValue(message);

  if (explicit !== null) return explicit;

  return isAdmin ? senderIsAdmin : !senderIsAdmin;
};

const normalizeMessageForRender = (message, isAdmin) => {
  if (!message) return null;

  const user = getUser(message);
  const senderIsAdmin = Boolean(
    message?.is_admin ||
      message?.sender_is_admin ||
      isAdminUser(user)
  );

  const ownMessage = getOwnMessage(
    message,
    isAdmin,
    senderIsAdmin
  );

  return {
    ...message,
    __user: user,
    __senderIsAdmin: senderIsAdmin,
    __ownMessage: ownMessage,
    __content: getMessageContent(message),
    __createdAt: getMessageDate(message),
    __deleted: isDeletedMessage(message),
  };
};

const getConversationStatusText = (conversation) => {
  const status = getStatus(conversation);

  if (status === 'closed') return 'Conversation closed';
  if (conversation?.admin_id) return 'Support representative assigned';

  return 'Waiting for support';
};

// ================================================================
// ChatMessage
// ================================================================

const ChatMessage = ({
  message,
  isAdmin,
  previousMessage,
  nextMessage,
  onRetry,
}) => {
  const normalized = normalizeMessageForRender(message, isAdmin);
  if (!normalized) return null;

  const {
    __user: user,
    __senderIsAdmin: senderIsAdmin,
    __ownMessage: ownMessage,
    __content: content,
    __createdAt: createdAt,
    __deleted: deleted,
  } = normalized;

  const edited = Boolean(message?.is_edited || message?.edited);
  const failed = message?.__status === 'failed';
  const sending = message?.__status === 'sending';

  const previousNormalized = normalizeMessageForRender(
    previousMessage,
    isAdmin
  );

  const nextNormalized = normalizeMessageForRender(nextMessage, isAdmin);

  const groupedWithPrevious =
    previousNormalized &&
    previousNormalized.__ownMessage === ownMessage &&
    previousNormalized.__senderIsAdmin === senderIsAdmin;

  const groupedWithNext =
    nextNormalized &&
    nextNormalized.__ownMessage === ownMessage &&
    nextNormalized.__senderIsAdmin === senderIsAdmin;

  const senderName = senderIsAdmin
    ? 'Support'
    : ownMessage
    ? 'You'
    : user?.full_name || user?.name || 'Support';

  return (
    <div
      className={`flex w-full ${
        ownMessage ? 'justify-end' : 'justify-start'
      } ${groupedWithPrevious ? 'mt-1' : 'mt-4 first:mt-0'}`}
    >
      <div
        className={`flex min-w-0 max-w-[92%] gap-2.5 sm:max-w-[72%] ${
          ownMessage ? 'flex-row-reverse' : ''
        }`}
      >
        {/* Avatar only at the beginning of a message group */}
        <div className="w-8 shrink-0">
          {!groupedWithPrevious && (
            <div
              className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl ${
                senderIsAdmin
                  ? 'bg-emerald-50 text-emerald-600'
                  : ownMessage
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {senderIsAdmin ? (
                <ShieldCheck className="h-3.5 w-3.5" />
              ) : user?.full_name || user?.name ? (
                <span className="text-[10px] font-bold">
                  {getInitials(user)}
                </span>
              ) : (
                <UserRound className="h-3.5 w-3.5" />
              )}
            </div>
          )}
        </div>

        <div className={`min-w-0 ${ownMessage ? 'text-right' : 'text-left'}`}>
          {!groupedWithPrevious && (
            <div
              className={`mb-1.5 flex items-center gap-1.5 ${
                ownMessage ? 'justify-end' : 'justify-start'
              }`}
            >
              <span className="text-[11px] font-semibold text-gray-500">
                {senderName}
              </span>

              {senderIsAdmin && (
                <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
                  Support
                </span>
              )}
            </div>
          )}

          <div
            className={`inline-block max-w-full px-3.5 py-2.5 text-sm leading-6 ${
              ownMessage
                ? `bg-primary-600 text-white shadow-sm ${
                    groupedWithPrevious
                      ? 'rounded-2xl rounded-tr-md'
                      : groupedWithNext
                      ? 'rounded-2xl rounded-br-md'
                      : 'rounded-2xl rounded-tr-md'
                  }`
                : `border border-gray-200 bg-white text-gray-700 ${
                    groupedWithPrevious
                      ? 'rounded-2xl rounded-tl-md'
                      : groupedWithNext
                      ? 'rounded-2xl rounded-bl-md'
                      : 'rounded-2xl rounded-tl-md'
                  }`
            }`}
          >
            {deleted ? (
              <p
                className={`italic ${
                  ownMessage ? 'text-white/60' : 'text-gray-400'
                }`}
              >
                This message was deleted.
              </p>
            ) : (
              <p className="whitespace-pre-wrap break-words">{content}</p>
            )}
          </div>

          {!groupedWithNext && (
            <div
              className={`mt-1.5 flex items-center gap-2 ${
                ownMessage ? 'justify-end' : 'justify-start'
              }`}
            >
              <span className="text-[10px] text-gray-400">
                {formatTime(createdAt)}
              </span>

              {edited && (
                <span className="text-[10px] italic text-gray-400">
                  edited
                </span>
              )}

              {sending && (
                <span className="text-[10px] text-gray-400">
                  Sending…
                </span>
              )}

              {failed && (
                <>
                  <span className="text-[10px] font-medium text-rose-500">
                    Failed
                  </span>
                  {onRetry && (
                    <button
                      type="button"
                      onClick={() => onRetry(message)}
                      className="text-[10px] font-semibold text-primary-600 hover:text-primary-700"
                    >
                      Retry
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ================================================================
// ChatArea
// ================================================================

const ChatArea = ({
  conversation,
  onToggleSidebar,
  isMobile,
  onNewChat,
  onBack,
  switching,
}) => {
  const {
    sendMessage,
    loading,
    isAdmin,
    addLocalMessage,
    updateLocalMessage,
  } = useChat();

  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [newMessageAnnouncement, setNewMessageAnnouncement] = useState('');

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const previousMessageCountRef = useRef(0);
  const shouldScrollAfterSendRef = useRef(false);

  const messages = Array.isArray(conversation?.messages)
    ? conversation.messages
    : [];

  const isClosed =
    conversation?.status === 'closed' ||
    conversation?.status === 'resolved';

  const assigned = Boolean(conversation?.admin_id);

  const activeConversationId = getConversationId(conversation);

  const scrollToBottom = (behavior = 'smooth') => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior,
        block: 'end',
      });
    });
  };

  const isNearBottom = () => {
    const element = messagesContainerRef.current;
    if (!element) return true;

    const distanceFromBottom =
      element.scrollHeight -
      element.scrollTop -
      element.clientHeight;

    return distanceFromBottom < 180;
  };

  // Scroll when opening a conversation and when the user is already near
  // the bottom. New incoming messages won't yank the user away from older
  // messages they are reading.
  useEffect(() => {
    const previousCount = previousMessageCountRef.current;
    const countChanged = messages.length !== previousCount;

    if (!countChanged) return;

    const wasNearBottom =
      previousCount === 0 || isNearBottom();

    if (wasNearBottom || shouldScrollAfterSendRef.current) {
      scrollToBottom(previousCount === 0 ? 'auto' : 'smooth');
    }

    if (messages.length > previousCount && previousCount > 0) {
      const latest = messages[messages.length - 1];
      const latestText = getMessageContent(latest);

      if (latestText) {
        setNewMessageAnnouncement(
          `New message: ${latestText.slice(0, 100)}`
        );

        window.clearTimeout(
          ChatArea.__announcementTimer
        );

        ChatArea.__announcementTimer = window.setTimeout(() => {
          setNewMessageAnnouncement('');
        }, 2500);
      }
    }

    previousMessageCountRef.current = messages.length;
    shouldScrollAfterSendRef.current = false;
  }, [messages.length, activeConversationId]);

  useEffect(() => {
    if (!conversation) return;

    previousMessageCountRef.current = messages.length;

    const timer = setTimeout(() => {
      textareaRef.current?.focus();
      scrollToBottom('auto');
    }, 120);

    return () => clearTimeout(timer);
  }, [activeConversationId]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 132)}px`;
  }, [message]);

  useEffect(() => {
    return () => {
      if (ChatArea.__announcementTimer) {
        window.clearTimeout(ChatArea.__announcementTimer);
      }
    };
  }, []);

  const handleSend = async () => {
    const trimmed = message.trim();

    if (
      !trimmed ||
      !conversation ||
      isClosed ||
      sending
    ) {
      return;
    }

    const conversationId = getConversationId(conversation);
    if (conversationId == null) return;

    const optimisticId = `local-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const optimisticMessage = {
      id: optimisticId,
      conversation_id: conversationId,
      content: trimmed,
      message: trimmed,
      created_at: new Date().toISOString(),
      is_own: true,
      __status: 'sending',
      user: {
        full_name: 'You',
      },
    };

    // Optional context methods enable optimistic UI. If they are not
    // implemented by the current ChatContext, the server remains the source
    // of truth and the existing sendMessage contract still works.
    const canAddLocalMessage =
      typeof addLocalMessage === 'function';

    const canUpdateLocalMessage =
      typeof updateLocalMessage === 'function';

    setMessage('');
    setSending(true);
    shouldScrollAfterSendRef.current = true;

    try {
      if (canAddLocalMessage) {
        addLocalMessage(conversationId, optimisticMessage);
      }

      await sendMessage(conversationId, trimmed);

      if (canUpdateLocalMessage) {
        updateLocalMessage(conversationId, optimisticId, {
          __status: 'sent',
        });
      }
    } catch (error) {
      if (canUpdateLocalMessage) {
        updateLocalMessage(conversationId, optimisticId, {
          __status: 'failed',
        });
      } else {
        setMessage(trimmed);
      }

      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleRetry = async (failedMessage) => {
    const retryText = getMessageContent(failedMessage);
    if (!retryText || sending || isClosed) return;

    setMessage(retryText);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const HeaderButton = ({ icon: Icon, label, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 active:scale-95"
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  if (!conversation && switching) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-gray-50">
        <header className="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 py-3.5 sm:px-6">
          {onBack && (
            <HeaderButton
              icon={ArrowLeft}
              label="Back to support"
              onClick={onBack}
            />
          )}

          {isMobile && (
            <HeaderButton
              icon={Menu}
              label="Open conversations"
              onClick={onToggleSidebar}
            />
          )}

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <Headphones className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900">
              Opening conversation…
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              Loading messages
            </p>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            <p className="text-xs font-medium">
              Loading conversation
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-gray-50">
        <header className="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 py-3.5 sm:px-6">
          {onBack && (
            <HeaderButton
              icon={ArrowLeft}
              label="Back to support"
              onClick={onBack}
            />
          )}

          {isMobile && (
            <HeaderButton
              icon={Menu}
              label="Open conversations"
              onClick={onToggleSidebar}
            />
          )}

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <Headphones className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-bold text-gray-900">
              Support centre
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              We're here to help
            </p>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-10">
          <div className="flex min-h-full items-center justify-center">
            <div className="w-full max-w-md text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-white text-primary-600 shadow-sm">
                <Headphones className="h-7 w-7" />
              </div>

              <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-600">
                Customer support
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950">
                How can we help?
              </h2>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-500">
                Start a private conversation with our support team about
                your account, payments, cards, or other services.
              </p>

              <div className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {[
                  ['Account', 'Account questions'],
                  ['Payments', 'Payment assistance'],
                  ['Cards', 'Card support'],
                ].map(([title, text]) => (
                  <div
                    key={title}
                    className="rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-left"
                  >
                    <p className="text-[11px] font-semibold text-gray-800">
                      {title}
                    </p>
                    <p className="mt-1 text-[10px] leading-4 text-gray-400">
                      {text}
                    </p>
                  </div>
                ))}
              </div>

              {onNewChat && (
                <button
                  type="button"
                  onClick={onNewChat}
                  className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-primary-700 active:scale-[0.98]"
                >
                  <MessageCircle className="h-4 w-4" />
                  Start a conversation
                </button>
              )}

              <div className="mt-5 flex items-center justify-center gap-1.5 text-[10px] font-medium text-gray-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Private support communication
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusText = getConversationStatusText(conversation);
  const status = getStatus(conversation);

  const statusColor =
    status === 'closed'
      ? 'text-gray-400'
      : assigned
      ? 'text-emerald-600'
      : 'text-amber-600';

  const statusDot =
    status === 'closed'
      ? 'bg-gray-400'
      : assigned
      ? 'bg-emerald-500'
      : 'bg-amber-500';

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50">
      {/* Header */}
      <header className="shrink-0 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
          {onBack && (
            <HeaderButton
              icon={ArrowLeft}
              label="Back to support"
              onClick={onBack}
            />
          )}

          {isMobile && (
            <HeaderButton
              icon={Menu}
              label="Open conversations"
              onClick={onToggleSidebar}
            />
          )}

          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            {isAdmin ? (
              <UserRound className="h-5 w-5" />
            ) : (
              <Headphones className="h-5 w-5" />
            )}

            {status !== 'closed' && (
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${statusDot}`}
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold text-gray-900">
              {getConversationTitle(conversation)}
            </h1>

            <div className="mt-1 flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
              <span
                className={`truncate text-[10px] font-semibold ${statusColor}`}
              >
                {statusText}
              </span>
            </div>
          </div>

          <div className="hidden items-center gap-1.5 text-[10px] font-medium text-gray-400 sm:flex">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Private
          </div>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-5 sm:px-8 sm:py-7">
          <div
            className="sr-only"
            aria-live="polite"
          >
            {newMessageAnnouncement}
          </div>

          {messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-white text-primary-600 shadow-sm">
                  <MessageCircle className="h-6 w-6" />
                </div>

                <p className="mt-5 text-sm font-bold text-gray-800">
                  Conversation started
                </p>

                <p className="mx-auto mt-1.5 max-w-xs text-xs leading-5 text-gray-500">
                  Send your first message and our support team will assist
                  you.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-5 flex justify-center">
                <div className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-gray-400 shadow-sm">
                  Private conversation
                </div>
              </div>

              <div className="flex flex-col">
                {messages.map((msg, index) => {
                  const previous = messages[index - 1];
                  const next = messages[index + 1];
                  const currentDate = getMessageDate(msg);
                  const previousDate = getMessageDate(previous);

                  const showDate =
                    currentDate &&
                    (!previousDate ||
                      !isSameDay(currentDate, previousDate));

                  return (
                    <React.Fragment
                      key={getMessageId(msg) || `message-${index}`}
                    >
                      {showDate && (
                        <div className="my-5 flex items-center gap-3">
                          <div className="h-px flex-1 bg-gray-200" />
                          <span className="shrink-0 text-[10px] font-semibold text-gray-400">
                            {formatDateSeparator(currentDate)}
                          </span>
                          <div className="h-px flex-1 bg-gray-200" />
                        </div>
                      )}

                      <ChatMessage
                        message={msg}
                        isAdmin={isAdmin}
                        previousMessage={previous}
                        nextMessage={next}
                        onRetry={handleRetry}
                      />
                    </React.Fragment>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-3 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto w-full max-w-3xl">
          {isClosed ? (
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                <Clock3 className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-700">
                  This conversation is closed
                </p>
                <p className="mt-0.5 text-[10px] text-gray-400">
                  Start a new conversation for further assistance.
                </p>
              </div>

              {onNewChat && (
                <button
                  type="button"
                  onClick={onNewChat}
                  className="shrink-0 rounded-lg bg-primary-600 px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-primary-700"
                >
                  New chat
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-1.5 shadow-sm transition focus-within:border-primary-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-100">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={message}
                    onChange={(event) =>
                      setMessage(event.target.value)
                    }
                    onKeyDown={handleKeyDown}
                    disabled={sending}
                    placeholder="Write a message to support..."
                    maxLength={5000}
                    className="max-h-[132px] min-h-[42px] flex-1 resize-none overflow-y-auto bg-transparent px-3 py-2.5 text-sm leading-5 text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!message.trim() || sending}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                      message.trim() && !sending
                        ? 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 active:scale-95'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                    aria-label="Send message"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-1.5 flex items-center justify-between px-1">
                <p className="text-[10px] text-gray-400">
                  Enter to send · Shift + Enter for a new line
                </p>

                <span className="hidden text-[10px] text-gray-400 sm:inline">
                  {message.length}/5000
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ================================================================
// ConversationItem
// ================================================================

const ConversationItem = ({
  conversation,
  active,
  selecting,
  onClick,
}) => {
  const status = getStatus(conversation);
  const unreadCount = getUnreadCount(conversation);
  const unread = unreadCount > 0 && !active;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={selecting}
      className={`w-full border-b border-gray-100 px-4 py-3.5 text-left transition ${
        active
          ? 'bg-primary-50/70'
          : 'bg-white hover:bg-gray-50'
      } ${selecting ? 'cursor-wait opacity-70' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            active
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {selecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageSquare className="h-4 w-4" />
          )}

          {!selecting && status === 'open' && (
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className={`min-w-0 flex-1 truncate text-xs ${
                unread
                  ? 'font-bold text-gray-900'
                  : active
                  ? 'font-semibold text-primary-900'
                  : 'font-semibold text-gray-800'
              }`}
            >
              {getConversationTitle(conversation)}
            </p>

            <span className="shrink-0 text-[10px] font-medium text-gray-400">
              {formatConversationDate(
                getConversationDate(conversation)
              )}
            </span>
          </div>

          <p
            className={`mt-1 truncate text-[10px] leading-5 ${
              unread
                ? 'font-medium text-gray-600'
                : 'text-gray-500'
            }`}
          >
            {getConversationPreview(conversation)}
          </p>

          <div className="mt-1.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {status === 'open' ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-semibold text-emerald-600">
                    Open
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3 text-gray-400" />
                  <span className="text-[10px] font-semibold text-gray-400">
                    Closed
                  </span>
                </>
              )}
            </div>

            {unread && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-[9px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

// ================================================================
// ChatSidebar
// ================================================================

const ChatSidebar = ({
  conversations = [],
  activeConversation,
  selectingId,
  onSelectConversation,
  onNewChat,
  loading,
  mobile = false,
  onClose,
}) => {
  const [search, setSearch] = useState('');

  const filteredConversations = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return conversations;

    return conversations.filter((conversation) => {
      const title = getConversationTitle(conversation).toLowerCase();
      const preview = getConversationPreview(conversation).toLowerCase();

      return (
        title.includes(term) ||
        preview.includes(term)
      );
    });
  }, [conversations, search]);

  const activeId = getConversationId(activeConversation);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <header className="shrink-0 border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary-600">
              Support
            </p>
            <h2 className="mt-1 text-sm font-bold tracking-tight text-gray-900">
              Conversations
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNewChat}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm transition hover:bg-primary-700 active:scale-95"
              aria-label="Start new conversation"
            >
              <Plus className="h-4 w-4" />
            </button>

            {mobile && (
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-50 active:scale-95"
                aria-label="Close conversations"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 transition focus-within:border-primary-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-100">
            <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search conversations"
              className="h-10 min-w-0 flex-1 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-gray-400 transition hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && conversations.length === 0 && (
          <div className="space-y-1 p-3">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-xl p-3"
              >
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gray-100" />

                  <div className="flex-1">
                    <div className="h-3 w-2/3 rounded bg-gray-100" />
                    <div className="mt-2 h-2.5 w-full rounded bg-gray-100" />
                    <div className="mt-2 h-2 w-1/3 rounded bg-gray-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredConversations.length === 0 && (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
              <MessageSquare className="h-5 w-5" />
            </div>

            <p className="mt-4 text-xs font-bold text-gray-800">
              {search
                ? 'No conversations found'
                : 'No conversations yet'}
            </p>

            <p className="mx-auto mt-1.5 max-w-[210px] text-[10px] leading-5 text-gray-500">
              {search
                ? 'Try another search term or clear your search.'
                : 'Start a conversation with our support team when you need assistance.'}
            </p>

            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-4 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[10px] font-bold text-gray-600 transition hover:bg-gray-50"
              >
                Clear search
              </button>
            ) : (
              <button
                type="button"
                onClick={onNewChat}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-3.5 py-2.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-primary-700"
              >
                <Plus className="h-3.5 w-3.5" />
                New conversation
              </button>
            )}
          </div>
        )}

        {filteredConversations.length > 0 && (
          <>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                Recent
              </span>

              <span className="text-[10px] font-medium text-gray-400">
                {filteredConversations.length}
              </span>
            </div>

            {filteredConversations.map((conversation) => {
              const id = getConversationId(conversation);

              return (
                <ConversationItem
                  key={id ?? `conversation-${Math.random()}`}
                  conversation={conversation}
                  active={id === activeId}
                  selecting={
                    selectingId != null &&
                    selectingId === id
                  }
                  onClick={() => onSelectConversation(id)}
                />
              );
            })}
          </>
        )}
      </div>

      <footer className="shrink-0 border-t border-gray-100 bg-gray-50 p-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Clock3 className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-gray-700">
              Support availability
            </p>
            <p className="mt-0.5 truncate text-[10px] text-gray-400">
              Representatives respond during business hours
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ================================================================
// NewChatModal
// ================================================================

const NewChatModal = ({
  open,
  onClose,
  onCreated,
}) => {
  const {
    createConversation,
    newConversation,
  } = useChat();

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) {
      setSubject('');
      setCategory('');
      setError('');
      setCreating(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape' && !creating) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () =>
      window.removeEventListener('keydown', handleEscape);
  }, [open, creating, onClose]);

  if (!open) return null;

  const topics = [
    ['Account', 'Account access or profile'],
    ['Payments', 'Transfers or payment issues'],
    ['Cards', 'Card support'],
    ['Other', 'Something else'],
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmed = subject.trim();

    if (!trimmed) {
      setError('Please enter a subject for your conversation.');
      return;
    }

    setError('');

    const create =
      createConversation || newConversation;

    if (typeof create !== 'function') {
      setError(
        'Conversation service is not available. Please try again later.'
      );
      console.error(
        'No conversation creation function found in context.'
      );
      return;
    }

    setCreating(true);

    try {
      // Keep compatibility with contexts that accept only a subject,
      // while also supporting a richer second options argument.
      let result;

      try {
        result = await create(trimmed, {
          category: category || undefined,
        });
      } catch (firstError) {
        // If the existing context only expects one argument, retrying
        // with the original contract preserves compatibility.
        result = await create(trimmed);
      }

      const created =
        result?.conversation ||
        result?.data?.conversation ||
        result?.data ||
        result;

      if (
        created &&
        getConversationId(created) != null
      ) {
        onCreated?.(created);
      } else if (created) {
        console.warn(
          'Created conversation has no id/_id field:',
          created
        );
        setError(
          'Conversation was created but could not be opened. Please refresh and try again.'
        );
      } else {
        setError(
          'Conversation was created but no data was returned.'
        );
      }
    } catch (err) {
      console.error(
        'Conversation creation error:',
        err
      );

      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        err?.error ||
        'Unable to start the conversation. Please try again.';

      setError(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/45 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !creating
        ) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md overflow-hidden rounded-[26px] border border-gray-200 bg-white shadow-[0_30px_90px_-35px_rgba(15,23,42,0.5)]"
      >
        <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <MessageCircle className="h-5 w-5" />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-600">
                  Customer support
                </p>

                <h2 className="mt-1 text-lg font-bold tracking-tight text-gray-900">
                  Start a conversation
                </h2>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Choose a topic and briefly describe what you need.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-5 py-5 sm:px-6">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                Topic
              </p>

              <div className="grid grid-cols-2 gap-2">
                {topics.map(([title, description]) => {
                  const selected = category === title;

                  return (
                    <button
                      key={title}
                      type="button"
                      disabled={creating}
                      onClick={() => {
                        setCategory(title);
                        if (!subject.trim()) {
                          setSubject(title);
                        }
                        setError('');
                      }}
                      className={`rounded-xl border px-3 py-3 text-left transition ${
                        selected
                          ? 'border-primary-300 bg-primary-50 text-primary-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-primary-200 hover:bg-primary-50/50'
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <p className="text-[11px] font-semibold">
                        {title}
                      </p>
                      <p className="mt-1 text-[10px] leading-4 text-gray-400">
                        {description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="support-subject"
                  className="block text-xs font-semibold text-gray-700"
                >
                  What do you need help with?
                </label>

                <span className="text-[10px] text-gray-400">
                  {subject.length}/120
                </span>
              </div>

              <input
                id="support-subject"
                type="text"
                value={subject}
                onChange={(event) => {
                  setSubject(event.target.value);
                  setError('');
                }}
                placeholder="e.g. I need help with a transfer"
                autoFocus
                maxLength={120}
                disabled={creating}
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <p className="mt-1.5 px-1 text-[10px] text-gray-400">
                A short description helps the support team understand your request.
              </p>
            </div>

            <div className="flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

              <div>
                <p className="text-xs font-semibold text-emerald-800">
                  Private support
                </p>

                <p className="mt-0.5 text-[10px] leading-5 text-emerald-700/70">
                  Your conversation is visible only to you and authorised support staff.
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-3 text-xs font-medium text-rose-700">
                {error}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={creating || !subject.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Starting…
                </>
              ) : (
                <>
                  Start conversation
                  <MessageCircle className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================================================================
// ChatPage
// ================================================================

const MOBILE_BREAKPOINT = 768;

const ChatPage = ({ onBack }) => {
  
  const {
    conversations = [],
    currentConversation,
    selectConversation,
    loading,
  } = useChat();

  // no separate `currentConversation = a || b || null` line anymore —
  // currentConversation now comes straight from context

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [newChatOpen, setNewChatOpen] =
    useState(false);

  const [selectingId, setSelectingId] =
    useState(null);

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(
          `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
        ).matches
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
    );

    const handleChange = () => {
      const mobile = media.matches;
      setIsMobile(mobile);

      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    handleChange();
    media.addEventListener('change', handleChange);

    return () =>
      media.removeEventListener(
        'change',
        handleChange
      );
  }, []);

  useEffect(() => {
    if (currentConversation && isMobile) {
      setSidebarOpen(false);
    }
  }, [
    getConversationId(currentConversation),
    isMobile,
  ]);

  useEffect(() => {
    if (
      selectingId != null &&
      getConversationId(currentConversation) ===
        selectingId
    ) {
      setSelectingId(null);
    }
  }, [
    selectingId,
    currentConversation,
  ]);

  const runSelect = async (id) => {
    if (id == null) {
      console.warn(
        'Tried to select a conversation with no id.'
      );
      return;
    }

    if (
      selectingId === id &&
      getConversationId(currentConversation) !== id
    ) {
      return;
    }

    setSelectingId(id);

    try {
      await selectConversation?.(id);

      // Some contexts update synchronously, some asynchronously.
      // The effect above clears this when the selected conversation arrives.
      // This fallback prevents a permanent spinner when the context
      // performs a synchronous/no-op selection.
      window.setTimeout(() => {
        setSelectingId((current) =>
          current === id &&
          getConversationId(currentConversation) === id
            ? null
            : current
        );
      }, 2500);
    } catch (err) {
      console.error(
        'Failed to open conversation:',
        err
      );
      setSelectingId(null);
    }
  };

  const handleSelectConversation = (conversationId) => {
    runSelect(conversationId);

    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleNewChat = () => {
    setNewChatOpen(true);
  };

  const handleCreated = (createdConversation) => {
    setNewChatOpen(false);

    const id = getConversationId(
      createdConversation
    );

    if (id != null) {
      runSelect(id);
    } else {
      console.warn(
        'Created conversation has no id/_id, cannot open it:',
        createdConversation
      );
    }

    setSidebarOpen(false);
  };

  return (
    <>
      <section className="flex h-full min-h-0 w-full">
        <div className="relative flex h-full min-h-0 w-full overflow-hidden bg-white">
          {/* Desktop sidebar */}
          <aside className="hidden w-[288px] shrink-0 border-r border-gray-200 bg-white md:flex">
            <ChatSidebar
              conversations={conversations}
              activeConversation={currentConversation}
              selectingId={selectingId}
              onSelectConversation={
                handleSelectConversation
              }
              onNewChat={handleNewChat}
              loading={loading}
            />
          </aside>

          {/* Mobile sidebar */}
          {isMobile && sidebarOpen && (
            <>
              <button
                type="button"
                aria-label="Close conversations"
                onClick={() => setSidebarOpen(false)}
                className="absolute inset-0 z-30 bg-gray-950/25 backdrop-blur-[1px]"
              />

              <aside className="absolute inset-y-0 left-0 z-40 flex w-[88%] max-w-[340px] overflow-hidden border-r border-gray-200 bg-white shadow-2xl">
                <ChatSidebar
                  conversations={conversations}
                  activeConversation={currentConversation}
                  selectingId={selectingId}
                  onSelectConversation={
                    handleSelectConversation
                  }
                  onNewChat={handleNewChat}
                  loading={loading}
                  mobile
                  onClose={() =>
                    setSidebarOpen(false)
                  }
                />
              </aside>
            </>
          )}

          {/* Chat area */}
          <main className="flex min-h-0 min-w-0 flex-1">
            <ChatArea
              conversation={currentConversation}
              switching={selectingId != null}
              onToggleSidebar={() =>
                setSidebarOpen(true)
              }
              isMobile={isMobile}
              onNewChat={handleNewChat}
              onBack={onBack}
            />
          </main>

          {/* Mobile conversations button */}
          {isMobile &&
            !sidebarOpen &&
            !currentConversation && (
              <button
                type="button"
                onClick={() =>
                  setSidebarOpen(true)
                }
                className="absolute left-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 active:scale-95"
                aria-label="Open conversations"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            )}
        </div>
      </section>

      <NewChatModal
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
};

export default ChatPage;
