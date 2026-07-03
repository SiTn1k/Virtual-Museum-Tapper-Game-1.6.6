import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { validateRequest } from "../_shared/validate-init-data.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

/**
 * Open Chest Edge Function
 *
 * Server-authoritative chest/skychest opening.
 * Generates artifact fragment rewards with proper rarity chances.
 *
 * BASE Rarity chances:
 * - Common: 60%
 * - Rare: 25%
 * - Epic: 10%
 * - Legendary: 4%
 * - Secret: 1% (only if prestige_level >= requiredPrestige)
 *
 * EPOCH-BASED RARE BONUS (Phase 9):
 * - Epochs 1-4 (indices 0-3): Base rates
 * - Epochs 5-8 (indices 4-7): +0.5% rare chance
 * - Epochs 9-12 (indices 8-11): +1% rare chance
 * - Epochs 13-16 (indices 12-15): +1.5% rare chance
 * - Epochs 17-20 (indices 16-19): +2% rare chance
 *
 * Secret artifact chance scales with prestige research:
 * - Base: 1%
 * - +5% per "rare_artifact_chance" research level (max 10 levels = +50% = 1.5% total)
 *
 * PITY SYSTEM (Phase 20):
 * - 50th chest without Epic+: Guaranteed Epic or higher
 * - 200th chest without Legendary: Guaranteed Legendary
 * - Pity resets on each guaranteed drop
 *
 * Rewards: 1-3 artifact fragments for a random artifact from current epoch
 */

// Pity system constants
const PITY_EPIC_THRESHOLD = 50;      // Guaranteed Epic+ after 50 chests
const PITY_LEGENDARY_THRESHOLD = 200; // Guaranteed Legendary after 200 chests

/**
 * Get epoch-based rare bonus percentage
 * Later epochs get slightly better rare drop rates
 */
function getEpochRareBonus(epochIndex: number): number {
  if (epochIndex >= 16) return 2.0;      // Epochs 17-20: +2%
  if (epochIndex >= 12) return 1.5;      // Epochs 13-16: +1.5%
  if (epochIndex >= 8) return 1.0;       // Epochs 9-12: +1%
  if (epochIndex >= 4) return 0.5;       // Epochs 5-8: +0.5%
  return 0;                              // Epochs 1-4: Base rates
}

interface OpenChestRequest {
  telegram_id: number;
  epoch_id: string;
  chest_type?: "skychest" | "daily"; // skychest = premium, daily = free
  epoch_index?: number; // For cost calculation: 0-based epoch order
  init_data: string;
}

interface ArtifactDrop {
  id: string;
  epoch: string;
  rarity: string;
  parts_granted: number;
  icon: string;
  name: { ua: string; en: string };
}

interface OpenChestResponse {
  success: boolean;
  error?: string;
  rewards?: ArtifactDrop[];
  chest_type?: string;
}

