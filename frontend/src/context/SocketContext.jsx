import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token || !user) return;

    const socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    // Socket event listeners
    socketInstance.on('connect', () => {
      console.log('🔌 Socket connected');
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });

    socketInstance.on('users:online', (onlineIds) => {
      setOnlineUsers(onlineIds);
    });

    socketInstance.on('notification:new', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      toast.info(notification.title, {
        description: notification.message,
      });
    });

    // Cleanup
    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [token, user]);

  const markNotificationRead = (notificationId) => {
    if (socketRef.current) {
      socketRef.current.emit('notification:read', notificationId);
    }
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const sendMessage = (toUserId, message) => {
    if (socketRef.current) {
      socketRef.current.emit('chat:message', { toUserId, message });
    }
  };

  const sendTyping = (toUserId) => {
    if (socketRef.current) {
      socketRef.current.emit('chat:typing', { toUserId });
    }
  };

  const value = {
    socket,
    onlineUsers,
    notifications,
    setNotifications,
    markNotificationRead,
    sendMessage,
    sendTyping,
    isUserOnline: (userId) => onlineUsers.includes(userId),
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};