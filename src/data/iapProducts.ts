/**
 * Virtual Museum Tapper Game — IAP Products Data
 * Production-ready monetization offerings
 */

import type {
  IAPProduct,
  OfferType,
} from '../types/liveops';

// ============================================================================
// STARTER PACKS (Entry-level IAP)
// ============================================================================

const STARTER_PACKS: IAPProduct[] = [
  {
    id: 'starter_pack_basic',
    type: 'starter_pack',
    name: { ua: 'Стартовий Набір', en: 'Starter Pack' },
    description: { ua: 'Ідеальний старт! Включає валюту та бустери.', en: 'Perfect start! Includes currency and boosters.' },
    priceStars: 50,
    priceUSD: 0.50,
    items: [
      { type: 'currency', amount: 5000 },
      { type: 'booster', amount: 1, duration: 3600000 }, // 1hr XP boost
    ],
    displayConditions: {
      maxLevel: 10,
      firstPurchaseOnly: true,
    },
    sortOrder: 1,
    isFeatured: true,
    analyticsId: 'starter_basic',
  },
  {
    id: 'starter_pack_deluxe',
    type: 'starter_pack',
    name: { ua: 'Делюкс Старт', en: 'Deluxe Starter' },
    description: { ua: 'Більше всього для швидкого старту!', en: 'More everything for a fast start!' },
    priceStars: 150,
    priceUSD: 1.50,
    items: [
      { type: 'currency', amount: 20000 },
      { type: 'booster', amount: 1, duration: 7200000 }, // 2hr XP boost
      { type: 'gacha_ticket', amount: 3 },
    ],
    displayConditions: {
      maxLevel: 20,
      firstPurchaseOnly: true,
    },
    sortOrder: 2,
    isFeatured: true,
    analyticsId: 'starter_deluxe',
  },
];

// ============================================================================
// CURRENCY BUNDLES
// ============================================================================

const CURRENCY_BUNDLES: IAPProduct[] = [
  {
    id: 'coins_small',
    type: 'currency_bundle',
    name: { ua: '10K Монет', en: '10K Coins' },
    description: { ua: 'Невеликий пакет монет для покупок', en: 'Small coin pack for purchases' },
    priceStars: 20,
    priceUSD: 0.20,
    items: [
      { type: 'currency', amount: 10000 },
    ],
    sortOrder: 1,
    analyticsId: 'coins_small',
  },
  {
    id: 'coins_medium',
    type: 'currency_bundle',
    name: { ua: '50K Монет', en: '50K Coins' },
    description: { ua: 'Середній пакет монет', en: 'Medium coin pack' },
    priceStars: 90,
    priceUSD: 0.90,
    items: [
      { type: 'currency', amount: 50000 },
    ],
    sortOrder: 2,
    analyticsId: 'coins_medium',
  },
  {
    id: 'coins_large',
    type: 'currency_bundle',
    name: { ua: '100K Монет', en: '100K Coins' },
    description: { ua: 'Великий пакет монет', en: 'Large coin pack' },
    priceStars: 170,
    priceUSD: 1.70,
    items: [
      { type: 'currency', amount: 100000 },
    ],
    sortOrder: 3,
    isFeatured: true,
    analyticsId: 'coins_large',
  },
  {
    id: 'coins_mega',
    type: 'currency_bundle',
    name: { ua: '500K Монет', en: '500K Coins' },
    description: { ua: 'Мега пакет монет', en: 'Mega coin pack' },
    priceStars: 800,
    priceUSD: 8.00,
    items: [
      { type: 'currency', amount: 500000 },
    ],
    sortOrder: 4,
    analyticsId: 'coins_mega',
  },
  {
    id: 'coins_ultimate',
    type: 'currency_bundle',
    name: { ua: '1M Монет', en: '1M Coins' },
    description: { ua: 'Ультимативний пакет монет', en: 'Ultimate coin pack' },
    priceStars: 1500,
    priceUSD: 15.00,
    items: [
      { type: 'currency', amount: 1000000 },
    ],
    sortOrder: 5,
    isFeatured: true,
    analyticsId: 'coins_ultimate',
  },
];

// ============================================================================
// ENERGY PACKS
// ============================================================================

