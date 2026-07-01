import { Sparkles, Star, Lock, CheckCircle } from 'lucide-react';
import { SIT_STUDIO_WORD, SIT_STUDIO_LETTERS } from '../../data/epochs';

interface SitStudioTrackerProps {
  collectedLetters: Record<string, boolean>;
  onCelebrate?: () => void;
}

export function SitStudioTracker({ collectedLetters, onCelebrate }: SitStudioTrackerProps) {
  const collectedCount = Object.values(collectedLetters).filter(Boolean).length;
  const totalCount = SIT_STUDIO_LETTERS.length;
  const isComplete = collectedCount === totalCount;

  // Calculate progress
  const progress = (collectedCount / totalCount) * 100;

  return (
    <div className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-2xl p-4 border border-purple-500/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="text-white font-bold">Таємнича колекція</h3>
        </div>
        <div className="text-purple-400 font-bold text-sm">
          {collectedCount}/{totalCount}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-black/30 rounded-full h-2 mb-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Letter slots */}
      <div className="flex justify-center gap-1 flex-wrap">
        {SIT_STUDIO_LETTERS.map((letter, index) => {
          const letterKey = `${index}_${letter}`;
          const isCollected = collectedLetters[letterKey] || false;

          return (
            <div
              key={index}
              className={`
                w-7 h-9 sm:w-8 sm:h-10 rounded-lg flex items-center justify-center font-bold text-sm sm:text-base
                transition-all duration-300 transform
                ${isCollected
                  ? 'bg-gradient-to-br from-yellow-500 to-amber-500 text-black shadow-lg shadow-yellow-500/30 scale-110'
                  : 'bg-gray-700/50 text-gray-500'
                }
                ${isComplete ? 'animate-pulse' : ''}
              `}
            >
              {isCollected ? (
                letter === ' ' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  letter
                )
              ) : (
                <Lock className="w-3 h-3" />
              )}
            </div>
          );
        })}
      </div>

      {/* Status message */}
      <div className="mt-3 text-center">
        {isComplete ? (
          <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black px-4 py-2 rounded-full font-bold animate-bounce">
            <div className="flex items-center justify-center gap-2">
              <Star className="w-4 h-4" />
              <span>ВІТАЄМО! SIT STUDIO!</span>
              <Star className="w-4 h-4" />
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-xs">
            Збери всі літери слова "SIT STUDIO" • Шанс: 0.1% за скриню
          </p>
        )}
      </div>

      {/* Hint for collected */}
      {collectedCount > 0 && !isComplete && (
        <div className="mt-2 text-center text-xs text-purple-300">
          Поточне слово:{' '}
          <span className="font-mono font-bold text-purple-200">
            {SIT_STUDIO_LETTERS.map((letter, index) => {
              const letterKey = `${index}_${letter}`;
              return collectedLetters[letterKey] ? letter : '_';
            }).join('')}
          </span>
        </div>
      )}
    </div>
  );
}

// Celebration modal when completed
interface SitStudioCelebrationProps {
  onClose: () => void;
}

export function SitStudioCelebration({ onClose }: SitStudioCelebrationProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="relative w-full max-w-sm mx-4">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float-up text-2xl"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              {['⭐', '✨', '🌟', '💫', '🎉'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="relative bg-gradient-to-b from-purple-900 to-indigo-900 rounded-3xl p-8 text-center border-2 border-yellow-500 shadow-2xl shadow-yellow-500/20">
          <div className="text-6xl mb-4 animate-bounce">🎊</div>

          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 mb-2">
            SIT STUDIO
          </h2>

          <p className="text-purple-200 mb-4">
            Ти зібрав секретне слово!<br />
            Ти один з 1000 щасливчиків!
          </p>

          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4 mb-4">
            <div className="text-yellow-400 font-bold text-lg mb-1">Нагорода:</div>
            <div className="text-white font-bold">x2 XP назавжди!</div>
            <div className="text-yellow-300 text-sm">+100% до всього XP</div>
          </div>

          <div className="text-gray-400 text-xs mb-4">
            Ця нагорода зберігається після переродження
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold text-lg hover:from-yellow-400 hover:to-amber-400 transition-all active:scale-95 shadow-lg shadow-yellow-500/30"
          >
            Неймовірно! 🔮
          </button>
        </div>
      </div>
    </div>
  );
}
