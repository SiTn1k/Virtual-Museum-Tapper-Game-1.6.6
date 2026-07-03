# Virtual Museum Tapper Game — Architecture Documentation

## Overview

Virtual Museum Tapper is a Telegram Mini App idle/incremental game that combines Ukrainian and World history into an engaging progression system. Built with React, TypeScript, and Supabase for backend services.

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tooling
- **TailwindCSS** - Styling
- **Vitest** - Testing

### Backend (Supabase)
- **Edge Functions** - Serverless API
- **PostgreSQL** - Database
- **RPC Functions** - Server-side logic

### External Integrations
- **Telegram WebApp API** - Mini app integration
- **Adsgram** - Rewarded ads

## Directory Structure

```
/
├── src/
│   ├── components/       # React components
│   │   ├── GameBoard.tsx
│   │   ├── GachaModal.tsx
│   │   ├── GeneratorsPanel.tsx
│   │   ├── Header.tsx
│   │   ├── Leaderboard.tsx
│   │   ├── ProfileModal.tsx
│   │   ├── SettingsModal.tsx
│   │   └── tabs/          # Tab content components
│   ├── data/              # Static game data
│   │   ├── epochs.ts      # Epoch definitions
│   │   └── tasks.ts       # Daily tasks
│   ├── hooks/             # React custom hooks
│   │   ├── useGame.ts     # Main game hook (orchestrator)
│   │   ├── useGenerators.ts # Generator management
│   │   ├── usePrestige.ts # Prestige system
│   │   └── useEnergy.ts   # Energy system
│   ├── lib/               # Utility libraries
│   │   ├── logger.ts      # Structured logging
│   │   ├── storage.ts     # Local/remote storage
│   │   ├── supabase.ts    # Supabase client
│   │   └── telegram.ts    # Telegram API helpers
│   ├── services/          # External services
│   │   └── analytics.ts   # Analytics tracking
│   ├── types/             # TypeScript types
│   │   ├── index.ts       # Re-exports all types
│   │   ├── game.ts        # Game-specific types
│   │   └── liveops.ts     # LiveOps/analytics types
│   ├── App.tsx            # Root component
│   └── main.tsx           # Entry point
├── supabase/
│   └── functions/         # Edge functions
│       ├── _shared/       # Shared code
│       │   └── logger.ts  # Edge logger
│       ├── open-chest/    # Gacha chest logic
│       ├── save-game-state/
│       ├── load-game-state/
│       ├── perform-prestige/
│       └── ...
├── tests/                 # Test files
│   ├── setup.ts           # Test setup
│   └── epochs.test.ts     # Epoch tests
└── .github/
    └── workflows/         # CI/CD
        ├── ci.yml
        └── deploy.yml
```

## Architecture Patterns

### Custom Hooks (useGame as Orchestrator)

The main `useGame` hook orchestrates the game state, delegating specific concerns to smaller hooks:

```
useGame (Orchestrator)
├── useGenerators (Generator purchasing and state)
├── usePrestige (Prestige/rebirth logic)
└── useEnergy (Energy system)
```

This pattern:
- **Separates concerns** into focused hooks
- **Enables testing** of individual features
- **Improves readability** of the main hook
- **Allows reuse** of hooks in different contexts

### Data Flow

```
User Action → Component → useGame Hook → State Update → UI Re-render
                                    ↓
                              Server Sync (if needed)
```

### State Management

- **React useState** - Local state
- **Refs** - Mutable values (intervals, save state)
- **Props drilling** - Minimal, through context or direct props

### Persistence Strategy

| Data Type | Storage | Interval |
|----------|---------|----------|
| Game State | LocalStorage + Remote | 2s local, 15s remote |
| Analytics | Remote via Edge Function | Batched, 5s |
| Leaderboard | Remote only | On demand |

## Key Systems

### Epoch System

20 epochs covering Ukrainian and World history:

| Era | Epochs | Rebirth Required |
|-----|--------|------------------|
| Ukrainian | 1-12 | 0 |
| World History | 13-20 | 1+ |

Each epoch has:
- 5 generators with scaling costs
- Unique currency and theme
- Unlock requirements

