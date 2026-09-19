// frontend/src/chat/AdminChat.jsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { useChat } from './ChatContext';
import { useSocket } from '../../context/SocketContext';
import { chatAPI } from '../../api';
import Modal from '../Modal';

/* ============================================================
   CONFIRM DIALOG
============================================================ */

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  loading = false,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  icon: Icon = Archive,
}) => {
  const toneStyles = {
    danger: {
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
      confirmBtn:
        'bg-red-600 hover:bg-red-700 focus-visible:ring-red-200',
    },

    warning: {
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      confirmBtn:
        'bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-200',
    },

    primary: {
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      confirmBtn:
        'bg-indigo-600 hover:bg-indigo-700 focus-visible:ring-indigo-200',
    },
  };

  const styles = toneStyles[tone] || toneStyles.danger;

  return (
    <Modal
      isOpen={open}
      onClose={loading ? undefined : onClose}
      closeOnOutsideClick={!loading}
      showCloseButton={false}
      position="bottom"
      size="sm"
      className="!max-w-md !overflow-hidden !rounded-3xl !p-0"
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${styles.iconBg} ${styles.iconColor}`}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black tracking-tight text-slate-900">
              {title}
            </h2>

            {description && (
              <p className="mt-1.5 text-sm leading-6 text-slate-500">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            className="shrink-0 rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm outline-none transition focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${styles.confirmBtn}`}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* ============================================================
   ADMIN CHAT
============================================================ */

const AdminChat = () => {
  const {
    conversations,
    currentConversation,
    loading,
    error,
    fetchConversations,
    loadConversation,
    sendMessage,
    closeConversation,
    setCurrentConversation,
  } = useChat();

  const {
    isConnected,
    getMessages,
    getTypingUser,
    sendTyping,
  } = useSocket();

  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');

  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [closing, setClosing] = useState(false);

  const [mobileView, setMobileView] = useState('list');
  const [showDetails, setShowDetails] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  /* ============================================================
     LOAD ALL CONVERSATIONS
     
     No Active / Closed switch.
     The inbox displays both open and closed conversations.
  ============================================================ */

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  /* ============================================================
     REAL-TIME MESSAGES
  ============================================================ */

  const realtimeMessages = currentConversation
    ? getMessages(currentConversation.id) || []
    : [];

  const displayedMessages = useMemo(() => {
    const databaseMessages = currentConversation?.messages || [];
    const merged = [...databaseMessages];

    realtimeMessages.forEach((incoming) => {
      const incomingId = incoming?.id;

      if (
        incomingId &&
        !merged.some((item) => item?.id === incomingId)
      ) {
        merged.push(incoming);
      }
    });

    return merged.sort(
      (a, b) =>
        new Date(a.created_at || a.timestamp || 0) -
        new Date(b.created_at || b.timestamp || 0)
    );
  }, [currentConversation, realtimeMessages]);

  /* ============================================================
     TYPING
  ============================================================ */

  const typingUser = currentConversation
    ? getTypingUser(currentConversation.id)
    : null;

  /* ============================================================
     AUTO SCROLL
  ============================================================ */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, [displayedMessages.length, typingUser]);

  /* ============================================================
     CLEANUP
  ============================================================ */

  useEffect(() => {
    return () => {
      clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  /* ============================================================
     HELPERS
  ============================================================ */

  const getUserName = (conversation) => {
    return (
      conversation?.user?.full_name ||
      conversation?.user_name ||
      conversation?.customer_name ||
      conversation?.full_name ||
      conversation?.email ||
      'Customer'
    );
  };

  const getUserEmail = (conversation) => {
    return (
      conversation?.user?.email ||
      conversation?.user_email ||
      conversation?.email ||
      ''
    );
  };

  const getInitials = (name = '') => {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (!parts.length) return 'C';

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const getLastMessage = (conversation) => {
    const messages = conversation?.messages || [];

    if (!messages.length) {
      return 'No messages yet';
    }

    const last = messages[messages.length - 1];

    return last?.message || last?.content || 'Message';
  };

  const getUnreadCount = (conversation) => {
    return Number(conversation?.admin_unread_count || 0);
  };

  const formatTime = (date) => {
    if (!date) return '';

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    return parsed.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatConversationDate = (date) => {
    if (!date) return '';

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    const today = new Date();

    if (parsed.toDateString() === today.toDateString()) {
      return formatTime(date);
    }

    return parsed.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
  };

  const isMine = (msg) => {
    const senderRole = String(
      msg?.sender_role ||
        msg?.senderRole ||
        msg?.role ||
        ''
    ).toLowerCase();

    return (
      senderRole === 'admin' ||
      msg?.is_admin === true
    );
  };

  const isConversationClosed = (conversation) => {
    const conversationStatus = String(
      conversation?.status || ''
    ).toLowerCase();

    return (
      conversationStatus === 'closed' ||
      conversationStatus === 'resolved'
    );
  };

  /* ============================================================
     FILTER

     Active and closed conversations now live in ONE inbox.
     Search filters everything together.
  ============================================================ */

  const filteredConversations = useMemo(() => {
    const list = conversations || [];
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return list;
    }

    return list.filter((conversation) => {
      const name = getUserName(conversation).toLowerCase();
      const email = getUserEmail(conversation).toLowerCase();
      const subject = String(
        conversation?.subject || ''
      ).toLowerCase();

      const lastMessage = getLastMessage(
        conversation
      ).toLowerCase();

      return (
        name.includes(term) ||
        email.includes(term) ||
        subject.includes(term) ||
        lastMessage.includes(term)
      );
    });
  }, [conversations, searchTerm]);

  /* ============================================================
     SELECT CONVERSATION
  ============================================================ */

  const handleSelectConversation = async (conversation) => {
    try {
      await loadConversation(conversation.id);

      setMobileView('chat');
      setShowDetails(false);
      setShowMenu(false);
    } catch {
      // ChatContext handles the error.
    }
  };

  /* ============================================================
     SEND MESSAGE
  ============================================================ */

  const handleSendMessage = async (event) => {
    event?.preventDefault();

    const trimmed = message.trim();

    if (
      !trimmed ||
      !currentConversation ||
      sending
    ) {
      return;
    }

    if (isConversationClosed(currentConversation)) {
      return;
    }

    setSending(true);

    try {
      await sendMessage(
        currentConversation.id,
        trimmed
      );

      setMessage('');

      clearTimeout(
        typingTimeoutRef.current
      );

      if (isConnected) {
        sendTyping(
          currentConversation.id,
          false
        );
      }

      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    } catch {
      // ChatContext handles the error.
    } finally {
      setSending(false);
    }
  };

  /* ============================================================
     TYPING
  ============================================================ */

  const handleTyping = (event) => {
    const value = event.target.value;

    setMessage(value);

    if (
      !currentConversation ||
      !isConnected ||
      isConversationClosed(currentConversation)
    ) {
      return;
    }

    sendTyping(
      currentConversation.id,
      true
    );

    clearTimeout(
      typingTimeoutRef.current
    );

    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(
        currentConversation.id,
        false
      );
    }, 1200);
  };

  /* ============================================================
     CLOSE CONVERSATION
  ============================================================ */

  const requestCloseConversation = () => {
    if (
      !currentConversation ||
      isConversationClosed(currentConversation)
    ) {
      return;
    }

    setShowMenu(false);
    setShowCloseConfirm(true);
  };

  const confirmCloseConversation = async () => {
    if (
      !currentConversation ||
      closing
    ) {
      return;
    }

    setClosing(true);

    try {
      await closeConversation(
        currentConversation.id
      );

      setShowCloseConfirm(false);

      toast.success(
        'Conversation closed'
      );

      /*
       * Refresh the single combined inbox.
       */
      await fetchConversations();
    } catch (err) {
      console.error(
        '[AdminChat] Close conversation failed:',
        err
      );

      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          'Unable to close this conversation.'
      );
    } finally {
      setClosing(false);
    }
  };

  /* ============================================================
     DELETE CONVERSATION
  ============================================================ */

  const requestDeleteConversation = () => {
    if (
      !currentConversation ||
      deleting
    ) {
      return;
    }

    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteConversation = async () => {
    if (
      !currentConversation ||
      deleting
    ) {
      return;
    }

    const conversationId =
      currentConversation.id;

    setDeleting(true);

    try {
      await chatAPI.deleteConversation(
        conversationId
      );

      setCurrentConversation(null);
      setMessage('');
      setShowDeleteConfirm(false);
      setShowMenu(false);
      setShowDetails(false);
      setMobileView('list');

      toast.success(
        'Conversation deleted'
      );

      await fetchConversations();
    } catch (err) {
      console.error(
        '[AdminChat] Delete conversation failed:',
        err
      );

      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          'Unable to delete this conversation.'
      );
    } finally {
      setDeleting(false);
    }
  };

  /* ============================================================
     LOADING
  ============================================================ */

  if (
    loading &&
    !conversations?.length
  ) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#f8fafc] p-3 sm:p-5 lg:p-6">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-5">
            <div className="h-8 w-48 animate-pulse rounded-xl bg-slate-200" />

            <div className="mt-2 h-4 w-72 animate-pulse rounded-lg bg-slate-100" />
          </div>

          <div className="grid min-h-[600px] h-[calc(100vh-205px)] grid-cols-1 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.06)] lg:grid-cols-[370px_1fr]">
            <div className="border-r border-slate-100 p-5">
              <div className="mb-5 h-11 animate-pulse rounded-xl bg-slate-100" />

              {[1, 2, 3, 4, 5, 6].map(
                (item) => (
                  <div
                    key={item}
                    className="mb-4 flex animate-pulse gap-3"
                  >
                    <div className="h-12 w-12 rounded-2xl bg-slate-100" />

                    <div className="flex-1">
                      <div className="h-4 w-32 rounded bg-slate-100" />

                      <div className="mt-2 h-3 w-44 rounded bg-slate-100" />
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="hidden items-center justify-center lg:flex">
              <div className="text-center">
                <div className="mx-auto h-16 w-16 animate-pulse rounded-3xl bg-slate-100" />

                <div className="mx-auto mt-4 h-5 w-40 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     CURRENT CONVERSATION STATE
  ============================================================ */

  const conversationClosed =
    isConversationClosed(
      currentConversation
    );

  const deletingCustomerName =
    currentConversation
      ? getUserName(currentConversation)
      : 'this customer';

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f8fafc] p-2.5 sm:p-4 lg:p-6">
      <div className="mx-auto w-full max-w-[1500px]">
        {/* ======================================================
            PAGE HEADER
        ====================================================== */}

        <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <MessageCircle size={17} />
              </div>

              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600 sm:text-xs">
                Support inbox
              </span>
            </div>

            <h1 className="truncate text-xl font-black tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
              Customer conversations
            </h1>

            <p className="mt-1 hidden text-sm text-slate-500 sm:block">
              Respond to customers and keep support moving.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[10px] font-bold sm:px-3 sm:py-2 sm:text-xs ${
                isConnected
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                  : 'border-amber-100 bg-amber-50 text-amber-700'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2 ${
                  isConnected
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                }`}
              />

              {isConnected
                ? 'Live'
                : 'Connecting'}
            </div>

            <div className="rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-500 sm:px-3 sm:py-2 sm:text-xs">
              {conversations?.length || 0}{' '}
              conversations
            </div>
          </div>
        </div>

        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="mb-3 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-3 py-3 text-xs text-red-700 sm:px-4 sm:text-sm">
            <X size={16} />

            <span className="min-w-0 flex-1">
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                fetchConversations()
              }
              className="shrink-0 font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* ======================================================
            MAIN CHAT
        ====================================================== */}

        <div className="grid h-[calc(100vh-180px)] min-h-[560px] overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.07)] sm:h-[calc(100vh-190px)] sm:rounded-[28px] lg:grid-cols-[350px_1fr] xl:grid-cols-[380px_1fr]">
          {/* ====================================================
              CONVERSATION LIST
          ==================================================== */}

          <aside
            className={`flex min-h-0 flex-col bg-white lg:border-r lg:border-slate-100 ${
              mobileView === 'chat'
                ? 'hidden lg:flex'
                : 'flex'
            }`}
          >
            {/* INBOX HEADER */}

            <div className="border-b border-slate-100 p-3.5 sm:p-5">
              <div className="mb-3 flex items-center justify-between sm:mb-4">
                <div className="min-w-0">
                  <h2 className="font-extrabold text-slate-900">
                    Inbox
                  </h2>

                  <p className="mt-0.5 text-[11px] text-slate-400 sm:text-xs">
                    All customer conversations
                  </p>
                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Users size={17} />
                </div>
              </div>

              {/* SEARCH ONLY — NO ACTIVE/CLOSED SWITCH */}

              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(
                      event.target.value
                    )
                  }
                  placeholder="Search conversations..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                />
              </div>
            </div>

            {/* CONVERSATIONS */}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {!filteredConversations.length ? (
                <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 text-slate-400">
                    <MessageCircle size={27} />
                  </div>

                  <h3 className="mt-4 font-bold text-slate-800">
                    No conversations
                  </h3>

                  <p className="mt-1 max-w-[220px] text-xs leading-5 text-slate-400">
                    {searchTerm
                      ? 'No conversations match your search.'
                      : 'New customer conversations will appear here.'}
                  </p>
                </div>
              ) : (
                filteredConversations.map(
                  (conversation) => {
                    const active =
                      currentConversation?.id ===
                      conversation.id;

                    const unread =
                      getUnreadCount(
                        conversation
                      );

                    const closed =
                      isConversationClosed(
                        conversation
                      );

                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() =>
                          handleSelectConversation(
                            conversation
                          )
                        }
                        className={`group flex w-full gap-3 border-b border-slate-50 px-3.5 py-3.5 text-left transition sm:px-5 sm:py-4 ${
                          active
                            ? 'bg-indigo-50/60'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* AVATAR */}

                        <div className="relative shrink-0">
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-black sm:h-12 sm:w-12 sm:text-sm ${
                              active
                                ? 'bg-indigo-600 text-white'
                                : closed
                                  ? 'bg-slate-100 text-slate-500'
                                  : 'bg-indigo-50 text-indigo-600'
                            }`}
                          >
                            {getInitials(
                              getUserName(
                                conversation
                              )
                            )}
                          </div>

                          {unread > 0 && (
                            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white ring-2 ring-white">
                              {unread > 9
                                ? '9+'
                                : unread}
                            </span>
                          )}
                        </div>

                        {/* CONTENT */}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p
                              className={`min-w-0 flex-1 truncate text-sm ${
                                unread
                                  ? 'font-black text-slate-900'
                                  : 'font-bold text-slate-700'
                              }`}
                            >
                              {getUserName(
                                conversation
                              )}
                            </p>

                            <span className="shrink-0 text-[9px] font-semibold text-slate-400 sm:text-[10px]">
                              {formatConversationDate(
                                conversation.last_message_at ||
                                  conversation.updated_at
                              )}
                            </span>
                          </div>

                          <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                            {conversation.subject && (
                              <p className="min-w-0 truncate text-[11px] font-bold text-indigo-500">
                                {conversation.subject}
                              </p>
                            )}

                            {closed && (
                              <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-slate-400">
                                Closed
                              </span>
                            )}
                          </div>

                          <p
                            className={`mt-1 truncate text-xs ${
                              unread
                                ? 'font-semibold text-slate-700'
                                : 'text-slate-400'
                            }`}
                          >
                            {getLastMessage(
                              conversation
                            )}
                          </p>
                        </div>

                        <ChevronRight
                          size={15}
                          className={`mt-3 shrink-0 transition ${
                            active
                              ? 'text-indigo-500'
                              : 'text-slate-300 opacity-0 group-hover:opacity-100'
                          }`}
                        />
                      </button>
                    );
                  }
                )
              )}
            </div>
          </aside>

          {/* ====================================================
              CHAT PANEL
          ==================================================== */}

          <main
            className={`relative min-w-0 flex-col bg-[#fcfdff] ${
              mobileView === 'list'
                ? 'hidden lg:flex'
                : 'flex'
            }`}
          >
            {!currentConversation ? (
              <div className="flex flex-1 items-center justify-center p-6 sm:p-8">
                <div className="max-w-sm text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-indigo-50 text-indigo-600">
                    <MessageCircle size={34} />
                  </div>

                  <h2 className="mt-5 text-xl font-black tracking-tight text-slate-900">
                    Select a conversation
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Choose a customer from the inbox to view their messages and respond.
                  </p>

                  <div className="mt-5 flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
                    <ShieldCheck size={15} />
                    Secure support workspace
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* ==================================================
                    CHAT HEADER
                ================================================== */}

                <header className="relative z-20 flex min-h-[68px] shrink-0 items-center gap-2.5 border-b border-slate-100 bg-white px-3 sm:h-[76px] sm:gap-3 sm:px-5 lg:px-6">
                  <button
                    type="button"
                    onClick={() =>
                      setMobileView('list')
                    }
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft size={19} />
                  </button>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-xs font-black text-indigo-600 sm:h-11 sm:w-11 sm:text-sm">
                    {getInitials(
                      getUserName(
                        currentConversation
                      )
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <h2 className="truncate text-sm font-black text-slate-900 sm:text-base">
                        {getUserName(
                          currentConversation
                        )}
                      </h2>

                      <span className="hidden shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-600 sm:inline-flex">
                        Customer
                      </span>
                    </div>

                    <p className="truncate text-[11px] text-slate-400 sm:text-xs">
                      {getUserEmail(
                        currentConversation
                      ) ||
                        'Customer support conversation'}
                    </p>
                  </div>

                  <div className="relative flex shrink-0 items-center gap-0.5 sm:gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setShowDetails(
                          (prev) => !prev
                        )
                      }
                      className={`hidden h-10 w-10 items-center justify-center rounded-xl transition sm:flex ${
                        showDetails
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                      }`}
                      title="Customer details"
                    >
                      <User size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setShowMenu(
                          (prev) => !prev
                        )
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      title="Conversation actions"
                    >
                      <MoreHorizontal size={19} />
                    </button>

                    {showMenu && (
                      <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_15px_50px_rgba(15,23,42,0.14)]">
                        {!conversationClosed && (
                          <button
                            type="button"
                            onClick={
                              requestCloseConversation
                            }
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-700"
                          >
                            <Archive size={16} />
                            Close conversation
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={
                            requestDeleteConversation
                          }
                          disabled={deleting}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2
                            size={16}
                            className={
                              deleting
                                ? 'animate-pulse'
                                : ''
                            }
                          />

                          {deleting
                            ? 'Deleting...'
                            : 'Delete conversation'}
                        </button>
                      </div>
                    )}
                  </div>
                </header>

                {/* ==================================================
                    CUSTOMER DETAILS
                ================================================== */}

                {showDetails && (
                  <div className="border-b border-slate-100 bg-white px-3 py-3 sm:px-6 sm:py-4">
                    <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Customer
                        </p>

                        <p className="mt-1 truncate text-sm font-bold text-slate-800">
                          {getUserName(
                            currentConversation
                          )}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Email
                        </p>

                        <p className="mt-1 truncate text-sm font-bold text-slate-800">
                          {getUserEmail(
                            currentConversation
                          ) ||
                            'Not provided'}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Subject
                        </p>

                        <p className="mt-1 truncate text-sm font-bold text-slate-800">
                          {currentConversation.subject ||
                            'General support'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ==================================================
                    CLOSED NOTICE
                ================================================== */}

                {conversationClosed && (
                  <div className="border-b border-amber-100 bg-amber-50 px-3 py-2.5 text-center">
                    <p className="text-[11px] font-bold text-amber-700 sm:text-xs">
                      This conversation is closed.
                    </p>
                  </div>
                )}

                {/* ==================================================
                    MESSAGES
                ================================================== */}

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-5 sm:px-5 sm:py-6 lg:px-8">
                  <div className="mx-auto max-w-4xl">
                    <div className="mb-6 flex items-center justify-center sm:mb-7">
                      <div className="flex items-center gap-2 rounded-full border border-slate-100 bg-white px-3 py-1.5 text-[9px] font-bold text-slate-400 shadow-sm sm:text-[10px]">
                        <Clock3 size={11} />
                        Conversation
                      </div>
                    </div>

                    {displayedMessages.length ===
                    0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center sm:py-20">
                        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
                          <MessageCircle size={27} />
                        </div>

                        <h3 className="mt-4 font-black text-slate-800">
                          Start the conversation
                        </h3>

                        <p className="mt-1 text-sm text-slate-400">
                          Send a message to this customer.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
                        {displayedMessages.map(
                          (msg, index) => {
                            const mine =
                              isMine(msg);

                            const messageText =
                              msg?.message ||
                              msg?.content ||
                              '';

                            return (
                              <div
                                key={
                                  msg.id ||
                                  `${msg.created_at}-${index}`
                                }
                                className={`flex ${
                                  mine
                                    ? 'justify-end'
                                    : 'justify-start'
                                }`}
                              >
                                <div
                                  className={`flex max-w-[90%] flex-col sm:max-w-[72%] ${
                                    mine
                                      ? 'items-end'
                                      : 'items-start'
                                  }`}
                                >
                                  <div
                                    className={`rounded-[20px] px-3.5 py-2.5 text-sm leading-6 shadow-sm sm:px-4 sm:py-3 ${
                                      mine
                                        ? 'rounded-br-md bg-indigo-600 text-white'
                                        : 'rounded-bl-md border border-slate-100 bg-white text-slate-700'
                                    }`}
                                  >
                                    <p className="whitespace-pre-wrap break-words">
                                      {messageText}
                                    </p>
                                  </div>

                                  <div
                                    className={`mt-1.5 flex items-center gap-1.5 px-1 text-[9px] font-semibold text-slate-400 sm:text-[10px] ${
                                      mine
                                        ? 'justify-end'
                                        : 'justify-start'
                                    }`}
                                  >
                                    <span>
                                      {formatTime(
                                        msg.created_at ||
                                          msg.timestamp
                                      )}
                                    </span>

                                    {mine &&
                                      (msg.read ||
                                      msg.is_read ? (
                                        <CheckCheck
                                          size={13}
                                          className="text-indigo-500"
                                        />
                                      ) : (
                                        <Check
                                          size={13}
                                        />
                                      ))}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}

                        {typingUser && (
                          <div className="flex justify-start">
                            <div className="rounded-[20px] rounded-bl-md border border-slate-100 bg-white px-4 py-3 shadow-sm">
                              <div className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* ==================================================
                    COMPOSER
                ================================================== */}

                <div className="shrink-0 border-t border-slate-100 bg-white px-2.5 py-2.5 sm:px-5 sm:py-4">
                  <form
                    onSubmit={
                      handleSendMessage
                    }
                    className="mx-auto max-w-4xl"
                  >
                    <div
                      className={`flex items-end gap-1.5 rounded-[20px] border p-1.5 transition sm:gap-2 ${
                        conversationClosed
                          ? 'border-slate-200 bg-slate-100'
                          : 'border-slate-200 bg-slate-50 focus-within:border-indigo-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-50'
                      }`}
                    >
                      <button
                        type="button"
                        disabled={
                          conversationClosed
                        }
                        className="mb-0.5 hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 sm:flex"
                        title="Attachments"
                      >
                        <Paperclip size={18} />
                      </button>

                      <textarea
                        ref={inputRef}
                        value={message}
                        onChange={
                          handleTyping
                        }
                        disabled={
                          conversationClosed
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key ===
                              'Enter' &&
                            !event.shiftKey
                          ) {
                            event.preventDefault();

                            handleSendMessage(
                              event
                            );
                          }
                        }}
                        rows={1}
                        placeholder={
                          conversationClosed
                            ? 'This conversation is closed'
                            : 'Write a reply...'
                        }
                        className="max-h-32 min-h-[42px] flex-1 resize-none bg-transparent px-2 py-2.5 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-400"
                      />

                      <button
                        type="submit"
                        disabled={
                          conversationClosed ||
                          !message.trim() ||
                          sending
                        }
                        className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                      >
                        <Send
                          size={17}
                          className={
                            sending
                              ? 'animate-pulse'
                              : ''
                          }
                        />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between px-1">
                      <p className="text-[9px] font-medium text-slate-400 sm:text-[10px]">
                        Enter to send · Shift + Enter for a new line
                      </p>

                      <div className="hidden items-center gap-1.5 text-[10px] font-bold text-slate-400 sm:flex">
                        <ShieldCheck size={12} />
                        Secure support
                      </div>
                    </div>
                  </form>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* ======================================================
          CONFIRM: CLOSE
      ====================================================== */}

      <ConfirmDialog
        open={showCloseConfirm}
        onClose={() =>
          !closing &&
          setShowCloseConfirm(false)
        }
        onConfirm={
          confirmCloseConversation
        }
        loading={closing}
        title="Close this conversation?"
        description="Once closed, the customer won't be able to send new messages. The conversation will remain available in the inbox."
        confirmLabel="Close conversation"
        cancelLabel="Keep open"
        tone="warning"
        icon={Archive}
      />

      {/* ======================================================
          CONFIRM: DELETE
      ====================================================== */}

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() =>
          !deleting &&
          setShowDeleteConfirm(false)
        }
        onConfirm={
          confirmDeleteConversation
        }
        loading={deleting}
        title="Delete this conversation?"
        description={`This will permanently delete the conversation with ${deletingCustomerName}. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        icon={Trash2}
      />
    </div>
  );
};

export default AdminChat;