const ENERGY_PACKS: IAPProduct[] = [
  {
    id: 'energy_small',
    type: 'energy_pack',
    name: { ua: 'Мала Енергія', en: 'Small Energy' },
    description: { ua: '500 енергії для тапання', en: '500 energy for tapping' },
    priceStars: 30,
    priceUSD: 0.30,
    items: [
      { type: 'energy', amount: 500 },
    ],
    displayConditions: {
      minLevel: 50, // Only available after prestige
    },
    sortOrder: 1,
    analyticsId: 'energy_small',
  },
  {
    id: 'energy_medium',
    type: 'energy_pack',
    name: { ua: 'Середня Енергія', en: 'Medium Energy' },
    description: { ua: '1500 енергії для тапання', en: '1500 energy for tapping' },
    priceStars: 80,
    priceUSD: 0.80,
    items: [
      { type: 'energy', amount: 1500 },
    ],
    displayConditions: {
      minLevel: 50,
    },
    sortOrder: 2,
    isFeatured: true,
    analyticsId: 'energy_medium',
  },
  {
    id: 'energy_large',
    type: 'energy_pack',
    name: { ua: 'Велика Енергія', en: 'Large Energy' },
    description: { ua: '5000 енергії для тапання', en: '5000 energy for tapping' },
    priceStars: 250,
    priceUSD: 2.50,
    items: [
      { type: 'energy', amount: 5000 },
    ],
    displayConditions: {
      minLevel: 50,
    },
    sortOrder: 3,
    analyticsId: 'energy_large',
  },
  {
    id: 'energy_max',
    type: 'energy_pack',
    name: { ua: 'Максимальна Енергія', en: 'Maximum Energy' },
    description: { ua: 'Повне відновлення енергії', en: 'Full energy restore' },
    priceStars: 150,
    priceUSD: 1.50,
    items: [
      { type: 'energy', amount: 999999 }, // Will be set to max
    ],
    displayConditions: {
      minLevel: 50,
    },
    sortOrder: 4,
    analyticsId: 'energy_max',
  },
];

// ============================================================================
// BOOSTER BUNDLES
// ============================================================================

const BOOSTER_BUNDLES: IAPProduct[] = [
  {
    id: 'booster_xp_1hr',
    type: 'booster_bundle',
    name: { ua: 'XP Бустер 1 год', en: 'XP Booster 1hr' },
    description: { ua: 'Подвійний XP на 1 годину', en: 'Double XP for 1 hour' },
    priceStars: 50,
    priceUSD: 0.50,
    items: [
      { type: 'booster', amount: 1, duration: 3600000 },
    ],
    sortOrder: 1,
    analyticsId: 'booster_xp_1hr',
  },
  {
    id: 'booster_xp_3hr',
    type: 'booster_bundle',
    name: { ua: 'XP Бустер 3 год', en: 'XP Booster 3hr' },
    description: { ua: 'Подвійний XP на 3 години', en: 'Double XP for 3 hours' },
    priceStars: 120,
    priceUSD: 1.20,
    items: [
      { type: 'booster', amount: 1, duration: 10800000 },
    ],
    sortOrder: 2,
    isFeatured: true,
    analyticsId: 'booster_xp_3hr',
  },
  {
    id: 'booster_xp_24hr',
    type: 'booster_bundle',
    name: { ua: 'XP Бустер 24 год', en: 'XP Booster 24hr' },
    description: { ua: 'Подвійний XP на 24 години', en: 'Double XP for 24 hours' },
    priceStars: 300,
    priceUSD: 3.00,
    items: [
      { type: 'booster', amount: 1, duration: 86400000 },
    ],
    sortOrder: 3,
    analyticsId: 'booster_xp_24hr',
  },
  {
    id: 'booster_super_1hr',
    type: 'booster_bundle',
    name: { ua: 'Супер Бустер 1 год', en: 'Super Booster 1hr' },
    description: { ua: 'Потрійний XP+Валюта на 1 годину', en: 'Triple XP+Currency for 1 hour' },
    priceStars: 100,
    priceUSD: 1.00,
    items: [
      { type: 'booster', amount: 1, duration: 3600000 },
    ],
    sortOrder: 4,
    analyticsId: 'booster_super_1hr',
  },
  {
    id: 'booster_super_3hr',
    type: 'booster_bundle',
    name: { ua: 'Супер Бустер 3 год', en: 'Super Booster 3hr' },
    description: { ua: 'Потрійний XP+Валюта на 3 години', en: 'Triple XP+Currency for 3 hours' },
    priceStars: 250,
    priceUSD: 2.50,
    items: [
      { type: 'booster', amount: 1, duration: 10800000 },
    ],
    sortOrder: 5,
    isFeatured: true,
    analyticsId: 'booster_super_3hr',
  },
];

