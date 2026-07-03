/**
 * Virtual Museum Tapper Game — Seasonal Events Panel
 * Displays active events, season battle pass, and event shop
 */

import React, { useState, useMemo } from 'react';
import type { EventConfig, PlayerSeasonState, SeasonConfig } from '../types/liveops';

interface SeasonalEventsPanelProps {
  activeEvents: Array<EventConfig & { timeRemaining: { days: number; hours: number; minutes: number; expired: boolean } }>;
  upcomingEvents: EventConfig[];
  currentSeason: SeasonConfig | null;
  seasonState: PlayerSeasonState | null;
  seasonProgress: {
    currentTier: number;
    xpInTier: number;
    xpToNextTier: number;
    progressPercent: number;
    premiumPurchased: boolean;
  };
  onClaimSeasonReward: (tier: number, isPremium: boolean) => boolean;
  onPurchasePremium: () => void;
  isWeekend: boolean;
  language?: 'ua' | 'en';
}

function formatTimeRemaining(remaining: { days: number; hours: number; minutes: number }): string {
  if (remaining.days > 0) {
    return `${remaining.days}d ${remaining.hours}h`;
  }
  if (remaining.hours > 0) {
    return `${remaining.hours}h ${remaining.minutes}m`;
  }
  return `${remaining.minutes}m`;
}

const EVENT_TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  weekend_bonus: { bg: 'bg-pink-900/30', border: 'border-pink-500/50', text: 'text-pink-400' },
  holiday: { bg: 'bg-red-900/30', border: 'border-red-500/50', text: 'text-red-400' },
  artifact_hunt: { bg: 'bg-purple-900/30', border: 'border-purple-500/50', text: 'text-purple-400' },
  seasonal: { bg: 'bg-blue-900/30', border: 'border-blue-500/50', text: 'text-blue-400' },
  marathon: { bg: 'bg-green-900/30', border: 'border-green-500/50', text: 'text-green-400' },
  flash_sale: { bg: 'bg-yellow-900/30', border: 'border-yellow-500/50', text: 'text-yellow-400' },
  community_goal: { bg: 'bg-cyan-900/30', border: 'border-cyan-500/50', text: 'text-cyan-400' },
  default: { bg: 'bg-gray-800/50', border: 'border-gray-600', text: 'text-gray-400' },
};

function EventCard({ event, language = 'ua' }: { 
  event: EventConfig & { timeRemaining: { days: number; hours: number; minutes: number } };
  language?: 'ua' | 'en';
}) {
  const lang = language as 'ua' | 'en';
  const colors = EVENT_TYPE_COLORS[event.type] || EVENT_TYPE_COLORS.default;
  
  const multipliers = event.rewardMultipliers;
  const multiplierText = Object.entries(multipliers)
    .map(([key, value]) => {
      if (key === 'currency') return `${value}x 💰`;
      if (key === 'xp') return `${value}x XP`;
      if (key === 'gacha_rate') return `+${((value - 1) * 100).toFixed(0)}% 🎁`;
      if (key === 'passive') return `${value}x ⚡`;
      return '';
    })
    .filter(Boolean)
    .join(' ');
  
  return (
    <div className={`rounded-xl p-4 ${colors.bg} border ${colors.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className={`font-bold text-lg ${colors.text}`}>
            {event.name[lang]}
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            {event.description[lang]}
          </p>
          
          {multiplierText && (
            <div className="flex flex-wrap gap-2 mt-3">
              {multiplierText.split(' ').filter(Boolean).map((part, i) => (
                <span key={i} className="px-2 py-1 bg-black/30 rounded text-sm font-medium text-white">
                  {part}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="text-right">
          <div className={`px-3 py-1 rounded-full text-sm font-bold ${colors.bg} ${colors.text}`}>
            ⏰ {formatTimeRemaining(event.timeRemaining)}
          </div>
        </div>
      </div>
    </div>
  );
}

function SeasonRewardCard({
  tier,
  season,
  seasonState,
  onClaim,
  language = 'ua'
}: {
  tier: number;
  season: SeasonConfig;
  seasonState: PlayerSeasonState | null;
  onClaim: (tier: number, isPremium: boolean) => boolean;
  language?: 'ua' | 'en';
}) {
  const lang = language as 'ua' | 'en';
  const freeReward = season.freeRewards.find(r => r.tier === tier);
  const premiumReward = season.premiumRewards.find(r => r.tier === tier);
  
  const isUnlocked = seasonState ? tier <= seasonState.currentTier : tier === 0;
  const freeClaimed = seasonState?.claimedTiers.includes(`free_${tier}`) || false;
  const premiumClaimed = seasonState?.claimedTiers.includes(`premium_${tier}`) || false;
  const hasPremium = seasonState?.premiumPurchased || false;
  
  const formatReward = (reward: typeof freeReward) => {
    if (!reward) return '-';
    if (reward.type === 'currency') return `${reward.amount?.toLocaleString() || 0} 💰`;
    if (reward.type === 'xp') return `${reward.amount?.toLocaleString() || 0} XP`;
    if (reward.type === 'artifact_fragment') return `${reward.amount || 0} 🧩`;
    if (reward.type === 'booster') return `⚡ Boost`;
    if (reward.type === 'cosmetic') return `🎨 ${reward.cosmeticId}`;
    if (reward.type === 'gacha_ticket') return `🎫 x${reward.amount || 1}`;
    return '🎁';
  };
  
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${
      isUnlocked ? 'bg-gray-800/50' : 'bg-gray-900/30 opacity-50'
    }`}>
      {/* Tier number */}
      <div className={`
        w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
        ${isUnlocked ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-500'}
      `}>
        {tier}
      </div>
      
      {/* Free reward */}
      <div className="flex-1 text-center">
        <p className="text-xs text-gray-500 mb-1">Free</p>
        <p className={`text-sm font-medium ${freeClaimed ? 'text-gray-600' : 'text-white'}`}>
          {formatReward(freeReward)}
        </p>
      </div>
      
      {/* Premium reward */}
      <div className="flex-1 text-center">
        <p className="text-xs text-gray-500 mb-1">Premium</p>
        <p className={`text-sm font-medium ${premiumClaimed || !hasPremium ? 'text-gray-600' : 'text-yellow-400'}`}>
          {hasPremium ? formatReward(premiumReward) : '🔒'}
        </p>
      </div>
      
      {/* Claim buttons */}
      <div className="flex gap-1">
        {!freeClaimed && isUnlocked && (
          <button
            onClick={() => onClaim(tier, false)}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-all"
          >
            Free
          </button>
        )}
        {freeClaimed && (
          <span className="px-2 py-1.5 text-green-400 text-xs">✓</span>
        )}
      </div>
    </div>
  );
}

