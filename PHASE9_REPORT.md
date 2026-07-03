# Phase 9: Chest Drop Rate Balance - Implementation Report

## Overview
Implemented epoch-based tier bonus system where later epochs provide slightly better artifact drop rates, particularly for rare items.

## Changes Made

### 1. Server-side Changes (`supabase/functions/open-chest/index.ts`)

#### Added `getEpochRareBonus` function
```typescript
function getEpochRareBonus(epochIndex: number): number {
  if (epochIndex >= 16) return 2.0;      // Epochs 17-20: +2%
  if (epochIndex >= 12) return 1.5;      // Epochs 13-16: +1.5%
  if (epochIndex >= 8) return 1.0;       // Epochs 9-12: +1%
  if (epochIndex >= 4) return 0.5;       // Epochs 5-8: +0.5%
  return 0;                              // Epochs 1-4: Base rates
}
```

#### Updated `rollRarity` function
- Added `epochIndex` parameter (0-based)
- Implements epoch-based rare bonus by shifting probability from Common to Rare
- Secret, Epic, and Legendary chances remain unchanged

#### Updated `generateRewards` function
- Added `epochIndex` parameter
- Passes epoch index to `rollRarity` for bonus calculation

#### Updated request handler
- Passes `epoch_index` from request to `generateRewards`

### 2. Client-side Changes (`src/components/GachaModal.tsx`)

#### Added `getEpochRareBonus` function (mirrors server-side)
Same implementation as server for consistent client display.

#### Added `getDropRates` function
Returns dynamic drop rates based on epoch and prestige level for display.

#### Updated GachaModal UI
- Changed static "Шанси" display to dynamic rates based on current epoch
- Shows epoch bonus notification when applicable
- Example: Epoch 13+ shows "Бонус епохи: +1.5% рідкісних"

## Drop Rate Tables

### Epochs 1-4 (Base Rates)
| Rarity | Chance |
|--------|--------|
| Common | 60% |
| Rare | 25% |
| Epic | 10% |
| Legendary | 4% |
| Secret | 1% (if prestige ≥ 1) |

### Epochs 5-8 (+0.5% Rare)
| Rarity | Chance |
|--------|--------|
| Common | 59.5% |
| Rare | 25.5% |
| Epic | 10% |
| Legendary | 4% |
| Secret | 1% (if prestige ≥ 1) |

### Epochs 9-12 (+1% Rare)
| Rarity | Chance |
|--------|--------|
| Common | 59% |
| Rare | 26% |
| Epic | 10% |
| Legendary | 4% |
| Secret | 1% (if prestige ≥ 1) |

### Epochs 13-16 (+1.5% Rare)
| Rarity | Chance |
|--------|--------|
| Common | 58.5% |
| Rare | 26.5% |
| Epic | 10% |
| Legendary | 4% |
| Secret | 1% (if prestige ≥ 1) |

### Epochs 17-20 (+2% Rare)
| Rarity | Chance |
|--------|--------|
| Common | 58% |
| Rare | 27% |
| Epic | 10% |
| Legendary | 4% |
| Secret | 1% (if prestige ≥ 1) |

## Implementation Notes

1. **Backward Compatibility**: Default `epochIndex = 0` maintains base rates for any legacy requests
2. **Additive Bonuses**: Epoch bonus stacks with chest ad bonus and prestige research bonuses
3. **UI Consistency**: Client-side function mirrors server-side for accurate display
4. **Secret Unchanged**: Epoch bonus only affects Common → Rare shift, not Secret chance

## Testing Considerations

1. Verify drop rates match between client display and server rolls
2. Test across multiple epochs to confirm bonus application
3. Verify backward compatibility with older requests

## Files Modified

- `supabase/functions/open-chest/index.ts` - Server-side drop rate logic
- `src/components/GachaModal.tsx` - Client display of rates

## Files Created

- `PHASE9_REPORT.md` - This documentation