// ============================================================================
// ARTIFACT PACKS
// ============================================================================

const ARTIFACT_PACKS: IAPProduct[] = [
  {
    id: 'artifact_random_5',
    type: 'artifact_pack',
    name: { ua: '5 Випадкових Фрагментів', en: '5 Random Fragments' },
    description: { ua: '5 випадкових фрагментів артефактів', en: '5 random artifact fragments' },
    priceStars: 50,
    priceUSD: 0.50,
    items: [
      { type: 'artifact_fragment', amount: 5 },
    ],
    sortOrder: 1,
    analyticsId: 'artifact_random_5',
  },
  {
    id: 'artifact_epic_10',
    type: 'artifact_pack',
    name: { ua: '10 Фрагментів Епічних', en: '10 Epic Fragments' },
    description: { ua: '10 фрагментів епічних або кращих артефактів', en: '10 epic or better artifact fragments' },
    priceStars: 200,
    priceUSD: 2.00,
    items: [
      { type: 'artifact_fragment', amount: 10, rarity: 'epic' },
    ],
    sortOrder: 2,
    isFeatured: true,
    analyticsId: 'artifact_epic_10',
  },
  {
    id: 'artifact_legendary_15',
    type: 'artifact_pack',
    name: { ua: '15 Фрагментів Легендарних', en: '15 Legendary Fragments' },
    description: { ua: '15 фрагментів легендарних артефактів', en: '15 legendary artifact fragments' },
    priceStars: 500,
    priceUSD: 5.00,
    items: [
      { type: 'artifact_fragment', amount: 15, rarity: 'legendary' },
    ],
    sortOrder: 3,
    analyticsId: 'artifact_legendary_15',
  },
  {
    id: 'artifact_guaranteed_legendary',
    type: 'artifact_pack',
    name: { ua: 'Гарантований Легендарний', en: 'Guaranteed Legendary' },
    description: { ua: '1 гарантований легендарний артефакт!', en: '1 guaranteed legendary artifact!' },
    priceStars: 800,
    priceUSD: 8.00,
    items: [
      { type: 'artifact_fragment', amount: 30, rarity: 'legendary' },
    ],
    sortOrder: 4,
    analyticsId: 'artifact_guaranteed_legendary',
  },
];

// ============================================================================
// LIMITED OFFERS
// ============================================================================

const LIMITED_OFFERS: IAPProduct[] = [
  {
    id: 'flash_sale_small',
    type: 'limited_offer',
    name: { ua: '⚡ Флеш Sale!', en: '⚡ Flash Sale!' },
    description: { ua: '50% знижка! Обмежена кількість!', en: '50% off! Limited quantity!' },
    priceStars: 100,
    priceUSD: 1.00,
    items: [
      { type: 'currency', amount: 100000 },
      { type: 'booster', amount: 1, duration: 7200000 },
    ],
    isLimited: true,
    limitedQuantity: 100,
    sortOrder: 1,
    isFeatured: true,
    analyticsId: 'flash_sale_small',
  },
  {
    id: 'weekend_bundle',
    type: 'limited_offer',
    name: { ua: '🎉 Вихідний Набір', en: '🎉 Weekend Bundle' },
    description: { ua: 'Тільки на вихідні! Особлива ціна!', en: 'Weekends only! Special price!' },
    priceStars: 250,
    priceUSD: 2.50,
    items: [
      { type: 'currency', amount: 200000 },
      { type: 'booster', amount: 1, duration: 14400000 },
      { type: 'gacha_ticket', amount: 5 },
    ],
    isLimited: true,
    sortOrder: 2,
    isFeatured: true,
    analyticsId: 'weekend_bundle',
  },
  {
    id: 'holiday_special',
    type: 'limited_offer',
    name: { ua: '🎄 Святковий Спеціальний', en: '🎄 Holiday Special' },
    description: { ua: 'Святкові нагороди! Обмежений час!', en: 'Holiday rewards! Limited time!' },
    priceStars: 400,
    priceUSD: 4.00,
    items: [
      { type: 'currency', amount: 400000 },
      { type: 'booster', amount: 1, duration: 86400000 },
      { type: 'artifact_fragment', amount: 20, rarity: 'rare' },
    ],
    isLimited: true,
    sortOrder: 3,
    analyticsId: 'holiday_special',
  },
];

