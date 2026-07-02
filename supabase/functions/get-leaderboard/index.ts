/// <reference path="../_shared/deno-types.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@^2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface LeaderboardRequest {
  init_data?: string;
  limit?: number;
}

interface LeaderboardEntry {
  telegram_id: number;
  first_name: string | null;
  username: string | null;
  level: number;
  total_xp: number;
  prestige_level: number;
  referrals_count: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const body: LeaderboardRequest = await req.json();
    const { init_data, limit = 50 } = body;

    // For leaderboard, HMAC validation is optional - it shows public data
    // But if init_data is provided, validate it for consistency
    if (init_data) {
      const { validateRequest } = await import('../_shared/validate-init-data.ts');
      const validation = validateRequest(init_data);
      
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Create admin client for database operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch leaderboard - sorted by prestige_level, level, then total_xp
    const { data, error } = await supabaseAdmin
      .from('game_progress')
      .select('telegram_id, first_name, username, level, total_xp, prestige_level, referrals_count')
      .order('prestige_level', { ascending: false })
      .order('level', { ascending: false })
      .order('total_xp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ error: 'Failed to load leaderboard' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const leaderboard: LeaderboardEntry[] = (data || []).map((row, index) => ({
      telegram_id: row.telegram_id,
      first_name: row.first_name,
      username: row.username,
      level: row.level,
      total_xp: row.total_xp,
      prestige_level: row.prestige_level || 0,
      referrals_count: row.referrals_count || 0,
      rank: index + 1,
    }));

    return new Response(JSON.stringify({ data: leaderboard }), {
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
