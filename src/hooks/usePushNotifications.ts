/**
 * Virtual Museum Tapper Game — usePushNotifications Hook
 * Manages push notification scheduling and delivery
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  ALL_NOTIFICATION_TEMPLATES,
  shouldSendNotification,
  processTemplate,
} from '../data/notificationTemplates';
import type { GameState } from '../types/game';

interface NotificationState {
  id: string;
  title: string;
  body: string;
  icon?: string;
  actionUrl?: string;
  actionText?: string;
  timestamp: number;
  read: boolean;
}

interface UsePushNotificationsReturn {
  notifications: NotificationState[];
  unreadCount: number;
  permissionStatus: NotificationPermission | 'unsupported';
  requestPermission: () => Promise<boolean>;
  sendLocalNotification: (notification: Omit<NotificationState, 'timestamp' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  scheduleNotification: (templateId: string, delayMs: number) => void;
  cancelScheduledNotification: (templateId: string) => void;
  processGameStateForNotifications: (gameState: GameState) => void;
}

const STORAGE_KEY = 'push_notification_state';
const MAX_NOTIFICATIONS = 50;

function getStoredState(): { notifications: NotificationState[]; preferences: Record<string, boolean> } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load notification state:', e);
  }
  return { notifications: [], preferences: {} };
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationState[]>([]);
  const [preferences] = useState<Record<string, boolean>>(() => {
    const state = getStoredState();
    return state.preferences;
  });
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>(() => {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  });
  
  const scheduledTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // Load saved notifications
  useEffect(() => {
    const state = getStoredState();
    setNotifications(state.notifications);
    
    // Clean old notifications (older than 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const filtered = state.notifications.filter(n => n.timestamp > sevenDaysAgo);
    
    if (filtered.length !== state.notifications.length) {
      setNotifications(filtered);
    }
  }, []);
  
  // Save notifications when they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ notifications, preferences }));
    } catch (e) {
      console.error('Failed to save notification state:', e);
    }
  }, [notifications, preferences]);
  
  /**
   * Request notification permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      setPermissionStatus('unsupported');
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      return permission === 'granted';
    } catch (e) {
      console.error('Failed to request notification permission:', e);
      return false;
    }
  }, []);
  
  /**
   * Send a local (in-app) notification
   */
  const sendLocalNotification = useCallback((
    notification: Omit<NotificationState, 'timestamp' | 'read'>
  ) => {
    const newNotification: NotificationState = {
      ...notification,
      timestamp: Date.now(),
      read: false,
    };
    
    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // Keep only the most recent notifications
      return updated.slice(0, MAX_NOTIFICATIONS);
    });
    
    // Also send browser notification if permission granted
    if (permissionStatus === 'granted' && Notification.permission === 'granted') {
      try {
        const browserNotification = new Notification(notification.title, {
          body: notification.body,
          icon: notification.icon || '/icon.png',
          tag: notification.id,
        });
        
        browserNotification.onclick = () => {
          if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
          }
          browserNotification.close();
        };
        
        // Auto-close after 10 seconds
        setTimeout(() => {
          browserNotification.close();
        }, 10000);
      } catch (e) {
        console.error('Failed to send browser notification:', e);
      }
    }
  }, [permissionStatus]);
  
  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  }, []);
  
  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);
  
  /**
   * Clear a specific notification
   */
  const clearNotification = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.filter(n => n.id !== notificationId)
    );
  }, []);
  
  /**
   * Clear all notifications
   */
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);
  
  /**
   * Schedule a notification for later
   */
  const scheduleNotification = useCallback((templateId: string, delayMs: number) => {
    // Cancel any existing scheduled notification with this ID
    const existingTimer = scheduledTimersRef.current.get(templateId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    const timer = setTimeout(() => {
      const template = ALL_NOTIFICATION_TEMPLATES.find(t => t.id === templateId);
      if (!template) return;
      
      // Process template with default player data
      const processed = processTemplate(template, {});
      
      sendLocalNotification({
        id: `scheduled_${templateId}_${Date.now()}`,
        title: processed.title,
        body: processed.body,
        icon: template.imageUrl,
        actionUrl: processed.actionUrl,
        actionText: processed.actionText,
      });
      
      scheduledTimersRef.current.delete(templateId);
    }, delayMs);
    
    scheduledTimersRef.current.set(templateId, timer);
  }, [sendLocalNotification]);
  
  /**
   * Cancel a scheduled notification
   */
  const cancelScheduledNotification = useCallback((templateId: string) => {
    const timer = scheduledTimersRef.current.get(templateId);
    if (timer) {
      clearTimeout(timer);
      scheduledTimersRef.current.delete(templateId);
    }
  }, []);
  
  /**
   * Process game state to check for triggered notifications
   */
  const processGameStateForNotifications = useCallback((gameState: GameState) => {
    // Build player state for condition checking
    const playerState = {
      streak: gameState.dailyStreak,
      lastSessionAt: gameState.lastOnlineAt ? new Date(gameState.lastOnlineAt).toISOString() : undefined,
      isPaying: gameState.prestigeLevel > 0,
      level: gameState.level,
      prestigeLevel: gameState.prestigeLevel,
    };
    
    // Check all triggered notification templates
    const triggeredTemplates = ALL_NOTIFICATION_TEMPLATES.filter(template => {
      if (!template.isEnabled) return false;
      if (template.scheduling?.type !== 'triggered') return false;
      
      return shouldSendNotification(template, playerState);
    });
    
    // Send notifications for triggered templates
    for (const template of triggeredTemplates) {
      const processed = processTemplate(template, {
        streak: gameState.dailyStreak,
        level: gameState.level,
      });
      
      sendLocalNotification({
        id: `triggered_${template.id}_${Date.now()}`,
        title: processed.title,
        body: processed.body,
        icon: template.imageUrl,
        actionUrl: processed.actionUrl,
        actionText: processed.actionText,
      });
    }
  }, [sendLocalNotification]);
  
  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all scheduled timers
      for (const timer of scheduledTimersRef.current.values()) {
        clearTimeout(timer);
      }
      scheduledTimersRef.current.clear();
    };
  }, []);
  
  return {
    notifications,
    unreadCount,
    permissionStatus,
    requestPermission,
    sendLocalNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    scheduleNotification,
    cancelScheduledNotification,
    processGameStateForNotifications,
  };
}

export default usePushNotifications;
