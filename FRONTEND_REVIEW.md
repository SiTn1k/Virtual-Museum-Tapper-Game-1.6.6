# FRONTEND_REVIEW.md

## Virtual Museum Tapper Game - Frontend Architecture Review

**Review Date:** 2026-07-02  
**Reviewer:** Frontend Architecture Review Team  
**Project:** Virtual Museum Tapper Game v1.6.6  
**Stack:** React 18.3 + TypeScript 5.5 + Vite 5.4 + Tailwind CSS 3.4

---

## Executive Summary

| Category | Score | Grade | Critical Issues |
|----------|-------|-------|-----------------|
| React Component Structure | 6/10 | B- | 3 |
| TypeScript Type Systems | 8/10 | B+ | 1 |
| Vite Build Configuration | 5/10 | C+ | 2 |
| Tailwind Styling | 6/10 | B- | 2 |
| State Management | 4/10 | C- | 3 |
| Component Reusability | 5/10 | C+ | 2 |
| Code Quality | 5/10 | C+ | 3 |
| Bundle Organization | 4/10 | C- | 3 |
| **OVERALL** | **5.4/10** | **C** | **19** |

---

## Issue Registry

### 🔴 CRITICAL Issues (Must Fix Immediately)

---

#### Issue #1: Monolithic App.tsx - Single Responsibility Violation

| Field | Value |
|-------|-------|
| **Title** | App.tsx Exceeds 650 Lines, Violates Single Responsibility |
| **Severity** | 🔴 CRITICAL |
| **Category** | React Component Structure |
| **Affected Files** | `src/App.tsx` |

**Description:**
The App.tsx file has grown to 650+ lines containing multiple responsibilities:
- 14+ useState hooks managing disparate UI states
- Business logic mixed with presentation
- 60+ props passed to child components
- Modal management (Gacha, Tutorial, Daily Rewards, Session Ads, Chest Ads)
- Tab navigation logic
- Ad trigger hooks integration
- Booster purchase flow

**Why This Matters:**
- Code is nearly impossible to test in isolation
- Any change risks breaking unrelated functionality
- Cognitive load makes onboarding new developers difficult
- Violates React best practices for component composition

**Potential Impact:**
- High bug risk during feature additions
- Slow development velocity
- Developer frustration leading to turnover
- Difficulty debugging production issues

**Risk if Ignored:**
- Accumulates technical debt at ~100 lines/month
- Will require complete rewrite in 3-6 months
- Risk of cascading bugs during any modification

**Recommended Solution:**
```typescript
// Proposed structure:
src/
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx       // Main layout, tab navigation
│   │   ├── BottomNav.tsx      // Tab navigation
│   │   └── Header.tsx        // Stats header
│   ├── modals/
│   │   ├── GachaModal.tsx     // Already exists
│   │   ├── TutorialModal.tsx  // Already exists
│   │   └── AdModals.tsx      // Consolidate session/chest ads
│   └── features/
│       ├── shop/
│       ├── epochs/
│       └── boosters/
├── contexts/
│   ├── GameContext.tsx        // Core game state
│   └── UIContext.tsx          // Modal/tab state
├── hooks/
│   ├── useGameState.ts        // Split from useGame
│   ├── useUIState.ts          // UI state management
│   └── useAdTriggers.ts       // Ad trigger logic
```

**Estimated Implementation Effort:** 3-5 sprints (High)

**Responsible Agent:** Frontend Lead

---

#### Issue #2: Massive useGame Hook - God Object Anti-Pattern

| Field | Value |
|-------|-------|
| **Title** | useGame Hook Exceeds 480 Lines, Handles 12+ Concerns |
| **Severity** | 🔴 CRITICAL |
| **Category** | State Management |
| **Affected Files** | `src/hooks/useGame.ts` |

**Description:**
The useGame hook returns 35+ values and handles:
1. Game state management (45+ state variables)
2. Passive income tick system
3. Local + remote persistence
4. Epoch/Generator logic
5. Artifact management
6. Daily tasks system
7. Prestige system
8. Energy system
9. Offline gains calculation
10. Tab synchronization
11. Leaderboard loading
12. Booster management