// Artifact definitions — MUST MATCH epochs.ts frontend exactly
const ARTIFACTS: Array<{
  id: string;
  epoch: string;
  rarity: "common" | "rare" | "epic" | "legendary" | "secret";
  parts: number;
  bonus: { type: string; value: number };
  icon: string;
  name: { ua: string; en: string };
  requiredPrestige?: number;
}> = [
  // Ukrainian Artifacts (Epochs 1-12)
  // Trypillia
  { id: "trypillia_vase", epoch: "trypillia", rarity: "common", parts: 10, bonus: { type: "passive_boost", value: 1.05 }, icon: "🏺", name: { ua: "Трипільський посуд", en: "Trypillian Vessel" } },
  { id: "trypillia_idol", epoch: "trypillia", rarity: "rare", parts: 10, bonus: { type: "xp_multiplier", value: 1.10 }, icon: "🕉️", name: { ua: "Богиня-Мати", en: "Mother Goddess" } },
  // Scythia
  { id: "scythian_gold", epoch: "scythia", rarity: "common", parts: 10, bonus: { type: "currency_multiplier", value: 1.05 }, icon: "💰", name: { ua: "Скіфське золото", en: "Scythian Gold" } },
  { id: "scythian_sword", epoch: "scythia", rarity: "rare", parts: 10, bonus: { type: "xp_multiplier", value: 1.10 }, icon: "⚔️", name: { ua: "Скіфський меч", en: "Scythian Sword" } },
  { id: "scythian_amulet", epoch: "scythia", rarity: "legendary", parts: 10, bonus: { type: "passive_boost", value: 1.15 }, icon: "🦌", name: { ua: "Золотий олень", en: "Golden Stag" } },
  // Antiquity
  { id: "greek_coin", epoch: "antiquity", rarity: "common", parts: 10, bonus: { type: "currency_multiplier", value: 1.05 }, icon: "🪙", name: { ua: "Грецька монета", en: "Greek Coin" } },
  { id: "greek_amphora", epoch: "antiquity", rarity: "rare", parts: 10, bonus: { type: "passive_boost", value: 1.08 }, icon: "🏺", name: { ua: "Глек для вина", en: "Wine Amphora" } },
  { id: "chersonesus_coin", epoch: "antiquity", rarity: "epic", parts: 10, bonus: { type: "xp_multiplier", value: 1.12 }, icon: "🪙", name: { ua: "Херсонеська монета", en: "Chersonesus Coin" } },
  // Kyiv Rus
  { id: "rus_currency", epoch: "kyiv_rus", rarity: "common", parts: 10, bonus: { type: "currency_multiplier", value: 1.05 }, icon: "₴", name: { ua: "Київська гривня", en: "Kyivan Hryvnia" } },
  { id: "sophia_icon", epoch: "kyiv_rus", rarity: "rare", parts: 10, bonus: { type: "xp_multiplier", value: 1.10 }, icon: "☦️", name: { ua: "Ікона Софії", en: "Sophia Icon" } },
  { id: "yaroslav_book", epoch: "kyiv_rus", rarity: "legendary", parts: 10, bonus: { type: "passive_boost", value: 1.15 }, icon: "📜", name: { ua: "Закон Ярослава", en: "Yaroslav's Law" } },
  // Halych-Volhynia
  { id: "galician_salt", epoch: "halych_volhynia", rarity: "common", parts: 10, bonus: { type: "passive_boost", value: 1.05 }, icon: "🧂", name: { ua: "Галицька сель", en: "Galician Salt" } },
  { id: "danylo_charter", epoch: "halych_volhynia", rarity: "rare", parts: 10, bonus: { type: "currency_multiplier", value: 1.10 }, icon: "📜", name: { ua: "Грамота Данила", en: "Danylo Charter" } },
  // Polish-Lithuanian
  { id: "sich_medal", epoch: "polish_lithuanian", rarity: "common", parts: 10, bonus: { type: "passive_boost", value: 1.05 }, icon: "🏅", name: { ua: "Медаль Січі", en: "Sich Medal" } },
  // Cossack
  { id: "cossack_banner", epoch: "cossack", rarity: "rare", parts: 10, bonus: { type: "xp_multiplier", value: 1.12 }, icon: "🚩", name: { ua: "Козацький прапор", en: "Cossack Banner" } },
  { id: "cossack_mace", epoch: "cossack", rarity: "legendary", parts: 10, bonus: { type: "xp_multiplier", value: 1.20 }, icon: "🏏", name: { ua: "Булава Богдана", en: "Bohdan's Mace" } },
  // Hetmanate
  { id: "hetman_seal", epoch: "hetmanate", rarity: "rare", parts: 10, bonus: { type: "currency_multiplier", value: 1.12 }, icon: "🔏", name: { ua: "Печать гетьмана", en: "Hetman's Seal" } },
  // Empire
  { id: "empire_medal", epoch: "empire", rarity: "common", parts: 10, bonus: { type: "passive_boost", value: 1.06 }, icon: "🏅", name: { ua: "Імперська медаль", en: "Imperial Medal" } },
  { id: "empire_factory", epoch: "empire", rarity: "rare", parts: 10, bonus: { type: "passive_boost", value: 1.12 }, icon: "🏭", name: { ua: "Заводський знак", en: "Factory Badge" } },
  // Revolution
  { id: "revolution_poster", epoch: "revolution", rarity: "common", parts: 10, bonus: { type: "xp_multiplier", value: 1.08 }, icon: "📰", name: { ua: "Агітаційний плакат", en: "Propaganda Poster" } },
  { id: "revolution_flag", epoch: "revolution", rarity: "legendary", parts: 10, bonus: { type: "xp_multiplier", value: 1.20 }, icon: "🇺🇦", name: { ua: "Прапор УНР", en: "UNR Flag" } },
  // Soviet
  { id: "soviet_badge", epoch: "soviet", rarity: "common", parts: 10, bonus: { type: "passive_boost", value: 1.06 }, icon: "⭐", name: { ua: "Радянський значок", en: "Soviet Badge" } },
  { id: "soviet_rocket", epoch: "soviet", rarity: "epic", parts: 10, bonus: { type: "passive_boost", value: 1.15 }, icon: "🚀", name: { ua: "Модель ракети", en: "Rocket Model" } },
  // Independence
  { id: "ind_flag", epoch: "independence", rarity: "common", parts: 10, bonus: { type: "xp_multiplier", value: 1.08 }, icon: "🇺🇦", name: { ua: "Національний прапор", en: "National Flag" } },
  { id: "ind_constitution", epoch: "independence", rarity: "legendary", parts: 10, bonus: { type: "passive_boost", value: 1.20 }, icon: "📜", name: { ua: "Конституція", en: "Constitution" } },

  // SIT STUDIO EASTER EGG — secret rarity, epoch independence
  { id: "sit_s", epoch: "independence", rarity: "secret", parts: 1, bonus: { type: "xp_multiplier", value: 1.01 }, icon: "🔮" },
  { id: "sit_i", epoch: "independence", rarity: "secret", parts: 1, bonus: { type: "xp_multiplier", value: 1.01 }, icon: "🔮" },
  { id: "sit_t", epoch: "independence", rarity: "secret", parts: 1, bonus: { type: "xp_multiplier", value: 1.01 }, icon: "🔮" },
  { id: "sit_space", epoch: "independence", rarity: "secret", parts: 1, bonus: { type: "xp_multiplier", value: 1.01 }, icon: "✨" },
  { id: "sit_u", epoch: "independence", rarity: "secret", parts: 1, bonus: { type: "xp_multiplier", value: 1.01 }, icon: "🔮" },
  { id: "sit_d", epoch: "independence", rarity: "secret", parts: 1, bonus: { type: "xp_multiplier", value: 1.01 }, icon: "🔮" },
  { id: "sit_o", epoch: "independence", rarity: "secret", parts: 1, bonus: { type: "xp_multiplier", value: 1.01 }, icon: "🔮" },

  // Ukrainian Secret Artifacts (Prestige 1+)
  { id: "secret_pyramid", epoch: "egypt", rarity: "secret", parts: 15, bonus: { type: "xp_multiplier", value: 1.15 }, icon: "🔺", requiredPrestige: 1 },
  { id: "secret_parthenon", epoch: "greece", rarity: "secret", parts: 15, bonus: { type: "currency_multiplier", value: 1.16 }, icon: "🏛️", requiredPrestige: 1 },
  { id: "secret_colosseum", epoch: "rome", rarity: "secret", parts: 15, bonus: { type: "passive_boost", value: 1.17 }, icon: "🏟️", requiredPrestige: 2 },
  { id: "secret_crusade", epoch: "medieval", rarity: "secret", parts: 15, bonus: { type: "xp_multiplier", value: 1.18 }, icon: "⚔️", requiredPrestige: 2 },
  { id: "secret_mona", epoch: "renaissance", rarity: "secret", parts: 15, bonus: { type: "currency_multiplier", value: 1.18 }, icon: "🎨", requiredPrestige: 3 },
  { id: "secret_enlightenment", epoch: "enlightenment", rarity: "secret", parts: 15, bonus: { type: "passive_boost", value: 1.19 }, icon: "💡", requiredPrestige: 3 },
  { id: "secret_industrial", epoch: "victorian", rarity: "secret", parts: 15, bonus: { type: "xp_multiplier", value: 1.19 }, icon: "⚙️", requiredPrestige: 4 },
  { id: "secret_digital", epoch: "modern_world", rarity: "secret", parts: 15, bonus: { type: "currency_multiplier", value: 1.20 }, icon: "🌐", requiredPrestige: 5 },

  // World History Artifacts (Egypt)
  { id: "egypt_scarab", epoch: "egypt", rarity: "common", parts: 10, bonus: { type: "passive_boost", value: 1.06 }, icon: "🪲", name: { ua: "Скарабей", en: "Scarab" } },
  { id: "egypt_pyramid_model", epoch: "egypt", rarity: "rare", parts: 10, bonus: { type: "xp_multiplier", value: 1.10 }, icon: "🔺", name: { ua: "Модель піраміди", en: "Pyramid Model" } },
  { id: "egypt_nefertiti", epoch: "egypt", rarity: "epic", parts: 10, bonus: { type: "passive_boost", value: 1.14 }, icon: "👸", name: { ua: "Нефертіті", en: "Nefertiti Bust" } },
  { id: "egypt_tutankhamun", epoch: "egypt", rarity: "legendary", parts: 10, bonus: { type: "currency_multiplier", value: 1.20 }, icon: "👑", name: { ua: "Маска Тутанхамона", en: "Tutankhamun Mask" } },
  // Greece
  { id: "greece_olive", epoch: "greece", rarity: "common", parts: 10, bonus: { type: "passive_boost", value: 1.06 }, icon: "🫒", name: { ua: "Оливкова гілка", en: "Olive Branch" } },
  { id: "greece_trophy", epoch: "greece", rarity: "rare", parts: 10, bonus: { type: "xp_multiplier", value: 1.10 }, icon: "🏆", name: { ua: "Олімпійський кубок", en: "Olympic Trophy" } },
  { id: "greece_philosopher", epoch: "greece", rarity: "epic", parts: 10, bonus: { type: "passive_boost", value: 1.14 }, icon: "📜", name: { ua: "Праці Платона", en: "Plato's Works" } },
  { id: "greece_alexander", epoch: "greece", rarity: "legendary", parts: 10, bonus: { type: "xp_multiplier", value: 1.20 }, icon: "⚔️", name: { ua: "Меч Олександра", en: "Alexander's Sword" } },
  // Rome
  { id: "rome_gladius", epoch: "rome", rarity: "common", parts: 10, bonus: { type: "xp_multiplier", value: 1.06 }, icon: "⚔️", name: { ua: "Гладіус", en: "Gladius" } },
  { id: "rome_aquila", epoch: "rome", rarity: "rare", parts: 10, bonus: { type: "passive_boost", value: 1.10 }, icon: "🦅", name: { ua: "Римський орел", en: "Roman Aquila" } },
  { id: "rome_senate", epoch: "rome", rarity: "epic", parts: 10, bonus: { type: "currency_multiplier", value: 1.14 }, icon: "🏛️", name: { ua: "Сенатська мантія", en: "Senate Toga" } },
  { id: "rome_caesar", epoch: "rome", rarity: "legendary", parts: 10, bonus: { type: "xp_multiplier", value: 1.20 }, icon: "👑", name: { ua: "Лавр цезаря", en: "Caesar's Laurel" } },
  // Medieval
  { id: "medieval_cross", epoch: "medieval", rarity: "common", parts: 10, bonus: { type: "passive_boost", value: 1.06 }, icon: "✝️", name: { ua: "Хрестоносний хрест", en: "Crusader Cross" } },
  { id: "medieval_sword", epoch: "medieval", rarity: "rare", parts: 10, bonus: { type: "xp_multiplier", value: 1.10 }, icon: "🗡️", name: { ua: "Меч лицаря", en: "Knight's Sword" } },
  { id: "medieval_holy_grail", epoch: "medieval", rarity: "epic", parts: 10, bonus: { type: "passive_boost", value: 1.14 }, icon: "🏆", name: { ua: "Святий Грааль", en: "Holy Grail" } },
  { id: "medieval_king_crown", epoch: "medieval", rarity: "legendary", parts: 10, bonus: { type: "currency_multiplier", value: 1.20 }, icon: "👑", name: { ua: "Корона короля Артура", en: "King Arthur's Crown" } },
  // Renaissance
  { id: "renaissance_palette", epoch: "renaissance", rarity: "common", parts: 10, bonus: { type: "passive_boost", value: 1.07 }, icon: "🎨", name: { ua: "Палітра художника", en: "Artist's Palette" } },
  { id: "renaissance_manuscript", epoch: "renaissance", rarity: "rare", parts: 10, bonus: { type: "xp_multiplier", value: 1.10 }, icon: "📖", name: { ua: "Ілюмінований манускрипт", en: "Illuminated Manuscript" } },
  { id: "renaissance_mona_lisa", epoch: "renaissance", rarity: "epic", parts: 10, bonus: { type: "currency_multiplier", value: 1.14 }, icon: "🖼️", name: { ua: "Мона Ліза", en: "Mona Lisa" } },
  { id: "renaissance_davinci", epoch: "renaissance", rarity: "legendary", parts: 10, bonus: { type: "xp_multiplier", value: 1.20 }, icon: "✍️", name: { ua: "Кодекс Леонардо", en: "Leonardo's Codex" } },
  // Enlightenment
  { id: "enlightenment_book", epoch: "enlightenment", rarity: "common", parts: 10, bonus: { type: "xp_multiplier", value: 1.07 }, icon: "📚", name: { ua: "Енциклопедія", en: "Encyclopedia" } },
  { id: "enlightenment_compass", epoch: "enlightenment", rarity: "rare", parts: 10, bonus: { type: "passive_boost", value: 1.10 }, icon: "🧭", name: { ua: "Науковий компас", en: "Scientific Compass" } },
  { id: "enlightenment_declaration", epoch: "enlightenment", rarity: "epic", parts: 10, bonus: { type: "currency_multiplier", value: 1.14 }, icon: "📜", name: { ua: "Декларація прав", en: "Declaration of Rights" } },
  { id: "enlightenment_foundation", epoch: "enlightenment", rarity: "legendary", parts: 10, bonus: { type: "xp_multiplier", value: 1.20 }, icon: "🏛️", name: { ua: "Академія наук", en: "Academy of Sciences" } },
  // Victorian
  { id: "victorian_clock", epoch: "victorian", rarity: "common", parts: 10, bonus: { type: "passive_boost", value: 1.07 }, icon: "🕰️", name: { ua: "Вікторіанський годинник", en: "Victorian Clock" } },
  { id: "victorian_steam", epoch: "victorian", rarity: "rare", parts: 10, bonus: { type: "xp_multiplier", value: 1.10 }, icon: "⚙️", name: { ua: "Паровий двигун", en: "Steam Engine" } },
  { id: "victorian_telegraph", epoch: "victorian", rarity: "epic", parts: 10, bonus: { type: "currency_multiplier", value: 1.14 }, icon: "📞", name: { ua: "Телеграф", en: "Telegraph" } },
  { id: "victorian_empire_crown", epoch: "victorian", rarity: "legendary", parts: 10, bonus: { type: "xp_multiplier", value: 1.20 }, icon: "👑", name: { ua: "Корона імперії", en: "Empire Crown" } },
  // Modern World
  { id: "modern_computer", epoch: "modern_world", rarity: "common", parts: 10, bonus: { type: "xp_multiplier", value: 1.08 }, icon: "💻", name: { ua: "Персональний комп'ютер", en: "Personal Computer" } },
  { id: "modern_internet", epoch: "modern_world", rarity: "rare", parts: 10, bonus: { type: "passive_boost", value: 1.12 }, icon: "🌐", name: { ua: "Інтернет", en: "Internet" } },
  { id: "modern_smartphone", epoch: "modern_world", rarity: "epic", parts: 10, bonus: { type: "currency_multiplier", value: 1.15 }, icon: "📱", name: { ua: "Смартфон", en: "Smartphone" } },
  { id: "modern_ai_chip", epoch: "modern_world", rarity: "legendary", parts: 10, bonus: { type: "xp_multiplier", value: 1.22 }, icon: "🤖", name: { ua: "AI чіп", en: "AI Chip" } },
];

