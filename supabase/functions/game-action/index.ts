import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createHmac } from "node:crypto";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

/**
 * Server-authoritative game actions.
 *
 * All actions require a valid `init_data` field which is verified via
 * HMAC-SHA256 against the bot token.  This prevents users from forging
 * their telegram_id or manipulating request payloads via DevTools.
 *
 * Supported actions:
 *   - buy_generator:  Verify currency balance, deduct cost, add generator.
 *   - upgrade_tap:    Verify currency balance, deduct cost, increment tap_power.
 *   - switch_epoch:   Verify the epoch is unlocked for this user.
 *   - record_tap:     Record tap XP server-side with rate limiting.
 *
 * The function reads the current DB row, applies the mutation, and writes it
 * back — all server-side, so the client cannot bypass cost checks.
 */

// ── InitData validation (same as validate-init-data) ──────────────────────

function validateInitData(initData: string): { valid: boolean; userId: number | null; error?: string } {
  if (!BOT_TOKEN) return { valid: false, userId: null, error: "BOT_TOKEN not configured" };

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { valid: false, userId: null, error: "Missing hash" };

  const authDateStr = params.get("auth_date");
  if (!authDateStr) return { valid: false, userId: null, error: "Missing auth_date" };
  const authDate = parseInt(authDateStr, 10);
  const age = Math.floor(Date.now() / 1000) - authDate;
  if (isNaN(authDate) || age > 86400 || age < 0) return { valid: false, userId: null, error: "Stale initData" };

  const keys = [...params.keys()].filter(k => k !== "hash").sort();
  const checkStr = keys.map(k => `${k}=${params.get(k)}`).join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const computed = createHmac("sha256", secretKey).update(checkStr).digest("hex");

  if (computed !== hash) return { valid: false, userId: null, error: "HMAC mismatch" };

  let userId: number | null = null;
  const userStr = params.get("user");
  if (userStr) { try { userId = JSON.parse(userStr).id ?? null; } catch { /* */ } }
  return { valid: true, userId };
}

// ── Generator definitions (mirrors client-side epochs.ts) ─────────────────

interface GeneratorDef {
  id: string;
  baseCost: number;
  baseProduction: number;
  costMultiplier: number;
}

