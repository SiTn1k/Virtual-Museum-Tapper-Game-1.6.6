/**
 * Virtual Museum Tapper Game — Battle Pass Panel UI
 * Displays season progress, tiers, and rewards
 */

import React, { useState, useMemo } from 'react';
import type { SeasonConfig, PlayerSeasonState, SeasonReward } from '../types/liveops';
import type { SeasonProgress } from '../hooks/useBattlePass';
import { Trophy, Star, Gift, Lock, Check, Clock, Crown, Zap } from 'lucide-react';

interface BattlePassPanelProps {
  currentSeason: SeasonConfig | null;
  seasonState: PlayerSeasonState | null;
  seasonProgress: SeasonProgress;
  onClaimReward: (tier: number, isPremium: boolean) => void;
  onPurchasePremium: () => void;
  language?: 'ua' | 'en';
}

function formatTimeRemaining(days: number): string {
  if (days > 0) {
    return `${days} ${days === 1 ? 'день' : days < 5 ? 'дні' : 'днів'}`;
  }
  return 'Завершено';
}

function formatReward(reward: SeasonReward | undefined, isPremium: boolean): string {
  if (!reward) return '-';
  
  const r = isPremium && reward.premiumReward ? reward.premiumReward : reward.freeReward;
  if (!r) return '-';

  switch (r.type) {
    case 'currency':
      return `${(r.amount || 0).toLocaleString()} 💰`;
    case 'xp':
      return `${(r.amount || 0).toLocaleString()} ⭐`;
    case 'artifact_fragment':
      return `${r.amount} 🧩 ${r.rarity || ''}`;
    case 'booster':
      return `⚡ ${formatDuration(r.duration || 0)}`;
    case 'cosmetic':
      return `🎨 ${r.cosmeticId}`;
    case 'gacha_ticket':
      return `🎫 x${r.amount || 1}`;
    default:
      return '🎁';
  }
}

function formatDuration(ms: number): string {
  if (ms <= 0) return '';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours >= 24) return `${Math.floor(hours / 24)}д`;
  return `${hours}г`;
}

function getRarityColor(rarity?: string): string {
  switch (rarity) {
    case 'legendary': return 'text-orange-400';
    case 'epic': return 'text-purple-400';
    case 'rare': return 'text-blue-400';
    default: return 'text-gray-300';
  }
}