**Why This Matters:**
- Bundle pulls ALL features even if unused
- Cannot mock specific functionality for tests
- setState on every tick impacts performance
- Tight coupling prevents feature isolation

**Potential Impact:**
- Bundle size bloat
- Performance degradation on lower-end devices
- Impossible to optimize individual features
- Test coverage remains at 0%

**Risk if Ignored:**
- Will grow with each feature addition
- Performance issues in production
- Cannot implement proper error boundaries

**Recommended Solution:**
```typescript
// Split into focused hooks:
export function useGameState() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  // Core state operations only
}

export function usePassiveIncome(state: GameState, multipliers: Multipliers) {
  // Tick system, passive XP calculation
  const tickRef = useRef<number>(null);
  // ...
}

export function useGamePersistence(state: GameState) {
  // Local + remote save logic
  const localSaveRef = useRef<number>(null);
  // ...
}

export function usePrestige(state: GameState) {
  // Prestige logic only
  const canPrestige = state.level >= 950;
  // ...
}

export function useEnergy(state: GameState) {
  // Energy system only
  const energyMultiplier = state.energy > 0 ? 5 : 1;
  // ...
}

// Context for dependency injection
export const GameContext = createContext<GameContextType>(null!);
```

**Estimated Implementation Effort:** 4-6 sprints (High)

**Responsible Agent:** Frontend Lead

---

#### Issue #3: Duplicate Components - PrestigeSystem vs RebirthSystem

| Field | Value |
|-------|-------|
| **Title** | PrestigeSystem.tsx and RebirthSystem.tsx Are 70% Identical |
| **Severity** | 🔴 CRITICAL |
| **Category** | Component Reusability |
| **Affected Files** | `src/components/PrestigeSystem.tsx`, `src/components/RebirthSystem.tsx` |

**Description:**
Two nearly identical components exist:
- **PrestigeSystem.tsx**: 315 lines, used in App.tsx
- **RebirthSystem.tsx**: 395 lines, separate implementation
- Shared logic duplicated: prestige upgrades, XP requirements, epoch unlocks
- Different naming conventions (Prestige vs Rebirth)
- Inconsistent UX between implementations

**Why This Matters:**
- Maintenance nightmare - bug fix requires changes in two places
- Inconsistent user experience
- Wasted bundle size (~30KB of duplicate code)
- Confusing for new developers

**Potential Impact:**
- Feature divergence over time
- User confusion about "Prestige" vs "Rebirth"
- Higher bug probability
- Increased QA effort

**Risk if Ignored:**
- One will become the "source of truth" accidentally
- Future features will only be added to one
- Technical debt compounds exponentially

**Recommended Solution:**
```typescript
// Create unified component:
export interface PrestigeSystemProps {
  level: number;
  epochId: string;
  prestigeLevel: number;
  prestigePoints: number;
  prestigeResearch: PrestigeResearch;
  totalXp: number;
  onPrestige: () => boolean;
  onBuyUpgrade: (id: string, cost: number, max: number) => boolean;
  variant?: 'compact' | 'expanded';
}

export function PrestigeSystem(props: PrestigeSystemProps) {
  // Single implementation with variant prop
}
```

**Estimated Implementation Effort:** 1 sprint (Medium)

**Responsible Agent:** Frontend Developer

---

### 🟠 HIGH Priority Issues

---

#### Issue #4: No Code Splitting - All Components Loaded Eagerly

| Field | Value |
|-------|-------|
| **Title** | Missing React.lazy() and Suspense for Modal Components |
| **Severity** | 🟠 HIGH |
| **Category** | Bundle Organization |
| **Affected Files** | `src/App.tsx`, `vite.config.ts` |

**Description:**
All modal components are imported statically:
- GachaModal (404 lines)
- TutorialModal (146 lines)
- DailyStreakModal (132 lines)
- DailyRewards (250 lines)
- OfflineRewardModal (168 lines)
- AdsGramButton (237 lines)
- PrestigeSystem (315 lines)
- RebirthSystem (395 lines)

Total: ~2,047 lines of code loaded upfront but rarely needed.

