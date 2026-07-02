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
 * Validate Passive XP Edge Function
 * 
 * Phase 8: Server-authoritative passive XP validation.
 * 
 * This function calculates the expected passive XP per second based on:
 * - Owned generators
 * - Prestige research (passive_income bonus)
 * 
 * The client periodically calls this to validate their calculation matches
 * the server's authoritative calculation.
 * 
 * NOTE: This does NOT update the database - it only returns the expected value
 * for client-side validation.
 */

interface ValidateRequest {
  telegram_id: number;
  init_data: string;
}

interface GeneratorState {
  generatorId: string;
  level: number;
}

// Generator production values (must match client-side epochs.ts)
const GENERATORS: Record<string, Array<{ id: string; baseProduction: number }>> = {
  trypillia: [
    { id: 'clay_pit', baseProduction: 2 },
    { id: 'pottery', baseProduction: 8 },
    { id: 'settlement', baseProduction: 40 },
    { id: 'megastructure', baseProduction: 200 },
    { id: 'temple', baseProduction: 1000 },
  ],
  scythia: [
    { id: 'pasture', baseProduction: 5 },
    { id: 'gold_mine', baseProduction: 20 },
    { id: 'kurgan', baseProduction: 100 },
    { id: 'fortress', baseProduction: 500 },
    { id: 'royal_tomb', baseProduction: 2500 },
  ],
  antiquity: [
    { id: 'port', baseProduction: 10 },
    { id: 'agora', baseProduction: 40 },
    { id: 'colony', baseProduction: 200 },
    { id: 'amphitheater', baseProduction: 1000 },
    { id: 'acropolis', baseProduction: 5000 },
  ],
  kyiv_rus: [
    { id: 'field', baseProduction: 15 },
    { id: 'craft_workshop', baseProduction: 60 },
    { id: 'city', baseProduction: 300 },
    { id: 'saint_sophia', baseProduction: 1500 },
    { id: 'golden_gate', baseProduction: 7500 },
  ],
  halych_volhynia: [
    { id: 'salt_mine', baseProduction: 20 },
    { id: 'caravan', baseProduction: 80 },
    { id: 'castle', baseProduction: 400 },
    { id: 'cathedral', baseProduction: 2000 },
    { id: 'principality', baseProduction: 10000 },
  ],
  polish_lithuanian: [
    { id: 'manor', baseProduction: 25 },
    { id: 'market', baseProduction: 100 },
    { id: 'cossack_sich', baseProduction: 500 },
    { id: 'brotherhood', baseProduction: 2500 },
    { id: 'university', baseProduction: 12500 },
  ],
  cossack: [
    { id: 'homestead', baseProduction: 30 },
    { id: 'cannon', baseProduction: 120 },
    { id: 'regiment', baseProduction: 600 },
    { id: 'fortress_sich', baseProduction: 3000 },
    { id: 'hetman_capital', baseProduction: 15000 },
  ],
  hetmanate: [
    { id: 'farm', baseProduction: 40 },
    { id: 'factory', baseProduction: 160 },
    { id: 'gymnasium', baseProduction: 800 },
    { id: 'theater', baseProduction: 4000 },
    { id: 'railway', baseProduction: 20000 },
  ],
  empire: [
    { id: 'manor_estate', baseProduction: 50 },
    { id: 'ironworks', baseProduction: 200 },
    { id: 'university_kyiv', baseProduction: 1000 },
    { id: 'railway_network', baseProduction: 5000 },
    { id: 'cultural_society', baseProduction: 25000 },
  ],
  revolution: [
    { id: 'workers_club', baseProduction: 60 },
    { id: 'military_council', baseProduction: 240 },
    { id: 'national_parliament', baseProduction: 1200 },
    { id: 'national_press', baseProduction: 6000 },
    { id: 'independence_square', baseProduction: 30000 },
  ],
  modern: [
    { id: 'collective_farm', baseProduction: 75 },
    { id: 'industrial_complex', baseProduction: 300 },
    { id: 'hydroelectric', baseProduction: 1500 },
    { id: 'nuclear_plant', baseProduction: 7500 },
    { id: 'space_program', baseProduction: 37500 },
  ],
  independence: [
    { id: 'tech_startup', baseProduction: 100 },
    { id: 'it_company', baseProduction: 400 },
    { id: 'eu_integration', baseProduction: 2000 },
    { id: 'cultural_center', baseProduction: 10000 },
    { id: 'eu_membership', baseProduction: 50000 },
  ],
  egypt: [
    { id: 'papyrus', baseProduction: 200 },
    { id: 'pyramid', baseProduction: 1000 },
    { id: 'temple_complex', baseProduction: 5000 },
    { id: 'obelisk', baseProduction: 25000 },
    { id: 'pharaoh_palace', baseProduction: 125000 },
  ],
  greece: [
    { id: 'olive_grove', baseProduction: 300 },
    { id: 'philosophy_school', baseProduction: 1500 },
    { id: 'gymnasium_athens', baseProduction: 7500 },
    { id: 'oracle_delphi', baseProduction: 37500 },
    { id: 'parthenon', baseProduction: 187500 },
  ],
  rome: [
    { id: 'vineyard', baseProduction: 400 },
    { id: 'colosseum', baseProduction: 2000 },
    { id: 'roman_forum', baseProduction: 10000 },
    { id: 'aqueduct', baseProduction: 50000 },
    { id: 'imperial_palace', baseProduction: 250000 },
  ],
  medieval: [
    { id: 'blacksmith', baseProduction: 500 },
    { id: 'cathedral_gothic', baseProduction: 2500 },
    { id: 'castle_fortress', baseProduction: 12500 },
    { id: 'knights_temple', baseProduction: 62500 },
    { id: 'royal_library', baseProduction: 312500 },
  ],
  renaissance: [
    { id: 'art_studio', baseProduction: 750 },
    { id: 'printing_press', baseProduction: 3750 },
    { id: 'bank_florence', baseProduction: 18750 },
    { id: 'sistine_chapel', baseProduction: 93750 },
    { id: 'medici_palace', baseProduction: 468750 },
  ],
  enlightenment: [
    { id: 'coffee_house', baseProduction: 1000 },
    { id: 'observatory', baseProduction: 5000 },
    { id: 'royal_society', baseProduction: 25000 },
    { id: 'philosophy_academy', baseProduction: 125000 },
    { id: 'louvre', baseProduction: 625000 },
  ],
  victorian: [
    { id: 'textile_factory', baseProduction: 1500 },
    { id: 'railway_station', baseProduction: 7500 },
    { id: 'parliament_uk', baseProduction: 37500 },
    { id: 'empire_ships', baseProduction: 187500 },
    { id: 'crystal_palace', baseProduction: 937500 },
  ],
  modern_world: [
    { id: 'tech_corporation', baseProduction: 2000 },
    { id: 'research_lab', baseProduction: 10000 },
    { id: 'space_station', baseProduction: 50000 },
    { id: 'quantum_computer', baseProduction: 250000 },
    { id: 'mars_colony', baseProduction: 1250000 },
  ],
};