function TierRow({
  tier,
  season,
  seasonState,
  canClaim,
  onClaim,
  language = 'ua'
}: {
  tier: number;
  season: SeasonConfig;
  seasonState: PlayerSeasonState | null;
  canClaim: (tier: number, isPremium: boolean) => boolean;
  onClaim: (tier: number, isPremium: boolean) => void;
  language?: 'ua' | 'en';
}) {
  const lang = language as 'ua' | 'en';
  const isUnlocked = seasonState ? tier <= seasonState.currentTier : tier === 0;
  const freeReward = season.freeRewards.find(r => r.tier === tier);
  const premiumReward = season.premiumRewards.find(r => r.tier === tier);
  const hasPremium = seasonState?.premiumPurchased || false;
  
  const freeClaimed = seasonState?.claimedTiers.includes(`free_${tier}`) || false;
  const premiumClaimed = seasonState?.claimedTiers.includes(`premium_${tier}`) || false;
  
  const canClaimFree = canClaim(tier, false);
  const canClaimPremium = canClaim(tier, true);
  
  const isMilestone = tier === 15 || tier === 30;
  const isGrandPrize = tier === 30;

  return (
    <div className={`
      p-4 rounded-xl transition-all
      ${isUnlocked ? 'bg-gray-800/70' : 'bg-gray-900/40 opacity-60'}
      ${isMilestone ? 'border-2 border-yellow-500/50' : 'border border-gray-700/50'}
      ${isGrandPrize ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30' : ''}
    `}>
      <div className="flex items-center gap-3">
        {/* Tier Badge */}
        <div className={`
          w-14 h-14 rounded-full flex flex-col items-center justify-center font-bold
          ${isUnlocked ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white' : 'bg-gray-700 text-gray-500'}
          ${isGrandPrize ? 'ring-2 ring-yellow-400' : ''}
        `}>
          <span className="text-lg">{tier}</span>
          {isGrandPrize && <Crown className="w-3 h-3 text-yellow-300" />}
        </div>

        {/* Free Reward */}
        <div className="flex-1 text-center">
          <div className="text-xs text-gray-500 mb-1">
            {lang === 'ua' ? 'Безкоштовно' : 'Free'}
          </div>
          <div className={`text-sm font-medium ${freeClaimed ? 'text-gray-600' : 'text-white'}`}>
            {formatReward(freeReward, false)}
          </div>
          {freeReward?.freeReward?.rarity && (
            <div className={`text-xs ${getRarityColor(freeReward.freeReward.rarity)}`}>
              {freeReward.freeReward.rarity}
            </div>
          )}
        </div>

        {/* Premium Reward */}
        <div className="flex-1 text-center">
          <div className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">
            ⭐ <span>{lang === 'ua' ? 'Преміум' : 'Premium'}</span>
          </div>
          {hasPremium ? (
            <div className={`text-sm font-medium ${premiumClaimed ? 'text-gray-600' : 'text-yellow-400'}`}>
              {formatReward(premiumReward, true)}
            </div>
          ) : (
            <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              <span>🔒</span>
            </div>
          )}
          {premiumReward?.premiumReward?.rarity && hasPremium && (
            <div className={`text-xs ${getRarityColor(premiumReward.premiumReward.rarity)}`}>
              {premiumReward.premiumReward.rarity}
            </div>
          )}
        </div>

        {/* Claim Buttons */}
        <div className="flex flex-col gap-1">
          {canClaimFree && !freeClaimed && (
            <button
              onClick={() => onClaim(tier, false)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-all active:scale-95"
            >
              {lang === 'ua' ? 'Отримати' : 'Claim'}
            </button>
          )}
          {freeClaimed && (
            <span className="px-3 py-1.5 text-green-400 text-xs flex items-center gap-1">
              <Check className="w-3 h-3" /> ✓
            </span>
          )}
          
          {hasPremium && canClaimPremium && !premiumClaimed && (
            <button
              onClick={() => onClaim(tier, true)}
              className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-semibold rounded-lg transition-all active:scale-95"
            >
              ⭐ {lang === 'ua' ? 'Отримати' : 'Claim'}
            </button>
          )}
          {hasPremium && premiumClaimed && (
            <span className="px-3 py-1.5 text-yellow-400 text-xs flex items-center gap-1">
              <Check className="w-3 h-3 text-yellow-400" /> ✓
            </span>
          )}
        </div>
      </div>

      {/* Milestone Indicator */}
      {isMilestone && isUnlocked && (
        <div className="mt-3 pt-3 border-t border-gray-700/50 text-center">
          <span className={`
            text-xs font-bold px-3 py-1 rounded-full
            ${isGrandPrize ? 'bg-yellow-500/20 text-yellow-400' : 'bg-orange-500/20 text-orange-400'}
          `}>
            {isGrandPrize 
              ? (lang === 'ua' ? '🏆 Гранд-пріз! 🏆' : '🏆 Grand Prize! 🏆')
              : (lang === 'ua' ? '⭐ Велика нагорода!' : '⭐ Big Reward!')
            }
          </span>
        </div>
      )}
    </div>
  );
}

export function BattlePassPanel({
  currentSeason,
  seasonState,
  seasonProgress,
  onClaimReward,
  onPurchasePremium,
  language = 'ua'
}: BattlePassPanelProps) {
  const [showPremiumInfo, setShowPremiumInfo] = useState(false);
  const lang = language as 'ua' | 'en';

  // Get all tiers for display
  const tiers = useMemo(() => {
    if (!currentSeason) return [];
    return Array.from({ length: currentSeason.levelCount }, (_, i) => i + 1);
  }, [currentSeason]);

  // Group tiers for scroll view (show nearby tiers + some context)
  const visibleTiers = useMemo(() => {
    const { currentTier } = seasonProgress;
    // Show 5 tiers before and after current, or just 1-10 initially
    const startTier = Math.max(1, Math.min(currentTier - 2, tiers.length - 10));
    const endTier = Math.min(currentSeason?.levelCount || 30, startTier + 14);
    return tiers.slice(startTier - 1, endTier);
  }, [tiers, seasonProgress.currentTier, currentSeason]);

  // Count unclaimed rewards
  const unclaimedCount = useMemo(() => {
    if (!seasonState) return 0;
    return tiers.filter(tier => {
      const freeClaimed = seasonState.claimedTiers.includes(`free_${tier}`);
      const premiumClaimed = seasonState.claimedTiers.includes(`premium_${tier}`);
      const hasPremium = seasonState.premiumPurchased;
      const isUnlocked = tier <= seasonState.currentTier;
      return isUnlocked && ((!freeClaimed) || (hasPremium && !premiumClaimed));
    }).length;
  }, [seasonState, tiers]);

  const canClaim = (tier: number, isPremium: boolean): boolean => {
    if (!seasonState) return false;
    if (tier > seasonState.currentTier) return false;
    const claimKey = isPremium ? `premium_${tier}` : `free_${tier}`;
    if (seasonState.claimedTiers.includes(claimKey)) return false;
    if (isPremium && !seasonState.premiumPurchased) return false;
    return true;
  };

  if (!currentSeason) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 text-center">
        <Trophy className="w-16 h-16 mx-auto text-gray-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-400 mb-2">
          {lang === 'ua' ? 'Немає активного сезону' : 'No Active Season'}
        </h2>
        <p className="text-gray-500">
          {lang === 'ua' 
            ? 'Перевірте пізніше для нових сезонів!'
            : 'Check back later for new seasons!'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Season Header */}
      <div className={`
        rounded-xl p-5 border
        ${seasonProgress.season?.theme === 'summer' ? 'bg-gradient-to-r from-orange-900/40 to-yellow-900/40 border-orange-500/40' : ''}
        ${seasonProgress.season?.theme === 'winter' ? 'bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border-blue-500/40' : ''}
        ${seasonProgress.season?.theme === 'autumn' ? 'bg-gradient-to-r from-amber-900/40 to-red-900/40 border-amber-500/40' : ''}
        bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-purple-500/40
      `}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {currentSeason.name[lang]}
              <Trophy className="w-6 h-6 text-yellow-400" />
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {currentSeason.description[lang]}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">
              {formatTimeRemaining(seasonProgress.daysRemaining)}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-300">
              {lang === 'ua' ? 'Рівень' : 'Level'} <span className="font-bold text-white">{seasonProgress.currentTier}</span>
              <span className="text-gray-500"> / {currentSeason.levelCount}</span>
            </span>
            <span className="text-gray-400">
              {seasonProgress.xpInTier.toLocaleString()} / {seasonProgress.xpToNextTier.toLocaleString()} XP
            </span>
          </div>
          <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400 transition-all duration-500 relative"
              style={{ width: `${seasonProgress.progressPercent}%` }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{seasonProgress.totalXp.toLocaleString()} XP</span>
            <span>{seasonProgress.progressPercent}%</span>
          </div>
        </div>

        {/* Premium Purchase Button */}
        {!seasonProgress.premiumPurchased ? (
          <button
            onClick={() => setShowPremiumInfo(true)}
            className="w-full py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Star className="w-5 h-5" />
            <span>{lang === 'ua' ? 'Придбати Преміум' : 'Buy Premium'}</span>
            <span className="bg-white/20 px-2 py-0.5 rounded text-sm">
              ⭐ {currentSeason.premiumPrice || 300} Stars
            </span>
          </button>
        ) : (
          <div className="py-3 bg-yellow-600/20 border border-yellow-500/40 rounded-xl text-center">
            <span className="text-yellow-400 font-bold flex items-center justify-center gap-2">
              <Star className="w-5 h-5" />
              {lang === 'ua' ? 'Преміум активний!' : 'Premium Active!'}
            </span>
          </div>
        )}

        {/* Unclaimed indicator */}
        {unclaimedCount > 0 && (
          <div className="mt-3 p-2 bg-green-900/30 border border-green-500/40 rounded-lg text-center">
            <span className="text-green-400 text-sm font-medium">
              🎁 {unclaimedCount} {lang === 'ua' ? 'невиконаних нагород!' : 'unclaimed rewards!'}
            </span>
          </div>
        )}
      </div>

      {/* Premium Info Modal */}
      {showPremiumInfo && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-yellow-500/40">
            <h3 className="text-xl font-bold text-white text-center mb-4 flex items-center justify-center gap-2">
              <Star className="w-6 h-6 text-yellow-400" />
              {lang === 'ua' ? 'Преміум Пропуск' : 'Premium Pass'}
            </h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                <Gift className="w-6 h-6 text-yellow-400" />
                <div>
                  <p className="text-white font-medium">{lang === 'ua' ? 'Подвійні нагороди' : 'Double Rewards'}</p>
                  <p className="text-gray-400 text-sm">{lang === 'ua' ? 'На кожному рівні' : 'On every tier'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                <Zap className="w-6 h-6 text-orange-400" />
                <div>
                  <p className="text-white font-medium">{lang === 'ua' ? 'Прискорений XP' : 'Accelerated XP'}</p>
                  <p className="text-gray-400 text-sm">{lang === 'ua' ? '+100 XP за рівень' : '+100 XP per level'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                <Crown className="w-6 h-6 text-purple-400" />
                <div>
                  <p className="text-white font-medium">{lang === 'ua' ? 'Ексклюзивні косметики' : 'Exclusive Cosmetics'}</p>
                  <p className="text-gray-400 text-sm">{lang === 'ua' ? 'Рамки, бейджі, титули' : 'Frames, badges, titles'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <div>
                  <p className="text-white font-medium">{lang === 'ua' ? 'Гранд-пріз на 30 рівні' : 'Grand Prize at Level 30'}</p>
                  <p className="text-gray-400 text-sm">{lang === 'ua' ? 'Ексклюзивний артефакт!' : 'Exclusive artifact!'}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onPurchasePremium();
                setShowPremiumInfo(false);
              }}
              className="w-full py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Star className="w-5 h-5" />
              <span>⭐ {currentSeason.premiumPrice || 300} Stars</span>
            </button>
            
            <button
              onClick={() => setShowPremiumInfo(false)}
              className="w-full py-2 mt-2 text-gray-400 hover:text-white transition-colors"
            >
              {lang === 'ua' ? 'Закрити' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Season Rewards List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          {lang === 'ua' ? 'Нагороди сезону' : 'Season Rewards'}
        </h3>
        
        {/* Quick nav */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {tiers.slice(0, 10).map(tier => (
            <button
              key={tier}
              onClick={() => {
                const el = document.getElementById(`tier-${tier}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className={`
                min-w-[36px] h-8 rounded-lg text-xs font-bold transition-all
                ${tier <= (seasonState?.currentTier || 0) 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}
              `}
            >
              {tier}
            </button>
          ))}
          <span className="text-gray-600 text-xs flex items-center">...</span>
        </div>
        
        {/* Tier rows */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
          {visibleTiers.map(tier => (
            <div key={tier} id={`tier-${tier}`}>
              <TierRow
                tier={tier}
                season={currentSeason}
                seasonState={seasonState}
                canClaim={canClaim}
                onClaim={onClaimReward}
                language={lang}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Season End Info */}
      <div className="text-center text-sm text-gray-500 pt-2">
        <p>{lang === 'ua' ? 'Сезон завершується' : 'Season ends'}: {new Date(currentSeason.endDate).toLocaleDateString()}</p>
      </div>
    </div>
  );
}

export default BattlePassPanel;