// ============================================================================
// BUNDLES (Mixed products)
// ============================================================================

const BUNDLES: IAPProduct[] = [
  {
    id: 'artifact_hunter_bundle',
    type: 'bundle',
    name: { ua: '🏺 Набір Шукача Артефактів', en: '🏺 Artifact Hunter Bundle' },
    description: { ua: 'Все для колекціонера артефактів', en: 'Everything for artifact collectors' },
    priceStars: 500,
    priceUSD: 5.00,
    items: [
      { type: 'currency', amount: 300000 },
      { type: 'artifact_fragment', amount: 30, rarity: 'epic' },
      { type: 'gacha_ticket', amount: 5 },
    ],
    sortOrder: 1,
    isFeatured: true,
    analyticsId: 'artifact_hunter_bundle',
  },
  {
    id: 'epoch_explorer_bundle',
    type: 'bundle',
    name: { ua: '🗺️ Набір Дослідника Епох', en: '🗺️ Epoch Explorer Bundle' },
    description: { ua: 'Прискорене проходження епох', en: 'Faster epoch progression' },
    priceStars: 800,
    priceUSD: 8.00,
    items: [
      { type: 'currency', amount: 500000 },
      { type: 'booster', amount: 1, duration: 172800000 }, // 48hr super boost
      { type: 'artifact_fragment', amount: 15, rarity: 'legendary' },
    ],
    sortOrder: 2,
    isFeatured: true,
    analyticsId: 'epoch_explorer_bundle',
  },
  {
    id: 'premium_collection_bundle',
    type: 'bundle',
    name: { ua: '👑 Преміум Колекція', en: '👑 Premium Collection' },
    description: { ua: 'Найкращий набір для серйозних гравців', en: 'Best bundle for serious players' },
    priceStars: 2000,
    priceUSD: 20.00,
    items: [
      { type: 'currency', amount: 1500000 },
      { type: 'booster', amount: 1, duration: 604800000 }, // 7-day super boost
      { type: 'artifact_fragment', amount: 50, rarity: 'legendary' },
      { type: 'gacha_ticket', amount: 20 },
    ],
    sortOrder: 3,
    isFeatured: true,
    analyticsId: 'premium_collection_bundle',
  },
  {
    id: 'value_essentials_bundle',
    type: 'bundle',
    name: { ua: '📦 Цінний Набір', en: '📦 Value Essentials' },
    description: { ua: 'Найкраще співвідношення ціни та якості', en: 'Best value for money' },
    priceStars: 300,
    priceUSD: 3.00,
    items: [
      { type: 'currency', amount: 200000 },
      { type: 'booster', amount: 1, duration: 21600000 }, // 6hr super boost
      { type: 'gacha_ticket', amount: 3 },
    ],
    sortOrder: 4,
    analyticsId: 'value_essentials_bundle',
  },
];

// ============================================================================
// PRODUCT REGISTRY
// ============================================================================

export const ALL_IAP_PRODUCTS: IAPProduct[] = [
  ...STARTER_PACKS,
  ...CURRENCY_BUNDLES,
  ...ENERGY_PACKS,
  ...BOOSTER_BUNDLES,
  ...ARTIFACT_PACKS,
  ...LIMITED_OFFERS,
  ...BUNDLES,
];

// Build lookup map
const PRODUCT_MAP: Record<string, IAPProduct> = {};
for (const product of ALL_IAP_PRODUCTS) {
  PRODUCT_MAP[product.id] = product;
}
export function getProductById(id: string): IAPProduct | undefined {
  return PRODUCT_MAP[id];
}

export function getProductsByType(type: OfferType): IAPProduct[] {
  return ALL_IAP_PRODUCTS.filter(p => p.type === type);
}

