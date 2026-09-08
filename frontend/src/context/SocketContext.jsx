// src/context/SocketContext.jsx

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  'http://localhost:5000';

const SOCKET_PATH = '/socket.io/';

/* ============================================================
   HELPERS
============================================================ */

const normalizeMessage = (message) => {
  if (!message) return null;

  return {
    ...message,

    message:
      message.message ??
      message.content ??
      message.text ??
      '',

    conversation_id:
      message.conversation_id ||
      message.conversationId ||
      null,

    sender_id:
      message.sender_id ||
      message.user_id ||
      message.sender?.id ||
      null,

    created_at:
      message.created_at ||
      message.timestamp ||
      new Date().toISOString(),
  };
};

const getMessageId = (message) => {
  if (!message) return null;

  /*
   * Always prefer the real database ID.
   */
  if (message.id) {
    return String(message.id);
  }

  if (message.message_id) {
    return String(message.message_id);
  }

  if (message.uuid) {
    return String(message.uuid);
  }

  /*
   * Fallback identity for messages that do not yet
   * have a database ID.
   */
  const conversationId =
    message.conversation_id ||
    message.conversationId ||
    '';

  const senderId =
    message.sender_id ||
    message.user_id ||
    '';

  const createdAt =
    message.created_at ||
    message.timestamp ||
    '';

  const text =
    message.message ||
    message.content ||
    message.text ||
    '';

  return `${conversationId}-${senderId}-${createdAt}-${text}`;
};