export function SeasonalEventsPanel({
  activeEvents,
  upcomingEvents,
  currentSeason,
  seasonState,
  seasonProgress,
  onClaimSeasonReward,
  onPurchasePremium,
  isWeekend,
  language = 'ua'
}: SeasonalEventsPanelProps) {
  const [activeTab, setActiveTab] = useState<'events' | 'season'>('events');
  
  const lang = language as 'ua' | 'en';
  
  // Show only next 3 upcoming events
  const visibleUpcoming = useMemo(() => upcomingEvents.slice(0, 3), [upcomingEvents]);
  
  // Season tier range (show tiers around current)
  const visibleTiers = useMemo(() => {
    if (!currentSeason) return [];
    const { currentTier } = seasonProgress;
    const startTier = Math.max(1, currentTier - 2);
    const endTier = Math.min(currentSeason.levelCount, currentTier + 5);
    return Array.from({ length: endTier - startTier + 1 }, (_, i) => startTier + i);
  }, [currentSeason, seasonProgress.currentTier]);
  
  return (
    <div className="space-y-4">
      {/* Weekender indicator */}
      {isWeekend && (
        <div className="bg-gradient-to-r from-pink-900/50 to-purple-900/50 rounded-xl p-4 border border-pink-500/50">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎉</span>
            <div>
              <h3 className="font-bold text-pink-300">Weekend Bonus Active!</h3>
              <p className="text-pink-400/70 text-sm">Double rewards until Monday</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('events')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'events'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          🎪 Events ({activeEvents.length})
        </button>
        <button
          onClick={() => setActiveTab('season')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'season'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          🏆 Season
        </button>
      </div>
      
      {/* Events tab */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          {/* Active events */}
          {activeEvents.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                Active Now
              </h3>
              {activeEvents.map(event => (
                <EventCard key={event.id} event={event} language={lang} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-4xl mb-4">🎪</p>
              <p>No active events right now</p>
            </div>
          )}
          
          {/* Upcoming events */}
          {visibleUpcoming.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                Coming Soon
              </h3>
              {visibleUpcoming.map(event => (
                <div key={event.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-300">{event.name[lang]}</h3>
                      <p className="text-gray-500 text-sm mt-1">{event.description[lang]}</p>
                    </div>
                    <span className="text-gray-500 text-sm">
                      {new Date(event.startDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Season tab */}
      {activeTab === 'season' && currentSeason && (
        <div className="space-y-4">
          {/* Season header */}
          <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl p-4 border border-purple-500/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xl text-white flex items-center gap-2">
                  {currentSeason.name[lang]}
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  {currentSeason.description[lang]}
                </p>
              </div>
              {!seasonProgress.premiumPurchased && currentSeason.premiumPrice && (
                <button
                  onClick={onPurchasePremium}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg font-bold transition-all hover:scale-105"
                >
                  ⭐ {currentSeason.premiumPrice} Stars
                </button>
              )}
              {seasonProgress.premiumPurchased && (
                <div className="px-4 py-2 bg-yellow-600/30 text-yellow-400 rounded-lg font-bold">
                  ⭐ Premium Active
                </div>
              )}
            </div>
            
            {/* Season XP progress */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Level {seasonProgress.currentTier}</span>
                <span className="text-gray-400">
                  {seasonProgress.xpInTier.toLocaleString()} / {seasonProgress.xpToNextTier.toLocaleString()} XP
                </span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all"
                  style={{ width: `${seasonProgress.progressPercent}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Season rewards */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              Season Rewards
            </h3>
            {visibleTiers.map(tier => (
              <SeasonRewardCard
                key={tier}
                tier={tier}
                season={currentSeason}
                seasonState={seasonState}
                onClaim={onClaimSeasonReward}
                language={lang}
              />
            ))}
          </div>
          
          {/* Season ends */}
          <div className="text-center text-sm text-gray-500">
            Season ends: {new Date(currentSeason.endDate).toLocaleDateString()}
          </div>
        </div>
      )}
      
      {/* No season */}
      {activeTab === 'season' && !currentSeason && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-4">🏆</p>
          <p>No active season</p>
          <p className="text-sm mt-1">Check back soon!</p>
        </div>
      )}
    </div>
  );
}

export default SeasonalEventsPanel;
