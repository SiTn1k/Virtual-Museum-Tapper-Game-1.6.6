/**
 * Virtual Museum Tapper Game — Notification Panel
 * Displays notification history and settings
 */

import React, { useState } from 'react';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
}

interface NotificationPanelProps {
  notifications: NotificationItem[];
  permissionStatus: NotificationPermission | 'unsupported';
  onRequestPermission: () => Promise<boolean>;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotification: (id: string) => void;
  onClearAll: () => void;
  language?: 'ua' | 'en';
}

function formatTimestamp(timestamp: number, lang: 'ua' | 'en' = 'ua'): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  // Less than 1 minute
  if (diff < 60 * 1000) {
    return lang === 'ua' ? 'Щойно' : 'Just now';
  }
  
  // Less than 1 hour
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return lang === 'ua' ? `${minutes} хв. тому` : `${minutes}m ago`;
  }
  
  // Less than 24 hours
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return lang === 'ua' ? `${hours} год. тому` : `${hours}h ago`;
  }
  
  // Less than 7 days
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return lang === 'ua' ? `${days} дн. тому` : `${days}d ago`;
  }
  
  // Default to date
  return new Date(timestamp).toLocaleDateString(lang === 'ua' ? 'uk-UA' : 'en-US');
}

export function NotificationPanel({
  notifications,
  permissionStatus,
  onRequestPermission,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotification,
  onClearAll,
  language = 'ua'
}: NotificationPanelProps) {
  const [showSettings, setShowSettings] = useState(false);
  
  const lang = language as 'ua' | 'en';
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              🔔 Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
                  {unreadCount}
                </span>
              )}
            </h2>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm rounded-lg transition-all"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm rounded-lg transition-all"
            >
              ⚙️
            </button>
          </div>
        </div>
      </div>
      
      {/* Settings panel */}
      {showSettings && (
        <div className="p-4 border-b border-gray-800 bg-gray-800/50">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Notification Settings
          </h3>
          
          <div className="space-y-3">
            {permissionStatus === 'unsupported' ? (
              <div className="text-sm text-gray-500">
                Notifications are not supported in this browser
              </div>
            ) : permissionStatus === 'denied' ? (
              <div className="text-sm text-yellow-500">
                Notifications blocked. Please enable in browser settings.
              </div>
            ) : permissionStatus === 'default' ? (
              <button
                onClick={onRequestPermission}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-all"
              >
                Enable Browser Notifications
              </button>
            ) : (
              <div className="text-sm text-green-500 flex items-center gap-2">
                <span>✓</span> Browser notifications enabled
              </div>
            )}
            
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="w-full py-2 bg-red-900/50 hover:bg-red-900/70 text-red-400 rounded-lg text-sm transition-all"
              >
                Clear All Notifications
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Notification list */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="text-5xl mb-4">🔔</p>
            <p className="text-lg font-medium">No notifications</p>
            <p className="text-sm mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-800/50 transition-all cursor-pointer ${
                  !notification.read ? 'bg-blue-900/10 border-l-2 border-blue-500' : ''
                }`}
                onClick={() => !notification.read && onMarkAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                      <h3 className={`font-semibold truncate ${
                        notification.read ? 'text-gray-400' : 'text-white'
                      }`}>
                        {notification.title}
                      </h3>
                    </div>
                    <p className={`text-sm mt-1 ${
                      notification.read ? 'text-gray-500' : 'text-gray-300'
                    }`}>
                      {notification.body}
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      {formatTimestamp(notification.timestamp, lang)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearNotification(notification.id);
                    }}
                    className="text-gray-600 hover:text-gray-400 p-1 transition-all"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationPanel;
