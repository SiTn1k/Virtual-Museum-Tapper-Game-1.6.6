/**
 * Virtual Museum Tapper Game — Achievement Notification Toast
 * Shows toast notification when achievements are unlocked
 */

import React, { useEffect, useState } from 'react';
import type { AchievementDef } from '../types/liveops';

interface AchievementNotificationProps {
  achievement: AchievementDef;
  onClose: () => void;
  autoCloseMs?: number;
  language?: 'ua' | 'en';
}

const RARITY_GLOW: Record<string, string> = {
  common: 'from-gray-600 to-gray-700',
  rare: 'from-blue-600 to-blue-700',
  epic: 'from-purple-600 to-purple-700',
  legendary: 'from-yellow-500 to-orange-500',
};

const RARITY_BORDER: Record<string, string> = {
  common: 'border-gray-500',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-yellow-400',
};

function formatReward(reward: AchievementDef['reward']): string {
  switch (reward.type) {
    case 'currency':
      return `+${reward.amount?.toLocaleString() || 0} 💰`;
    case 'xp':
      return `+${reward.amount?.toLocaleString() || 0} XP`;
    case 'artifact_fragment':
      return `+${reward.amount || 0} 🧩`;
    case 'cosmetic':
      return `🎨 ${reward.cosmeticId}`;
    default:
      return '🎁';
  }
}

export function AchievementNotification({ 
  achievement, 
  onClose, 
  autoCloseMs = 5000,
  language = 'ua' 
}: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  
  const lang = language as 'ua' | 'en';
  const rarity = achievement.reward.rarity || 'common';
  
  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
    
    // Auto close timer
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / autoCloseMs) * 100);
      setProgress(remaining);
      
      if (elapsed >= autoCloseMs) {
        clearInterval(interval);
        handleClose();
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [autoCloseMs]);
  
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation
  };
  
  return (
    <div 
      className={`fixed top-4 right-4 z-[100] transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div 
        className={`
          relative w-80 bg-gradient-to-br ${RARITY_GLOW[rarity]} 
          ${RARITY_BORDER[rarity]} border-2 rounded-xl shadow-2xl overflow-hidden
        `}
      >
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-900/50">
          <div 
            className={`h-full transition-all duration-100 ${
              rarity === 'legendary' ? 'bg-yellow-400' :
              rarity === 'epic' ? 'bg-purple-400' :
              rarity === 'rare' ? 'bg-blue-400' : 'bg-gray-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Content */}
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-yellow-300 uppercase tracking-wider">
              Achievement Unlocked!
            </span>
          </div>
          
          {/* Main */}
          <div className="flex items-center gap-3">
            <div className={`text-4xl ${progress < 50 ? 'animate-bounce' : ''}`}>
              {achievement.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg leading-tight">
                {achievement.name[lang]}
              </h3>
              <p className="text-gray-300 text-sm mt-0.5">
                {achievement.description[lang]}
              </p>
            </div>
          </div>
          
          {/* Reward */}
          <div className="mt-3 pt-3 border-t border-white/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Reward:</span>
              <span className={`font-bold text-lg ${
                rarity === 'legendary' ? 'text-yellow-300' :
                rarity === 'epic' ? 'text-purple-300' :
                rarity === 'rare' ? 'text-blue-300' : 'text-gray-200'
              }`}>
                {formatReward(achievement.reward)}
              </span>
            </div>
          </div>
          
          {/* Close button */}
          <button 
            onClick={handleClose}
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center
                       text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

interface AchievementNotificationStackProps {
  notifications: Array<{
    achievement: AchievementDef;
    id: string;
  }>;
  onDismiss: (id: string) => void;
  language?: 'ua' | 'en';
}

export function AchievementNotificationStack({ 
  notifications, 
  onDismiss,
  language = 'ua' 
}: AchievementNotificationStackProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3">
      {notifications.map((notification, index) => (
        <div 
          key={notification.id}
          style={{ transform: `translateY(${index * 10}px)` }}
        >
          <AchievementNotification
            achievement={notification.achievement}
            onClose={() => onDismiss(notification.id)}
            language={language}
          />
        </div>
      ))}
    </div>
  );
}

export default AchievementNotification;
