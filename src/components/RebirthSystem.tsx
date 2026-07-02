import { useState } from 'react';
import { RotateCcw, Star, AlertTriangle, Sparkles, Globe, BookOpen, Unlock, Lock } from 'lucide-react';
import { EPOCHS, getNextUnlockableEpoch } from '../data/epochs';
import { formatNumber } from '../lib/utils';

interface RebirthSystemProps {
  level: number;
  epochId: string;
  prestigeLevel: number;
  prestigePoints: number;
  prestigeResearch: {
    rare_artifact_chance?: number;
    passive_income?: number;
    xp_gain?: number;
    tap_power?: number;
    energy_capacity?: number;
  };
  totalXp: number;
  onPrestige: () => void;
  onBuyUpgrade: (upgradeId: string, cost: number, maxLevel: number) => boolean;
}

// Calculate XP required for rebirth (level 950+)
const getRebirthXpRequired = (currentRebirth: number) => {
  // Each rebirth needs more XP
  return 950 + (currentRebirth * 100);
};

// Calculate prestige points earned on rebirth
const getPrestigePoints = (level: number, currentRebirth: number) => {
  const basePoints = 10;
  const levelBonus = Math.floor(level / 100);
  const rebirthMultiplier = 1 + (currentRebirth * 0.5);
  return Math.floor((basePoints + levelBonus) * rebirthMultiplier);
};

