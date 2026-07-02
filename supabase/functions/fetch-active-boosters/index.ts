/// <reference path="../_shared/deno-types.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@^2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface FetchActiveBoostersRequest {
  init_data?: string;
  telegram_id: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const body: FetchActiveBoostersRequest = await req.json();
    const { init_data, telegram_id } = body;

    // Validate HMAC if init_data provided (optional for this endpoint)
    if (init_data) {
      const { validateRequest } = await import('../_shared/validate-init-data.ts');
      const validation = validateRequest(init_data);
      
      if (!validation.valid || validation.userId !== telegram_id) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Create admin client for database operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch active boosters
    const { data, error } = await supabaseAdmin
      .from('game_progress')
      .select('active_boosters')
      .eq('telegram_id', telegram_id)
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch boosters' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const raw = (data?.active_boosters as Record<string, unknown>) || {};
    // Remove _daily from the response
    const { _daily: _ignored, ...clean } = raw;
    void _ignored;

    return new Response(JSON.stringify({ boosters: clean }), {
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
