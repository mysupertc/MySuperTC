import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { EmailHistory } from '@/api/entities';
import { User } from '@/api/entities';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [lastEmailCheck, setLastEmailCheck] = useState(Date.now());
  const [user, setUser] = useState(null);
  const [emailUpdateTrigger, setEmailUpdateTrigger] = useState(0);

  // Check for user and Gmail connection status
  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
    };
    checkUser();
  }, []);

  // Polling function to check for new emails
  const checkForNewEmails = useCallback(async () => {
    if (!user?.is_gmail_connected || !user?.is_gmail_sync_enabled) return;

    try {
      // Get emails newer than our last check
      const recentEmails = await EmailHistory.filter(
        { direction: 'received' },
        '-created_date',
        10
      );

      // Filter to only emails that arrived since our last check
      const newEmails = recentEmails.filter(email => {
        const emailTime = new Date(email.created_date).getTime();
        return emailTime > lastEmailCheck;
      });

      if (newEmails.length > 0) {
        // Add notifications for new emails
        const newNotifications = newEmails.map(email => ({
          id: `email-${email.id}`,
          type: 'email',
          title: 'New Email Received',
          message: `From: ${email.from_address}\nSubject: ${email.subject}`,
          email: email,
          timestamp: Date.now(),
          read: false
        }));

        setNotifications(prev => [...newNotifications, ...prev].slice(0, 20)); // Keep max 20 notifications
        setEmailUpdateTrigger(prev => prev + 1); // Trigger email refresh across components
      }

      setLastEmailCheck(Date.now());
    } catch (error) {
      console.error('Error checking for new emails:', error);
    }
  }, [user, lastEmailCheck]);

  // Set up polling interval
  useEffect(() => {
    if (!user?.is_gmail_connected || !user?.is_gmail_sync_enabled) return;

    const interval = setInterval(checkForNewEmails, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, [checkForNewEmails, user]);

  // Function to mark notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  }, []);

  // Function to dismiss notification
  const dismissNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  }, []);

  // Function to clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Function to manually trigger email refresh (for components to call)
  const triggerEmailRefresh = useCallback(() => {
    setEmailUpdateTrigger(prev => prev + 1);
  }, []);

  const value = {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    markAsRead,
    dismissNotification,
    clearAllNotifications,
    triggerEmailRefresh,
    emailUpdateTrigger // Components can watch this to auto-refresh
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}