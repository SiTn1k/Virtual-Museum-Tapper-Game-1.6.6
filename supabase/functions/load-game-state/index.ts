/// <reference path="../_shared/deno-types.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@^2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface LoadGameStateRequest {
  init_data: string;
  telegram_id?: number;
  device_id?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const body: LoadGameStateRequest = await req.json();
    const { init_data, telegram_id, device_id } = body;

    if (!init_data) {
      return new Response(JSON.stringify({ error: 'Missing init_data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate HMAC - same as other edge functions
    const { validateRequest } = await import('../_shared/validate-init-data.ts');
    const validation = validateRequest(init_data);
    
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If telegram_id provided, validate it matches the authenticated user
    if (telegram_id && validation.userId !== telegram_id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create admin client for database operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let result;

    if (telegram_id) {
      // Load by telegram_id
      const { data, error } = await supabaseAdmin
        .from('game_progress')
        .select('*')
        .eq('telegram_id', telegram_id)
        .maybeSingle();

      if (error) {
        console.error('Database error:', error);
        return new Response(JSON.stringify({ error: 'Failed to load game state' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      result = data;
    } else if (device_id) {
      // Load by device_id (fallback for non-Telegram users)
      const { data, error } = await supabaseAdmin
        .from('game_progress')
        .select('*')
        .eq('device_id', device_id)
        .is('telegram_id', null)
        .maybeSingle();

      if (error) {
        console.error('Database error:', error);
        return new Response(JSON.stringify({ error: 'Failed to load game state' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      result = data;
    } else {
      return new Response(JSON.stringify({ error: 'Missing telegram_id or device_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ data: result }), {
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