// Generator costs by epoch - MUST match client-side epochs.ts
const GENERATORS_BY_EPOCH: Record<string, GeneratorDef[]> = {
  trypillia: [
    { id: 'clay_pit', baseCost: 10, baseProduction: 2, costMultiplier: 1.15 },
    { id: 'pottery', baseCost: 50, baseProduction: 8, costMultiplier: 1.15 },
    { id: 'settlement', baseCost: 300, baseProduction: 40, costMultiplier: 1.15 },
    { id: 'megastructure', baseCost: 3000, baseProduction: 200, costMultiplier: 1.15 },
    { id: 'temple', baseCost: 30000, baseProduction: 1000, costMultiplier: 1.15 },
  ],
  scythia: [
    { id: 'pasture', baseCost: 10, baseProduction: 5, costMultiplier: 1.15 },
    { id: 'gold_mine', baseCost: 50, baseProduction: 20, costMultiplier: 1.15 },
    { id: 'kurgan', baseCost: 300, baseProduction: 100, costMultiplier: 1.15 },
    { id: 'fortress', baseCost: 3000, baseProduction: 500, costMultiplier: 1.15 },
    { id: 'royal_tomb', baseCost: 30000, baseProduction: 2500, costMultiplier: 1.15 },
  ],
  antiquity: [
    { id: 'port', baseCost: 10, baseProduction: 10, costMultiplier: 1.15 },
    { id: 'agora', baseCost: 50, baseProduction: 40, costMultiplier: 1.15 },
    { id: 'colony', baseCost: 300, baseProduction: 200, costMultiplier: 1.15 },
    { id: 'amphitheater', baseCost: 3000, baseProduction: 1000, costMultiplier: 1.15 },
    { id: 'acropolis', baseCost: 30000, baseProduction: 5000, costMultiplier: 1.15 },
  ],
  kyiv_rus: [
    { id: 'field', baseCost: 10, baseProduction: 15, costMultiplier: 1.15 },
    { id: 'craft_workshop', baseCost: 50, baseProduction: 60, costMultiplier: 1.15 },
    { id: 'city', baseCost: 300, baseProduction: 300, costMultiplier: 1.15 },
    { id: 'saint_sophia', baseCost: 3000, baseProduction: 1500, costMultiplier: 1.15 },
    { id: 'golden_gate', baseCost: 30000, baseProduction: 7500, costMultiplier: 1.15 },
  ],
  halych_volhynia: [
    { id: 'salt_mine', baseCost: 10, baseProduction: 20, costMultiplier: 1.15 },
    { id: 'caravan', baseCost: 50, baseProduction: 80, costMultiplier: 1.15 },
    { id: 'castle', baseCost: 300, baseProduction: 400, costMultiplier: 1.15 },
    { id: 'cathedral', baseCost: 3000, baseProduction: 2000, costMultiplier: 1.15 },
    { id: 'principality', baseCost: 30000, baseProduction: 10000, costMultiplier: 1.15 },
  ],
  polish_lithuanian: [
    { id: 'manor', baseCost: 10, baseProduction: 25, costMultiplier: 1.15 },
    { id: 'market', baseCost: 50, baseProduction: 100, costMultiplier: 1.15 },
    { id: 'cossack_sich', baseCost: 300, baseProduction: 500, costMultiplier: 1.15 },
    { id: 'brotherhood', baseCost: 3000, baseProduction: 2500, costMultiplier: 1.15 },
    { id: 'university', baseCost: 30000, baseProduction: 12500, costMultiplier: 1.15 },
  ],
  cossack: [
    { id: 'homestead', baseCost: 10, baseProduction: 30, costMultiplier: 1.15 },
    { id: 'cannon', baseCost: 50, baseProduction: 120, costMultiplier: 1.15 },
    { id: 'regiment', baseCost: 300, baseProduction: 600, costMultiplier: 1.15 },
    { id: 'fortress_sich', baseCost: 3000, baseProduction: 3000, costMultiplier: 1.15 },
    { id: 'hetman_capital', baseCost: 30000, baseProduction: 15000, costMultiplier: 1.15 },
  ],
  hetmanate: [
    { id: 'farm', baseCost: 10, baseProduction: 40, costMultiplier: 1.15 },
    { id: 'factory', baseCost: 50, baseProduction: 160, costMultiplier: 1.15 },
    { id: 'gymnasium', baseCost: 300, baseProduction: 800, costMultiplier: 1.15 },
    { id: 'theater', baseCost: 3000, baseProduction: 4000, costMultiplier: 1.15 },
    { id: 'railway', baseCost: 30000, baseProduction: 20000, costMultiplier: 1.15 },
  ],
  empire: [
    { id: 'manor_estate', baseCost: 10, baseProduction: 50, costMultiplier: 1.15 },
    { id: 'ironworks', baseCost: 50, baseProduction: 200, costMultiplier: 1.15 },
    { id: 'university_kyiv', baseCost: 300, baseProduction: 1000, costMultiplier: 1.15 },
    { id: 'railway_network', baseCost: 3000, baseProduction: 5000, costMultiplier: 1.15 },
    { id: 'cultural_society', baseCost: 30000, baseProduction: 25000, costMultiplier: 1.15 },
  ],
  revolution: [
    { id: 'workers_club', baseCost: 10, baseProduction: 60, costMultiplier: 1.15 },
    { id: 'military_council', baseCost: 50, baseProduction: 240, costMultiplier: 1.15 },
    { id: 'national_parliament', baseCost: 300, baseProduction: 1200, costMultiplier: 1.15 },
    { id: 'national_press', baseCost: 3000, baseProduction: 6000, costMultiplier: 1.15 },
    { id: 'independence_square', baseCost: 30000, baseProduction: 30000, costMultiplier: 1.15 },
  ],
  modern: [
    { id: 'collective_farm', baseCost: 10, baseProduction: 75, costMultiplier: 1.15 },
    { id: 'industrial_complex', baseCost: 50, baseProduction: 300, costMultiplier: 1.15 },
    { id: 'hydroelectric', baseCost: 300, baseProduction: 1500, costMultiplier: 1.15 },
    { id: 'nuclear_plant', baseCost: 3000, baseProduction: 7500, costMultiplier: 1.15 },
    { id: 'space_program', baseCost: 30000, baseProduction: 37500, costMultiplier: 1.15 },
  ],
  independence: [
    { id: 'startup', baseCost: 10, baseProduction: 100, costMultiplier: 1.15 },
    { id: 'tech_hub', baseCost: 50, baseProduction: 400, costMultiplier: 1.15 },
    { id: 'it_company', baseCost: 300, baseProduction: 2000, costMultiplier: 1.15 },
    { id: 'innovation_center', baseCost: 3000, baseProduction: 10000, costMultiplier: 1.15 },
    { id: 'silicon_valley_ua', baseCost: 30000, baseProduction: 50000, costMultiplier: 1.15 },
  ],
  eu_integration: [
    { id: 'sme', baseCost: 10, baseProduction: 125, costMultiplier: 1.15 },
    { id: 'export_hub', baseCost: 50, baseProduction: 500, costMultiplier: 1.15 },
    { id: 'logistics_center', baseCost: 300, baseProduction: 2500, costMultiplier: 1.15 },
    { id: 'research_institute', baseCost: 3000, baseProduction: 12500, costMultiplier: 1.15 },
    { id: 'eu_member_state', baseCost: 30000, baseProduction: 62500, costMultiplier: 1.15 },
  ],
  future: [
    { id: 'quantum_lab', baseCost: 10, baseProduction: 150, costMultiplier: 1.15 },
    { id: 'ai_center', baseCost: 50, baseProduction: 600, costMultiplier: 1.15 },
    { id: 'colonization_hub', baseCost: 300, baseProduction: 3000, costMultiplier: 1.15 },
    { id: 'space_colony', baseCost: 3000, baseProduction: 15000, costMultiplier: 1.15 },
    { id: 'dyson_sphere', baseCost: 30000, baseProduction: 75000, costMultiplier: 1.15 },
  ],
};

