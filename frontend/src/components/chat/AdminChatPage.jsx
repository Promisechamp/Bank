// AdminChatPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Menu,
  MessageSquare,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useChat } from './ChatContext';

// ------------------------------------------------------------
// AdminSidebar
// ------------------------------------------------------------
const AdminSidebar = ({
  conversations,
  activeConversation,
  selectingId,
  onSelectConversation,
  loading,
  filter = 'all',
  onFilterChange,
}) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = conversations;
    if (filter === 'open') list = list.filter(c => c.status !== 'closed');
    if (filter === 'closed') list = list.filter(c => c.status === 'closed');

    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter(c =>
      (c.subject || c.title || '').toLowerCase().includes(term) ||
      (c.last_message || '').toLowerCase().includes(term)
    );
  }, [conversations, filter, search]);

  const activeId = activeConversation?.id || activeConversation?._id;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <header className="shrink-0 border-b border-gray-200 px-4 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary-600">
            Support Admin
          </p>
          <h2 className="mt-1 text-sm font-bold tracking-tight text-gray-900">
            Conversations
          </h2>
        </div>
        <div className="mt-3 flex gap-1">
          {[
            ['all', 'All'],
            ['open', 'Open'],
            ['closed', 'Closed'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onFilterChange?.(value)}
              className={`rounded-full px-3 py-1 text-[10px] font-semibold transition ${
                filter === value
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 transition focus-within:border-primary-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-100">
          <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject or preview"
            className="h-10 min-w-0 flex-1 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && conversations.length === 0 && (
          <div className="p-4 text-center text-gray-400">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary-500" />
            <p className="mt-2 text-xs">Loading conversations…</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
              <MessageSquare className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-bold text-gray-800">
              {search ? 'No matches' : 'No conversations'}
            </p>
            <p className="mx-auto mt-1.5 max-w-[210px] text-[10px] leading-5 text-gray-500">
              {search
                ? 'Try another search term.'
                : 'All conversations will appear here.'}
            </p>
          </div>
        )}

        {filtered.map((conversation) => {
          const id = conversation.id || conversation._id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                console.log('🔍 Clicked conversation ID:', id);
                onSelectConversation(id);
              }}
              disabled={selectingId === id}
              className={`w-full border-b border-gray-100 px-4 py-3.5 text-left transition ${
                id === activeId
                  ? 'bg-primary-50/70'
                  : 'bg-white hover:bg-gray-50'
              } ${selectingId === id ? 'cursor-wait opacity-70' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                  <MessageSquare className="h-4 w-4" />
                  {conversation.status !== 'closed' && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-800">
                      {conversation.subject || conversation.title || 'No subject'}
                    </p>
                    <span className="shrink-0 text-[10px] font-medium text-gray-400">
                      {conversation.last_message_at
                        ? new Date(conversation.last_message_at).toLocaleDateString()
                        : ''}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[10px] text-gray-500">
                    {conversation.last_message || 'No messages yet'}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        conversation.status === 'closed'
                          ? 'bg-gray-400'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <span
                      className={`text-[10px] font-semibold ${
                        conversation.status === 'closed'
                          ? 'text-gray-400'
                          : 'text-emerald-600'
                      }`}
                    >
                      {conversation.status === 'closed' ? 'Closed' : 'Open'}
                    </span>
                    {conversation.admin_id && (
                      <span className="ml-1 text-[10px] text-gray-400">· Assigned</span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ------------------------------------------------------------
// AdminReplyInput
// ------------------------------------------------------------
const AdminReplyInput = ({ conversationId }) => {
  const { sendMessage } = useChat();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await sendMessage(conversationId, trimmed);
      setMessage('');
    } catch (err) {
      console.error('Send failed:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-1.5 focus-within:border-primary-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-100">
      <textarea
        rows={1}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your reply…"
        maxLength={5000}
        disabled={sending}
        className="max-h-[132px] min-h-[42px] flex-1 resize-none overflow-y-auto bg-transparent px-3 py-2.5 text-sm leading-5 text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={!message.trim() || sending}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm transition hover:bg-primary-700 disabled:bg-gray-200 disabled:text-gray-400"
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
      </button>
    </div>
  );
};

// ------------------------------------------------------------
// AdminChatPage – main entry
// ------------------------------------------------------------
const AdminChatPage = ({ onBack }) => {
  const {
    conversations = [],
    currentConversation,
    selectConversation,
    loading,
    isAdmin,
    closeConversation,
    fetchConversations,
    error: contextError,
  } = useChat();

  const [filter, setFilter] = useState('all');
  const [selectingId, setSelectingId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [localError, setLocalError] = useState(null);

  // Fetch conversations on mount – ensure we have data
  useEffect(() => {
    if (fetchConversations) {
      fetchConversations(filter === 'all' ? undefined : filter);
    }
  }, [fetchConversations, filter]);

  const handleSelect = async (id) => {
    if (!id) {
      console.warn('⚠️ No conversation ID provided');
      return;
    }

    if (selectingId === id) return;

    console.log('🔄 Selecting conversation:', id);
    setSelectingId(id);
    setLocalError(null);

    try {
      if (typeof selectConversation === 'function') {
        await selectConversation(id);
        console.log('✅ Conversation loaded:', id);
      } else {
        console.error('❌ selectConversation is not a function');
        setLocalError('Chat service unavailable');
      }
    } catch (err) {
      console.error('❌ Failed to load conversation:', err);
      setLocalError(err.message || 'Failed to open conversation');
    } finally {
      setSelectingId(null);
    }
  };

  const handleClose = async () => {
    if (!currentConversation) return;
    try {
      await closeConversation?.(currentConversation.id);
    } catch (err) {
      console.error('Failed to close conversation:', err);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-sm font-medium text-gray-600">Admin access required</p>
        </div>
      </div>
    );
  }

  return (
    <section className="flex h-full min-h-0 w-full">
      <div className="relative flex h-full min-h-0 w-full overflow-hidden bg-white">
        {/* Sidebar */}
        <aside
          className={`flex shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-300 ${
            sidebarOpen ? 'w-64 sm:w-72' : 'w-0 overflow-hidden'
          }`}
        >
          <AdminSidebar
            conversations={conversations}
            activeConversation={currentConversation}
            selectingId={selectingId}
            onSelectConversation={handleSelect}
            loading={loading}
            filter={filter}
            onFilterChange={setFilter}
          />
        </aside>

        {/* Main chat area */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute left-4 top-4 z-10 rounded-xl border border-gray-200 bg-white p-2 text-gray-600 shadow-sm hover:bg-gray-50 md:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Error banner */}
          {(localError || contextError) && (
            <div className="shrink-0 bg-rose-50 p-3 text-center text-xs font-medium text-rose-700">
              {localError || contextError}
            </div>
          )}

          {currentConversation ? (
            <div className="flex min-h-0 flex-1 flex-col bg-gray-50">
              {/* Header */}
              <header className="shrink-0 border-b border-gray-200 bg-white px-4 py-3.5 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <h1 className="text-sm font-bold text-gray-900">
                        {currentConversation.subject || 'Conversation'}
                      </h1>
                      <p className="mt-0.5 text-[10px] text-gray-500">
                        {currentConversation.status === 'closed'
                          ? 'Closed'
                          : currentConversation.admin_id
                          ? 'Assigned to you'
                          : 'Unassigned'}
                      </p>
                    </div>
                  </div>
                  {currentConversation.status !== 'closed' && (
                    <button
                      type="button"
                      onClick={handleClose}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                    >
                      Close conversation
                    </button>
                  )}
                </div>
              </header>

              {/* Messages */}
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8">
                <div className="mx-auto max-w-3xl">
                  {currentConversation.messages?.length === 0 ? (
                    <div className="py-12 text-center text-gray-400">
                      <p className="text-sm">No messages yet</p>
                    </div>
                  ) : (
                    currentConversation.messages?.map((msg, idx) => {
                      const isOwn = msg.sender_id === currentConversation.admin_id;
                      return (
                        <div
                          key={msg.id || idx}
                          className={`flex w-full ${
                            isOwn ? 'justify-end' : 'justify-start'
                          } mb-3`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                              isOwn
                                ? 'bg-primary-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-700'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">
                              {msg.message || msg.content}
                            </p>
                            <div
                              className={`mt-1 text-[10px] ${
                                isOwn ? 'text-white/70' : 'text-gray-400'
                              }`}
                            >
                              {new Date(msg.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
                </div>
              </div>

              {/* Input */}
              <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="mx-auto max-w-3xl">
                  {currentConversation.status === 'closed' ? (
                    <div className="rounded-xl bg-gray-50 p-3 text-center text-xs text-gray-400">
                      This conversation is closed
                    </div>
                  ) : (
                    <AdminReplyInput conversationId={currentConversation.id} />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-sm font-medium text-gray-600">
                  Select a conversation
                </p>
                <p className="text-xs text-gray-400">
                  Choose from the list to start assisting
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </section>
  );
};

export default AdminChatPage;