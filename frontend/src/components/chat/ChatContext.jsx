// src/components/chat/ChatContext.jsx

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { chatAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const ChatContext = createContext(null);

/* ============================================================
   HELPERS
============================================================ */

const safeArray = (value) =>
  Array.isArray(value) ? value : [];

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const getRole = (user) =>
  String(
    user?.role ||
      user?.user_metadata?.role ||
      user?.app_metadata?.role ||
      ''
  ).toLowerCase();

const normalizeMessage = (message) => {
  if (!message || typeof message !== 'object') {
    return null;
  }

  return {
    ...message,

    id:
      message.id ||
      message.message_id ||
      message.uuid ||
      undefined,

    message:
      message.message ??
      message.content ??
      message.text ??
      '',

    created_at:
      message.created_at ||
      message.timestamp ||
      new Date().toISOString(),

    conversation_id:
      message.conversation_id ||
      message.conversationId ||
      null,

    sender_id:
      message.sender_id ||
      message.user_id ||
      message.sender?.id ||
      null,

    read: Boolean(
      message.read ??
        message.is_read ??
        false
    ),
  };
};

const getMessageId = (message) => {
  if (!message) {
    return null;
  }

  if (message.id) {
    return String(message.id);
  }

  if (message.message_id) {
    return String(message.message_id);
  }

  if (message.uuid) {
    return String(message.uuid);
  }

  return [
    message.conversation_id || '',
    message.sender_id || '',
    message.created_at ||
      message.timestamp ||
      '',
    message.message ||
      message.content ||
      message.text ||
      '',
  ].join('-');
};

const mergeMessages = (
  existing = [],
  incoming = []
) => {
  const map = new Map();

  [
    ...safeArray(existing),
    ...safeArray(incoming),
  ].forEach((rawMessage) => {
    const message =
      normalizeMessage(rawMessage);

    if (!message) {
      return;
    }

    const id =
      getMessageId(message);

    if (!id) {
      return;
    }

    if (map.has(id)) {
      map.set(id, {
        ...map.get(id),
        ...message,
      });
    } else {
      map.set(id, message);
    }
  });

  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(
        a?.created_at || 0
      ).getTime() -
      new Date(
        b?.created_at || 0
      ).getTime()
  );
};

const mergeConversationMessages = (
  conversation,
  incomingMessages
) => {
  if (!conversation) {
    return conversation;
  }

  const messages =
    mergeMessages(
      conversation.messages,
      incomingMessages
    );

  const lastMessage =
    messages[messages.length - 1];

  return {
    ...conversation,

    messages,

    last_message_at:
      lastMessage?.created_at ||
      conversation.last_message_at ||
      null,
  };
};

/* ============================================================
   PROVIDER
============================================================ */