function getGeneratorDef(generatorId: string): GeneratorDef | null {
  for (const generators of Object.values(GENERATORS_BY_EPOCH)) {
    const def = generators.find(g => g.id === generatorId);
    if (def) return def;
  }
  return null;
}

function calculateGeneratorCost(generator: GeneratorDef, currentLevel: number): number {
  return Math.floor(generator.baseCost * Math.pow(generator.costMultiplier, currentLevel));
}

// ── Action handlers ───────────────────────────────────────────────────────

async function buyGenerator(
  supabase: ReturnType<typeof createClient>,
  telegramId: number,
  generatorId: string,
  epochId: string
) {
  // Read current state
  const { data: row } = await supabase.from("game_progress")
    .select("currency, owned_generators, unlocked_epochs, epoch_id, prestige_level, prestige_research")
    .eq("telegram_id", telegramId).maybeSingle();
  if (!row) return { ok: false, error: "User not found" };

  // Verify epoch is unlocked
  const unlocked_epochs = (row.unlocked_epochs as string[]) ?? [];
  const normalizedEpochId = epochId.replace(/-/g, '_');
  if (!unlocked_epochs.some(e => e.replace(/-/g, '_') === normalizedEpochId)) {
    return { ok: false, error: "Epoch not unlocked" };
  }

  // Find generator definition
  const generator = getGeneratorDef(generatorId);
  if (!generator) return { ok: false, error: "Invalid generator" };

  // Calculate current level and cost
  const owned = (row.owned_generators as Array<{ generatorId: string; level: number }>) ?? [];
  const currentGen = owned.find(g => g.generatorId === generatorId);
  const currentLevel = currentGen?.level || 0;
  const cost = calculateGeneratorCost(generator, currentLevel);

  // Verify balance
  const currency = (row.currency as number) ?? 0;
  if (currency < cost) return { ok: false, error: "Not enough currency" };

  // Apply prestige research bonus if available
  const prestigeResearch = (row.prestige_research as Record<string, number>) ?? {};
  const buyDiscount = 1 - ((prestigeResearch.buy_cost ?? 0) * 0.05);
  const finalCost = Math.floor(cost * Math.max(0.5, buyDiscount));

  if (currency < finalCost) return { ok: false, error: "Not enough currency after discount" };

  // Update state - add or upgrade generator
  const newOwned = currentGen
    ? owned.map(g => g.generatorId === generatorId ? { ...g, level: g.level + 1 } : g)
    : [...owned, { generatorId, level: 1 }];

  const { error } = await supabase.from("game_progress")
    .update({
      currency: currency - finalCost,
      owned_generators: newOwned,
    })
    .eq("telegram_id", telegramId);

  if (error) return { ok: false, error: error.message };

  return { ok: true, cost: finalCost, new_level: currentLevel + 1 };
}

