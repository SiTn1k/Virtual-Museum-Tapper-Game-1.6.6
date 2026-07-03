/**
 * Virtual Museum Tapper Game — Achievement Modal
 * Displays all achievements with progress tracking
 */

import React, { useState, useMemo } from 'react';
import { ALL_ACHIEVEMENTS, getAchievementStats } from '../data/achievements';
import type { AchievementDef, AchievementCategory } from '../types/liveops';
import type { AchievementProgress } from '../hooks/useAchievements';

interface AchievementModalProps {
  achievements: AchievementProgress[];
  isOpen: boolean;
  onClose: () => void;
  language?: 'ua' | 'en';
}

type TabType = 'all' | AchievementCategory;

const CATEGORY_TABS: { key: TabType; labelUa: string; labelEn: string; icon: string }[] = [
  { key: 'all', labelUa: 'Всі', labelEn: 'All', icon: '🏆' },
  { key: 'progression', labelUa: 'Прогресія', labelEn: 'Progression', icon: '📈' },
  { key: 'combat', labelUa: 'Тапання', labelEn: 'Tapping', icon: '👆' },
  { key: 'economy', labelUa: 'Економіка', labelEn: 'Economy', icon: '💰' },
  { key: 'collection', labelUa: 'Колекція', labelEn: 'Collection', icon: '📦' },
  { key: 'engagement', labelUa: 'Активність', labelEn: 'Engagement', icon: '🔥' },
  { key: 'social', labelUa: 'Соціал', labelEn: 'Social', icon: '👥' },
  { key: 'special', labelUa: 'Секрети', labelEn: 'Special', icon: '❓' },
];

const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
};

function formatReward(reward: AchievementDef['reward']): string {
  switch (reward.type) {
    case 'currency':
      return `${reward.amount?.toLocaleString() || 0} 💰`;
    case 'xp':
      return `${reward.amount?.toLocaleString() || 0} XP`;
    case 'artifact_fragment':
      return `${reward.amount || 0} 🧩 (${reward.rarity || 'common'})`;
    case 'cosmetic':
      return `🎨 ${reward.cosmeticId}`;
    default:
      return '🎁';
  }
}

function AchievementCard({ progress, language = 'ua' }: { 
  progress: AchievementProgress; 
  language?: 'ua' | 'en';
}) {
  const { achievement, state, isComplete, canEarn, progressPercent } = progress;
  const [expanded, setExpanded] = useState(false);
  
  const lang = language as 'ua' | 'en';
  const isSecret = achievement.isSecret && !isComplete;
  
  // Hide secret achievements until earned
  if (isSecret) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-4 opacity-60">
        <div className="flex items-center gap-3">
          <div className="text-3xl">❓</div>
          <div>
            <p className="text-gray-400 font-medium">???</p>
            <p className="text-gray-500 text-sm">Невідоме досягнення</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={`rounded-lg p-4 transition-all cursor-pointer ${
        isComplete 
          ? 'bg-gradient-to-r from-green-900/30 to-green-800/20 border border-green-700/50' 
          : canEarn 
            ? 'bg-gray-800/50 hover:bg-gray-800 border border-gray-700'
            : 'bg-gray-900/30 opacity-50 border border-gray-800'
      }`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`text-3xl ${isComplete ? 'animate-pulse' : ''}`}>
          {achievement.icon}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold truncate ${
              isComplete ? 'text-green-400' : 'text-white'
            }`}>
              {achievement.name[lang]}
            </h3>
            {achievement.limitedTime && (
              <span className="text-xs px-2 py-0.5 bg-orange-900/50 text-orange-400 rounded-full">
                ⏰ Limited
              </span>
            )}
          </div>
          
          <p className="text-gray-400 text-sm mt-1">
            {achievement.description[lang]}
          </p>
          
          {/* Progress bar */}
          {!isComplete && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{Math.round(progressPercent)}%</span>
                <span>{state.progress.toFixed(0)} / {achievement.requirement.target}</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Expanded details */}
          {expanded && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Reward</p>
                  <p className={`font-medium ${RARITY_COLORS[achievement.reward.rarity || 'common']}`}>
                    {formatReward(achievement.reward)}
                  </p>
                </div>
                {achievement.prerequisites && achievement.prerequisites.length > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Requires</p>
                    <p className="text-sm text-gray-400">
                      {achievement.prerequisites.length} achievements
                    </p>
                  </div>
                )}
              </div>
              
              {isComplete && state.earnedAt && (
                <p className="text-xs text-green-500 mt-2">
                  ✓ Earned: {new Date(state.earnedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* Status */}
        {isComplete && (
          <div className="text-green-400 text-xl">✓</div>
        )}
      </div>
    </div>
  );
}

export function AchievementModal({ 
  achievements, 
  isOpen, 
  onClose,
  language = 'ua' 
}: AchievementModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  
  const lang = language as 'ua' | 'en';
  
  // Filter achievements by tab
  const filteredAchievements = useMemo(() => {
    if (activeTab === 'all') return achievements;
    return achievements.filter(a => a.achievement.category === activeTab);
  }, [achievements, activeTab]);
  
  // Sort: completed first, then by progress
  const sortedAchievements = useMemo(() => {
    return [...filteredAchievements].sort((a, b) => {
      if (a.isComplete && !b.isComplete) return -1;
      if (!a.isComplete && b.isComplete) return 1;
      return b.progressPercent - a.progressPercent;
    });
  }, [filteredAchievements]);
  
  // Stats
  const completedCount = achievements.filter(a => a.isComplete).length;
  const totalCount = achievements.length;
  const completionPercent = Math.round((completedCount / totalCount) * 100);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                🏆 Achievements
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {completedCount} / {totalCount} completed ({completionPercent}%)
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
          
          {/* Overall progress bar */}
          <div className="mt-4 h-3 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 p-4 overflow-x-auto border-b border-gray-800">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.labelUa}</span>
            </button>
          ))}
        </div>
        
        {/* Achievement list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sortedAchievements.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-4">🎯</p>
              <p>No achievements in this category</p>
            </div>
          ) : (
            sortedAchievements.map(progress => (
              <AchievementCard 
                key={progress.achievement.id} 
                progress={progress}
                language={lang}
              />
            ))
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-800 text-center">
          <p className="text-gray-500 text-sm">
            Keep playing to unlock more achievements!
          </p>
        </div>
      </div>
    </div>
  );
}

export default AchievementModal;
