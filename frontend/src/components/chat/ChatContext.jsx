// src/components/chat/ChatContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { chatAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const socketRef = useRef(null);

  // Determine role
  useEffect(() => {
    if (user) {
      setIsAdmin(user.role?.toLowerCase() === 'admin');
    }
  }, [user]);

  // ---------- Socket connection ----------
  useEffect(() => {
    if (!user) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;
    socket.emit('join', { userId: user.id, role: isAdmin ? 'admin' : 'user' });

    // NOTE: these handlers are registered once per (user, isAdmin, token)
    // change, so they must never read `currentConversation` (or any other
    // frequently-changing state) from the outer closure — that value would
    // be frozen at whatever it was when the socket connected. Every update
    // below uses the functional setState form instead, which always sees
    // the latest state regardless of when the handler was registered.

    socket.on('new_message', ({ conversationId, message }) => {
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== conversationId) return conv;
          const isIncoming = message.sender_id !== user.id;
          return {
            ...conv,
            messages: [...conv.messages, message],
            last_message_at: message.created_at,
            user_unread_count: isIncoming ? (conv.user_unread_count || 0) + 1 : conv.user_unread_count,
            admin_unread_count: isIncoming ? (conv.admin_unread_count || 0) + 1 : conv.admin_unread_count,
          };
        })
      );

      setCurrentConversation((prev) => {
        if (!prev || prev.id !== conversationId) return prev;
        return {
          ...prev,
          messages: [...prev.messages, message],
          last_message_at: message.created_at,
        };
      });
    });

    socket.on('conversation_updated', ({ conversation: updatedConversation }) => {
      setConversations((prev) =>
        prev.map((conv) => (conv.id === updatedConversation.id ? updatedConversation : conv))
      );

      setCurrentConversation((prev) => {
        if (!prev || prev.id !== updatedConversation.id) return prev;
        return updatedConversation;
      });
    });

    socket.on('unread_updated', ({ conversationId, user_unread_count, admin_unread_count }) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? { ...conv, user_unread_count, admin_unread_count }
            : conv
        )
      );

      setCurrentConversation((prev) => {
        if (!prev || prev.id !== conversationId) return prev;
        return { ...prev, user_unread_count, admin_unread_count };
      });
    });

    return () => {
      socket.off('new_message');
      socket.off('conversation_updated');
      socket.off('unread_updated');
      socket.disconnect();
    };
  }, [user, isAdmin, token]);

  // ---------- API calls ----------
  const fetchConversations = useCallback(async (status = 'active') => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = isAdmin
        ? await chatAPI.getAdminConversations(status)
        : await chatAPI.getUserConversations();
      setConversations(data.conversations || []);
    } catch (err) {
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const loadConversation = useCallback(async (conversationId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await chatAPI.getConversationById(conversationId);
      setCurrentConversation(data.conversation);
      await chatAPI.markConversationRead(conversationId);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, user_unread_count: 0, admin_unread_count: 0 }
            : c
        )
      );
      return data.conversation;
    } catch (err) {
      setError(err.message || 'Failed to load conversation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (conversationId, message) => {
    if (!message.trim()) return;
    try {
      await chatAPI.sendMessage(conversationId, { message });
      // Delivery back into state happens via the 'new_message' socket
      // event above, including for the sender — the server is expected to
      // broadcast to the whole room. If messages ever stop appearing for
      // the sender specifically, check that the server includes the
      // sender's own socket in that broadcast.
    } catch (err) {
      setError(err.message || 'Failed to send message');
      throw err;
    }
  }, []);

  const closeConversation = useCallback(async (conversationId) => {
    try {
      const data = await chatAPI.closeConversation(conversationId);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? data.conversation : c))
      );
      setCurrentConversation((prev) =>
        prev && prev.id === conversationId ? data.conversation : prev
      );
      return data.conversation;
    } catch (err) {
      setError(err.message || 'Failed to close conversation');
      throw err;
    }
  }, []);

  const createNewConversation = useCallback(async (subject = '') => {
    try {
      const data = await chatAPI.createConversation({ subject });
      const newConv = data.conversation;
      setConversations((prev) => [newConv, ...prev]);
      setCurrentConversation(newConv);
      return newConv;
    } catch (err) {
      setError(err.message || 'Failed to create conversation');
      throw err;
    }
  }, []);

  const claimConversation = useCallback(async (conversationId) => {
    try {
      const data = await chatAPI.claimConversation(conversationId);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? data.conversation : c))
      );
      setCurrentConversation((prev) =>
        prev && prev.id === conversationId ? data.conversation : prev
      );
      return data.conversation;
    } catch (err) {
      setError(err.message || 'Failed to claim conversation');
      throw err;
    }
  }, []);

  const filterConversations = useCallback(async (status) => {
    if (!isAdmin) return;
    await fetchConversations(status);
  }, [isAdmin, fetchConversations]);

  // ============================================================
  // VALUE
  // ============================================================

  const value = {
    conversations,
    currentConversation,
    loading,
    error,
    isAdmin,
    fetchConversations,
    loadConversation,
    // Alias, in case other code (or a future refactor) reaches for this name.
    selectConversation: loadConversation,
    sendMessage,
    closeConversation,
    createNewConversation,
    createConversation: createNewConversation,
    newConversation: createNewConversation,
    claimConversation,
    filterConversations,
    setCurrentConversation,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};