**Why This Matters:**
- Initial bundle size is inflated
- Slower Time to Interactive (TTI)
- Users on slow connections wait longer
- Telegram Mini App guidelines require fast load

**Potential Impact:**
- Higher bounce rates
- Poor Core Web Vitals scores
- User experience degradation
- Lower engagement metrics

**Risk if Ignored:**
- Bundle will continue growing
- Performance issues in production
- Negative app store reviews

**Recommended Solution:**
```typescript
// App.tsx - Use lazy loading
import { lazy, Suspense } from 'react';

const GachaModal = lazy(() => import('./components/GachaModal'));
const TutorialModal = lazy(() => import('./components/TutorialModal'));
const DailyStreakModal = lazy(() => import('./components/DailyStreakModal'));
const SessionAdModal = lazy(() => import('./components/AdSystem').then(m => ({ default: m.SessionAdModal })));

// Usage with fallback
<Suspense fallback={<LoadingSpinner />}>
  {showGacha && <GachaModal {...props} />}
</Suspense>

// vite.config.ts - Add manual chunks
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom'],
        'vendor-supabase': ['@supabase/supabase-js'],
        'vendor-icons': ['lucide-react'],
      },
    },
  },
}
```

**Estimated Implementation Effort:** 1 sprint (Medium)

**Responsible Agent:** Frontend Developer

---

#### Issue #5: Heavy Prop Drilling - No Context API

| Field | Value |
|-------|-------|
| **Title** | Props Passed Through 5+ Component Levels Without Context |
| **Severity** | 🟠 HIGH |
| **Category** | State Management |
| **Affected Files** | `src/App.tsx`, `src/components/*.tsx` |

**Description:**
Game state is passed through component tree manually:
```
App.tsx
  └── TapArea (15 props)
  └── GeneratorShop (5 props)
  └── StatsPanel (6 props)
  └── GachaModal (10 props)
  └── [5+ more components]
```

This creates:
- 60+ props on App.tsx
- Components tightly coupled to parent
- Difficult to test components independently
- Prop changes cause unnecessary re-renders

**Why This Matters:**
- Violates React composition principles
- Components cannot be reused in other contexts
- Debugging prop chains is tedious
- Error-prone when adding new props

**Potential Impact:**
- Performance issues from unnecessary re-renders
- Higher bug risk during refactoring
- Slower development velocity
- Difficult onboarding for new developers

**Risk if Ignored:**
- Will worsen with feature additions
- Becomes technical debt
- Limits future architectural improvements

**Recommended Solution:**
```typescript
// contexts/GameContext.tsx
import { createContext, useContext } from 'react';

interface GameContextType {
  state: GameState;
  epoch: Epoch;
  multipliers: {
    artifacts: ArtifactMultipliers;
    boosters: BoosterMultipliers;
  };
  actions: {
    tap: (x: number, y: number) => void;
    buyGenerator: (id: string) => boolean;
    upgradeTapPower: () => boolean;
    // ... other actions
  };
}

export const GameContext = createContext<GameContextType | null>(null);

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}

// App.tsx
function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

// Child components
function TapArea() {
  const { state, actions } = useGame();
  // Clean, decoupled component
}
```

**Estimated Implementation Effort:** 2 sprints (Medium)

**Responsible Agent:** Frontend Lead

---

#### Issue #6: Duplicate XP Calculation Logic

| Field | Value |
|-------|-------|
| **Title** | calculateXpToLevel() Duplicated in useGame.ts and storage.ts |
| **Severity** | 🟠 HIGH |
| **Category** | Code Quality |
| **Affected Files** | `src/hooks/useGame.ts`, `src/lib/storage.ts` |

**Description:**
XP calculation function exists in two files:
- `src/hooks/useGame.ts` lines 45-86
- `src/lib/storage.ts` lines 29-57

Both implement:
- Epoch-based XP curve calculation
- Progress estimation
- Passive XP estimation
- Identical logic with different variable names

