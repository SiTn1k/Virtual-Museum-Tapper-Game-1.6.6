/**
 * Virtual Museum Tapper Game — Collection Milestones Panel
 * Displays collection progress with milestone rewards
 */

import React, { useState, useMemo } from 'react';
import { ALL_MILESTONES, getMilestonesByType } from '../data/collectionMilestones';
import type { CollectionMilestone } from '../types/liveops';

interface MilestoneProgress {
  milestone: CollectionMilestone;
  isComplete: boolean;
  isClaimed: boolean;
  currentProgress: number;
  progressPercent: number;
}

interface CollectionMilestonesPanelProps {
  gameState: {
    completedArtifacts?: string[];
    unlockedEpochs?: string[];
    ownedGenerators?: Array<{ generatorId: string }>;
  };
  claimedMilestones: Set<string>;
  onClaim: (milestoneId: string) => boolean;
  language?: 'ua' | 'en';
}

type TabType = 'all' | CollectionMilestone['collectionType'];

const TABS: { key: TabType; labelUa: string; labelEn: string }[] = [
  { key: 'all', labelUa: 'Всі', labelEn: 'All' },
  { key: 'artifact', labelUa: 'Артефакти', labelEn: 'Artifacts' },
  { key: 'epoch', labelUa: 'Епохи', labelEn: 'Epochs' },
  { key: 'generator', labelUa: 'Генератори', labelEn: 'Generators' },
  { key: 'achievement', labelUa: 'Досягнення', labelEn: 'Achievements' },
];

const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
};

const RARITY_BG: Record<string, string> = {
  common: 'bg-gray-700/50',
  rare: 'bg-blue-900/50',
  epic: 'bg-purple-900/50',
  legendary: 'bg-yellow-900/50',
};

function formatReward(reward: CollectionMilestone['reward']): string {
  if (reward.type === 'currency') {
    return `${reward.amount?.toLocaleString() || 0} 💰`;
  }
  if (reward.type === 'artifact_fragment') {
    return `${reward.amount || 0} 🧩 (${reward.rarity || 'common'})`;
  }
  return '🎁';
}