function jsonResponse(data: OpenChestResponse | { error: string }, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Roll for rarity based on chances
 * Returns: common | rare | epic | legendary | secret
 * 
 * @param prestigeLevel - Player's prestige level (0+)
 * @param rareArtifactChanceBonus - Bonus from prestige research
 * @param epochIndex - 0-based index of the epoch for epoch-based bonuses
 */
function rollRarity(prestigeLevel: number, rareArtifactChanceBonus: number, epochIndex: number = 0): string {
  const roll = Math.random() * 100;

  // Get epoch-based rare bonus (Phase 9)
  const epochRareBonus = getEpochRareBonus(epochIndex);
  
  // Total rare bonus = research bonus + epoch bonus
  const totalRareBonus = rareArtifactChanceBonus + epochRareBonus;

  // Secret chance: base 1% + bonus from research (NO epoch bonus for secret)
  const secretChance = 1 + rareArtifactChanceBonus;
  if (prestigeLevel >= 1 && roll < secretChance) {
    return "secret";
  }

  // Legendary: 4% (unchanged)
  if (roll < secretChance + 4) {
    return "legendary";
  }

  // Epic: 10% (unchanged)
  if (roll < secretChance + 4 + 10) {
    return "epic";
  }

  // Rare: 25% + epoch bonus
  // The epoch bonus shifts some probability from Common to Rare
  // This is done by increasing the rare threshold
  if (roll < secretChance + 4 + 10 + 25 + totalRareBonus) {
    return "rare";
  }

  // Common: remaining ~60% - epoch bonus
  return "common";
}

/**
 * Get random artifact from epoch with matching rarity
 */
function getRandomArtifact(epochId: string, rarity: string, prestigeLevel: number): typeof ARTIFACTS[0] | null {
  const eligible = ARTIFACTS.filter((a) => {
    if (a.epoch !== epochId) return false;
    if (a.rarity !== rarity) return false;
    if (a.requiredPrestige && a.requiredPrestige > prestigeLevel) return false;
    return true;
  });

  if (eligible.length === 0) {
    // Fallback to common if no artifacts found for rarity
    return getRandomArtifact(epochId, "common", prestigeLevel);
  }

  return eligible[Math.floor(Math.random() * eligible.length)];
}

/**
 * Generate rewards for chest opening
 * 
 * @param epochId - The epoch ID for artifact selection
 * @param prestigeLevel - Player's prestige level
 * @param rareArtifactChanceBonus - Bonus from prestige research
 * @param chestType - Type of chest being opened
 * @param epochIndex - 0-based index of the epoch for epoch-based bonuses (Phase 9)
 * @param pityEpic - Current epic pity counter (chests since last Epic+)
 * @param pityLegendary - Current legendary pity counter (chests since last Legendary)
 */
function generateRewards(
  epochId: string,
  prestigeLevel: number,
  rareArtifactChanceBonus: number,
  chestType: "skychest" | "daily",
  epochIndex: number = 0,
  pityEpic: number = 0,
  pityLegendary: number = 0
): { rewards: ArtifactDrop[]; pityUsed: { epic: boolean; legendary: boolean } } {
  const rewards: ArtifactDrop[] = [];
  let pityUsed = { epic: false, legendary: false };

  // Skychest: 2-3 artifacts, Daily: 1 artifact
  const numArtifacts = chestType === "skychest" ? Math.floor(Math.random() * 2) + 2 : 1;

  for (let i = 0; i < numArtifacts; i++) {
    let rarity: string;
    
    // PITY SYSTEM: Check pity before rolling
    // Legendary pity takes priority over Epic pity (200 > 50)
    if (pityLegendary >= PITY_LEGENDARY_THRESHOLD) {
      rarity = "legendary";
      pityUsed.legendary = true;
    } else if (pityEpic >= PITY_EPIC_THRESHOLD) {
      // Roll between Epic and Legendary (weighted)
      const roll = Math.random() * 100;
      if (roll < 70) {
        rarity = "epic"; // 70% Epic, 30% Legendary on pity
      } else {
        rarity = "legendary";
        pityUsed.legendary = true;
      }
      pityUsed.epic = true;
    } else {
      // Normal roll with epoch bonuses
      rarity = rollRarity(prestigeLevel, rareArtifactChanceBonus, epochIndex);
    }
    
    const artifact = getRandomArtifact(epochId, rarity, prestigeLevel);

    if (artifact) {
      // Fragments: 1-3 for common, 1-2 for rare+, 1 for legendary/secret
      let partsGranted = 1;
      if (rarity === "common") {
        partsGranted = Math.floor(Math.random() * 3) + 1;
      } else if (rarity === "rare" || rarity === "epic") {
        partsGranted = Math.floor(Math.random() * 2) + 1;
      }

      rewards.push({
        id: artifact.id,
        epoch: artifact.epoch,
        rarity: artifact.rarity,
        parts_granted: partsGranted,
        icon: artifact.icon,
        name: artifact.name,
      });
    }
  }

  return { rewards, pityUsed };
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body: OpenChestRequest = await req.json();
    const { telegram_id, epoch_id, chest_type = "daily", epoch_index = 0, init_data } = body;

    if (!init_data) {
      return jsonResponse({ error: "Missing init_data" }, 400);
    }

    const validation = validateRequest(init_data);
    if (!validation.valid) {
      console.warn(`HMAC validation failed for open-chest: ${validation.error}`);
      return jsonResponse({ error: validation.error }, 401);
    }

    if (validation.userId !== telegram_id) {
      console.warn(`User ID mismatch in open-chest: expected ${validation.userId}, got ${telegram_id}`);
      return jsonResponse({ error: "User ID mismatch" }, 403);
    }

    if (!telegram_id || typeof telegram_id !== "number" || telegram_id <= 0) {
      return jsonResponse({ error: "Invalid telegram_id" }, 400);
    }

    if (!epoch_id) {
      return jsonResponse({ error: "Missing epoch_id" }, 400);
    }

    // Calculate chest cost: 100 * (epoch_index + 1)
    const chestCost = chest_type === "skychest" ? 0 : 100 * Math.max(1, (epoch_index || 0) + 1);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch player state (include pity_state for Phase 20)
    const { data: player, error: fetchError } = await supabase
      .from("game_progress")
      .select("currency, prestige_level, prestige_research, artifact_parts, artifact_levels, completed_artifacts, active_boosters, pity_state")
      .eq("telegram_id", telegram_id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching player:", fetchError);
      return jsonResponse({ error: "Database error" }, 500);
    }

    if (!player) {
      return jsonResponse({ error: "Player not found" }, 404);
    }

    // Check and deduct currency for daily chests
    const playerCurrency = (player.currency as number) || 0;
    if (chestCost > 0 && playerCurrency < chestCost) {
      return jsonResponse({ error: "Not enough currency" }, 400);
    }

    const prestigeLevel = (player.prestige_level as number) || 0;
    const prestigeResearch = (player.prestige_research as Record<string, number>) || {};

    // Calculate rare artifact chance bonus from research
    // +5% per level (relative bonus, so 10 levels = +50% of base 1% = 1.5% total)
    const rareArtifactChanceBonus = (prestigeResearch.rare_artifact_chance || 0) * 0.05;

    // Check for chest bonus boost (from watching ad)
    const activeBoosters = (player.active_boosters as Record<string, unknown>) || {};
    const hasChestBonus = activeBoosters.chest_bonus_active === true;

    // Apply +5% rare chance if chest bonus active
    const finalRareBonus = hasChestBonus ? rareArtifactChanceBonus + 5 : rareArtifactChanceBonus;

    // Get pity state (initialize if not exists)
    const pityState = (player.pity_state as { pity_epic: number; pity_legendary: number } | null) || {
      pity_epic: 0,
      pity_legendary: 0,
    };

    // Generate rewards with epoch index for epoch-based bonuses (Phase 9)
    // Pass pity counters to generateRewards
    const { rewards, pityUsed } = generateRewards(
      epoch_id,
      prestigeLevel,
      finalRareBonus,
      chest_type,
      epoch_index ?? 0,
      pityState.pity_epic || 0,
      pityState.pity_legendary || 0
    );

    // Update pity state based on rewards
    // Check if any reward was Epic or higher
    const hasEpicOrHigher = rewards.some(r => r.rarity === 'epic' || r.rarity === 'legendary' || r.rarity === 'secret');
    const hasLegendary = rewards.some(r => r.rarity === 'legendary' || r.rarity === 'secret');

    // Update pity counters
    if (hasLegendary || pityUsed.legendary) {
      // Reset legendary pity on Legendary drop or if pity was used for legendary
      pityState.pity_legendary = 0;
    } else {
      // Increment legendary pity counter
      pityState.pity_legendary = (pityState.pity_legendary || 0) + 1;
    }

    if (hasEpicOrHigher || pityUsed.epic) {
      // Reset epic pity on Epic+ drop or if pity was used for epic
      pityState.pity_epic = 0;
    } else {
      // Increment epic pity counter
      pityState.pity_epic = (pityState.pity_epic || 0) + 1;
    }

    // Update player's artifact parts
    const artifactParts = (player.artifact_parts as Record<string, number>) || {};
    const artifactLevels = (player.artifact_levels as Record<string, number>) || {};
    const completedArtifacts = (player.completed_artifacts as string[]) || [];

    for (const reward of rewards) {
      // Add parts
      artifactParts[reward.id] = (artifactParts[reward.id] || 0) + reward.parts_granted;

      // Check if artifact is completed (parts >= required)
      const artifact = ARTIFACTS.find((a) => a.id === reward.id);
      if (artifact) {
        const partsRequired = artifact.parts;
        if (artifactParts[reward.id] >= partsRequired && !completedArtifacts.includes(reward.id)) {
          // Complete the artifact — leftover parts remain for upgrades
          completedArtifacts.push(reward.id);
          artifactLevels[reward.id] = 1;
        }
      }
    }

    // Update database (deduct currency + save artifacts + clear chest bonus if used + save pity state)
    const updateData: Record<string, unknown> = {
      artifact_parts: artifactParts,
      artifact_levels: artifactLevels,
      completed_artifacts: completedArtifacts,
      pity_state: pityState, // Save updated pity state (Phase 20)
    };

    // Clear chest bonus if it was used
    if (hasChestBonus) {
      const updatedBoosters = { ...activeBoosters };
      delete updatedBoosters.chest_bonus_active;
      updateData.active_boosters = updatedBoosters;
    }

    if (chestCost > 0) {
      updateData.currency = playerCurrency - chestCost;
    }

    const { error: updateError } = await supabase
      .from("game_progress")
      .update(updateData)
      .eq("telegram_id", telegram_id);

    if (updateError) {
      console.error("Error updating artifacts:", updateError);
      return jsonResponse({ error: "Failed to save rewards" }, 500);
    }

    console.log(`Chest opened: user=${telegram_id}, epoch=${epoch_id}, type=${chest_type}, rewards=${rewards.length}, pityEpic=${pityState.pity_epic}, pityLegendary=${pityState.pity_legendary}`);

    return jsonResponse({
      success: true,
      rewards,
      chest_type: chest_type,
      pity_state: pityState, // Return updated pity state for client display (Phase 20)
      pity_triggered: pityUsed, // Indicate if pity was used for this roll
    });
  } catch (err) {
    console.error("Open chest error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