**Why This Matters:**
- DRY (Don't Repeat Yourself) violation
- Bug fix in one place doesn't fix the other
- Different behavior possible if modified inconsistently
- Confuses developers about which to use

**Potential Impact:**
- Feature drift between client and server calculations
- Harder to tune game balance
- Bug probability increases linearly with changes
- Code review overhead

**Risk if Ignored:**
- Production bugs from inconsistent calculations
- Difficulty balancing game economy
- Technical debt accumulation

**Recommended Solution:**
```typescript
// src/utils/gameCalculations.ts
export function calculateXpToLevel(level: number): number {
  const epoch = getCurrentEpochByLevel(level);
  const { min, max } = epoch.levelRange;
  const rangeSize = Math.max(1, max - min + 1);
  const progress = Math.min(1, Math.max(0, (level - min) / rangeSize));
  
  const epochIndex = EPOCHS.findIndex(e => e.id === epoch.id);
  // ... implementation
  
  return Math.max(50, Math.floor(estimatedPassive * targetSeconds));
}

export function estimatePassiveForEpoch(epoch: Epoch, levelInEpoch: number): number {
  // ... shared implementation
}

// Re-export for backward compatibility
export { getBoosterMultipliers } from '../hooks/useGame';
export { getArtifactMultipliers } from '../hooks/useGame';
```

**Estimated Implementation Effort:** 1-2 days (Low)

**Responsible Agent:** Frontend Developer

---

#### Issue #7: No Error Boundaries

| Field | Value |
|-------|-------|
| **Title** | Missing React Error Boundaries for Graceful Degradation |
| **Severity** | 🟠 HIGH |
| **Category** | React Component Structure |
| **Affected Files** | `src/App.tsx`, `src/components/*.tsx` |

**Description:**
No ErrorBoundary component exists in the codebase. Any uncaught exception in a child component will crash the entire application.

**Why This Matters:**
- Single component error crashes entire app
- Poor user experience on errors
- Difficult to diagnose production issues
- Telegram Mini App quality standards require graceful degradation

**Potential Impact:**
- Users stuck on broken screen
- Lost engagement
- Negative reviews
- Support ticket increase

**Risk if Ignored:**
- Production incidents will be severe
- User churn from crashes
- Difficult debugging

**Recommended Solution:**
```typescript
// components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Report to analytics
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-4 text-center">
          <h2 className="text-red-400 font-bold">Щось пішло не так</h2>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-500 rounded"
          >
            Перезавантажити
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Usage in App.tsx
<ErrorBoundary>
  <GameProvider>
    <AppContent />
  </GameProvider>
</ErrorBoundary>
```

**Estimated Implementation Effort:** 1 day (Low)

**Responsible Agent:** Frontend Developer

---

#### Issue #8: Missing Performance Optimizations

| Field | Value |
|-------|-------|
| **Title** | No React.memo() on Reusable Components, Causing Unnecessary Rerenders |
| **Severity** | 🟠 HIGH |
| **Category** | React Component Structure |
| **Affected Files** | `src/App.tsx`, `src/components/*.tsx` |

**Description:**
Components without React.memo():
- TabButton (rendered 6 times, frequently)
- StatCard (rendered in lists)
- BoosterCard (rendered in scrollable list)
- GeneratorShop items (rendered 5+ times per epoch)

Every tap triggers re-renders of all these components due to state updates in App.tsx.

**Why This Matters:**
- TapArea updates state on every tap (60+ fps potential)
- Every state change re-renders entire component tree
- Performance degradation on mobile devices
- Poor user experience with jank

**Potential Impact:**
- 30+ FPS drops during gameplay
- Battery drain from excessive rendering
- Negative user experience
- Poor performance metrics

**Risk if Ignored:**
- Production performance complaints
- User abandonment
- Bad reviews

**Recommended Solution:**
```typescript
// Use React.memo for list components
const TabButton = React.memo(function TabButton({ 
  active, onClick, icon, label, badge 
}: TabButtonProps) {
  return (
    <button className={...}>
      {icon}
      {badge !== undefined && badge > 0 && <span>{badge}</span>}
      {label}
    </button>
  );
});

// Use useMemo for derived data
const ownedLevels = useMemo(() => {
  const map = new Map<string, number>();
  state.ownedGenerators.forEach(og => {
    map.set(og.generatorId, og.level);
  });
  return map;
}, [state.ownedGenerators]);

// Use useCallback for event handlers passed to children
const handleBuy = useCallback((generatorId: string): boolean => {
  return buyGenerator(generatorId);
}, [buyGenerator]);
```

**Estimated Implementation Effort:** 1-2 days (Low)

**Responsible Agent:** Frontend Developer

---

### 🟡 MEDIUM Priority Issues

---

#### Issue #9: Vite Config Missing Production Optimizations

| Field | Value |
|-------|-------|
| **Title** | vite.config.ts Lacks Minification, Tree Shaking, and Chunk Splitting |
| **Severity** | 🟡 MEDIUM |
| **Category** | Vite Build Configuration |
| **Affected Files** | `vite.config.ts` |

**Description:**
Current vite.config.ts:
```typescript
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
```

Missing:
- Build target specification
- Minification options
- Code splitting configuration
- Compression settings
- Environment validation
- Source maps for debugging

**Why This Matters:**
- Larger bundle size
- Slower load times
- No code splitting for vendor libraries
- Debugging difficulties in production

**Potential Impact:**
- Higher bounce rates
- Poor Core Web Vitals
- Higher bandwidth costs

**Recommended Solution:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteCompression } from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    viteCompression({ algorithm: 'gzip' }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ads': ['@adsgram/react'],
          'vendor-icons': ['lucide-react'],
        },
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 500,
    sourcemap: false,
  },
  define: {
    'import.meta.env.STRICT_MODE': JSON.stringify(true),
  },
});
```

**Estimated Implementation Effort:** 1 day (Low)

**Responsible Agent:** DevOps/Frontend

---

#### Issue #10: ESLint Configuration Missing Key Rules

| Field | Value |
|-------|-------|
| **Title** | ESLint Config Doesn't Enforce TypeScript Best Practices |
| **Severity** | 🟡 MEDIUM |
| **Category** | Code Quality |
| **Affected Files** | `eslint.config.js` |

**Description:**
Current ESLint config:
```javascript
rules: {
  'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
}
```

Missing:
- `@typescript-eslint/no-explicit-any`
- `@typescript-eslint/no-unused-vars`
- `react-hooks/exhaustive-deps` (already present but warnings only)
- `no-console` rules for production
- Complexity limits

**Why This Matters:**
- `any` types proliferate unchecked
- Console.log statements in production
- React hooks dependencies may be missed
- Code complexity increases unchecked

**Recommended Solution:**
```javascript
rules: {
  ...reactHooks.configs.recommended.rules,
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  'react-hooks/exhaustive-deps': 'warn',
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true }],
  'max-depth': ['warn', 4],
  'max-params': ['warn', 4],
}
```

**Estimated Implementation Effort:** 2 hours (Low)

**Responsible Agent:** Frontend Developer

---

#### Issue #11: Tailwind Config Missing Design Tokens

| Field | Value |
|-------|-------|
| **Title** | Tailwind Theme Not Using Design System Tokens |
| **Severity** | 🟡 MEDIUM |
| **Category** | Tailwind Styling |
| **Affected Files** | `tailwind.config.js` |

**Description:**
Current Tailwind config is minimal:
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

Missing design tokens:
- Color palette with semantic names
- Typography scale
- Spacing scale
- Border radius definitions
- Animation durations
- Breakpoint definitions

**Why This Matters:**
- Inconsistent styling across components
- Hard to maintain theme consistency
- Difficult to implement dark/light mode
- No clear design system

**Recommended Solution:**
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary palette
        primary: {
          50: '#fef3c7',
          100: '#fde68a',
          // ... full scale
        },
        // Semantic colors
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        // Rarity colors
        rarity: {
          common: '#9ca3af',
          rare: '#3b82f6',
          epic: '#a855f7',
          legendary: '#eab308',
          secret: '#ec4899',
        },
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
      },
    },
  },
  plugins: [],
}
```

