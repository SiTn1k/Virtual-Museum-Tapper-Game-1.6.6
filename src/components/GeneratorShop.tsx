import { useState } from 'react';
import { Epoch } from '../types/game';
import { getGeneratorCost, getGeneratorProduction } from '../data/epochs';
import { formatNumber } from '../lib/utils';
import { Check } from 'lucide-react';

interface GeneratorShopProps {
  epoch: Epoch;
  currency: number;
  ownedLevels: Map<string, number>;
  onBuy: (generatorId: string) => boolean;
}

// Skeleton loader for generators
function GeneratorSkeleton() {
  return (
    <div className="skeleton-generator">
      <div className="icon" />
      <div className="content">
        <div className="title skeleton" />
        <div className="desc skeleton" />
      </div>
    </div>
  );
}

// Enhanced Generator Card with purchase animation
function GeneratorCard({ 
  generator, 
  level, 
  cost, 
  canAfford, 
  production, 
  epochCurrencyIcon,
  onBuy,
  nextProduction
}: { 
  generator: any; 
  level: number; 
  cost: number; 
  canAfford: boolean; 
  production: number;
  epochCurrencyIcon: string;
  onBuy: () => void;
  nextProduction: number;
}) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [justPurchased, setJustPurchased] = useState(false);

  const handleClick = () => {
    if (!canAfford) return;
    
    setIsPurchasing(true);
    const success = onBuy();
    
    if (success) {
      setJustPurchased(true);
      setTimeout(() => {
        setIsPurchasing(false);
        setTimeout(() => setJustPurchased(false), 300);
      }, 200);
    } else {
      setIsPurchasing(false);
    }
  };

  return (
    <div
      className={`
        p-3 flex items-center gap-3 transition-all duration-200
        ${canAfford 
          ? 'bg-gray-800 hover:bg-gray-750 active:bg-gray-700 cursor-pointer hover:shadow-lg hover:shadow-yellow-500/10' 
          : 'bg-gray-900/50 opacity-60'
        }
        ${justPurchased ? 'bg-green-900/30 ring-2 ring-green-500/50' : ''}
        ${isPurchasing ? 'scale-[0.98]' : ''}
        rounded-xl
      `}
      onClick={handleClick}
    >
      {/* Icon with glow for owned items */}
      <div className={`
        text-3xl w-12 h-12 rounded-xl flex items-center justify-center
        transition-all duration-300
        ${level > 0 
          ? 'bg-gradient-to-br from-gray-700 to-gray-800 shadow-lg' 
          : 'bg-gray-700/50'
        }
        ${canAfford ? 'hover:scale-110' : ''}
      `}>
        {generator.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{generator.name.ua}</span>
          {level > 0 && (
            <span className={`
              text-xs px-2 py-0.5 rounded-full font-medium
              ${justPurchased 
                ? 'bg-green-500/30 text-green-400' 
                : 'bg-yellow-500/20 text-yellow-400'
              }
            `}>
              Lv.{level}
            </span>
          )}
          {justPurchased && (
            <span className="text-xs bg-green-500/30 text-green-400 px-2 py-0.5 rounded-full font-medium animate-bounce">
              +1!
            </span>
          )}
        </div>
        <div className="text-xs text-gray-400 truncate">
          {generator.description.ua}
        </div>
        {level > 0 && (
          <div className="text-xs text-green-400 flex items-center gap-1">
            <span>Продукція: {formatNumber(production)}/с</span>
            {canAfford && (
              <span className="text-yellow-400/70">
                → {formatNumber(nextProduction)}/с
              </span>
            )}
          </div>
        )}
      </div>

      <div className="text-right">
        <div className={`
          text-sm font-bold flex items-center gap-1 justify-end
          ${canAfford ? 'text-yellow-400' : 'text-gray-500'}
        `}>
          <span>{formatNumber(cost)}</span>
          <span className="text-xs">{epochCurrencyIcon}</span>
        </div>
        <div className="text-xs text-gray-400">
          {level > 0
            ? `+${formatNumber(nextProduction)}/с`
            : `${formatNumber(generator.baseProduction)}/с`}
        </div>
      </div>

      {/* Purchase success indicator */}
      {justPurchased && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
}

export function GeneratorShop({ epoch, currency, ownedLevels, onBuy }: GeneratorShopProps) {
  return (
    <div className="bg-gray-900 text-white">
      {/* Epoch Header */}
      <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800/50">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{epoch.currencyIcon}</span>
          <div>
            <h3 className="font-bold text-lg text-white">{epoch.name.ua}</h3>
            <p className="text-xs text-gray-400">{epoch.description.ua}</p>
          </div>
        </div>
      </div>

      {/* Currency indicator */}
      <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700/50 flex items-center justify-between">
        <span className="text-xs text-gray-400">Ваш баланс:</span>
        <span className="text-sm font-bold text-yellow-400 flex items-center gap-1">
          <span>{epoch.currencyIcon}</span>
          <span>{formatNumber(currency)}</span>
        </span>
      </div>

      {/* Generator List */}
      <div className="divide-y divide-gray-700/50">
        {epoch.generators.map(generator => {
          const level = ownedLevels.get(generator.id) || 0;
          const cost = getGeneratorCost(generator, level);
          const canAfford = currency >= cost;
          const production = getGeneratorProduction(generator, level);
          const nextProduction = getGeneratorProduction(generator, level + 1);

          return (
            <GeneratorCard
              key={generator.id}
              generator={generator}
              level={level}
              cost={cost}
              canAfford={canAfford}
              production={production}
              epochCurrencyIcon={epoch.currencyIcon}
              onBuy={() => onBuy(generator.id)}
              nextProduction={nextProduction}
            />
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="p-3 text-center text-xs text-gray-500 bg-gray-900/50">
        Натисніть на генератор для покупки
      </div>
    </div>
  );
}