async function upgradeTap(supabase: ReturnType<typeof createClient>, telegramId: number) {
  const { data: row } = await supabase.from("game_progress")
    .select("currency, tap_power, prestige_level, prestige_research")
    .eq("telegram_id", telegramId).maybeSingle();
  if (!row) return { ok: false, error: "User not found" };

  const tapPower = (row.tap_power as number) ?? 1;
  const prestigeLevel = (row.prestige_level as number) ?? 0;
  const prestigeResearch = (row.prestige_research as Record<string, number>) ?? {};

  // Calculate cost with prestige discount
  const baseCost = 25 * Math.pow(1.8, tapPower - 1);
  const discount = 1 - ((prestigeResearch.tap_cost ?? 0) * 0.05);
  const cost = Math.floor(baseCost * Math.max(0.5, discount));

  const currency = (row.currency as number) ?? 0;
  if (currency < cost) return { ok: false, error: "Not enough currency" };

  const { error } = await supabase.from("game_progress")
    .update({ currency: currency - cost, tap_power: tapPower + 1 })
    .eq("telegram_id", telegramId);
  if (error) return { ok: false, error: error.message };

  return { ok: true, new_tap_power: tapPower + 1, cost };
}

async function switchEpoch(supabase: ReturnType<typeof createClient>, telegramId: number, epochId: string) {
  const { data: row } = await supabase.from("game_progress")
    .select("unlocked_epochs, level")
    .eq("telegram_id", telegramId).maybeSingle();
  if (!row) return { ok: false, error: "User not found" };

  const unlocked = (row.unlocked_epochs as string[]) ?? [];
  const normalizedEpochId = epochId.replace(/-/g, '_');
  if (!unlocked.some(e => e.replace(/-/g, '_') === normalizedEpochId)) {
    return { ok: false, error: "Epoch not unlocked" };
  }

  const { error } = await supabase.from("game_progress")
    .update({ epoch_id: epochId })
    .eq("telegram_id", telegramId);
  if (error) return { ok: false, error: error.message };

  return { ok: true, epoch_id: epochId };
}

async function recordTap(
  supabase: ReturnType<typeof createClient>,
  telegramId: number,
  tapCount: number
) {
  // Rate limit: max 10 taps per call (batch), max ~5 calls per second = 50 taps/sec max
  if (tapCount < 1 || tapCount > 10) {
    return { ok: false, error: "Invalid tap count" };
  }

  // Read current state
  const { data: row } = await supabase.from("game_progress")
    .select("tap_power, prestige_level, prestige_research, xp, total_xp")
    .eq("telegram_id", telegramId).maybeSingle();
  if (!row) return { ok: false, error: "User not found" };

  const tapPower = (row.tap_power as number) ?? 1;
  const prestigeLevel = (row.prestige_level as number) ?? 0;
  const prestigeResearch = (row.prestige_research as Record<string, number>) ?? {};

  // Calculate XP per tap
  const tapPowerBonus = prestigeResearch.tap_power || 0;
  const prestigeBonus = 1 + (prestigeLevel * 0.1);
  const xpBonus = 1 + ((prestigeResearch.xp_gain ?? 0) * 0.05);

  const xpPerTap = Math.max(1, Math.round((tapPower + tapPowerBonus) * prestigeBonus * xpBonus));
  const totalXpGain = xpPerTap * tapCount;

  // Update XP
  const currentXp = (row.xp as number) ?? 0;
  const currentTotalXp = (row.total_xp as number) ?? 0;

  const { error } = await supabase.from("game_progress")
    .update({
      xp: currentXp + totalXpGain,
      total_xp: currentTotalXp + totalXpGain,
    })
    .eq("telegram_id", telegramId);

  if (error) return { ok: false, error: error.message };

  return { ok: true, xp_gained: totalXpGain, xp_per_tap: xpPerTap };
}

// ── Main handler ──────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const body = await req.json();
    const { action, init_data, generator_id, epoch_id, tap_count } = body as {
      action: string;
      init_data?: string;
      generator_id?: string;
      epoch_id?: string;
      tap_count?: number;
    };

    if (!init_data) return json({ error: "Missing init_data" }, 400);

    const validation = validateInitData(init_data);
    if (!validation.valid) return json({ error: validation.error }, 401);
    if (!validation.userId) return json({ error: "No user_id in initData" }, 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const telegramId = validation.userId;

    switch (action) {
      case "upgrade_tap":
        return json(await upgradeTap(supabase, telegramId));
      case "switch_epoch":
        if (!epoch_id) return json({ error: "Missing epoch_id" }, 400);
        return json(await switchEpoch(supabase, telegramId, epoch_id));
      case "buy_generator":
        if (!generator_id) return json({ error: "Missing generator_id" }, 400);
        // Use current epoch from request or row
        return json(await buyGenerator(supabase, telegramId, generator_id, epoch_id || 'trypillia'));
      case "record_tap":
        const count = tap_count ?? 1;
        return json(await recordTap(supabase, telegramId, count));
      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error("game-action error:", err);
    return json({ error: String(err) }, 500);
  }
});
