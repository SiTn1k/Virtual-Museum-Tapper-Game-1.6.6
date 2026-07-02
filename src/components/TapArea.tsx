import { useRef, useCallback, useState, useEffect } from 'react';
import { TapEvent, Epoch } from '../types/game';
import { formatNumber } from '../lib/utils';
import { Sparkles, Zap } from 'lucide-react';

interface TapAreaProps {
  epoch: Epoch;
  onTap: (x: number, y: number) => void;
  tapEvents: TapEvent[];
  tapPower: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  passiveXp: number;
  currency: number;
  currencyIcon: string;
  prestigeLevel: number;
  topOffset?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// PARTICLE EFFECT - Enhanced with spring physics
// ═══════════════════════════════════════════════════════════════════════════
function TapParticle({ x, y, value, onComplete }: { x: number; y: number; value: number; onComplete: () => void }) {
  const [opacity, setOpacity] = useState(1);
  const [scale, setScale] = useState(1);
  const [offsetY, setOffsetY] = useState(0);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    let frame = 0;
    const totalFrames = 45;
    
    const animate = () => {
      frame++;
      // Spring-like easing curve
      const progress = frame / totalFrames;
      const springProgress = 1 - Math.pow(1 - progress, 3);
      
      setOpacity(1 - springProgress);
      setScale(1 + springProgress * 0.8);
      setOffsetY(-frame * 2.2);
      setRotation(frame * 3);
      
      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };
    requestAnimationFrame(animate);
  }, [onComplete]);

  const isBig = value >= 100;
  const isHuge = value >= 1000;

  return (
    <div
      className="absolute pointer-events-none font-black select-none"
      style={{
        left: x,
        top: y + offsetY,
        transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
        opacity,
        zIndex: 100,
      }}
    >
      <div className={`${isHuge ? 'text-yellow-300' : isBig ? 'text-yellow-200' : 'text-white'} ${isHuge ? 'text-4xl' : isBig ? 'text-3xl' : 'text-xl'} font-black text-shadow`}>
        +{formatNumber(value)}
      </div>
      {isBig && (
        <div className="absolute -top-1 -right-1 animate-pulse">
          <Sparkles className={`${isHuge ? 'w-6 h-6 text-yellow-400' : 'w-4 h-4 text-yellow-400'}`} />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RIPPLE EFFECT - Enhanced with better animation
// ═══════════════════════════════════════════════════════════════════════════
function TapRipple({ x, y, onComplete }: { x: number; y: number; onComplete: () => void }) {
  const [radius, setRadius] = useState(0);
  const [opacity, setOpacity] = useState(0.6);

  useEffect(() => {
    let frame = 0;
    const totalFrames = 25;
    const maxRadius = 100;
    
    const animate = () => {
      frame++;
      const progress = frame / totalFrames;
      // Ease out quad
      const easedProgress = 1 - Math.pow(1 - progress, 2);
      
      setRadius(easedProgress * maxRadius);
      setOpacity(0.6 * (1 - easedProgress));
      
      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };
    requestAnimationFrame(animate);
  }, [onComplete]);

  return (
    <div
      className="absolute pointer-events-none rounded-full"
      style={{
        left: x,
        top: y,
        width: radius * 2,
        height: radius * 2,
        transform: 'translate(-50%, -50%)',
        opacity,
        background: 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)',
        border: '2px solid rgba(251, 191, 36, 0.5)',
        zIndex: 50,
      }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMBO INDICATOR - Smooth entrance/exit
// ═══════════════════════════════════════════════════════════════════════════
function ComboIndicator({ combo, show }: { combo: number; show: boolean }) {
  if (combo < 3) return null;

  const colors = {
    3: { from: 'from-yellow-500', to: 'to-orange-500', glow: 'shadow-yellow-500/50' },
    5: { from: 'from-orange-500', to: 'to-red-500', glow: 'shadow-orange-500/50' },
    10: { from: 'from-red-500', to: 'to-pink-500', glow: 'shadow-red-500/50' },
    20: { from: 'from-pink-500', to: 'to-purple-500', glow: 'shadow-pink-500/50' },
  };

  const getColorScheme = () => {
    if (combo >= 20) return colors[20];
    if (combo >= 10) return colors[10];
    if (combo >= 5) return colors[5];
    return colors[3];
  };

  const colorScheme = getColorScheme();

  return (
    <div 
      className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        show ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
      }`}
    >
      <div 
        className={`px-5 py-2.5 rounded-full bg-gradient-to-r ${colorScheme.from} ${colorScheme.to} shadow-lg ${colorScheme.glow} animate-bounce`}
      >
        <div className="flex items-center gap-2 text-white font-bold">
          <Zap className="w-5 h-5" />
          <span>COMBO x{combo}</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LEVEL UP CELEBRATION - New polish feature
// ═══════════════════════════════════════════════════════════════════════════
function LevelUpCelebration({ level, show }: { level: number; show: boolean }) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="text-center animate-celebration">
        <div className="text-6xl mb-2">🎉</div>
        <div className="text-3xl font-black text-yellow-400 text-shadow">
          LEVEL {level}!
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN TAP AREA COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export function TapArea({
  epoch,
  onTap,
  tapEvents,
  tapPower,
  level,
  xp,
  xpToNextLevel,
  passiveXp,
  currency,
  currencyIcon,
  prestigeLevel,
  topOffset = 0,
}: TapAreaProps) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Array<{ id: string; x: number; y: number; value: number }>>([]);
  const [ripples, setRipples] = useState<Array<{ id: string; x: number; y: number }>>([]);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [prevLevel, setPrevLevel] = useState(level);
  const lastTapTime = useRef(0);
  const comboTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect level up
  useEffect(() => {
    if (level > prevLevel) {
      setShowLevelUp(true);
      setPrevLevel(level);
      const timeout = setTimeout(() => setShowLevelUp(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [level, prevLevel]);

  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!areaRef.current) return;

    const rect = areaRef.current.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      e.preventDefault();
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    onTap(x, y);

    // Add particle with slight randomization for variety
    const particleId = `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setParticles(prev => [...prev, { id: particleId, x: x + (Math.random() - 0.5) * 10, y: y + (Math.random() - 0.5) * 10, value: tapPower }]);

    // Add ripple
    const rippleId = `r_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setRipples(prev => [...prev, { id: rippleId, x, y }]);

    // Combo system - tap within 500ms to build combo
    const now = Date.now();
    if (now - lastTapTime.current < 500) {
      setCombo(prev => {
        const newCombo = prev + 1;
        if (newCombo >= 3) {
          setShowCombo(true);
          // Clear existing timeout
          if (comboTimeoutRef.current) {
            clearTimeout(comboTimeoutRef.current);
          }
          // Auto-hide combo after delay
          comboTimeoutRef.current = setTimeout(() => setShowCombo(false), 1000);
        }
        return newCombo;
      });
    } else {
      setCombo(1);
    }
    lastTapTime.current = now;
  }, [onTap, tapPower]);

  const removeParticle = useCallback((id: string) => {
    setParticles(prev => prev.filter(p => p.id !== id));
  }, []);

  const removeRipple = useCallback((id: string) => {
    setRipples(prev => prev.filter(r => r.id !== id));
  }, []);

  const xpPercent = (xp / xpToNextLevel) * 100;

  // Calculate tap power with prestige bonus
  const effectiveTapPower = prestigeLevel > 0 ? tapPower * (1 + prestigeLevel * 0.1) : tapPower;

  return (
    <div className="relative flex-shrink-0 flex flex-col" style={{ height: `calc(50vh - ${topOffset}px)` }}>
      {/* Header Stats */}
      <div
        className="p-3 sm:p-4 text-white relative overflow-hidden"
        style={{ background: epoch.bgGradient }}
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative flex justify-between items-center mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl">{epoch.currencyIcon}</span>
              <h2 className="text-sm sm:text-lg font-bold">{epoch.name.ua}</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs opacity-80">Рівень {level}</span>
              {prestigeLevel > 0 && (
                <span className="text-[10px] sm:text-xs bg-yellow-500/50 px-1.5 py-0.5 rounded-full font-medium">
                  ★ {prestigeLevel}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl sm:text-2xl font-bold flex items-center gap-1">
              <span>{currencyIcon}</span>
              <span>{formatNumber(currency)}</span>
            </div>
            <div className="text-[10px] sm:text-xs opacity-80 flex items-center justify-end gap-1">
              <Zap className="w-3 h-3" />
              <span>+{formatNumber(passiveXp)}/с XP</span>
            </div>
          </div>
        </div>

        {/* XP Progress Bar - Fixed shine animation */}
        <div className="xp-bar">
          <div
            className="xp-bar-fill"
            style={{ width: `${Math.min(xpPercent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] sm:text-xs mt-1 opacity-90">
          <span className="font-medium">{formatNumber(xp)} XP</span>
          <span className="opacity-70">{formatNumber(xpToNextLevel)} XP</span>
        </div>
      </div>

      {/* Tap Area */}
      <div
        ref={areaRef}
        className="flex-1 relative overflow-hidden cursor-pointer select-none touch-manipulation"
        style={{
          background: `linear-gradient(135deg, ${epoch.color}22 0%, ${epoch.color}44 100%)`,
        }}
        onClick={handleTap}
        onTouchStart={handleTap}
      >
        {/* Level Up Celebration */}
        <LevelUpCelebration level={level} show={showLevelUp} />

        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 bg-white rounded-full animate-float-slow"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${8 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        {/* Central Icon with enhanced glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Enhanced glow effect */}
            <div
              className="absolute inset-0 blur-3xl animate-pulse"
              style={{ backgroundColor: epoch.color, opacity: 0.5 }}
            />
            <div
              className="absolute inset-0 blur-xl"
              style={{ backgroundColor: epoch.color, opacity: 0.3 }}
            />
            {/* Main icon */}
            <div
              className="text-6xl sm:text-8xl transform transition-transform duration-150 active:scale-95 relative z-10"
              style={{ filter: `drop-shadow(0 0 30px ${epoch.color})` }}
            >
              {epoch.currencyIcon}
            </div>
          </div>
        </div>

        {/* Tap Power Indicator - Enhanced styling */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-white backdrop-blur-md shadow-lg border border-white/20">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 sm:w-5 sm:h-5 text-yellow-400 animate-pulse" />
            <span className="text-base sm:text-lg font-bold">
              +{formatNumber(Math.round(effectiveTapPower))} XP
            </span>
          </div>
        </div>

        {/* Combo Indicator */}
        <ComboIndicator combo={combo} show={showCombo} />

        {/* Ripple Effects */}
        {ripples.map(ripple => (
          <TapRipple
            key={ripple.id}
            x={ripple.x}
            y={ripple.y}
            onComplete={() => removeRipple(ripple.id)}
          />
        ))}

        {/* Tap Particles */}
        {particles.map(particle => (
          <TapParticle
            key={particle.id}
            x={particle.x}
            y={particle.y}
            value={particle.value}
            onComplete={() => removeParticle(particle.id)}
          />
        ))}

        {/* Prestige indicator - Enhanced */}
        {prestigeLevel > 0 && (
          <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500 to-amber-500 px-3 py-1.5 rounded-full shadow-lg animate-pulse-slow">
            <div className="flex items-center gap-1 text-black font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Енергія x5</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