function MilestoneCard({ 
  progress, 
  onClaim,
  language = 'ua'
}: { 
  progress: MilestoneProgress;
  onClaim: (id: string) => boolean;
  language?: 'ua' | 'en';
}) {
  const { milestone, isComplete, isClaimed, progressPercent, currentProgress } = progress;
  const lang = language as 'ua' | 'en';
  const rarity = milestone.reward.rarity || 'common';
  
  const canClaim = isComplete && !isClaimed;
  
  const handleClaim = () => {
    if (canClaim) {
      onClaim(milestone.id);
    }
  };
  
  return (
    <div className={`
      relative rounded-lg p-4 transition-all
      ${canClaim 
        ? 'bg-gradient-to-r from-green-900/40 to-green-800/20 border border-green-600/50 cursor-pointer hover:from-green-900/60' 
        : isClaimed 
          ? 'bg-gray-800/30 border border-gray-700/50 opacity-70'
          : 'bg-gray-800/50 border border-gray-700'
      }
    `}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`
          w-14 h-14 rounded-xl flex items-center justify-center text-3xl
          ${isClaimed ? 'bg-gray-700/50' : RARITY_BG[rarity]}
        `}>
          {milestone.icon}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-bold ${
              isClaimed ? 'text-gray-400' : isComplete ? 'text-green-400' : 'text-white'
            }`}>
              {milestone.name[lang]}
            </h3>
            {milestone.tier && (
              <span className={`
                text-xs px-2 py-0.5 rounded-full font-medium
                ${rarity === 'legendary' ? 'bg-yellow-900/50 text-yellow-400' :
                  rarity === 'epic' ? 'bg-purple-900/50 text-purple-400' :
                  rarity === 'rare' ? 'bg-blue-900/50 text-blue-400' :
                  'bg-gray-700/50 text-gray-400'}
              `}>
                Tier {milestone.tier}
              </span>
            )}
          </div>
          
          <p className="text-gray-400 text-sm mt-1">
            {milestone.description[lang]}
          </p>
          
          {/* Progress */}
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">
                {currentProgress} / {milestone.target}
              </span>
              <span className={progressPercent >= 100 ? 'text-green-400' : 'text-gray-500'}>
                {progressPercent}%
              </span>
            </div>
            <div className="h-2.5 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  isClaimed
                    ? 'bg-gray-600'
                    : progressPercent >= 100
                      ? 'bg-gradient-to-r from-green-500 to-green-400'
                      : 'bg-gradient-to-r from-blue-600 to-blue-400'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Reward */}
        <div className="flex flex-col items-end gap-2">
          <div className={`
            px-3 py-1.5 rounded-lg text-sm font-semibold
            ${isClaimed ? 'bg-gray-700/50 text-gray-500' : RARITY_BG[rarity]}
          `}>
            <span className={RARITY_COLORS[rarity]}>
              {formatReward(milestone.reward)}
            </span>
          </div>
          
          {canClaim && (
            <button
              onClick={handleClaim}
              className="px-5 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold 
                         text-sm transition-all transform hover:scale-105 active:scale-95 shadow-lg"
            >
              CLAIM
            </button>
          )}
          
          {isClaimed && (
            <div className="px-4 py-2 bg-green-900/30 text-green-500 rounded-lg text-sm font-medium">
              ✓ Earned
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CollectionMilestonesPanel({
  gameState,
  claimedMilestones,
  onClaim,
  language = 'ua'
}: CollectionMilestonesPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('artifact');
  
  const lang = language as 'ua' | 'en';
  
  // Calculate current counts
  const currentCounts = useMemo(() => ({
    artifact: gameState.completedArtifacts?.length || 0,
    epoch: gameState.unlockedEpochs?.length || 0,
    generator: gameState.ownedGenerators?.length || 0,
    achievement: 0, // Would come from achievements hook
    season: 0, // Would come from seasons hook
  }), [gameState]);
  
  // Build milestones with current progress
  const milestonesWithProgress = useMemo(() => {
    const types: CollectionMilestone['collectionType'][] = ['artifact', 'epoch', 'generator', 'achievement', 'season'];
    
    const result: Record<string, MilestoneProgress[]> = {};
    
    for (const type of types) {
      const milestones = getMilestonesByType(type);
      result[type] = milestones.map(milestone => {
        const currentCount = currentCounts[type];
        const isComplete = currentCount >= milestone.target;
        const isClaimed = claimedMilestones.has(milestone.id);
        const progressPercent = Math.min(100, Math.round((currentCount / milestone.target) * 100));
        
        return {
          milestone,
          isComplete,
          isClaimed,
          currentProgress: Math.min(currentCount, milestone.target),
          progressPercent,
        };
      });
    }
    
    return result;
  }, [currentCounts, claimedMilestones]);
  
  // All milestones with progress
  const allMilestones = useMemo(() => {
    const all: MilestoneProgress[] = [];
    for (const type of ['artifact', 'epoch', 'generator', 'achievement', 'season'] as const) {
      all.push(...milestonesWithProgress[type]);
    }
    return all;
  }, [milestonesWithProgress]);
  
  // Filtered milestones
  const filteredMilestones = useMemo(() => {
    if (activeTab === 'all') return allMilestones;
    return milestonesWithProgress[activeTab] || [];
  }, [activeTab, allMilestones, milestonesWithProgress]);
  
  // Sort: unclaimed complete first, then by tier
  const sortedMilestones = useMemo(() => {
    return [...filteredMilestones].sort((a, b) => {
      // Complete and unclaimed first
      if (a.isComplete && !a.isClaimed && !b.isComplete) return -1;
      if (b.isComplete && !b.isClaimed && !a.isComplete) return 1;
      
      // Then complete and claimed
      if (a.isComplete && a.isClaimed && !b.isComplete) return 1;
      if (b.isComplete && b.isClaimed && !a.isComplete) return -1;
      
      // Then by tier
      return (a.milestone.tier || 0) - (b.milestone.tier || 0);
    });
  }, [filteredMilestones]);
  
  // Stats
  const completedCount = allMilestones.filter(m => m.isComplete && !m.isClaimed).length;
  const totalCount = allMilestones.length;
  const earnedCount = allMilestones.filter(m => m.isClaimed).length;
  
  return (
    <div className="space-y-4">
      {/* Stats header */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{completedCount}</p>
          <p className="text-xs text-gray-500">Ready</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-yellow-400">{earnedCount}</p>
          <p className="text-xs text-gray-500">Earned</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-400">{totalCount}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {tab.labelUa}
          </button>
        ))}
      </div>
      
      {/* Milestones list */}
      <div className="space-y-3">
        {sortedMilestones.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-4xl mb-4">🏛️</p>
            <p>No milestones available</p>
          </div>
        ) : (
          sortedMilestones.map(progress => (
            <MilestoneCard
              key={progress.milestone.id}
              progress={progress}
              onClaim={onClaim}
              language={lang}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default CollectionMilestonesPanel;
