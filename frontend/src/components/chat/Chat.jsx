import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ArrowLeft,
  ArrowUp,
  Check,
  CheckCheck,
  ChevronRight,
  Inbox,
  LifeBuoy,
  Loader2,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';

import { toast } from 'sonner';
import { useChat } from './ChatContext';

/* ============================================================
   HELPERS
============================================================ */

const safeArray = (value) =>
  Array.isArray(value) ? value : [];

const getConversationId = (conversation) =>
  conversation?.id ||
  conversation?.conversation_id ||
  conversation?._id ||
  null;

const getMessageId = (
  message,
  index = 0
) =>
  message?.id ||
  message?.message_id ||
  message?._id ||
  `message-${index}`;

const getMessageText = (message) =>
  message?.content ||
  message?.message ||
  message?.text ||
  '';

const getMessageTime = (message) => {
  const raw =
    message?.created_at ||
    message?.timestamp ||
    message?.sent_at ||
    message?.updated_at;

  if (!raw) return '';

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getMessageDate = (message) => {
  const raw =
    message?.created_at ||
    message?.timestamp ||
    message?.sent_at ||
    message?.updated_at;

  if (!raw) return '';

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
};

const isOwnMessage = (
  message,
  user
) => {
  if (!message || !user) {
    return false;
  }

  const senderId =
    message?.sender_id ||
    message?.user_id ||
    message?.author_id ||
    message?.from_user_id;

  return (
    String(senderId || '') ===
      String(user?.id || '') ||
    message?.sender === 'user' ||
    (
      message?.sender === 'admin' &&
      user?.role === 'admin'
    )
  );
};

const getOtherParticipantName = (
  conversation,
  user,
  isAdmin
) => {
  if (!conversation) {
    return isAdmin
      ? 'Customer'
      : 'Support';
  }

  if (isAdmin) {
    return (
      conversation?.user?.full_name ||
      conversation?.user_name ||
      conversation?.customer_name ||
      conversation?.full_name ||
      conversation?.email ||
      'Customer'
    );
  }

  return (
    conversation?.admin?.full_name ||
    conversation?.admin_name ||
    conversation?.agent_name ||
    conversation?.assigned_to_name ||
    'Support team'
  );
};

const getOtherParticipantEmail = (
  conversation,
  isAdmin
) => {
  if (!conversation) {
    return '';
  }

  if (isAdmin) {
    return (
      conversation?.user?.email ||
      conversation?.user_email ||
      conversation?.email ||
      ''
    );
  }

  return (
    conversation?.admin?.email ||
    conversation?.admin_email ||
    ''
  );
};

const getConversationPreview = (
  conversation
) => {
  if (!conversation) {
    return 'Start a conversation';
  }

  const messages =
    safeArray(
      conversation?.messages
    );

  const latest =
    messages[messages.length - 1] ||
    conversation?.last_message ||
    conversation?.latest_message;

  if (typeof latest === 'string') {
    return latest;
  }

  return (
    getMessageText(latest) ||
    conversation?.last_message_text ||
    conversation?.preview ||
    'No messages yet'
  );
};

const getUnreadCount = (
  conversation,
  isAdmin
) => {
  if (!conversation) {
    return 0;
  }

  return Number(
    isAdmin
      ? conversation?.admin_unread_count || 0
      : conversation?.user_unread_count || 0
  );
};

const formatConversationDate = (
  conversation
) => {
  const raw =
    conversation?.updated_at ||
    conversation?.last_message_at ||
    conversation?.created_at;

  if (!raw) return '';

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();

  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (sameDay) {
    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
};

const getInitials = (name = '') => {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return 'S';
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`
    .toUpperCase();
};

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState({
  onNewConversation,
  isAdmin,
}) {
  return (
    <div className="flex h-full min-h-0 items-center justify-center bg-white px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-[28px] border border-blue-100 bg-blue-50 shadow-[0_18px_45px_rgba(59,130,246,0.10)]">
          {isAdmin ? (
            <Inbox className="h-9 w-9 text-blue-600" />
          ) : (
            <MessageCircle className="h-9 w-9 text-blue-600" />
          )}
        </div>

        <div className="mb-2 flex items-center justify-center gap-2">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-800">
            {isAdmin
              ? 'Select a conversation'
              : 'How can we help?'}
          </h2>

          <Sparkles className="h-4 w-4 text-blue-500" />
        </div>

        <p className="mx-auto max-w-sm text-sm leading-6 text-slate-500">
          {isAdmin
            ? 'Choose a conversation from the inbox to continue helping the customer.'
            : 'Send us a message and our support team will be happy to help.'}
        </p>

        {!isAdmin && (
          <button
            type="button"
            onClick={onNewConversation}
            className="mt-7 inline-flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0"
          >
            <Plus className="h-4 w-4" />
            Start a conversation
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   CONVERSATION LIST
============================================================ */

function ConversationList({
  conversations,
  currentConversation,
  onSelect,
  onNewConversation,
  isAdmin,
  searchTerm,
  setSearchTerm,
}) {
  const filteredConversations =
    useMemo(() => {
      const query =
        searchTerm
          .trim()
          .toLowerCase();

      if (!query) {
        return conversations;
      }

      return conversations.filter(
        (conversation) => {
          const name =
            getOtherParticipantName(
              conversation,
              null,
              isAdmin
            );

          const email =
            getOtherParticipantEmail(
              conversation,
              isAdmin
            );

          const preview =
            getConversationPreview(
              conversation
            );

          return `${name} ${email} ${preview}`
            .toLowerCase()
            .includes(query);
        }
      );
    }, [
      conversations,
      searchTerm,
      isAdmin,
    ]);

  return (
    <aside className="flex h-full min-h-0 w-full shrink-0 flex-col border-r border-slate-100 bg-white md:w-[320px] lg:w-[350px]">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-100 px-5 pb-4 pt-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight text-slate-800">
                {isAdmin
                  ? 'Support inbox'
                  : 'Messages'}
              </h1>

              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                Live
              </span>
            </div>

            <p className="mt-1 text-xs font-medium text-slate-400">
              {conversations.length}{' '}
              {conversations.length === 1
                ? 'conversation'
                : 'conversations'}
            </p>
          </div>

          {!isAdmin && (
            <button
              type="button"
              onClick={onNewConversation}
              aria-label="New conversation"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 transition hover:border-blue-200 hover:bg-blue-100"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
            placeholder={
              isAdmin
                ? 'Search customers...'
                : 'Search conversations...'
            }
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
          />
        </div>
      </div>

      {/* List */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-2.5">
        {filteredConversations.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 py-12">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
                <MessageCircle className="h-6 w-6 text-slate-300" />
              </div>

              <p className="mt-4 text-sm font-bold text-slate-600">
                {searchTerm
                  ? 'No conversations found'
                  : 'No conversations yet'}
              </p>

              {!searchTerm &&
                !isAdmin && (
                  <button
                    type="button"
                    onClick={
                      onNewConversation
                    }
                    className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    Start one now
                  </button>
                )}
            </div>
          </div>
        ) : (
          filteredConversations.map(
            (conversation) => {
              const id =
                getConversationId(
                  conversation
                );

              const selected =
                id ===
                getConversationId(
                  currentConversation
                );

              const name =
                getOtherParticipantName(
                  conversation,
                  null,
                  isAdmin
                );

              const preview =
                getConversationPreview(
                  conversation
                );

              const unread =
                getUnreadCount(
                  conversation,
                  isAdmin
                );

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    onSelect(
                      conversation
                    )
                  }
                  className={[
                    'group mb-1.5 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition',
                    selected
                      ? 'bg-blue-50 shadow-[0_5px_18px_rgba(59,130,246,0.08)]'
                      : 'hover:bg-slate-50',
                  ].join(' ')}
                >
                  <div
                    className={[
                      'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] text-xs font-extrabold',
                      selected
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-500',
                    ].join(' ')}
                  >
                    {getInitials(name)}

                    {unread > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-blue-600 px-1 text-[8px] font-extrabold text-white">
                        {unread > 9
                          ? '9+'
                          : unread}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={[
                          'truncate text-sm',
                          unread > 0
                            ? 'font-extrabold text-slate-800'
                            : 'font-bold text-slate-700',
                        ].join(' ')}
                      >
                        {name}
                      </span>

                      <span className="shrink-0 text-[10px] font-semibold text-slate-400">
                        {formatConversationDate(
                          conversation
                        )}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p
                        className={[
                          'truncate text-xs',
                          unread > 0
                            ? 'font-semibold text-slate-600'
                            : 'font-medium text-slate-400',
                        ].join(' ')}
                      >
                        {preview}
                      </p>

                      {selected && (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                      )}
                    </div>
                  </div>
                </button>
              );
            }
          )
        )}
      </div>
    </aside>
  );
}

/* ============================================================
   CHAT HEADER
============================================================ */

function ChatHeader({
  conversation,
  user,
  isAdmin,
  isConnected,
  onBack,
}) {
  const name =
    getOtherParticipantName(
      conversation,
      user,
      isAdmin
    );

  const email =
    getOtherParticipantEmail(
      conversation,
      isAdmin
    );

  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-50 hover:text-blue-600 md:hidden"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-blue-50 text-xs font-extrabold text-blue-600">
          {getInitials(name)}

          <span
            className={[
              'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white',
              isConnected
                ? 'bg-emerald-400'
                : 'bg-slate-300',
            ].join(' ')}
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-sm font-extrabold text-slate-800">
              {name}
            </h2>

            {isAdmin && (
              <span className="hidden rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-violet-600 sm:inline-flex">
                Customer
              </span>
            )}
          </div>

          <div className="mt-0.5 flex items-center gap-1.5">
            {email ? (
              <span className="max-w-[180px] truncate text-[11px] font-medium text-slate-400">
                {email}
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-400">
                {isConnected
                  ? 'Available now'
                  : 'Connecting...'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {isConnected ? (
          <div className="mr-1 hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 sm:flex">
            <Wifi className="h-3 w-3 text-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-600">
              Live
            </span>
          </div>
        ) : (
          <div className="mr-1 hidden items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1.5 sm:flex">
            <WifiOff className="h-3 w-3 text-amber-500" />
            <span className="text-[10px] font-bold text-amber-600">
              Connecting
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

/* ============================================================
   MESSAGE BUBBLE
============================================================ */

function MessageBubble({
  message,
  user,
}) {
  const own =
    isOwnMessage(
      message,
      user
    );

  const text =
    getMessageText(message);

  const time =
    getMessageTime(message);

  const read =
    message?.read === true ||
    message?.is_read === true ||
    message?.status === 'read';

  if (!text) {
    return null;
  }

  return (
    <div
      className={[
        'flex w-full',
        own
          ? 'justify-end'
          : 'justify-start',
      ].join(' ')}
    >
      <div
        className={[
          'max-w-[82%] sm:max-w-[72%]',
          own
            ? 'items-end'
            : 'items-start',
        ].join(' ')}
      >
        <div
          className={[
            'rounded-[20px] px-4 py-3 text-sm leading-6 shadow-sm',
            own
              ? 'rounded-br-[7px] bg-blue-600 text-white shadow-[0_7px_20px_rgba(37,99,235,0.13)]'
              : 'rounded-bl-[7px] border border-slate-100 bg-white text-slate-700 shadow-[0_5px_18px_rgba(15,23,42,0.045)]',
          ].join(' ')}
        >
          <p className="whitespace-pre-wrap break-words">
            {text}
          </p>
        </div>

        <div
          className={[
            'mt-1.5 flex items-center gap-1.5 px-1',
            own
              ? 'justify-end'
              : 'justify-start',
          ].join(' ')}
        >
          {time && (
            <span className="text-[10px] font-medium text-slate-400">
              {time}
            </span>
          )}

          {own && (
            <span className="text-blue-500">
              {read ? (
                <CheckCheck className="h-3.5 w-3.5" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TYPING INDICATOR
============================================================ */

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] bg-blue-50 text-[10px] font-extrabold text-blue-600">
        ST
      </div>

      <div className="flex h-10 items-center gap-1 rounded-[17px] rounded-bl-[6px] border border-slate-100 bg-white px-4 shadow-[0_5px_18px_rgba(15,23,42,0.045)]">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300" />
      </div>
    </div>
  );
}

/* ============================================================
   MESSAGE AREA
============================================================ */

function MessageArea({
  messages,
  user,
  typingUser,
  loading,
}) {
  const bottomRef =
    useRef(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    });
  }, [
    messages.length,
    typingUser,
  ]);

  const grouped =
    useMemo(() => {
      const result = [];

      messages.forEach(
        (message, index) => {
          const currentDate =
            getMessageDate(
              message
            );

          const previousDate =
            index > 0
              ? getMessageDate(
                  messages[
                    index - 1
                  ]
                )
              : null;

          if (
            currentDate &&
            currentDate !==
              previousDate
          ) {
            result.push({
              type: 'date',
              id: `date-${currentDate}-${index}`,
              label: currentDate,
            });
          }

          result.push({
            type: 'message',
            id: getMessageId(
              message,
              index
            ),
            message,
          });
        }
      );

      return result;
    }, [messages]);

  return (
    <div className="relative min-h-0 flex-1 overflow-y-auto bg-[#fbfcfe]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex h-full min-h-[240px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex min-h-[360px] flex-1 items-center justify-center">
            <div className="max-w-sm text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-blue-50">
                <LifeBuoy className="h-7 w-7 text-blue-500" />
              </div>

              <h3 className="mt-5 text-base font-extrabold text-slate-700">
                Your conversation starts here
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Send your first message and we'll take it from there.
              </p>
            </div>
          </div>
        ) : (
          <>
            {grouped.map(
              (item) =>
                item.type ===
                'date' ? (
                  <div
                    key={item.id}
                    className="my-2 flex items-center gap-3"
                  >
                    <div className="h-px flex-1 bg-slate-100" />

                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-slate-400 shadow-sm">
                      {item.label}
                    </span>

                    <div className="h-px flex-1 bg-slate-100" />
                  </div>
                ) : (
                  <MessageBubble
                    key={item.id}
                    message={
                      item.message
                    }
                    user={user}
                  />
                )
            )}

            {typingUser && (
              <TypingIndicator />
            )}

            <div
              ref={bottomRef}
              className="h-1 shrink-0"
            />
          </>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   MESSAGE COMPOSER
============================================================ */

function MessageComposer({
  value,
  setValue,
  onSend,
  sending,
  onTyping,
}) {
  const textareaRef =
    useRef(null);

  const resize =
    useCallback(() => {
      const element =
        textareaRef.current;

      if (!element) return;

      element.style.height =
        'auto';

      element.style.height = `${Math.min(
        element.scrollHeight,
        140
      )}px`;
    }, []);

  useEffect(() => {
    resize();
  }, [
    value,
    resize,
  ]);

  const handleChange = (
    event
  ) => {
    setValue(
      event.target.value
    );

    onTyping?.();

    resize();
  };

  const handleKeyDown = (
    event
  ) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault();

      if (
        value.trim() &&
        !sending
      ) {
        onSend();
      }
    }
  };

  return (
    <div
      className={[
        'shrink-0 border-t border-slate-100 bg-white px-3 py-3 sm:px-5 sm:py-4',
        'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
      ].join(' ')}
    >
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex items-end gap-2 rounded-[21px] border border-slate-200 bg-slate-50/80 p-2 shadow-[0_8px_30px_rgba(15,23,42,0.045)] transition focus-within:border-blue-200 focus-within:bg-white focus-within:shadow-[0_10px_35px_rgba(37,99,235,0.08)]">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Write a message..."
            className="max-h-[140px] min-h-[42px] flex-1 resize-none overflow-y-auto bg-transparent px-3 py-2.5 text-sm font-medium leading-5 text-slate-700 outline-none placeholder:text-slate-400"
          />

          <button
            type="button"
            onClick={onSend}
            disabled={
              !value.trim() ||
              sending
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-blue-600 text-white shadow-[0_7px_18px_rgba(37,99,235,0.22)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            aria-label="Send message"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp
                className="h-4 w-4"
                strokeWidth={2.5}
              />
            )}
          </button>
        </div>

        <div className="mt-2 hidden items-center justify-between px-2 sm:flex">
          <span className="text-[10px] font-medium text-slate-400">
            Enter to send · Shift + Enter for a new line
          </span>

          <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            Secure conversation
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN CHAT
============================================================ */

export default function Chat() {
  const {
    user,
    conversations,
    currentConversation,
    loading,
    conversationLoading,
    sending,
    error,
    isConnected,
    currentMessages,
    currentTypingUser,
    fetchConversations,
    loadConversation,
    createNewConversation,
    sendMessage,
    sendTyping,
    clearError,
  } = useChat();

  const safeConversations =
    safeArray(conversations);

  const safeMessages =
    safeArray(currentMessages);

  const [
    mobileChatOpen,
    setMobileChatOpen,
  ] = useState(
    Boolean(currentConversation)
  );

  const [
    searchTerm,
    setSearchTerm,
  ] = useState('');

  const [
    message,
    setMessage,
  ] = useState('');

  const isAdmin =
    user?.role === 'admin' ||
    user?.role === 'super_admin';

  /* ----------------------------------------------------------
     Fetch conversations
  ---------------------------------------------------------- */

  useEffect(() => {
    fetchConversations?.();
  }, [
    fetchConversations,
  ]);

  /* ----------------------------------------------------------
     Error handling
  ---------------------------------------------------------- */

  useEffect(() => {
    if (!error) {
      return;
    }

    toast.error(
      typeof error === 'string'
        ? error
        : 'Something went wrong.'
    );

    clearError?.();
  }, [
    error,
    clearError,
  ]);

  /* ----------------------------------------------------------
     Open current conversation on mobile
  ---------------------------------------------------------- */

  useEffect(() => {
    if (currentConversation) {
      setMobileChatOpen(true);
    }
  }, [
    currentConversation,
  ]);

  /* ----------------------------------------------------------
     New conversation
  ---------------------------------------------------------- */

  const handleNewConversation =
    async () => {
      try {
        const result =
          await createNewConversation?.();

        if (result) {
          setMobileChatOpen(true);
        }
      } catch (err) {
        toast.error(
          err?.message ||
            'Unable to start conversation.'
        );
      }
    };

  /* ----------------------------------------------------------
     Select conversation
  ---------------------------------------------------------- */

  const handleSelectConversation =
    async (conversation) => {
      const id =
        getConversationId(
          conversation
        );

      if (!id) {
        return;
      }

      try {
        await loadConversation?.(
          id
        );

        setMobileChatOpen(
          true
        );
      } catch (err) {
        toast.error(
          err?.message ||
            'Unable to open conversation.'
        );
      }
    };

  /* ----------------------------------------------------------
     SEND MESSAGE
     
     ChatContext.sendMessage expects:
     
       sendMessage(conversationId, message)
     
     The message is only cleared after successful
     confirmation from the chat layer.
  ---------------------------------------------------------- */

  const handleSend =
    async () => {
      const trimmed =
        message.trim();

      const conversationId =
        getConversationId(
          currentConversation
        );

      if (
        !trimmed ||
        sending
      ) {
        return;
      }

      if (!conversationId) {
        toast.error(
          'Start a conversation first.'
        );
        return;
      }

      try {
        const result =
          await sendMessage?.(
            conversationId,
            trimmed
          );

        if (
          result?.success !== false
        ) {
          setMessage('');
        }
      } catch (err) {
        /*
         * Keep the text in the composer so the user
         * does not lose an unsent message.
         */
        toast.error(
          err?.message ||
            'Message could not be sent.'
        );
      }
    };

  /* ----------------------------------------------------------
     Typing
  ---------------------------------------------------------- */

  const handleTyping =
    () => {
      const conversationId =
        getConversationId(
          currentConversation
        );

      if (!conversationId) {
        return;
      }

      sendTyping?.(
        conversationId
      );
    };

  /* ----------------------------------------------------------
     Back to conversations on mobile
  ---------------------------------------------------------- */

  const handleMobileBack =
    () => {
      setMobileChatOpen(false);
    };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div
      className={[
        'flex w-full flex-col overflow-hidden',

        /*
         * Mobile:
         * Layout header = 64px
         * Main vertical spacing + mobile nav allowance.
         */
        'h-[calc(100dvh-180px)]',

        /*
         * Desktop:
         * Layout header + main vertical spacing.
         */
        'md:h-[calc(100dvh-120px)]',

        'min-h-0',

        'rounded-[22px] border border-slate-200/80 bg-white',

        'shadow-[0_20px_60px_rgba(15,23,42,0.08),0_4px_18px_rgba(15,23,42,0.04)]',

        'ring-1 ring-slate-100/80',
      ].join(' ')}
    >
      <div className="flex h-full min-h-0 w-full overflow-hidden rounded-[22px]">
        {/* ====================================================
            CONVERSATION PANEL
        ==================================================== */}

        <div
          className={[
            'h-full min-h-0 shrink-0',
            mobileChatOpen
              ? 'hidden md:block'
              : 'block',
            'w-full md:w-auto',
          ].join(' ')}
        >
          <ConversationList
            conversations={
              safeConversations
            }
            currentConversation={
              currentConversation
            }
            onSelect={
              handleSelectConversation
            }
            onNewConversation={
              handleNewConversation
            }
            isAdmin={isAdmin}
            searchTerm={
              searchTerm
            }
            setSearchTerm={
              setSearchTerm
            }
          />
        </div>

        {/* ====================================================
            CHAT PANEL
        ==================================================== */}

        <section
          className={[
            'flex h-full min-h-0 min-w-0 flex-1 flex-col bg-white',
            mobileChatOpen
              ? 'flex'
              : 'hidden md:flex',
          ].join(' ')}
        >
          {!currentConversation ? (
            <EmptyState
              onNewConversation={
                handleNewConversation
              }
              isAdmin={isAdmin}
            />
          ) : (
            <>
              <ChatHeader
                conversation={
                  currentConversation
                }
                user={user}
                isAdmin={isAdmin}
                isConnected={
                  isConnected
                }
                onBack={
                  handleMobileBack
                }
              />

              <div className="flex min-h-0 flex-1 flex-col">
                <MessageArea
                  messages={
                    safeMessages
                  }
                  user={user}
                  typingUser={
                    currentTypingUser
                  }
                  loading={
                    conversationLoading
                  }
                />

                <MessageComposer
                  value={message}
                  setValue={setMessage}
                  onSend={handleSend}
                  sending={sending}
                  onTyping={
                    handleTyping
                  }
                />
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}