const mergeUniqueMessages = (
  existing = [],
  incoming = []
) => {
  const map = new Map();

  [
    ...(Array.isArray(existing)
      ? existing
      : []),

    ...(Array.isArray(incoming)
      ? incoming
      : []),
  ].forEach((rawMessage) => {
    const message =
      normalizeMessage(rawMessage);

    if (!message) return;

    const id =
      getMessageId(message);

    if (!id) return;

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

/* ============================================================
   PROVIDER
============================================================ */

export const SocketProvider = ({
  children,
}) => {
  /*
   * IMPORTANT:
   * Your AuthContext exposes `token`.
   *
   * Do NOT change this to session.access_token.
   */
  const { user, token } = useAuth();

  const socketRef = useRef(null);

  const userRef = useRef(user);
  const tokenRef = useRef(token);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  /* ==========================================================
     STATE
  ========================================================== */

  const [socket, setSocket] =
    useState(null);

  const [isConnected, setIsConnected] =
    useState(false);

  const [onlineUsers, setOnlineUsers] =
    useState([]);

  const [notifications, setNotifications] =
    useState([]);

  const [chatMessages, setChatMessages] =
    useState({});

  const [typingUsers, setTypingUsers] =
    useState({});

  const [connectionError, setConnectionError] =
    useState(null);

  /* ==========================================================
     ADD CHAT MESSAGE

     SINGLE realtime message insertion point.
  ========================================================== */

  const addChatMessage = useCallback(
    (conversationId, message) => {
      if (!conversationId || !message) {
        return;
      }

      const normalized =
        normalizeMessage(message);

      if (!normalized) return;

      setChatMessages((previous) => {
        const existing =
          Array.isArray(
            previous?.[conversationId]
          )
            ? previous[conversationId]
            : [];

        const merged =
          mergeUniqueMessages(
            existing,
            [normalized]
          );

        return {
          ...previous,
          [conversationId]: merged,
        };
      });
    },
    []
  );

  /* ==========================================================
     SOCKET CONNECTION

     KEEPING YOUR WORKING CONNECTION CODE
  ========================================================== */

  useEffect(() => {
    if (!user || !token) {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      setSocket(null);
      setIsConnected(false);
      setConnectionError(null);
      setOnlineUsers([]);
      setTypingUsers({});
      setChatMessages({});

      return undefined;
    }

    /*
     * Prevent duplicate sockets.
     */
    if (socketRef.current) {
      return undefined;
    }

    console.log(
      '[Socket] Connecting to:',
      SOCKET_URL
    );

    const socketInstance = io(
      SOCKET_URL,
      {
        auth: {
          token,
        },

        transports: [
          'polling',
          'websocket',
        ],

        withCredentials: true,

        timeout: 20000,

        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,

        path: SOCKET_PATH,

        autoConnect: true,
      }
    );

    socketRef.current =
      socketInstance;

    setSocket(socketInstance);

    /* ========================================================
       CONNECT
    ======================================================== */

    const handleConnect = () => {
      setIsConnected(true);
      setConnectionError(null);

      console.log(
        '[Socket] Connected:',
        socketInstance.id
      );
    };

    /* ========================================================
       DISCONNECT
    ======================================================== */

    const handleDisconnect = (
      reason
    ) => {
      setIsConnected(false);

      console.log(
        '[Socket] Disconnected:',
        reason
      );
    };

    /* ========================================================
       CONNECT ERROR
    ======================================================== */

    const handleConnectError = (
      error
    ) => {
      setIsConnected(false);

      setConnectionError(
        error?.message ||
          'Unable to connect to real-time services'
      );

      console.error(
        '[Socket] Connection error:',
        error
      );
    };

    /* ========================================================
       ONLINE USERS
    ======================================================== */

    const handleOnlineUsers = (
      users
    ) => {
      if (Array.isArray(users)) {
        setOnlineUsers(users);
        return;
      }

      if (Array.isArray(users?.users)) {
        setOnlineUsers(
          users.users
        );
      }
    };

    /* ========================================================
       NOTIFICATION
    ======================================================== */

    const handleNewNotification = (
      notification
    ) => {
      if (!notification) return;

      setNotifications((previous) => {
        const id =
          notification.id;

        if (
          id &&
          previous.some(
            (item) =>
              item.id === id
          )
        ) {
          return previous;
        }

        return [
          notification,
          ...previous,
        ];
      });
    };

    /* ========================================================
       CHAT MESSAGE

       Normally received by the OTHER participant.
    ======================================================== */

    const handleChatMessage = (
      payload
    ) => {
      if (!payload) return;

      console.log(
        '[Socket] chat:message:',
        payload
      );

      const conversationId =
        payload.conversationId ||
        payload.conversation_id ||
        payload.message?.conversation_id ||
        payload.message?.conversationId;

      const message =
        payload.message ||
        payload.data?.message ||
        payload.data;

      if (!conversationId || !message) {
        console.warn(
          '[Socket] Invalid chat:message payload:',
          payload
        );

        return;
      }

      addChatMessage(
        conversationId,
        message
      );
    };

    /* ========================================================
       SENT CHAT MESSAGE

       Canonical message returned to the sender.
    ======================================================== */

    const handleSentChatMessage = (
      payload
    ) => {
      if (!payload) return;

      console.log(
        '[Socket] chat:message:sent:',
        payload
      );

      const conversationId =
        payload.conversationId ||
        payload.conversation_id ||
        payload.message?.conversation_id ||
        payload.message?.conversationId;

      const message =
        payload.message ||
        payload.data?.message ||
        payload.data;

      if (!conversationId || !message) {
        console.warn(
          '[Socket] Invalid chat:message:sent payload:',
          payload
        );

        return;
      }

      /*
       * This is the canonical server message.
       *
       * Because it has the real UUID generated by the server,
       * it can safely be merged without creating a duplicate.
       */
      addChatMessage(
        conversationId,
        message
      );
    };

    /* ========================================================
       TYPING
    ======================================================== */

    const handleTyping = (
      payload
    ) => {
      if (!payload) return;

      const conversationId =
        payload.conversationId ||
        payload.conversation_id;

      if (!conversationId) return;

      const typingUserId =
        payload.userId ||
        payload.user_id ||
        payload.senderId ||
        payload.sender_id;

      const isTyping =
        payload.isTyping ??
        payload.typing ??
        false;

      /*
       * Never show our own typing indicator.
       */
      if (
        typingUserId &&
        userRef.current?.id &&
        String(typingUserId) ===
          String(
            userRef.current.id
          )
      ) {
        return;
      }

      if (!isTyping) {
        setTypingUsers(
          (previous) => {
            const next = {
              ...previous,
            };

            delete next[
              conversationId
            ];

            return next;
          }
        );

        return;
      }

      setTypingUsers(
        (previous) => ({
          ...previous,

          [conversationId]: {
            userId:
              typingUserId,

            isTyping: true,

            timestamp:
              Date.now(),
          },
        })
      );
    };

    /* ========================================================
       CHAT CLOSED
    ======================================================== */

    const handleChatClosed = (
      payload
    ) => {
      if (!payload) return;

      const conversationId =
        payload.conversationId ||
        payload.conversation_id ||
        payload.conversation?.id;

      if (!conversationId) return;

      setTypingUsers(
        (previous) => {
          const next = {
            ...previous,
          };

          delete next[
            conversationId
          ];

          return next;
        }
      );
    };

    /* ========================================================
       REGISTER LISTENERS
    ======================================================== */

    socketInstance.on(
      'connect',
      handleConnect
    );

    socketInstance.on(
      'disconnect',
      handleDisconnect
    );

    socketInstance.on(
      'connect_error',
      handleConnectError
    );

    socketInstance.on(
      'users:online',
      handleOnlineUsers
    );

    socketInstance.on(
      'notification:new',
      handleNewNotification
    );

    socketInstance.on(
      'chat:message',
      handleChatMessage
    );

    socketInstance.on(
      'chat:message:sent',
      handleSentChatMessage
    );

    socketInstance.on(
      'chat:typing',
      handleTyping
    );

    socketInstance.on(
      'chat:closed',
      handleChatClosed
    );

    /* ========================================================
       CLEANUP
    ======================================================== */

    return () => {
      console.log(
        '[Socket] Cleaning up connection'
      );

      socketInstance.off(
        'connect',
        handleConnect
      );

      socketInstance.off(
        'disconnect',
        handleDisconnect
      );

      socketInstance.off(
        'connect_error',
        handleConnectError
      );

      socketInstance.off(
        'users:online',
        handleOnlineUsers
      );

      socketInstance.off(
        'notification:new',
        handleNewNotification
      );

      socketInstance.off(
        'chat:message',
        handleChatMessage
      );

      socketInstance.off(
        'chat:message:sent',
        handleSentChatMessage
      );

      socketInstance.off(
        'chat:typing',
        handleTyping
      );

      socketInstance.off(
        'chat:closed',
        handleChatClosed
      );

      socketInstance.disconnect();

      if (
        socketRef.current ===
        socketInstance
      ) {
        socketRef.current = null;
      }

      setSocket(null);
      setIsConnected(false);
    };
  }, [
    user,
    token,
    addChatMessage,
  ]);

  /* ==========================================================
     SEND CHAT MESSAGE

     IMPORTANT FIX:
     Wait for the backend ACK.

     The OLD version simply did:

       socket.emit(...)
       return true

     That meant ChatContext could think the message succeeded
     even when the server rejected it.

     This version waits for:

       {
         success: true,
         message: {...},
         conversation: {...}
       }
  ========================================================== */

  const sendChatMessage =
    useCallback(
      (
        conversationId,
        message
      ) => {
        return new Promise(
          (resolve, reject) => {
            const text =
              String(
                message || ''
              ).trim();

            if (
              !conversationId
            ) {
              reject(
                new Error(
                  'Conversation ID is required'
                )
              );

              return;
            }

            if (!text) {
              reject(
                new Error(
                  'Message is required'
                )
              );

              return;
            }

            const currentSocket =
              socketRef.current;

            if (
              !currentSocket ||
              !currentSocket.connected
            ) {
              reject(
                new Error(
                  'Chat connection is not available'
                )
              );

              return;
            }

            console.log(
              '[Socket] Sending chat message:',
              {
                conversationId,
                message: text,
              }
            );

            currentSocket.emit(
              'chat:message',
              {
                conversationId,
                message: text,
              },
              (response) => {
                console.log(
                  '[Socket] Chat message ACK:',
                  response
                );

                if (
                  !response ||
                  response.success !==
                    true
                ) {
                  reject(
                    new Error(
                      response?.message ||
                        'Unable to send message'
                    )
                  );

                  return;
                }

                resolve(
                  response
                );
              }
            );
          }
        );
      },
      []
    );

  /* ==========================================================
     SEND TYPING
  ========================================================== */

  const sendTyping =
    useCallback(
      (
        conversationId,
        isTyping
      ) => {
        if (!conversationId) {
          return;
        }

        const currentSocket =
          socketRef.current;

        if (
          !currentSocket ||
          !currentSocket.connected
        ) {
          return;
        }

        currentSocket.emit(
          'chat:typing',
          {
            conversationId,
            isTyping:
              Boolean(isTyping),
          }
        );
      },
      []
    );

  /* ==========================================================
     MARK READ
  ========================================================== */

  const markConversationRead =
    useCallback(
      (
        conversationId,
        callback
      ) => {
        if (!conversationId) {
          return;
        }

        const currentSocket =
          socketRef.current;

        if (
          !currentSocket ||
          !currentSocket.connected
        ) {
          return;
        }

        currentSocket.emit(
          'chat:read',
          {
            conversationId,
          },
          (response) => {
            if (
              typeof callback ===
              'function'
            ) {
              callback(response);
            }
          }
        );
      },
      []
    );

  /* ==========================================================
     CLOSE
  ========================================================== */

  const closeConversation =
    useCallback(
      (
        conversationId,
        callback
      ) => {
        if (!conversationId) {
          return;
        }

        const currentSocket =
          socketRef.current;

        if (
          !currentSocket ||
          !currentSocket.connected
        ) {
          return;
        }

        currentSocket.emit(
          'chat:close',
          {
            conversationId,
          },
          (response) => {
            if (
              typeof callback ===
              'function'
            ) {
              callback(response);
            }
          }
        );
      },
      []
    );

  /* ==========================================================
     GET MESSAGES
  ========================================================== */

  const getMessages =
    useCallback(
      (conversationId) => {
        if (!conversationId) {
          return [];
        }

        return (
          chatMessages[
            conversationId
          ] || []
        );
      },
      [chatMessages]
    );

  /* ==========================================================
     GET TYPING USER
  ========================================================== */

  const getTypingUser =
    useCallback(
      (conversationId) => {
        if (!conversationId) {
          return null;
        }

        const typing =
          typingUsers[
            conversationId
          ];

        if (!typing?.isTyping) {
          return null;
        }

        if (
          typing.timestamp &&
          Date.now() -
            typing.timestamp >
            5000
        ) {
          return null;
        }

        return typing;
      },
      [typingUsers]
    );

  /* ==========================================================
     ONLINE CHECK
  ========================================================== */

  const isUserOnline =
    useCallback(
      (userId) => {
        if (!userId) return false;

        return onlineUsers.some(
          (item) => {
            const id =
              typeof item ===
              'object'
                ? item.id ||
                  item.userId ||
                  item.user_id
                : item;

            return (
              String(id) ===
              String(userId)
            );
          }
        );
      },
      [onlineUsers]
    );

  /* ==========================================================
     NOTIFICATION READ
  ========================================================== */

  const markNotificationRead =
    useCallback(
      (notificationId) => {
        if (!notificationId) {
          return;
        }

        setNotifications(
          (previous) =>
            previous.map(
              (notification) =>
                notification.id ===
                notificationId
                  ? {
                      ...notification,
                      is_read: true,
                      read: true,
                    }
                  : notification
            )
        );

        const currentSocket =
          socketRef.current;

        if (
          currentSocket &&
          currentSocket.connected
        ) {
          currentSocket.emit(
            'notification:read',
            {
              notificationId,
            }
          );
        }
      },
      []
    );

  /* ==========================================================
     CLEAR CHAT MESSAGES
  ========================================================== */

  const clearChatMessages =
    useCallback(
      (conversationId) => {
        if (!conversationId) {
          return;
        }

        setChatMessages(
          (previous) => {
            const next = {
              ...previous,
            };

            delete next[
              conversationId
            ];

            return next;
          }
        );
      },
      []
    );

  /* ==========================================================
     CLEAR CHAT CACHE
  ========================================================== */

  const clearChatCache =
    useCallback(() => {
      setChatMessages({});
      setTypingUsers({});
    }, []);

  /* ==========================================================
     MANUAL MESSAGE INSERT
  ========================================================== */

  const addMessage =
    useCallback(
      (
        conversationId,
        message
      ) => {
        addChatMessage(
          conversationId,
          message
        );
      },
      [addChatMessage]
    );

  /* ==========================================================
     CONTEXT VALUE
  ========================================================== */

  const value = useMemo(
    () => ({
      socket,

      isConnected,

      connectionError,

      onlineUsers,

      isUserOnline,

      notifications,

      setNotifications,

      markNotificationRead,

      chatMessages,

      typingUsers,

      getMessages,

      getTypingUser,

      addMessage,

      addChatMessage,

      clearChatMessages,

      clearChatCache,

      sendChatMessage,

      sendTyping,

      markConversationRead,

      closeConversation,

      getMessageId,
    }),
    [
      socket,

      isConnected,

      connectionError,

      onlineUsers,

      isUserOnline,

      notifications,

      markNotificationRead,

      chatMessages,

      typingUsers,

      getMessages,

      getTypingUser,

      addMessage,

      addChatMessage,

      clearChatMessages,

      clearChatCache,

      sendChatMessage,

      sendTyping,

      markConversationRead,

      closeConversation,
    ]
  );

  return (
    <SocketContext.Provider
      value={value}
    >
      {children}
    </SocketContext.Provider>
  );
};

/* ============================================================
   HOOK
============================================================ */

export const useSocket = () => {
  const context =
    useContext(SocketContext);

  if (!context) {
    throw new Error(
      'useSocket must be used inside a SocketProvider'
    );
  }

  return context;
};

export default SocketContext;