export function getFeaturedProducts(): IAPProduct[] {
  return ALL_IAP_PRODUCTS.filter(p => p.isFeatured);
}

export function getLimitedProducts(): IAPProduct[] {
  return ALL_IAP_PRODUCTS.filter(p => p.isLimited);
}

// ============================================================================
// PRODUCT FILTERING
// ============================================================================

/**
 * Filter products based on player state and conditions
 */
export function filterProductsForPlayer(
  products: IAPProduct[],
  playerState: {
    level: number;
    prestigeLevel: number;
    isPaying: boolean;
    previousPurchases: string[];
  }
): IAPProduct[] {
  return products.filter(product => {
    const conditions = product.displayConditions;
    if (!conditions) return true;
    
    // Level check
    if (conditions.minLevel && playerState.level < conditions.minLevel) {
      return false;
    }
    if (conditions.maxLevel && playerState.level > conditions.maxLevel) {
      return false;
    }
    
    // Prestige check
    if (conditions.minPrestige && playerState.prestigeLevel < conditions.minPrestige) {
      return false;
    }
    
    // First purchase only
    if (conditions.firstPurchaseOnly) {
      const hasPurchased = playerState.previousPurchases.some(id => {
        const p = getProductById(id);
        return p?.type === product.type;
      });
      if (hasPurchased) return false;
    }
    
    // Segment check
    if (conditions.segments && conditions.segments.length > 0) {
      // Would need player segments here - placeholder
      return true;
    }
    
    return true;
  });
}

/**
 * Sort products by sort order
 */
export function getSortedProducts(products: IAPProduct[]): IAPProduct[] {
  return [...products].sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Get available products for player
 */
export function getAvailableProducts(playerState: {
  level: number;
  prestigeLevel: number;
  isPaying: boolean;
  previousPurchases: string[];
}): IAPProduct[] {
  const filtered = filterProductsForPlayer(ALL_IAP_PRODUCTS, playerState);
  return getSortedProducts(filtered);
}

// ============================================================================
// VALUE CALCULATIONS
// ============================================================================

/**
 * Calculate value per star for a product
 */
export function calculateValuePerStar(product: IAPProduct): number {
  let totalValue = 0;
  const totalStars = product.priceStars;
  
  for (const item of product.items) {
    switch (item.type) {
      case 'currency':
        totalValue += item.amount;
        break;
      case 'energy':
        // Energy valued at roughly 1 star per 100 energy
        totalValue += item.amount / 100;
        break;
      case 'booster':
        // Booster valued at equivalent XP boost
        // 1 hour = ~50 currency equivalent
        totalValue += (item.duration / 3600000) * 50;
        break;
      case 'gacha_ticket':
        // Gacha ticket valued at chest cost (~300 currency)
        totalValue += item.amount * 300;
        break;
      case 'artifact_fragment':
        // Fragment valued at 20 currency each
        totalValue += item.amount * 20;
        break;
      default:
        break;
    }
  }
  
  return totalValue / totalStars;
}

/**
 * Get products sorted by value per star
 */
export function getBestValueProducts(limit: number = 5): IAPProduct[] {
  return ALL_IAP_PRODUCTS
    .map(p => ({
      product: p,
      value: calculateValuePerStar(p),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map(item => item.product);
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Format price for display
 */
export function formatPrice(product: IAPProduct): string {
  if (product.priceStars >= 1000) {
    return `${(product.priceStars / 100).toFixed(1)}K ⭐`;
  }
  return `${product.priceStars} ⭐`;
}

/**
 * Format price in USD
 */
export function formatUSDPrice(product: IAPProduct): string {
  return `$${product.priceUSD.toFixed(2)}`;
}

/**
 * Get products by category for display
 */
export function getProductsByCategory(category: 'currency' | 'boosters' | 'artifacts' | 'bundles' | 'limited'): IAPProduct[] {
  const typeMap: Record<string, OfferType[]> = {
    currency: ['currency_bundle', 'energy_pack'],
    boosters: ['booster_bundle'],
    artifacts: ['artifact_pack'],
    bundles: ['starter_pack', 'bundle'],
    limited: ['limited_offer'],
  };
  
  const types = typeMap[category] || [];
  return ALL_IAP_PRODUCTS.filter(p => types.includes(p.type));
}