### Gacha/Chest System

- **Daily Chest** - Free, respawns daily
- **Bronze Chest** - Cheap, basic drops
- **Silver Chest** - Mid-tier, better rates
- **Gold Chest** - Premium, rare drops
- **Sky Chest** - Epic, highest rarity

Drop rates scale with epoch (Phase 9 enhancement):
- Epochs 1-4: Base rates
- Epochs 5-8: +0.5% rare
- Epochs 9-12: +1% rare
- Epochs 13-16: +1.5% rare
- Epochs 17-20: +2% rare

### Prestige System (Rebirth)

Unlocks at Level 950, Epoch 20 (Independence).

Benefits:
- Prestige Points for permanent upgrades
- Access to World History epochs
- Energy system activation

Upgrades:
- Starting Capital
- Energy Capacity
- Tap Booster
- Generator Boost
- Artifact Bonus

### Energy System

Available after Prestige 1+.

Mechanics:
- Tap costs 1 energy
- Energy regenerates: +10 per 30 seconds
- Multiplier: 1x at low energy, 5x at high energy

### Artifact Collection

- Collect parts from gacha
- Complete sets for permanent bonuses
- Duplicates upgrade artifact levels

## API Design

### Edge Functions

| Function | Purpose | Auth |
|----------|---------|------|
| `open-chest` | Gacha chest logic | Telegram ID |
| `save-game-state` | Persist game state | Telegram ID |
| `load-game-state` | Load game state | Telegram ID |
| `perform-prestige` | Execute rebirth | Telegram ID |
| `track-analytics` | Analytics events | None |

### Client-Side RPC

| Function | Purpose |
|----------|---------|
| `rpc_buy_generator` | Buy generator |
| `rpc_record_taps` | Record tap batch |
| `rpc_validate_passive_xp` | Validate passive XP |

## Testing Strategy

### Unit Tests (Vitest)

```bash
npm test              # Watch mode
npm run test:run     # Single run
npm run test:coverage # With coverage
```

Test files:
- `tests/epochs.test.ts` - Epoch data validation
- Additional tests can be added

### Test Coverage Goals

| Type | Current | Target |
|------|---------|--------|
| Statements | 50%+ | 80% |
| Branches | 50%+ | 80% |
| Functions | 50%+ | 80% |
| Lines | 50%+ | 80% |

## CI/CD Pipeline

### GitHub Actions

#### CI Workflow (`.github/workflows/ci.yml`)

Runs on every push/PR:
1. Set up Node 20
2. Install dependencies
3. Run lint
4. Run typecheck
5. Run build
6. Run tests

#### Deploy Workflow (`.github/workflows/deploy.yml`)

Manual trigger:
1. Build the project
2. Deploy to hosting

## Code Quality

### Pre-commit Hooks

```bash
# Pre-commit (lint-staged)
- ESLint fix (TS/TSX)
- Prettier format

# Commit-msg
- Validate Conventional Commits format
```

### Commit Format

```
<type>(<scope>): <subject>

Types: feat, fix, docs, style, refactor, test, chore, perf, ci, revert
```

## Logging

### Client Logger (`src/lib/logger.ts`)

- Structured logging with levels
- Color-coded output
- Optional remote transport
- Batched remote sends

### Edge Logger (`supabase/functions/_shared/logger.ts`)

- Deno-compatible
- Function-prefixed messages
- Error serialization
- Optional remote transport

## Analytics

### Event Categories

- **Progression**: level_up, epoch_unlock, prestige
- **Economy**: currency_earned, currency_spent, generator_purchase
- **Engagement**: session_start, session_end, ad_watched
- **Commerce**: offer_viewed, offer_purchased, iap_completed
- **Social**: referral_sent, leaderboard_viewed

### Tracking Flow

```
trackEvent() → Batch Queue → flushEvents() → Edge Function → Database
                                         ↓
                                    localStorage (backup)
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |

## Future Enhancements

1. **Season System** - Time-limited events with rewards
2. **Clans/Guilds** - Social features
3. **PvP Leagues** - Competitive mode
4. **Achievement Milestones** - Goals with rewards
5. **Daily Challenges** - Limited-time objectives