export const ChatProvider = ({
  children,
}) => {
  const { user } = useAuth();

  const {
    socket,
    isConnected,

    chatMessages,

    getMessages,
    getTypingUser,

    sendChatMessage,
    sendTyping,

    markConversationRead:
      socketMarkConversationRead,

    addMessage,
  } = useSocket();

  /* ==========================================================
     STATE
  ========================================================== */

  const [
    conversations,
    setConversations,
  ] = useState([]);

  const [
    currentConversation,
    setCurrentConversation,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    conversationLoading,
    setConversationLoading,
  ] = useState(false);

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState(null);

  const [
    isAdmin,
    setIsAdmin,
  ] = useState(false);

  /* ==========================================================
     ROLE
  ========================================================== */

  useEffect(() => {
    setIsAdmin(
      getRole(user) === 'admin'
    );
  }, [user]);

  /* ==========================================================
     RESET
  ========================================================== */

  useEffect(() => {
    if (user) {
      return;
    }

    setConversations([]);
    setCurrentConversation(null);
    setError(null);
    setLoading(false);
    setConversationLoading(false);
    setSending(false);
  }, [user]);

  /* ==========================================================
     FETCH CONVERSATIONS
  ========================================================== */

  const fetchConversations =
    useCallback(
      async (status = 'active') => {
        if (!user) {
          return [];
        }

        setLoading(true);
        setError(null);

        try {
          const response = isAdmin
            ? await chatAPI.getAdminConversations(
                status
              )
            : await chatAPI.getUserConversations();

          const next =
            safeArray(
              response?.conversations
            );

          /*
           * Preserve realtime messages already held
           * by SocketContext when refreshing the list.
           */
          const mergedNext =
            next.map((conversation) => {
              const realtime =
                safeArray(
                  chatMessages?.[
                    conversation.id
                  ]
                );

              if (!realtime.length) {
                return conversation;
              }

              return mergeConversationMessages(
                conversation,
                realtime
              );
            });

          setConversations(
            mergedNext
          );

          setCurrentConversation(
            (current) => {
              if (!current?.id) {
                return current;
              }

              const updated =
                mergedNext.find(
                  (item) =>
                    item.id ===
                    current.id
                );

              if (!updated) {
                return current;
              }

              return mergeConversationMessages(
                {
                  ...current,
                  ...updated,
                },
                updated.messages
              );
            }
          );

          return mergedNext;
        } catch (err) {
          const message =
            getErrorMessage(
              err,
              'Failed to load conversations'
            );

          setError(message);

          throw err;
        } finally {
          setLoading(false);
        }
      },
      [
        user,
        isAdmin,
        chatMessages,
      ]
    );

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    if (!user) {
      return;
    }

    fetchConversations(
      'active'
    ).catch(() => {});
  }, [
    user,
    isAdmin,
    fetchConversations,
  ]);

  /* ==========================================================
     REALTIME MESSAGE SYNC
  ========================================================== */

  useEffect(() => {
    if (!chatMessages) {
      return;
    }

    setConversations(
      (previous) =>
        previous.map(
          (conversation) => {
            const realtime =
              safeArray(
                chatMessages[
                  conversation.id
                ]
              );

            if (!realtime.length) {
              return conversation;
            }

            return mergeConversationMessages(
              conversation,
              realtime
            );
          }
        )
    );

    setCurrentConversation(
      (current) => {
        if (!current?.id) {
          return current;
        }

        const realtime =
          safeArray(
            chatMessages[
              current.id
            ]
          );

        if (!realtime.length) {
          return current;
        }

        return mergeConversationMessages(
          current,
          realtime
        );
      }
    );
  }, [chatMessages]);

  /* ==========================================================
     LOAD CONVERSATION
  ========================================================== */

  const loadConversation =
    useCallback(
      async (conversationId) => {
        if (!conversationId) {
          return null;
        }

        setConversationLoading(true);
        setError(null);

        try {
          const response =
            await chatAPI.getConversationById(
              conversationId
            );

          let conversation =
            response?.conversation ||
            null;

          if (!conversation) {
            throw new Error(
              'Conversation could not be found'
            );
          }

          /*
           * Merge messages already received through
           * Socket.IO with the REST response.
           */
          const realtimeMessages =
            safeArray(
              getMessages?.(
                conversationId
              )
            );

          conversation =
            mergeConversationMessages(
              conversation,
              realtimeMessages
            );

          setCurrentConversation(
            conversation
          );

          /*
           * Mark conversation as read.
           *
           * This is deliberately non-blocking from
           * the perspective of opening the chat.
           */
          try {
            if (
              isConnected &&
              socketMarkConversationRead
            ) {
              socketMarkConversationRead(
                conversationId
              );
            } else {
              await chatAPI.markConversationRead(
                conversationId
              );
            }
          } catch {
            /*
             * Read status should never prevent
             * a conversation from opening.
             */
          }

          /*
           * Reset unread counters locally.
           */
          setConversations(
            (previous) =>
              previous.map(
                (item) =>
                  item.id ===
                  conversationId
                    ? {
                        ...item,

                        user_unread_count:
                          0,

                        admin_unread_count:
                          0,

                        messages:
                          mergeMessages(
                            item.messages,
                            conversation.messages
                          ),

                        last_message_at:
                          conversation.last_message_at,
                      }
                    : item
              )
          );

          return conversation;
        } catch (err) {
          const message =
            getErrorMessage(
              err,
              'Failed to load conversation'
            );

          setError(message);

          throw err;
        } finally {
          setConversationLoading(false);
        }
      },
      [
        getMessages,
        isConnected,
        socketMarkConversationRead,
      ]
    );

  /* ==========================================================
     SELECT
  ========================================================== */

  const selectConversation =
    useCallback(
      async (conversationOrId) => {
        const id =
          typeof conversationOrId ===
          'object'
            ? conversationOrId?.id
            : conversationOrId;

        if (!id) {
          return null;
        }

        return loadConversation(id);
      },
      [loadConversation]
    );

  /* ==========================================================
     CURRENT MESSAGES
  ========================================================== */

  const currentMessages =
    useMemo(() => {
      if (!currentConversation?.id) {
        return [];
      }

      const stored =
        safeArray(
          currentConversation.messages
        );

      const realtime =
        safeArray(
          chatMessages?.[
            currentConversation.id
          ]
        );

      return mergeMessages(
        stored,
        realtime
      );
    }, [
      currentConversation,
      chatMessages,
    ]);

  /* ==========================================================
     TYPING
  ========================================================== */

  const currentTypingUser =
    useMemo(() => {
      if (!currentConversation?.id) {
        return null;
      }

      return (
        getTypingUser?.(
          currentConversation.id
        ) || null
      );
    }, [
      currentConversation,
      getTypingUser,
    ]);

  /* ==========================================================
     UNREAD
  ========================================================== */

  const totalUnreadCount =
    useMemo(() => {
      const key = isAdmin
        ? 'admin_unread_count'
        : 'user_unread_count';

      return conversations.reduce(
        (total, conversation) =>
          total +
          Number(
            conversation?.[key] || 0
          ),
        0
      );
    }, [
      conversations,
      isAdmin,
    ]);

  /* ==========================================================
     SEND MESSAGE
     
     IMPORTANT:
     
     1. Socket.IO is preferred whenever connected.
     2. Assignment DOES NOT determine permission.
     3. Admin can reply to ANY active conversation.
     4. Client can send even when admin_id is NULL.
     5. No optimistic messages.
     6. We wait for the server ACK.
     7. The canonical server message is inserted.
     ========================================================== */

  const sendMessage =
    useCallback(
      async (
        conversationId,
        message
      ) => {
        const text =
          String(
            message || ''
          ).trim();

        if (
          !conversationId ||
          !text ||
          sending
        ) {
          return null;
        }

        setError(null);
        setSending(true);

        try {
          const conversation =
            currentConversation?.id ===
            conversationId
              ? currentConversation
              : conversations.find(
                  (item) =>
                    item.id ===
                    conversationId
                );

          /*
           * ----------------------------------------------------
           * SOCKET
           * ----------------------------------------------------
           *
           * Assignment is intentionally NOT checked here.
           *
           * Admin:
           *   can reply to any active conversation.
           *
           * Client:
           *   can send whether admin_id is NULL or assigned.
           *
           * The backend socket handler is responsible for
           * determining the actual recipient(s).
           */

          const canUseSocket =
            Boolean(
              socket &&
                isConnected &&
                sendChatMessage &&
                conversation?.id
            );

          if (canUseSocket) {
            /*
             * sendChatMessage now returns a Promise and
             * resolves only after the server confirms the
             * message.
             */
            const result =
              await sendChatMessage(
                conversationId,
                text
              );

            const canonicalMessage =
              normalizeMessage(
                result?.message
              );

            /*
             * The socket server returns the canonical DB
             * message. Insert it here immediately so the UI
             * doesn't have to wait for another event.
             *
             * SocketContext will also receive its own
             * chat:message:sent / chat:message event.
             *
             * mergeMessages() deduplicates using the UUID,
             * so this does NOT create duplicates.
             */
            if (
              canonicalMessage?.id
            ) {
              setCurrentConversation(
                (current) => {
                  if (
                    current?.id !==
                    conversationId
                  ) {
                    return current;
                  }

                  return mergeConversationMessages(
                    current,
                    [canonicalMessage]
                  );
                }
              );

              setConversations(
                (previous) =>
                  previous.map(
                    (item) =>
                      item.id ===
                      conversationId
                        ? mergeConversationMessages(
                            item,
                            [canonicalMessage]
                          )
                        : item
                  )
              );

              /*
               * Keep SocketContext's message cache
               * synchronized with the canonical message.
               */
              addMessage?.(
                conversationId,
                canonicalMessage
              );
            }

            /*
             * Merge any conversation metadata returned
             * by the server, such as unread counters
             * or last_message_at.
             */
            if (
              result?.conversation
            ) {
              const updatedConversation =
                result.conversation;

              setConversations(
                (previous) =>
                  previous.map(
                    (item) =>
                      item.id ===
                      conversationId
                        ? mergeConversationMessages(
                            {
                              ...item,
                              ...updatedConversation,
                            },
                            canonicalMessage
                              ? [
                                  canonicalMessage,
                                ]
                              : []
                          )
                        : item
                  )
              );

              setCurrentConversation(
                (current) => {
                  if (
                    current?.id !==
                    conversationId
                  ) {
                    return current;
                  }

                  return mergeConversationMessages(
                    {
                      ...current,
                      ...updatedConversation,
                    },
                    canonicalMessage
                      ? [
                          canonicalMessage,
                        ]
                      : []
                  );
                }
              );
            }

            return {
              success: true,
              via: 'socket',
              message:
                canonicalMessage ||
                result?.message ||
                null,
              conversation:
                result?.conversation ||
                conversation ||
                null,
            };
          }

          /* ==================================================
             REST FALLBACK
          ================================================== */

          const response =
            await chatAPI.sendMessage(
              conversationId,
              {
                message: text,
              }
            );

          /*
           * IMPORTANT:
           *
           * Backend returns:
           *
           * {
           *   success: true,
           *   message: "Message sent successfully.",
           *   chatMessage: {...},
           *   conversation: {...}
           * }
           *
           * Therefore response.message is NOT the actual
           * chat message.
           */
          const sentMessage =
            normalizeMessage(
              response?.chatMessage ||
                response?.data?.chatMessage ||
                null
            );

          if (
            sentMessage?.id
          ) {
            setCurrentConversation(
              (current) => {
                if (
                  current?.id !==
                  conversationId
                ) {
                  return current;
                }

                return mergeConversationMessages(
                  current,
                  [sentMessage]
                );
              }
            );

            setConversations(
              (previous) =>
                previous.map(
                  (item) =>
                    item.id ===
                    conversationId
                      ? mergeConversationMessages(
                          item,
                          [sentMessage]
                        )
                      : item
                )
            );

            /*
             * If REST caused the backend to emit the
             * same message through Socket.IO, the UUID
             * prevents a duplicate.
             */
            addMessage?.(
              conversationId,
              sentMessage
            );
          }

          /*
           * Also merge the returned conversation metadata.
           */
          if (
            response?.conversation
          ) {
            const updatedConversation =
              response.conversation;

            setConversations(
              (previous) =>
                previous.map(
                  (item) =>
                    item.id ===
                    conversationId
                      ? mergeConversationMessages(
                          {
                            ...item,
                            ...updatedConversation,
                          },
                          sentMessage
                            ? [sentMessage]
                            : []
                        )
                      : item
                )
            );

            setCurrentConversation(
              (current) => {
                if (
                  current?.id !==
                  conversationId
                ) {
                  return current;
                }

                return mergeConversationMessages(
                  {
                    ...current,
                    ...updatedConversation,
                  },
                  sentMessage
                    ? [sentMessage]
                    : []
                );
              }
            );
          }

          return {
            ...response,

            success:
              response?.success !==
              false,

            via: 'rest',

            chatMessage:
              sentMessage,
          };
        } catch (err) {
          const message =
            getErrorMessage(
              err,
              'Failed to send message'
            );

          setError(message);

          throw err;
        } finally {
          setSending(false);
        }
      },
      [
        addMessage,
        conversations,
        currentConversation,
        isConnected,
        sendChatMessage,
        sending,
        socket,
      ]
    );

  /* ==========================================================
     CREATE CONVERSATION
  ========================================================== */

  const createNewConversation =
    useCallback(
      async (subject = '') => {
        if (!user) {
          return null;
        }

        setError(null);

        try {
          const response =
            await chatAPI.createConversation({
              subject:
                String(
                  subject || ''
                ).trim(),
            });

          const conversation =
            response?.conversation;

          if (!conversation) {
            throw new Error(
              'Conversation was not created'
            );
          }

          setConversations(
            (previous) => [
              conversation,
              ...previous.filter(
                (item) =>
                  item.id !==
                  conversation.id
              ),
            ]
          );

          setCurrentConversation(
            conversation
          );

          return conversation;
        } catch (err) {
          const message =
            getErrorMessage(
              err,
              'Failed to create conversation'
            );

          setError(message);

          throw err;
        }
      },
      [user]
    );

  /* ==========================================================
     START NEW CONVERSATION
  ========================================================== */

  const startNewConversation =
    useCallback(
      async (data = {}) => {
        if (!user) {
          return null;
        }

        setError(null);

        try {
          const response =
            await chatAPI.startNewConversation(
              data
            );

          const conversation =
            response?.conversation;

          if (!conversation) {
            throw new Error(
              'Conversation was not created'
            );
          }

          setConversations(
            (previous) => [
              conversation,
              ...previous.filter(
                (item) =>
                  item.id !==
                  conversation.id
              ),
            ]
          );

          setCurrentConversation(
            conversation
          );

          return conversation;
        } catch (err) {
          const message =
            getErrorMessage(
              err,
              'Failed to start conversation'
            );

          setError(message);

          throw err;
        }
      },
      [user]
    );

  /* ==========================================================
     CLOSE CONVERSATION
  ========================================================== */

  const closeConversation =
    useCallback(
      async (conversationId) => {
        if (!conversationId) {
          return null;
        }

        setError(null);

        try {
          const response =
            await chatAPI.closeConversation(
              conversationId
            );

          const closed =
            response?.conversation;

          if (closed) {
            setConversations(
              (previous) =>
                previous.map(
                  (item) =>
                    item.id ===
                    conversationId
                      ? {
                          ...item,
                          ...closed,
                        }
                      : item
                )
            );

            setCurrentConversation(
              (current) =>
                current?.id ===
                conversationId
                  ? {
                      ...current,
                      ...closed,
                    }
                  : current
            );
          }

          return closed || response;
        } catch (err) {
          const message =
            getErrorMessage(
              err,
              'Failed to close conversation'
            );

          setError(message);

          throw err;
        }
      },
      []
    );

  /* ==========================================================
     CLAIM
     
     Claiming is completely separate from messaging.
     
     An admin may claim a conversation, but claiming is
     NOT required before replying.
  ========================================================== */

  const claimConversation =
    useCallback(
      async (conversationId) => {
        if (!conversationId) {
          return null;
        }

        setError(null);

        try {
          const response =
            await chatAPI.claimConversation(
              conversationId
            );

          const claimed =
            response?.conversation;

          if (claimed) {
            setConversations(
              (previous) =>
                previous.map(
                  (item) =>
                    item.id ===
                    conversationId
                      ? {
                          ...item,
                          ...claimed,
                        }
                      : item
                )
            );

            setCurrentConversation(
              (current) =>
                current?.id ===
                conversationId
                  ? {
                      ...current,
                      ...claimed,
                    }
                  : current
            );
          }

          return claimed || response;
        } catch (err) {
          const message =
            getErrorMessage(
              err,
              'Failed to claim conversation'
            );

          setError(message);

          throw err;
        }
      },
      []
    );

  /* ==========================================================
     FILTER
  ========================================================== */

  const filterConversations =
    useCallback(
      async (status = 'active') => {
        if (!isAdmin) {
          return [];
        }

        return fetchConversations(
          status
        );
      },
      [
        isAdmin,
        fetchConversations,
      ]
    );

  /* ==========================================================
     UPDATE
  ========================================================== */

  const updateConversation =
    useCallback(
      (
        conversationId,
        updates
      ) => {
        if (!conversationId) {
          return;
        }

        setConversations(
          (previous) =>
            previous.map(
              (conversation) =>
                conversation.id ===
                conversationId
                  ? {
                      ...conversation,
                      ...updates,
                    }
                  : conversation
            )
        );

        setCurrentConversation(
          (current) =>
            current?.id ===
            conversationId
              ? {
                  ...current,
                  ...updates,
                }
              : current
        );
      },
      []
    );

  /* ==========================================================
     CLEAR ERROR
  ========================================================== */

  const clearError =
    useCallback(() => {
      setError(null);
    }, []);

  /* ==========================================================
     CONTEXT VALUE
  ========================================================== */

  const value = useMemo(
    () => ({
      user,

      conversations,
      currentConversation,

      loading,
      conversationLoading,
      sending,

      error,
      isAdmin,

      socket,
      isConnected,

      currentMessages,
      currentTypingUser,
      totalUnreadCount,

      sendTyping,

      fetchConversations,
      loadConversation,
      selectConversation,

      sendMessage,

      createNewConversation,

      createConversation:
        createNewConversation,

      newConversation:
        createNewConversation,

      startNewConversation,

      closeConversation,
      claimConversation,

      filterConversations,

      setCurrentConversation,
      updateConversation,
      clearError,
    }),
    [
      user,

      conversations,
      currentConversation,

      loading,
      conversationLoading,
      sending,

      error,
      isAdmin,

      socket,
      isConnected,

      currentMessages,
      currentTypingUser,
      totalUnreadCount,

      sendTyping,

      fetchConversations,
      loadConversation,
      selectConversation,

      sendMessage,

      createNewConversation,
      startNewConversation,

      closeConversation,
      claimConversation,

      filterConversations,

      updateConversation,
      clearError,
    ]
  );

  return (
    <ChatContext.Provider
      value={value}
    >
      {children}
    </ChatContext.Provider>
  );
};

/* ============================================================
   HOOK
============================================================ */

export const useChat = () => {
  const context =
    useContext(ChatContext);

  if (!context) {
    throw new Error(
      'useChat must be used inside a ChatProvider'
    );
  }

  return context;
};

export default ChatContext;