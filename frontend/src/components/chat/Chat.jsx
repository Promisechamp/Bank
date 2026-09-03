import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ArrowLeft,
  Check,
  CheckCheck,
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

/* ================================================================
   HELPERS
================================================================ */

const getConversationId = (conversation) =>
  conversation?.id ?? conversation?._id ?? null;

const getMessageId = (message) =>
  message?.id ??
  message?._id ??
  message?.message_id ??
  null;

const text = (value) =>
  value === null || value === undefined
    ? ''
    : String(value);

const getMessageUser = (message) =>
  message?.user ??
  message?.sender ??
  message?.author ??
  message?.sender_user ??
  message?.senderUser ??
  {};

const getMessageContent = (message) =>
  text(
    message?.content ??
      message?.message ??
      message?.text ??
      ''
  );

const getMessageDate = (message) =>
  message?.created_at ??
  message?.createdAt ??
  message?.sent_at ??
  message?.sentAt ??
  message?.timestamp ??
  null;

const parseDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
};

const formatTime = (value) => {
  const date = parseDate(value);

  if (!date) return '';

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const sameDay = (a, b) => {
  const first = parseDate(a);
  const second = parseDate(b);

  if (!first || !second) return false;

  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
};

const formatDate = (value) => {
  const date = parseDate(value);

  if (!date) return '';

  const today = new Date();

  if (sameDay(date, today)) {
    return 'Today';
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (sameDay(date, yesterday)) {
    return 'Yesterday';
  }

  return date.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year:
      date.getFullYear() === today.getFullYear()
        ? undefined
        : 'numeric',
  });
};

