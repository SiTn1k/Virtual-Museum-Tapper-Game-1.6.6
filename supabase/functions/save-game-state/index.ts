/// <reference path="../_shared/deno-types.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@^2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface SaveGameStateRequest {
  init_data: string;
  data: {
    telegram_id: number;
    device_id?: string;
    epoch_id: string;
    level: number;
    xp: number;
    xp_to_next_level: number;
    total_xp: number;
    currency: number;
    total_currency_earned: number;
    tap_power: number;
    passive_xp_per_second: number;
    owned_generators: Record<string, unknown>;
    unlocked_epochs: string[];
    artifact_parts: Record<string, number>;
    artifact_levels: Record<string, number>;
    completed_artifacts: string[];
    artifact_dupes: Record<string, number>;
    referrer_id?: number;
    referrals_count: number;
    referral_earnings: number;
    username?: string;
    first_name?: string;
    photo_url?: string;
    last_saved_at: string;
    active_boosters: Record<string, unknown>;
    last_check_in?: string;
    current_streak: number;
    prestige_level: number;
    prestige_points: number;
    prestige_research: Record<string, unknown>;
    energy: number;
    max_energy: number;
    last_online_at: string;
    session_start_at: string;
    daily_ad_views: Record<string, number>;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const body: SaveGameStateRequest = await req.json();
    const { init_data, data } = body;

    if (!init_data) {
      return new Response(JSON.stringify({ error: 'Missing init_data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate HMAC - same as other edge functions
    const { validateRequest } = await import('../_shared/validate-init-data.ts');
    const validation = validateRequest(init_data);
    
    if (!validation.valid || validation.userId !== data.telegram_id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create admin client for database operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Upsert the game state
    const { error } = await supabaseAdmin
      .from('game_progress')
      .upsert(
        { ...data, telegram_id: data.telegram_id },
        { onConflict: 'telegram_id' }
      );

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ error: 'Failed to save game state' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Clean up orphaned device records for this telegram_id
    if (data.device_id) {
      await supabaseAdmin
        .from('game_progress')
        .delete()
        .eq('device_id', data.device_id)
        .is('telegram_id', null);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