**Estimated Implementation Effort:** 2-3 days (Medium)

**Responsible Agent:** Frontend Developer

---

#### Issue #12: Missing Type for GachaReward

| Field | Value |
|-------|-------|
| **Title** | GachaReward Interface Defined Inline Instead of Central Type |
| **Severity** | 🟡 MEDIUM |
| **Category** | TypeScript Type Systems |
| **Affected Files** | `src/components/GachaModal.tsx` |

**Description:**
GachaReward type is defined inline in GachaModal.tsx instead of in the centralized types file:
```typescript
interface GachaReward {
  id: string;
  epoch: string;
  rarity: string;
  parts_granted: number;
  icon: string;
  name: { ua: string; en: string };
}
```

This type should be in `src/types/game.ts` as it's used across components.

**Why This Matters:**
- Type scattered across codebase
- Potential for drift
- Not reusable
- IDE autocomplete limited

**Recommended Solution:**
```typescript
// src/types/game.ts
export interface GachaReward {
  id: string;
  epoch: string;
  rarity: Rarity;
  parts_granted: number;
  icon: string;
  name: { ua: string; en: string };
}

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'secret';
```

**Estimated Implementation Effort:** 1 hour (Low)

**Responsible Agent:** Frontend Developer

---

#### Issue #13: No Test Coverage

