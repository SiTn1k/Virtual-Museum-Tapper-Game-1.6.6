/// <reference path="../_shared/deno-types.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@^2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface GetUserRankRequest {
  telegram_id: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const body: GetUserRankRequest = await req.json();
    const { telegram_id } = body;

    if (!telegram_id) {
      return new Response(JSON.stringify({ error: 'Missing telegram_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create admin client for database operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all users sorted by prestige_level DESC, level DESC, total_xp DESC
    const { data, error } = await supabaseAdmin
      .from('game_progress')
      .select('telegram_id, prestige_level, level, total_xp')
      .order('prestige_level', { ascending: false })
      .order('level', { ascending: false })
      .order('total_xp', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ error: 'Failed to load rankings' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Find user's rank
    const index = data?.findIndex(row => row.telegram_id === telegram_id) ?? -1;
    const rank = index >= 0 ? index + 1 : null;

    return new Response(JSON.stringify({ rank }), {
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