export function RebirthSystem({
  level,
  epochId,
  prestigeLevel,
  prestigePoints,
  prestigeResearch,
  totalXp,
  onPrestige,
  onBuyUpgrade,
}: RebirthSystemProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'rebirth' | 'upgrades' | 'epochs'>('rebirth');

  const xpRequired = getRebirthXpRequired(prestigeLevel);
  const xpProgress = Math.min(100, (totalXp / xpRequired) * 100);
  const canRebirth = level >= 950;
  const pointsEarned = getPrestigePoints(level, prestigeLevel);
  const nextUnlock = getNextUnlockableEpoch(prestigeLevel);

  const handleRebirth = () => {
    const success = onPrestige();
    if (success) {
      setShowConfirm(false);
    }
  };

  // Prestige upgrades - Phase 7: Rebalanced costs
  // XP gain was too cheap (1pt for +5% XP), now properly balanced
  const UPGRADES = [
    {
      id: 'rare_artifact_chance',
      name: 'Чорна Археологія',
      description: '+5% шанс рідкісного артефакту',
      icon: Sparkles,
      cost: 3, // Was 2 - increased for balance
      maxLevel: 10,
      effect: (level: number) => `+${level * 5}% рідкісні артефакти`,
    },
    {
      id: 'passive_income',
      name: 'Всесвітня Експедиція',
      description: '+10% пасивний дохід',
      icon: Globe,
      cost: 4, // Was 3 - increased per economy audit
      maxLevel: 10,
      effect: (level: number) => `+${level * 10}% пасивний дохід`,
    },
    {
      id: 'xp_gain',
      name: 'Головний Історик',
      description: '+5% XP за кожне переродження',
      icon: BookOpen,
      cost: 2, // Was 1 - too cheap per economy audit
      maxLevel: 20,
      effect: (level: number) => `+${level * 5}% XP (назавжди)`,
    },
    {
      id: 'energy_capacity',
      name: 'Енергетичний Резерв',
      description: '+100 max енергії',
      icon: Sparkles,
      cost: 5,
      maxLevel: 10,
      effect: (level: number) => `+${level * 100} max енергії`,
    },
    {
      id: 'tap_power',
      name: 'Козацька Сила',
      description: '+1 базової сили тапу',
      icon: BookOpen,
      cost: 8,
      maxLevel: 5,
      effect: (level: number) => `+${level} базової сили`,
    },
  ];

  // Get unlocked epochs for current rebirth
  const unlockedEpochs = EPOCHS.filter(e => e.requiredRebirth <= prestigeLevel);
  const lockedEpochs = EPOCHS.filter(e => e.requiredRebirth > prestigeLevel);

  return (
    <div className="space-y-3">
      {/* Tab Switcher */}
      <div className="flex gap-1 bg-gray-800/50 rounded-xl p-1">
        {(['rebirth', 'upgrades', 'epochs'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'rebirth' && 'Переродження'}
            {tab === 'upgrades' && 'Покращення'}
            {tab === 'epochs' && 'Епохи'}
          </button>
        ))}
      </div>

      {/* REBIRTH TAB */}
      {activeTab === 'rebirth' && (
        <>
          {/* Current Status */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-yellow-500/20 rounded-xl">
                <RotateCcw className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold">Переродження</h3>
                <p className="text-gray-400 text-sm">Скинь прогрес та відкрий нові епохи</p>
              </div>
              {prestigeLevel > 0 && (
                <div className="text-center">
                  <div className="flex items-center gap-1 text-yellow-400">
                    {[...Array(Math.min(prestigeLevel, 5))].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400" />
                    ))}
                    {prestigeLevel > 5 && <span className="text-sm">+{prestigeLevel - 5}</span>}
                  </div>
                  <div className="text-xs text-gray-400">{prestigePoints} очок</div>
                </div>
              )}
            </div>

            {/* XP Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Прогрес XP</span>
                <span>{formatNumber(totalXp)} / {formatNumber(xpRequired)}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    canRebirth ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              {canRebirth && (
                <p className="text-green-400 text-xs mt-1 text-center">
                  ✓ Готові до переродження!
                </p>
              )}
            </div>

            {/* Next unlock preview */}
            {nextUnlock && (
              <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Unlock className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-300 text-sm font-medium">
                    Наступне відкриття:
                  </span>
                </div>
                <div className="text-white font-bold">{nextUnlock.name.ua}</div>
                <div className="text-gray-400 text-xs">{nextUnlock.description.ua}</div>
              </div>
            )}

            {/* Rebirth button or requirements */}
            {canRebirth ? (
              <button
                onClick={() => setShowConfirm(true)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold transition-all active:scale-95"
              >
                Переродитися (+{pointsEarned} ★)
              </button>
            ) : (
              <div className="bg-gray-700/50 rounded-xl p-3 text-center">
                <div className="text-gray-400 text-sm">
                  Рівень {level}/950 для переродження
                </div>
                <div className="text-gray-500 text-xs mt-1">
                  Епоха: {EPOCHS.find(e => e.id === epochId)?.name.ua || epochId}
                </div>
              </div>
            )}
          </div>

          {/* What gets preserved/reset */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <h4 className="text-white font-medium mb-2">Що відбувається:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-green-400">
                <span className="text-green-500">✓</span> Артефакти
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <span className="text-green-500">✓</span> Очки переродження
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <span className="text-green-500">✓</span> Покращення
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <span className="text-green-500">✓</span> Реферали
              </div>
              <div className="flex items-center gap-2 text-red-400">
                <span className="text-red-500">✗</span> Рівень → 1
              </div>
              <div className="flex items-center gap-2 text-red-400">
                <span className="text-red-500">✗</span> Епоха → Трипілля
              </div>
              <div className="flex items-center gap-2 text-red-400">
                <span className="text-red-500">✗</span> Валюта → 20
              </div>
              <div className="flex items-center gap-2 text-red-400">
                <span className="text-red-500">✗</span> Генератори → 0
              </div>
            </div>
          </div>
        </>
      )}

      {/* UPGRADES TAB */}
      {activeTab === 'upgrades' && (
        <div className="space-y-3">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold">Покращення</h3>
              <div className="text-purple-400 font-bold">{prestigePoints} ★</div>
            </div>

            <p className="text-gray-400 text-xs mb-4">
              Покращення зберігаються після переродження
            </p>

            <div className="space-y-2">
              {UPGRADES.map(upgrade => {
                const currentLevel = prestigeResearch[upgrade.id as keyof typeof prestigeResearch] || 0;
                const canBuy = prestigePoints >= upgrade.cost && currentLevel < upgrade.maxLevel;
                const Icon = upgrade.icon;

                return (
                  <div
                    key={upgrade.id}
                    className={`p-3 rounded-xl flex items-center gap-3 ${
                      canBuy ? 'bg-purple-900/30' : 'bg-gray-700/30'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${canBuy ? 'bg-purple-500/30' : 'bg-gray-600/30'}`}>
                      <Icon className={`w-5 h-5 ${canBuy ? 'text-purple-400' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium text-sm">{upgrade.name}</div>
                      <div className="text-gray-400 text-xs">{upgrade.description}</div>
                      <div className="text-purple-400 text-xs mt-1">
                        {upgrade.effect(currentLevel)}
                        <span className="text-gray-500 ml-1">
                          ({currentLevel}/{upgrade.maxLevel})
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onBuyUpgrade(upgrade.id, upgrade.cost, upgrade.maxLevel)}
                      disabled={!canBuy}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        canBuy
                          ? 'bg-purple-500 hover:bg-purple-400 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {currentLevel >= upgrade.maxLevel ? 'МАКС' : `${upgrade.cost} ★`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* EPOCHS TAB */}
      {activeTab === 'epochs' && (
        <div className="space-y-3">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-5 h-5 text-yellow-400" />
              <h3 className="text-white font-bold">Відкриті епохи</h3>
            </div>

            {/* Unlocked */}
            <div className="space-y-2 mb-4">
              {unlockedEpochs.map(epoch => (
                <div
                  key={epoch.id}
                  className="p-2 rounded-lg bg-green-900/20 border border-green-500/30 flex items-center gap-2"
                >
                  <span className="text-xl">{epoch.currencyIcon}</span>
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">{epoch.name.ua}</div>
                    <div className="text-gray-400 text-xs">{epoch.period.ua}</div>
                  </div>
                  {epoch.id === epochId && (
                    <span className="text-xs bg-green-500 text-black px-2 py-0.5 rounded-full font-medium">
                      Активна
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Locked */}
            {lockedEpochs.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-400 text-sm">Заблоковані</span>
                </div>
                <div className="space-y-2">
                  {lockedEpochs.slice(0, 5).map(epoch => (
                    <div
                      key={epoch.id}
                      className="p-2 rounded-lg bg-gray-700/30 border border-gray-600/30 flex items-center gap-2 opacity-60"
                    >
                      <span className="text-xl">{epoch.currencyIcon}</span>
                      <div className="flex-1">
                        <div className="text-gray-300 text-sm font-medium">{epoch.name.ua}</div>
                        <div className="text-gray-500 text-xs">
                          Потрібно ★{epoch.requiredRebirth}
                        </div>
                      </div>
                      <Lock className="w-4 h-4 text-gray-500" />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 bg-gray-900 rounded-3xl overflow-hidden border border-yellow-500/30">
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <RotateCcw className="w-8 h-8 text-yellow-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Переродження?</h2>
              <p className="text-gray-400 text-sm mb-4">
                Весь прогрес (крім покращень) буде скинуто.
              </p>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-4">
                <div className="text-yellow-400 font-bold text-lg">+{pointsEarned} ★</div>
                <div className="text-gray-400 text-xs">
                  Поточний рівень: {prestigeLevel + 1} ★
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-700 flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-medium hover:bg-gray-600 transition-all"
              >
                Скасувати
              </button>
              <button
                onClick={handleRebirth}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold hover:from-yellow-400 hover:to-orange-400 transition-all"
              >
                Переродитись
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