const formatConversationDate = (value) => {
  const date = parseDate(value);

  if (!date) return '';

  if (sameDay(date, new Date())) {
    return formatTime(date);
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
};

const getConversationDate = (conversation) =>
  conversation?.updated_at ??
  conversation?.updatedAt ??
  conversation?.last_message_at ??
  conversation?.lastMessageAt ??
  conversation?.created_at ??
  conversation?.createdAt ??
  null;

const getConversationTitle = (conversation) =>
  text(
    conversation?.subject ??
      conversation?.title ??
      conversation?.name ??
      'Support conversation'
  );

const getStatus = (conversation) => {
  const status = text(
    conversation?.status ?? 'open'
  ).toLowerCase();

  return status === 'closed' ||
    status === 'resolved'
    ? 'closed'
    : 'open';
};

const getUnreadCount = (conversation) => {
  const value =
    conversation?.unread_count ??
    conversation?.unreadCount ??
    conversation?.unread_messages ??
    conversation?.unreadMessages ??
    0;

  const number = Number(value);

  return Number.isFinite(number) && number > 0
    ? number
    : 0;
};

const getConversationPreview = (conversation) => {
  const messages = Array.isArray(
    conversation?.messages
  )
    ? conversation.messages
    : [];

  const latest = [...messages]
    .reverse()
    .find(Boolean);

  return (
    getMessageContent(latest) ||
    text(
      conversation?.last_message ??
        conversation?.lastMessage ??
        conversation?.preview
    ) ||
    'No messages yet'
  );
};

const getExplicitOwnValue = (message) => {
  if (
    message?.is_own !== undefined &&
    message?.is_own !== null
  ) {
    return Boolean(message.is_own);
  }

  if (
    message?.isOwn !== undefined &&
    message?.isOwn !== null
  ) {
    return Boolean(message.isOwn);
  }

  if (
    message?.from_current_user !== undefined &&
    message?.from_current_user !== null
  ) {
    return Boolean(message.from_current_user);
  }

  if (
    message?.fromCurrentUser !== undefined &&
    message?.fromCurrentUser !== null
  ) {
    return Boolean(message.fromCurrentUser);
  }

  return null;
};

const getRole = (user) =>
  text(
    user?.role ??
      user?.user_role ??
      user?.userRole ??
      ''
  ).toLowerCase();

const isAdminUser = (user) => {
  const role = getRole(user);

  return Boolean(
    user?.is_admin ||
      user?.isAdmin ||
      user?.is_staff ||
      user?.isStaff ||
      role === 'admin' ||
      role === 'support' ||
      role === 'staff' ||
      role === 'agent'
  );
};

const getSenderIsAdmin = (message) => {
  const user = getMessageUser(message);

  return Boolean(
    message?.is_admin ||
      message?.isAdmin ||
      message?.sender_is_admin ||
      message?.senderIsAdmin ||
      message?.author_is_admin ||
      message?.authorIsAdmin ||
      isAdminUser(user)
  );
};

const getOwnMessage = (
  message,
  isAdmin,
  senderIsAdmin
) => {
  const explicit = getExplicitOwnValue(message);

  if (explicit !== null) {
    return explicit;
  }

  return isAdmin
    ? senderIsAdmin
    : !senderIsAdmin;
};

/*
 * IMPORTANT:
 * Resolve the actual sender name from as many common API
 * shapes as possible.
 */
const getSenderName = (
  message,
  {
    ownMessage = false,
    senderIsAdmin = false,
  } = {}
) => {
  const user = getMessageUser(message);

  const candidates = [
    message?.sender_name,
    message?.senderName,
    message?.author_name,
    message?.authorName,
    message?.user_name,
    message?.userName,
    message?.display_name,
    message?.displayName,
    message?.full_name,
    message?.fullName,
    message?.name,

    user?.full_name,
    user?.fullName,
    user?.display_name,
    user?.displayName,
    user?.name,
    user?.username,
    user?.first_name &&
      user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : null,
    user?.firstName &&
      user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : null,
  ];

  const actualName = candidates
    .map((item) => text(item).trim())
    .find(Boolean);

  if (actualName) {
    return actualName;
  }

  if (ownMessage) {
    return 'You';
  }

  if (senderIsAdmin) {
    return 'Support';
  }

  return 'Customer';
};

const getInitialsFromName = (name) => {
  const clean = text(name).trim();

  if (!clean) return '?';

  return clean
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
};

const isDeleted = (message) =>
  Boolean(
    message?.is_deleted ||
      message?.isDeleted ||
      message?.deleted
  );

/* ================================================================
   MESSAGE
================================================================ */

const ChatMessage = ({
  message,
  previousMessage,
  nextMessage,
  isAdmin,
  onRetry,
}) => {
  if (!message) return null;

  const senderIsAdmin =
    getSenderIsAdmin(message);

  const ownMessage = getOwnMessage(
    message,
    isAdmin,
    senderIsAdmin
  );

  const previousSenderIsAdmin =
    previousMessage
      ? getSenderIsAdmin(previousMessage)
      : null;

  const previousOwn =
    previousMessage
      ? getOwnMessage(
          previousMessage,
          isAdmin,
          previousSenderIsAdmin
        )
      : null;

  const nextSenderIsAdmin =
    nextMessage
      ? getSenderIsAdmin(nextMessage)
      : null;

  const nextOwn =
    nextMessage
      ? getOwnMessage(
          nextMessage,
          isAdmin,
          nextSenderIsAdmin
        )
      : null;

  const groupedPrevious =
    previousMessage &&
    previousOwn === ownMessage &&
    previousSenderIsAdmin === senderIsAdmin &&
    sameDay(
      getMessageDate(previousMessage),
      getMessageDate(message)
    );

  const groupedNext =
    nextMessage &&
    nextOwn === ownMessage &&
    nextSenderIsAdmin === senderIsAdmin &&
    sameDay(
      getMessageDate(message),
      getMessageDate(nextMessage)
    );

  const senderName = getSenderName(
    message,
    {
      ownMessage,
      senderIsAdmin,
    }
  );

  const content = getMessageContent(message);

  const failed =
    message?.__status === 'failed';

  const sending =
    message?.__status === 'sending';

  const edited = Boolean(
    message?.is_edited ||
      message?.isEdited ||
      message?.edited
  );

  const deleted = isDeleted(message);

  return (
    <div
      className={[
        'flex w-full',
        ownMessage
          ? 'justify-end'
          : 'justify-start',
        groupedPrevious
          ? 'mt-0.5'
          : 'mt-4',
      ].join(' ')}
    >
      <div
        className={[
          'flex max-w-[88%] items-end gap-2',
          'sm:max-w-[70%]',
          ownMessage
            ? 'flex-row-reverse'
            : 'flex-row',
        ].join(' ')}
      >
        {/* Avatar */}
        <div className="w-7 shrink-0">
          {!groupedPrevious ? (
            <div
              className={[
                'flex h-7 w-7 items-center justify-center',
                'rounded-full text-[9px] font-bold',
                ownMessage
                  ? 'bg-primary-100 text-primary-700'
                  : senderIsAdmin
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600',
              ].join(' ')}
            >
              {senderIsAdmin ? (
                <ShieldCheck className="h-3.5 w-3.5" />
              ) : (
                getInitialsFromName(
                  senderName
                )
              )}
            </div>
          ) : (
            <div />
          )}
        </div>

        <div
          className={[
            'min-w-0',
            ownMessage
              ? 'items-end'
              : 'items-start',
          ].join(' ')}
        >
          {/* Sender */}
          {!groupedPrevious && (
            <div
              className={[
                'mb-1 flex items-center gap-1.5',
                ownMessage
                  ? 'justify-end'
                  : 'justify-start',
              ].join(' ')}
            >
              <span className="text-[11px] font-semibold text-gray-500">
                {senderName}
              </span>

              {senderIsAdmin && (
                <span className="text-[9px] font-medium text-gray-400">
                  Support
                </span>
              )}
            </div>
          )}

          {/* Bubble */}
          <div
            className={[
              'relative inline-block max-w-full',
              'px-3.5 py-2.5',
              'text-[13px] leading-[1.55]',
              ownMessage
                ? [
                    'bg-primary-600 text-white',
                    groupedPrevious
                      ? 'rounded-2xl rounded-tr-md'
                      : groupedNext
                      ? 'rounded-2xl rounded-br-md'
                      : 'rounded-2xl rounded-tr-md',
                  ].join(' ')
                : [
                    'border border-gray-200',
                    'bg-white text-gray-800',
                    groupedPrevious
                      ? 'rounded-2xl rounded-tl-md'
                      : groupedNext
                      ? 'rounded-2xl rounded-bl-md'
                      : 'rounded-2xl rounded-tl-md',
                  ].join(' '),
              sending
                ? 'opacity-70'
                : '',
              failed
                ? 'border-rose-200'
                : '',
            ].join(' ')}
          >
            {deleted ? (
              <p
                className={
                  ownMessage
                    ? 'italic text-white/60'
                    : 'italic text-gray-400'
                }
              >
                This message was deleted.
              </p>
            ) : (
              <p className="whitespace-pre-wrap break-words">
                {content}
              </p>
            )}
          </div>

          {/* Metadata */}
          {!groupedNext && (
            <div
              className={[
                'mt-1 flex items-center gap-1.5',
                ownMessage
                  ? 'justify-end'
                  : 'justify-start',
              ].join(' ')}
            >
              <span className="text-[9px] text-gray-400">
                {formatTime(
                  getMessageDate(message)
                )}
              </span>

              {edited && (
                <span className="text-[9px] italic text-gray-400">
                  edited
                </span>
              )}

              {sending && (
                <span className="text-[9px] text-gray-400">
                  Sending
                </span>
              )}

              {failed && (
                <>
                  <span className="text-[9px] font-semibold text-rose-500">
                    Failed
                  </span>

                  {onRetry && (
                    <button
                      type="button"
                      onClick={() =>
                        onRetry(message)
                      }
                      className="text-[9px] font-bold text-primary-600 hover:text-primary-700"
                    >
                      Retry
                    </button>
                  )}
                </>
              )}

              {ownMessage &&
                !sending &&
                !failed && (
                  message?.read ||
                  message?.is_read ||
                  message?.isRead ? (
                    <CheckCheck className="h-3 w-3 text-primary-500" />
                  ) : (
                    <Check className="h-3 w-3 text-gray-400" />
                  )
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ================================================================
   CHAT HEADER
================================================================ */

const ChatHeader = ({
  conversation,
  isAdmin,
  isMobile,
  onMenu,
  onBack,
}) => {
  const status = getStatus(
    conversation
  );

  const assigned = Boolean(
    conversation?.admin_id ??
      conversation?.adminId ??
      conversation?.assigned_to ??
      conversation?.assignedTo
  );

  return (
    <header className="relative z-20 h-[68px] shrink-0 border-b border-gray-200 bg-white">
      <div className="flex h-full items-center gap-3 px-4 sm:px-6">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}

        {isMobile && (
          <button
            type="button"
            onClick={onMenu}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50"
            aria-label="Conversations"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700">
          {isAdmin ? (
            <UserRound className="h-4 w-4" />
          ) : (
            <Headphones className="h-4 w-4" />
          )}

          {status === 'open' && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-bold text-gray-900">
            {getConversationTitle(
              conversation
            )}
          </h1>

          <div className="mt-0.5 flex items-center gap-1.5">
            <span
              className={[
                'h-1.5 w-1.5 rounded-full',
                status === 'closed'
                  ? 'bg-gray-300'
                  : assigned
                  ? 'bg-emerald-500'
                  : 'bg-amber-400',
              ].join(' ')}
            />

            <span className="truncate text-[10px] font-medium text-gray-400">
              {status === 'closed'
                ? 'Closed'
                : assigned
                ? 'Support is handling this conversation'
                : 'Waiting for support'}
            </span>
          </div>
        </div>

        <div className="hidden items-center gap-1.5 text-[10px] font-medium text-gray-400 sm:flex">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          Private
        </div>
      </div>
    </header>
  );
};

/* ================================================================
   COMPOSER
================================================================ */

const Composer = ({
  conversation,
  onNewChat,
}) => {
  const {
    sendMessage,
    addLocalMessage,
    updateLocalMessage,
  } = useChat();

  const [value, setValue] =
    useState('');

  const [sending, setSending] =
    useState(false);

  const textareaRef =
    useRef(null);

  const closed =
    getStatus(conversation) ===
    'closed';

  useEffect(() => {
    const textarea =
      textareaRef.current;

    if (!textarea) return;

    textarea.style.height = 'auto';

    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      128
    )}px`;
  }, [value]);

  const send = async () => {
    const content = value.trim();

    if (
      !content ||
      sending ||
      closed
    ) {
      return;
    }

    const conversationId =
      getConversationId(
        conversation
      );

    if (conversationId == null) {
      return;
    }

    const optimisticId =
      `local-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`;

    const optimistic = {
      id: optimisticId,
      conversation_id:
        conversationId,
      content,
      message: content,
      created_at:
        new Date().toISOString(),
      is_own: true,
      __status: 'sending',
    };

    setValue('');
    setSending(true);

    try {
      if (
        typeof addLocalMessage ===
        'function'
      ) {
        addLocalMessage(
          conversationId,
          optimistic
        );
      }

      await sendMessage(
        conversationId,
        content
      );

      if (
        typeof updateLocalMessage ===
        'function'
      ) {
        updateLocalMessage(
          conversationId,
          optimisticId,
          {
            __status: 'sent',
          }
        );
      }
    } catch (error) {
      console.error(
        'Failed to send message:',
        error
      );

      if (
        typeof updateLocalMessage ===
        'function'
      ) {
        updateLocalMessage(
          conversationId,
          optimisticId,
          {
            __status: 'failed',
          }
        );
      } else {
        setValue(content);
      }
    } finally {
      setSending(false);

      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  };

  const handleKeyDown = (event) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault();
      send();
    }
  };

  if (closed) {
    return (
      <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3">
          <Clock3 className="h-4 w-4 shrink-0 text-gray-400" />

          <p className="min-w-0 flex-1 text-xs text-gray-500">
            This conversation is closed.
          </p>

          {onNewChat && (
            <button
              type="button"
              onClick={onNewChat}
              className="shrink-0 rounded-lg bg-primary-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-primary-700"
            >
              New chat
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-gray-200 bg-white px-3 py-3 sm:px-6 sm:py-4">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-1.5 transition focus-within:border-primary-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-100">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={value}
              rows={1}
              maxLength={5000}
              disabled={sending}
              onChange={(event) =>
                setValue(
                  event.target.value
                )
              }
              onKeyDown={
                handleKeyDown
              }
              placeholder="Write a message..."
              className="max-h-[128px] min-h-[42px] flex-1 resize-none overflow-y-auto bg-transparent px-3 py-2.5 text-sm leading-5 text-gray-900 outline-none placeholder:text-gray-400"
            />

            <button
              type="button"
              disabled={
                sending ||
                !value.trim()
              }
              onClick={send}
              className={[
                'flex h-10 w-10 shrink-0',
                'items-center justify-center',
                'rounded-xl transition',
                value.trim() && !sending
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-200 text-gray-400',
              ].join(' ')}
              aria-label="Send"
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
          <span className="text-[9px] text-gray-400">
            Enter to send · Shift + Enter for a new line
          </span>

          <span className="hidden text-[9px] text-gray-400 sm:block">
            {value.length}/5000
          </span>
        </div>
      </div>
    </div>
  );
};

/* ================================================================
   CHAT BODY
================================================================ */

const ChatBody = ({
  conversation,
  isAdmin,
}) => {
  const messages =
    Array.isArray(
      conversation?.messages
    )
      ? conversation.messages
      : [];

  const scrollRef =
    useRef(null);

  const bottomRef =
    useRef(null);

  const previousCount =
    useRef(messages.length);

  const announcementTimer =
    useRef(null);

  const [announcement, setAnnouncement] =
    useState('');

  const isNearBottom = () => {
    const element =
      scrollRef.current;

    if (!element) return true;

    const distance =
      element.scrollHeight -
      element.scrollTop -
      element.clientHeight;

    return distance < 160;
  };

  const scrollBottom = (
    behavior = 'smooth'
  ) => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView(
        {
          behavior,
          block: 'end',
        }
      );
    });
  };

  useEffect(() => {
    const oldCount =
      previousCount.current;

    const changed =
      messages.length !== oldCount;

    if (!changed) return;

    const shouldScroll =
      oldCount === 0 ||
      isNearBottom();

    if (shouldScroll) {
      scrollBottom(
        oldCount === 0
          ? 'auto'
          : 'smooth'
      );
    }

    if (
      messages.length > oldCount &&
      oldCount > 0
    ) {
      const latest =
        messages[
          messages.length - 1
        ];

      const latestContent =
        getMessageContent(latest);

      if (latestContent) {
        setAnnouncement(
          `New message: ${latestContent.slice(
            0,
            100
          )}`
        );

        if (
          announcementTimer.current
        ) {
          clearTimeout(
            announcementTimer.current
          );
        }

        announcementTimer.current =
          setTimeout(() => {
            setAnnouncement('');
          }, 2500);
      }
    }

    previousCount.current =
      messages.length;
  }, [messages.length]);

  useEffect(() => {
    previousCount.current =
      messages.length;

    const timer =
      setTimeout(() => {
        scrollBottom('auto');
      }, 50);

    return () => {
      clearTimeout(timer);

      if (
        announcementTimer.current
      ) {
        clearTimeout(
          announcementTimer.current
        );
      }
    };
  }, [
    getConversationId(
      conversation
    ),
  ]);

  const retry = (failedMessage) => {
    const content =
      getMessageContent(
        failedMessage
      );

    if (!content) return;

    window.dispatchEvent(
      new CustomEvent(
        'support-chat-retry',
        {
          detail: content,
        }
      )
    );
  };

  return (
    <div
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#f8f9fb]"
    >
      <div className="mx-auto min-h-full w-full max-w-3xl px-4 py-5 sm:px-8 sm:py-7">
        <div
          className="sr-only"
          aria-live="polite"
        >
          {announcement}
        </div>

        {messages.length === 0 ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm ring-1 ring-gray-200">
                <MessageCircle className="h-5 w-5" />
              </div>

              <p className="mt-4 text-sm font-semibold text-gray-800">
                Start the conversation
              </p>

              <p className="mt-1 max-w-xs text-xs leading-5 text-gray-400">
                Send a message below and a
                support representative will
                get back to you.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 flex justify-center">
              <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[9px] font-medium text-gray-400 ring-1 ring-gray-200">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                End-to-end support conversation
              </span>
            </div>

            {messages.map(
              (message, index) => {
                const previous =
                  messages[index - 1];

                const next =
                  messages[index + 1];

                const currentDate =
                  getMessageDate(
                    message
                  );

                const previousDate =
                  getMessageDate(
                    previous
                  );

                const showDate =
                  currentDate &&
                  (!previousDate ||
                    !sameDay(
                      currentDate,
                      previousDate
                    ));

                return (
                  <React.Fragment
                    key={
                      getMessageId(
                        message
                      ) ??
                      `message-${index}`
                    }
                  >
                    {showDate && (
                      <div className="my-6 flex items-center gap-3">
                        <div className="h-px flex-1 bg-gray-200" />

                        <span className="shrink-0 text-[9px] font-semibold text-gray-400">
                          {formatDate(
                            currentDate
                          )}
                        </span>

                        <div className="h-px flex-1 bg-gray-200" />
                      </div>
                    )}

                    <ChatMessage
                      message={message}
                      previousMessage={
                        previous
                      }
                      nextMessage={
                        next
                      }
                      isAdmin={isAdmin}
                      onRetry={retry}
                    />
                  </React.Fragment>
                )
              }
            )}

            <div ref={bottomRef} />
          </>
        )}
      </div>
    </div>
  );
};

/* ================================================================
   CONVERSATION ITEM
================================================================ */

const ConversationItem = ({
  conversation,
  active,
  onClick,
  selecting,
}) => {
  const unread =
    getUnreadCount(
      conversation
    );

  const status =
    getStatus(conversation);

  return (
    <button
      type="button"
      disabled={selecting}
      onClick={onClick}
      className={[
        'w-full border-b border-gray-100',
        'px-4 py-3 text-left',
        'transition',
        active
          ? 'bg-primary-50'
          : 'bg-white hover:bg-gray-50',
      ].join(' ')}
    >
      <div className="flex gap-3">
        <div
          className={[
            'relative flex h-10 w-10',
            'shrink-0 items-center justify-center',
            'rounded-full',
            active
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-gray-500',
          ].join(' ')}
        >
          {selecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageSquare className="h-4 w-4" />
          )}

          {status === 'open' &&
            !selecting && (
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
            )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className={[
                'min-w-0 flex-1 truncate text-xs',
                unread
                  ? 'font-bold text-gray-900'
                  : 'font-semibold text-gray-800',
              ].join(' ')}
            >
              {getConversationTitle(
                conversation
              )}
            </p>

            <span className="shrink-0 text-[9px] text-gray-400">
              {formatConversationDate(
                getConversationDate(
                  conversation
                )
              )}
            </span>
          </div>

          <p
            className={[
              'mt-1 truncate text-[10px] leading-5',
              unread
                ? 'font-medium text-gray-600'
                : 'text-gray-400',
            ].join(' ')}
          >
            {getConversationPreview(
              conversation
            )}
          </p>

          <div className="mt-1.5 flex items-center justify-between">
            <span
              className={[
                'text-[9px] font-semibold',
                status === 'open'
                  ? 'text-emerald-600'
                  : 'text-gray-400',
              ].join(' ')}
            >
              {status === 'open'
                ? 'Open'
                : 'Closed'}
            </span>

            {unread > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-[9px] font-bold text-white">
                {unread > 99
                  ? '99+'
                  : unread}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

/* ================================================================
   SIDEBAR
================================================================ */

const ChatSidebar = ({
  conversations,
  activeConversation,
  onSelect,
  onNewChat,
  selectingId,
  loading,
  mobile,
  onClose,
}) => {
  const [search, setSearch] =
    useState('');

  const filtered =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return conversations;
      }

      return conversations.filter(
        (conversation) => {
          return (
            getConversationTitle(
              conversation
            )
              .toLowerCase()
              .includes(query) ||
            getConversationPreview(
              conversation
            )
              .toLowerCase()
              .includes(query)
          );
        }
      );
    }, [
      conversations,
      search,
    ]);

  const activeId =
    getConversationId(
      activeConversation
    );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-white">
      {/* Sidebar header */}
      <header className="shrink-0 border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Messages
            </h2>

            <p className="mt-0.5 text-[10px] text-gray-400">
              Your support conversations
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onNewChat}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white hover:bg-primary-700"
              aria-label="New conversation"
            >
              <Plus className="h-4 w-4" />
            </button>

            {mobile && (
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 focus-within:border-primary-300 focus-within:bg-white">
            <Search className="h-3.5 w-3.5 text-gray-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search messages"
              className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-gray-400"
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch('')
                }
                className="text-gray-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar body */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading &&
          conversations.length === 0 && (
            <div className="space-y-2 p-3">
              {[1, 2, 3, 4].map(
                (item) => (
                  <div
                    key={item}
                    className="animate-pulse p-2"
                  >
                    <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-100" />

                      <div className="flex-1">
                        <div className="h-3 w-2/3 rounded bg-gray-100" />
                        <div className="mt-2 h-2.5 w-full rounded bg-gray-100" />
                        <div className="mt-2 h-2 w-1/3 rounded bg-gray-100" />
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

        {!loading &&
          filtered.length === 0 && (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 text-gray-400">
                <MessageSquare className="h-5 w-5" />
              </div>

              <p className="mt-4 text-xs font-bold text-gray-800">
                {search
                  ? 'No conversations found'
                  : 'No conversations yet'}
              </p>

              <p className="mt-1.5 text-[10px] leading-5 text-gray-400">
                {search
                  ? 'Try another search.'
                  : 'Start a conversation with support.'}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={onNewChat}
                  className="mt-4 rounded-xl bg-primary-600 px-4 py-2.5 text-[10px] font-bold text-white"
                >
                  Start conversation
                </button>
              )}
            </div>
          )}

        {filtered.length > 0 && (
          <>
            <div className="px-4 py-3">
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-gray-400">
                Conversations
              </span>
            </div>

            {filtered.map(
              (conversation, index) => {
                const id =
                  getConversationId(
                    conversation
                  );

                return (
                  <ConversationItem
                    key={
                      id ??
                      `conversation-${index}`
                    }
                    conversation={
                      conversation
                    }
                    active={
                      id === activeId
                    }
                    selecting={
                      selectingId === id
                    }
                    onClick={() =>
                      onSelect(id)
                    }
                  />
                );
              }
            )}
          </>
        )}
      </div>

      {/* Sidebar footer */}
      <footer className="shrink-0 border-t border-gray-100 bg-gray-50 p-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-gray-700">
              Private support
            </p>

            <p className="mt-0.5 truncate text-[9px] text-gray-400">
              Your messages are protected
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ================================================================
   NEW CHAT MODAL
================================================================ */

const NewChatModal = ({
  open,
  onClose,
  onCreated,
}) => {
  const {
    createConversation,
    newConversation,
  } = useChat();

  const [subject, setSubject] =
    useState('');

  const [category, setCategory] =
    useState('');

  const [creating, setCreating] =
    useState(false);

  const [error, setError] =
    useState('');

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

    const escape = (event) => {
      if (
        event.key === 'Escape' &&
        !creating
      ) {
        onClose();
      }
    };

    window.addEventListener(
      'keydown',
      escape
    );

    return () =>
      window.removeEventListener(
        'keydown',
        escape
      );
  }, [
    open,
    creating,
    onClose,
  ]);

  if (!open) return null;

  const topics = [
    [
      'Account',
      'Account or profile',
    ],
    [
      'Payments',
      'Payments or transfers',
    ],
    [
      'Cards',
      'Card assistance',
    ],
    [
      'Other',
      'Something else',
    ],
  ];

  const submit = async (event) => {
    event.preventDefault();

    const clean =
      subject.trim();

    if (!clean) {
      setError(
        'Please enter a subject.'
      );
      return;
    }

    const create =
      createConversation ||
      newConversation;

    if (
      typeof create !==
      'function'
    ) {
      setError(
        'Conversation service is unavailable.'
      );
      return;
    }

    setCreating(true);
    setError('');

    try {
      const result =
        await create(clean, {
          category:
            category || undefined,
        });

      const created =
        result?.conversation ??
        result?.data?.conversation ??
        result?.data ??
        result;

      if (
        created &&
        getConversationId(
          created
        ) != null
      ) {
        onCreated?.(created);
        return;
      }

      setError(
        'The conversation was created but could not be opened.'
      );
    } catch (firstError) {
      /*
       * Only fall back to the one-argument
       * contract when the API explicitly
       * indicates argument/signature trouble.
       *
       * This avoids accidentally creating
       * duplicate conversations.
       */
      try {
        const result =
          await create(clean);

        const created =
          result?.conversation ??
          result?.data?.conversation ??
          result?.data ??
          result;

        if (
          created &&
          getConversationId(
            created
          ) != null
        ) {
          onCreated?.(created);
          return;
        }

        setError(
          'The conversation was created but could not be opened.'
        );
      } catch (secondError) {
        console.error(
          'Conversation creation failed:',
          secondError
        );

        setError(
          secondError?.response
            ?.data?.message ||
            secondError?.response
              ?.data?.error ||
            secondError?.message ||
            'Unable to start the conversation.'
        );
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/40 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !creating
        ) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-5">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <MessageCircle className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-bold text-gray-900">
                New conversation
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Tell support what you need help with.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={creating}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="space-y-5 px-5 py-5">
            <div>
              <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.14em] text-gray-400">
                Topic
              </p>

              <div className="grid grid-cols-2 gap-2">
                {topics.map(
                  ([name, description]) => {
                    const selected =
                      category ===
                      name;

                    return (
                      <button
                        key={name}
                        type="button"
                        disabled={creating}
                        onClick={() => {
                          setCategory(
                            name
                          );

                          if (
                            !subject.trim()
                          ) {
                            setSubject(
                              name
                            );
                          }

                          setError('');
                        }}
                        className={[
                          'rounded-xl border px-3 py-3 text-left transition',
                          selected
                            ? 'border-primary-300 bg-primary-50'
                            : 'border-gray-200 hover:bg-gray-50',
                        ].join(' ')}
                      >
                        <p className="text-[11px] font-semibold text-gray-800">
                          {name}
                        </p>

                        <p className="mt-1 text-[9px] leading-4 text-gray-400">
                          {description}
                        </p>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="chat-subject"
                className="mb-2 block text-xs font-semibold text-gray-700"
              >
                What do you need help with?
              </label>

              <input
                id="chat-subject"
                value={subject}
                maxLength={120}
                disabled={creating}
                onChange={(event) => {
                  setSubject(
                    event.target.value
                  );
                  setError('');
                }}
                placeholder="e.g. I need help with a transfer"
                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-100"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
                {error}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4">
            <button
              type="button"
              disabled={creating}
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                creating ||
                !subject.trim()
              }
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating...
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

/* ================================================================
   PAGE
================================================================ */

const MOBILE_BREAKPOINT = 768;

const ChatPage = ({
  onBack,
}) => {
  const {
    conversations = [],
    currentConversation,
    selectConversation,
    loading,
    isAdmin,
  } = useChat();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [newChatOpen, setNewChatOpen] =
    useState(false);

  const [selectingId, setSelectingId] =
    useState(null);

  const [isMobile, setIsMobile] =
    useState(() =>
      typeof window !==
      'undefined'
        ? window.matchMedia(
            `(max-width: ${
              MOBILE_BREAKPOINT - 1
            }px)`
          ).matches
        : false
    );

  useEffect(() => {
    if (
      typeof window ===
      'undefined'
    ) {
      return;
    }

    const media =
      window.matchMedia(
        `(max-width: ${
          MOBILE_BREAKPOINT - 1
        }px)`
      );

    const handleChange = () => {
      setIsMobile(
        media.matches
      );

      if (!media.matches) {
        setSidebarOpen(false);
      }
    };

    handleChange();

    media.addEventListener(
      'change',
      handleChange
    );

    return () =>
      media.removeEventListener(
        'change',
        handleChange
      );
  }, []);

  useEffect(() => {
    if (
      currentConversation &&
      isMobile
    ) {
      setSidebarOpen(false);
    }
  }, [
    getConversationId(
      currentConversation
    ),
    isMobile,
  ]);

  useEffect(() => {
    if (
      selectingId !== null &&
      getConversationId(
        currentConversation
      ) === selectingId
    ) {
      setSelectingId(null);
    }
  }, [
    selectingId,
    currentConversation,
  ]);

  const select = async (id) => {
    if (id == null) return;

    if (
      selectingId === id
    ) {
      return;
    }

    setSelectingId(id);

    try {
      await selectConversation?.(
        id
      );
    } catch (error) {
      console.error(
        'Failed to select conversation:',
        error
      );
    } finally {
      setSelectingId(null);
    }
  };

  const created = (
    conversation
  ) => {
    setNewChatOpen(false);

    const id =
      getConversationId(
        conversation
      );

    if (id != null) {
      select(id);
    }
  };

  return (
    <section className="h-full min-h-0 w-full overflow-hidden bg-white">
      <div className="relative flex h-full min-h-0 w-full overflow-hidden">
        {/* ======================================================
            DESKTOP SIDEBAR
        ====================================================== */}

        <aside className="hidden h-full w-[300px] shrink-0 border-r border-gray-200 bg-white md:flex">
          <ChatSidebar
            conversations={
              conversations
            }
            activeConversation={
              currentConversation
            }
            selectingId={
              selectingId
            }
            onSelect={select}
            onNewChat={() =>
              setNewChatOpen(true)
            }
            loading={loading}
          />
        </aside>

        {/* ======================================================
            MOBILE SIDEBAR
        ====================================================== */}

        {isMobile &&
          sidebarOpen && (
            <>
              <button
                type="button"
                aria-label="Close sidebar"
                onClick={() =>
                  setSidebarOpen(false)
                }
                className="absolute inset-0 z-30 bg-gray-950/30"
              />

              <aside className="absolute inset-y-0 left-0 z-40 flex w-[88%] max-w-[340px] overflow-hidden border-r border-gray-200 bg-white shadow-2xl">
                <ChatSidebar
                  conversations={
                    conversations
                  }
                  activeConversation={
                    currentConversation
                  }
                  selectingId={
                    selectingId
                  }
                  onSelect={select}
                  onNewChat={() =>
                    setNewChatOpen(true)
                  }
                  loading={loading}
                  mobile
                  onClose={() =>
                    setSidebarOpen(
                      false
                    )
                  }
                />
              </aside>
            </>
          )}

        {/* ======================================================
            MAIN CHAT

            IMPORTANT:
            This is a flex column with min-h-0.

            Header = fixed
            Body   = only scrolling area
            Composer = fixed
        ====================================================== */}

        <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {currentConversation ? (
            <>
              <ChatHeader
                conversation={
                  currentConversation
                }
                isAdmin={isAdmin}
                isMobile={isMobile}
                onMenu={() =>
                  setSidebarOpen(
                    true
                  )
                }
                onBack={onBack}
              />

              <ChatBody
                conversation={
                  currentConversation
                }
                isAdmin={isAdmin}
              />

              <Composer
                conversation={
                  currentConversation
                }
                onNewChat={() =>
                  setNewChatOpen(true)
                }
              />
            </>
          ) : (
            <>
              <header className="flex h-[68px] shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 sm:px-6">
                {isMobile && (
                  <button
                    type="button"
                    onClick={() =>
                      setSidebarOpen(
                        true
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500"
                  >
                    <Menu className="h-4 w-4" />
                  </button>
                )}

                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                  <Headphones className="h-4 w-4" />
                </div>

                <div>
                  <h1 className="text-sm font-bold text-gray-900">
                    Support
                  </h1>

                  <p className="text-[10px] text-gray-400">
                    We're here to help
                  </p>
                </div>
              </header>

              <div className="flex min-h-0 flex-1 items-center justify-center bg-[#f8f9fb] px-5">
                <div className="max-w-sm text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm ring-1 ring-gray-200">
                    <MessageCircle className="h-6 w-6" />
                  </div>

                  <h2 className="mt-5 text-lg font-bold text-gray-900">
                    Need some help?
                  </h2>

                  <p className="mt-2 text-xs leading-5 text-gray-400">
                    Start a conversation with
                    our support team and we'll
                    help you with your account,
                    payments, cards, or other
                    questions.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setNewChatOpen(
                        true
                      )
                    }
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-primary-700"
                  >
                    <Plus className="h-4 w-4" />
                    Start conversation
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      <NewChatModal
        open={newChatOpen}
        onClose={() =>
          setNewChatOpen(false)
        }
        onCreated={created}
      />
    </section>
  );
};

export default ChatPage;