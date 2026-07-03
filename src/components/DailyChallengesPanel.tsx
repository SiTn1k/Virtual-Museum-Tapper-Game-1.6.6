/**
 * Virtual Museum Tapper Game — Daily Challenges Panel
 * Displays daily and weekly rotating challenges
 */

import React, { useState } from 'react';
import type { MissionDef, PlayerMissionState } from '../types/liveops';

interface DailyChallenge {
  task: MissionDef;
  state: PlayerMissionState;
  progress: number;
  progressPercent: number;
  isComplete: boolean;
  isWeekly: boolean;
}

interface DailyChallengesPanelProps {
  dailyChallenges: DailyChallenge[];
  weeklyChallenges: DailyChallenge[];
  onClaim: (challengeId: string) => boolean;
  onRefresh?: () => void;
  language?: 'ua' | 'en';
}

function formatReward(reward: MissionDef['reward']): string {
  if (reward.currency) return `${reward.currency} 💰`;
  if (reward.xp) return `${reward.xp} XP`;
  if (reward.gachaTicket) return '🎫 Gacha Ticket';
  if (reward.booster) return `⚡ ${reward.booster.type}`;
  return '🎁';
}

function ChallengeCard({ 
  challenge, 
  onClaim,
  language = 'ua' 
}: { 
  challenge: DailyChallenge;
  onClaim: (id: string) => void;
  language?: 'ua' | 'en';
}) {
  const { task, progressPercent, isComplete, isWeekly } = challenge;
  const lang = language as 'ua' | 'en';
  
  const handleClaim = () => {
    if (isComplete && !challenge.state.claimed) {
      onClaim(challenge.state.missionId);
    }
  };
  
  return (
    <div className={`
      relative rounded-lg p-4 transition-all
      ${isComplete 
        ? challenge.state.claimed 
          ? 'bg-gray-800/50 border border-gray-700' 
          : 'bg-gradient-to-r from-green-900/40 to-green-800/20 border border-green-600/50 cursor-pointer hover:from-green-900/60'
        : 'bg-gray-800/50 border border-gray-700'
      }
    `}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`
          w-12 h-12 rounded-lg flex items-center justify-center text-2xl
          ${isComplete ? 'bg-green-900/50' : 'bg-gray-700/50'}
        `}>
          {task.icon}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold ${
              isComplete ? 'text-green-400' : 'text-white'
            }`}>
              {task.name[lang]}
            </h3>
            {isWeekly && (
              <span className="text-xs px-2 py-0.5 bg-purple-900/50 text-purple-300 rounded-full">
                Weekly
              </span>
            )}
          </div>
          
          <p className="text-gray-400 text-sm mt-0.5">
            {task.description[lang]}
          </p>
          
          {/* Progress */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{progressPercent}%</span>
              <span>{task.target.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  isComplete 
                    ? 'bg-gradient-to-r from-green-500 to-green-400' 
                    : 'bg-gradient-to-r from-blue-600 to-blue-400'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Reward & Claim */}
        <div className="flex flex-col items-end gap-2">
          <div className={`
            px-3 py-1 rounded-lg text-sm font-medium
            ${isComplete 
              ? 'bg-green-900/50 text-green-300' 
              : 'bg-gray-700/50 text-gray-300'
            }
          `}>
            {formatReward(task.reward)}
          </div>
          
          {isComplete && !challenge.state.claimed && (
            <button
              onClick={handleClaim}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold 
                         text-sm transition-all transform hover:scale-105 active:scale-95"
            >
              Claim
            </button>
          )}
          
          {challenge.state.claimed && (
            <div className="px-4 py-2 bg-gray-700 text-gray-500 rounded-lg text-sm font-medium">
              ✓ Claimed
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DailyChallengesPanel({
  dailyChallenges,
  weeklyChallenges,
  onClaim,
  onRefresh,
  language = 'ua'
}: DailyChallengesPanelProps) {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');
  
  const lang = language as 'ua' | 'en';
  
  const completedDaily = dailyChallenges.filter(c => c.isComplete && !c.state.claimed).length;
  const completedWeekly = weeklyChallenges.filter(c => c.isComplete && !c.state.claimed).length;
  
  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'daily'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Daily ({completedDaily}/{dailyChallenges.length})
        </button>
        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'weekly'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Weekly ({completedWeekly}/{weeklyChallenges.length})
        </button>
      </div>
      
      {/* Daily challenges */}
      {activeTab === 'daily' && (
        <div className="space-y-3">
          {dailyChallenges.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-4xl mb-4">📋</p>
              <p>No daily challenges available</p>
            </div>
          ) : (
            dailyChallenges.map(challenge => (
              <ChallengeCard
                key={challenge.state.missionId}
                challenge={challenge}
                onClaim={onClaim}
                language={lang}
              />
            ))
          )}
          
          {/* Reset timer */}
          <div className="text-center text-sm text-gray-500 mt-4">
            Resets at midnight UTC
          </div>
        </div>
      )}
      
      {/* Weekly challenges */}
      {activeTab === 'weekly' && (
        <div className="space-y-3">
          {weeklyChallenges.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-4xl mb-4">📅</p>
              <p>No weekly challenges available</p>
            </div>
          ) : (
            weeklyChallenges.map(challenge => (
              <ChallengeCard
                key={challenge.state.missionId}
                challenge={challenge}
                onClaim={onClaim}
                language={lang}
              />
            ))
          )}
          
          {/* Reset timer */}
          <div className="text-center text-sm text-gray-500 mt-4">
            Resets on Sunday UTC
          </div>
        </div>
      )}
      
      {/* Refresh button */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg text-sm transition-all"
        >
          🔄 Refresh Challenges
        </button>
      )}
    </div>
  );
}

export default DailyChallengesPanel;
