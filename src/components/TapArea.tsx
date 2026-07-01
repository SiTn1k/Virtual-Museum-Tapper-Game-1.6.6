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

// Particle effect component
function TapParticle({ x, y, value, onComplete }: { x: number; y: number; value: number; onComplete: () => void }) {
  const [opacity, setOpacity] = useState(1);
  const [scale, setScale] = useState(1);
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    let frame = 0;
    const animate = () => {
      frame++;
      setOpacity(1 - frame / 40);
      setScale(1 + frame / 30);
      setOffsetY(-frame * 1.5);
      if (frame < 40) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };
    requestAnimationFrame(animate);
  }, [onComplete]);

  const isBig = value >= 100;

  return (
    <div
      className="absolute pointer-events-none font-black select-none"
      style={{
        left: x,
        top: y + offsetY,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
        zIndex: 100,
      }}
    >
      <div className={`${isBig ? 'text-yellow-300' : 'text-white'} ${isBig ? 'text-3xl' : 'text-xl'} font-black drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]`}>
        +{value}
      </div>
      {isBig && (
        <div className="absolute -top-1 -right-1">
          <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
        </div>
      )}
    </div>
  );
}

// Ripple effect component
function TapRipple({ x, y, onComplete }: { x: number; y: number; onComplete: () => void }) {
  const [radius, setRadius] = useState(0);
  const [opacity, setOpacity] = useState(0.8);

  useEffect(() => {
    let frame = 0;
    const maxRadius = 80;
    const animate = () => {
      frame++;
      setRadius(frame * 3);
      setOpacity(0.8 * (1 - frame / 30));
      if (frame < 30) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };
    requestAnimationFrame(animate);
  }, [onComplete]);

  return (
    <div
      className="absolute pointer-events-none rounded-full border-4 border-white/30"
      style={{
        left: x,
        top: y,
        width: radius * 2,
        height: radius * 2,
        transform: 'translate(-50%, -50%)',
        opacity,
      }}
    />
  );
}

// Combo indicator component
function ComboIndicator({ combo, show }: { combo: number; show: boolean }) {
  if (!show || combo < 3) return null;

  const colors = {
    3: 'from-yellow-500 to-orange-500',
    5: 'from-orange-500 to-red-500',
    10: 'from-red-500 to-pink-500',
    20: 'from-pink-500 to-purple-500',
  };

  const getColor = () => {
    if (combo >= 20) return colors[20];
    if (combo >= 10) return colors[10];
    if (combo >= 5) return colors[5];
    return colors[3];
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
      <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${getColor()} shadow-lg animate-bounce`}>
        <div className="flex items-center gap-2 text-white font-bold">
          <Zap className="w-5 h-5" />
          <span>COMBO x{combo}</span>
        </div>
      </div>
    </div>
  );
}

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
  const lastTapTime = useRef(0);

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

    // Add particle
    const particleId = `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setParticles(prev => [...prev, { id: particleId, x, y, value: tapPower }]);

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
          setTimeout(() => setShowCombo(false), 800);
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

        {/* XP Progress Bar */}
        <div className="relative w-full bg-black/30 rounded-full h-3 sm:h-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-100 rounded-full relative"
            style={{ width: `${Math.min(xpPercent, 100)}%` }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine" />
          </div>
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
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full animate-float-slow"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${8 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        {/* Central Icon with glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Glow effect */}
            <div
              className="absolute inset-0 blur-2xl animate-pulse"
              style={{ backgroundColor: epoch.color, opacity: 0.4 }}
            />
            {/* Main icon */}
            <div
              className="text-6xl sm:text-8xl transform transition-transform duration-150 active:scale-95 drop-shadow-2xl relative z-10"
              style={{ filter: `drop-shadow(0 0 20px ${epoch.color})` }}
            >
              {epoch.currencyIcon}
            </div>
          </div>
        </div>

        {/* Tap Power Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-white backdrop-blur-md shadow-lg border border-white/20">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
            <span className="text-sm sm:text-base font-bold">
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

        {/* Prestige indicator */}
        {prestigeLevel > 0 && (
          <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500 to-amber-500 px-3 py-1.5 rounded-full shadow-lg">
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