| Field | Value |
|-------|-------|
| **Title** | Zero Test Coverage - No Unit or Integration Tests |
| **Severity** | 🟡 MEDIUM |
| **Category** | Code Quality |
| **Affected Files** | All source files |

**Description:**
- 0% test coverage
- No Vitest/Jest configuration
- No React Testing Library setup
- No E2E tests with Playwright
- No component storybooks

**Why This Matters:**
- Bugs go undetected
- Refactoring is risky
- No confidence in changes
- Production incidents likely

**Potential Impact:**
- Higher bug rate
- Slower development
- Fear of change
- Technical debt

**Recommended Solution:**
```typescript
// package.json additions:
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "storybook": "storybook dev -p 6006"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jsdom": "^24.0.0"
  }
}

// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

**Estimated Implementation Effort:** 1-2 sprints (High)

**Responsible Agent:** QA/Frontend Lead

---

### 🟢 LOW Priority Issues

---

#### Issue #14: Inconsistent Component Export Patterns

| Field | Value |
|-------|-------|
| **Title** | Some Components Use Named Exports, Others Default |
| **Severity** | 🟢 LOW |
| **Category** | Code Quality |
| **Affected Files** | `src/components/*.tsx` |

**Description:**
- `TapArea` - named export
- `GachaModal` - named export
- `PrestigeButton` - named export
- `GeneratorShop` - named export
- Some components mix patterns

**Why This Matters:**
- Inconsistent imports
- IDE autocomplete confusion
- Code review overhead

**Recommended Solution:**
Adopt consistent naming convention:
```typescript
// Default export for page-level components
export default function App() { }

// Named exports for reusable components
export function TabButton() { }
export function StatCard() { }
```

**Estimated Implementation Effort:** 2 hours (Low)

**Responsible Agent:** Frontend Developer

---

#### Issue #15: No Lazy Loading for Images

| Field | Value |
|-------|-------|
| **Title** | No Image Optimization - Epoch Icons Load Eagerly |
| **Severity** | 🟢 LOW |
| **Category** | Bundle Organization |
| **Affected Files** | `src/components/TapArea.tsx` |

**Description:**
Emoji-based icons (🏺, ⚔️, 👑, etc.) work well, but if transitioning to image assets:
- No lazy loading implementation
- No image optimization
- No responsive images

**Why This Matters:**
- Future-proofing
- Performance for image assets
- Accessibility improvements

**Recommended Solution:**
```typescript
// When adding image assets:
import { LazyLoadImage } from 'react-lazy-load-image-component';

<LazyLoadImage
  src={epoch.icon}
  alt={epoch.name.ua}
  effect="blur"
  placeholder={<div className="animate-pulse bg-gray-700" />}
/>
```

**Estimated Implementation Effort:** 1 day (Low)

**Responsible Agent:** Frontend Developer

---

#### Issue #16: Missing Environment Validation

| Field | Value |
|-------|-------|
| **Title** | No Runtime Validation for Environment Variables |
| **Severity** | 🟢 LOW |
| **Category** | Vite Build Configuration |
| **Affected Files** | `src/lib/*.ts`, `vite.config.ts` |

**Description:**
Environment variables accessed without validation:
```typescript
const url = import.meta.env.VITE_SUPABASE_URL;
```

If VITE_SUPABASE_URL is missing, app crashes with cryptic error.

**Recommended Solution:**
```typescript
// src/lib/env.ts
const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const;

for (const key of required) {
  if (!import.meta.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
};
```

**Estimated Implementation Effort:** 1 hour (Low)

**Responsible Agent:** Frontend Developer

---

#### Issue #17: No Virtualization for Long Lists

| Field | Value |
|-------|-------|
| **Title** | DailyTasksPanel Uses Full Render - No Virtualization |
| **Severity** | 🟢 LOW |
| **Category** | Bundle Organization |
| **Affected Files** | `src/components/DailyTasksPanel.tsx` |

**Description:**
DailyTasksPanel renders all tasks even if list grows large. No react-window or similar virtualization.

**Recommended Solution:**
```typescript
import { FixedSizeList as List } from 'react-window';

<List
  height={400}
  itemCount={tasks.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <TaskItem task={tasks[index]} />
    </div>
  )}
</List>
```

**Estimated Implementation Effort:** 2 hours (Low)

**Responsible Agent:** Frontend Developer

---

#### Issue #18: Missing Keyboard Accessibility

| Field | Value |
|-------|-------|
| **Title** | Modal Components Lack Keyboard Navigation |
| **Severity** | 🟢 LOW |
| **Category** | React Component Structure |
| **Affected Files** | `src/components/GachaModal.tsx`, `src/components/AdSystem.tsx` |

**Description:**
Modals don't handle:
- Focus trap
- Escape key to close
- Arrow key navigation
- Screen reader announcements

**Recommended Solution:**
```typescript
import { useEffect, useRef } from 'react';

function Modal({ children, onClose }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        // Focus trap logic
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      {children}
    </div>
  );
}
```

**Estimated Implementation Effort:** 2-3 hours (Low)

**Responsible Agent:** Frontend Developer

---

#### Issue #19: Deprecated React Patterns

| Field | Value |
|-------|-------|
| **Title** | Some Code Uses Legacy React Patterns |
| **Severity** | 🟢 LOW |
| **Category** | Code Quality |
| **Affected Files** | `src/App.tsx`, `src/components/*.tsx` |

**Description:**
- Some `useEffect` dependencies missing in eslint-disable comments
- String refs used in some places
- Legacy context API not used despite deep trees

**Recommended Solution:**
- Enable strict ESLint rules
- Gradually migrate to modern patterns
- Use TypeScript's `unknown` instead of `any`

**Estimated Implementation Effort:** 3-4 days (Medium)

**Responsible Agent:** Frontend Developer

---

## Summary & Priority Matrix

### 🔴 Critical (Must Fix Before Launch)

| Issue | Estimated Effort | Impact |
|-------|-----------------|--------|
| #1 Monolithic App.tsx | 3-5 sprints | Dev velocity, bug risk |
| #2 Massive useGame hook | 4-6 sprints | Performance, bundle size |
| #3 Duplicate Prestige/Rebirth | 1 sprint | Maintenance, UX |

### 🟠 High Priority (Sprint 1)

| Issue | Estimated Effort | Impact |
|-------|-----------------|--------|
| #4 No code splitting | 1 sprint | Performance, Core Web Vitals |
| #5 Prop drilling | 2 sprints | Maintainability, testing |
| #6 Duplicate XP calc | 1-2 days | Bug risk, game balance |
| #7 No error boundaries | 1 day | Production stability |
| #8 Missing optimizations | 1-2 days | Performance |

### 🟡 Medium (Sprint 2-3)

| Issue | Estimated Effort | Impact |
|-------|-----------------|--------|
| #9 Vite config | 1 day | Bundle size |
| #10 ESLint gaps | 2 hours | Code quality |
| #11 Tailwind tokens | 2-3 days | Maintainability |
| #12 GachaReward type | 1 hour | Type safety |
| #13 Zero test coverage | 1-2 sprints | Bug detection |

### 🟢 Low (Backlog)

| Issue | Estimated Effort | Impact |
|-------|-----------------|--------|
| #14 Inconsistent exports | 2 hours | Code quality |
| #15 Image lazy loading | 1 day | Future-proofing |
| #16 Env validation | 1 hour | Developer experience |
| #17 List virtualization | 2 hours | Performance |
| #18 Keyboard accessibility | 2-3 hours | A11y |
| #19 Deprecated patterns | 3-4 days | Modernization |

---

## Appendix A: File Complexity Analysis

| File | Lines | Complexity | Maintainability | Priority |
|------|-------|------------|-----------------|----------|
| App.tsx | 650+ | 15 | Poor | 🔴 Critical |
| useGame.ts | 480+ | 18 | Poor | 🔴 Critical |
| storage.ts | 455 | 10 | Fair | 🟠 High |
| RebirthSystem.tsx | 395 | 8 | Fair | 🟠 High |
| GachaModal.tsx | 404 | 8 | Good | 🟡 Medium |
| TapArea.tsx | 363 | 7 | Good | 🟡 Medium |
| AdSystem.tsx | 475 | 8 | Fair | 🟡 Medium |
| PrestigeSystem.tsx | 315 | 6 | Fair | 🟡 Medium |
| ReferralsTab.tsx | 260 | 5 | Good | 🟢 Low |
| AdsGramButton.tsx | 237 | 5 | Good | 🟢 Low |

---

## Appendix B: Bundle Size Estimate

| Chunk | Current | With Optimization |
|-------|---------|-------------------|
| React + ReactDOM | ~130KB | ~130KB (vendor chunk) |
| Supabase | ~200KB | ~200KB (vendor chunk) |
| Lucide Icons | ~50KB | ~30KB (tree-shaken) |
| AdsGram SDK | ~15KB | ~15KB |
| App Code | ~50KB | ~35KB (gzipped) |
| **Total (uncompressed)** | **~445KB** | **~410KB** |
| **Total (gzipped)** | **~135KB** | **~120KB** |

---

## Appendix C: Recommended File Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── BottomNav.tsx
│   │   └── Header.tsx
│   ├── modals/
│   │   ├── AdModals.tsx
│   │   └── ConfirmationModal.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── ProgressBar.tsx
│   │   └── TabButton.tsx
│   └── features/
│       ├── game/
│       │   ├── TapArea.tsx
│       │   ├── GeneratorShop.tsx
│       │   └── StatsPanel.tsx
│       ├── gacha/
│       │   └── GachaModal.tsx
│       ├── prestige/
│       │   └── PrestigeSystem.tsx
│       ├── ads/
│       │   ├── AdSystem.tsx
│       │   └── AdsGramButton.tsx
│       └── social/
│           ├── ReferralsTab.tsx
│           └── Leaderboard.tsx
├── contexts/
│   ├── GameContext.tsx
│   └── UIContext.tsx
├── hooks/
│   ├── useGameState.ts
│   ├── usePassiveIncome.ts
│   ├── useGamePersistence.ts
│   ├── usePrestige.ts
│   ├── useEnergy.ts
│   └── useAdTriggers.ts
├── utils/
│   ├── gameCalculations.ts
│   └── env.ts
├── types/
│   └── game.ts
└── App.tsx
```

---

## Appendix D: Migration Roadmap

### Phase 1: Foundation (Weeks 1-2)
1. Extract types to centralized file (#12)
2. Add environment validation (#16)
3. Implement error boundaries (#7)
4. Add React.memo to list components (#8)
5. Fix ESLint configuration (#10)

### Phase 2: Code Quality (Weeks 3-4)
1. Consolidate PrestigeSystem and RebirthSystem (#3)
2. Extract shared XP calculation (#6)
3. Add Tailwind design tokens (#11)
4. Standardize component exports (#14)

### Phase 3: Architecture (Weeks 5-8)
1. Create GameContext (#5)
2. Split useGame hook (#2)
3. Add code splitting (#4)
4. Refactor App.tsx (#1)

### Phase 4: Polish (Weeks 9-12)
1. Optimize Vite config (#9)
2. Add test infrastructure (#13)
3. Add keyboard accessibility (#18)
4. Add list virtualization (#17)

---

*End of Frontend Architecture Review*