/**
 * Get generator production based on level
 * Production scales: base * level
 */
function getGeneratorProduction(generatorId: string, epochId: string, level: number): number {
  const epochGens = GENERATORS[epochId];
  if (!epochGens) return 0;
  
  const gen = epochGens.find(g => g.id === generatorId);
  if (!gen) return 0;
  
  return gen.baseProduction * level;
}

/**
 * Calculate total passive XP from all generators
 */
function calculatePassiveXp(
  ownedGenerators: GeneratorState[],
  unlockedEpochs: string[]
): number {
  let total = 0;
  
  for (const og of ownedGenerators) {
    // Search all unlocked epochs for this generator
    for (const epochId of unlockedEpochs) {
      const production = getGeneratorProduction(og.generatorId, epochId, og.level);
      if (production > 0) {
        total += production;
        break; // Found in one epoch, don't double count
      }
    }
  }
  
  return total;
}

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body: ValidateRequest = await req.json();
    const { telegram_id, init_data } = body;

    if (!init_data) {
      return jsonResponse({ error: "Missing init_data" }, 400);
    }

    const validation = validateRequest(init_data);
    if (!validation.valid) {
      return jsonResponse({ error: validation.error || "Validation failed" }, 401);
    }

    if (validation.userId !== telegram_id) {
      return jsonResponse({ error: "User ID mismatch" }, 403);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch player state
    const { data: player, error: fetchError } = await supabase
      .from("game_progress")
      .select("owned_generators, unlocked_epochs, prestige_research, passive_xp_per_second")
      .eq("telegram_id", telegram_id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching player:", fetchError);
      return jsonResponse({ error: "Database error" }, 500);
    }

    if (!player) {
      return jsonResponse({ error: "Player not found" }, 404);
    }

    // Calculate expected passive XP
    const owned = (player.owned_generators as GeneratorState[]) ?? [];
    const unlocked = (player.unlocked_epochs as string[]) ?? [];
    const prestigeResearch = (player.prestige_research as Record<string, number>) ?? {};
    
    // Calculate base passive XP
    const basePassiveXp = calculatePassiveXp(owned, unlocked);
    
    // Apply prestige research bonus: +10% per level
    const passiveIncomeBonus = 1 + ((prestigeResearch.passive_income || 0) * 0.10);
    const expectedPassiveXp = basePassiveXp * passiveIncomeBonus;

    // Get current stored value for comparison
    const currentPassiveXp = (player.passive_xp_per_second as number) ?? 0;

    // Calculate discrepancy
    const discrepancy = Math.abs(expectedPassiveXp - currentPassiveXp);
    const isValid = discrepancy < 0.01; // Allow small floating point differences

    console.log(`Passive XP validation: user=${telegram_id}, expected=${expectedPassiveXp}, current=${currentPassiveXp}, valid=${isValid}`);

    return jsonResponse({
      success: true,
      expected_passive_xp: expectedPassiveXp,
      current_passive_xp: currentPassiveXp,
      discrepancy,
      is_valid: isValid,
      passive_income_bonus: passiveIncomeBonus,
      base_passive_xp: basePassiveXp,
    });
  } catch (err) {
    console.error("Validate passive XP error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
