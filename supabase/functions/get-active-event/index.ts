// Get Active Event Edge Function
// Returns current active events for a player

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'node:crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
const MAX_INIT_DATA_AGE_SECONDS = 86400;

function parseUrlEncodedForm(formString: string): Map<string, string> {
  const params = new URLSearchParams(formString);
  const map = new Map<string, string>();
  for (const [key, value] of params) {
    map.set(key, value);
  }
  return map;
}

function extractUserId(initData: string): number | null {
  const params = parseUrlEncodedForm(initData);
  const userStr = params.get('user');
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    return typeof user.id === 'number' ? user.id : null;
  } catch {
    return null;
  }
}

function validateRequest(initData: string): { valid: boolean; userId: number | null; error?: string } {
  if (!BOT_TOKEN) return { valid: false, userId: null, error: 'TELEGRAM_BOT_TOKEN not configured' };

  const params = parseUrlEncodedForm(initData);
  const hash = params.get('hash');
  if (!hash) return { valid: false, userId: null, error: 'Missing hash' };

  const authDateStr = params.get('auth_date');
  if (!authDateStr) return { valid: false, userId: null, error: 'Missing auth_date' };
  const authDate = parseInt(authDateStr, 10);
  const age = Math.floor(Date.now() / 1000) - authDate;
  if (isNaN(authDate) || age > MAX_INIT_DATA_AGE_SECONDS || age < 0) {
    return { valid: false, userId: null, error: 'Stale initData' };
  }

  const keys = [...params.keys()].filter(k => k !== 'hash').sort();
  const checkStr = keys.map(k => `${k}=${params.get(k)}`).join('\n');
  const secretKey = createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const computed = createHmac('sha256', secretKey).update(checkStr).digest('hex');

  if (computed !== hash) return { valid: false, userId: null, error: 'HMAC mismatch' };

  return { valid: true, userId: extractUserId(initData) };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await req.json();
    const { telegram_id, init_data } = body;
    
    if (!init_data) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing init_data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validation = validateRequest(init_data);
    if (!validation.valid) {
      console.warn(`HMAC validation failed for get-active-event: ${validation.error}`);
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (validation.userId !== telegram_id) {
      console.warn(`User ID mismatch in get-active-event`);
      return new Response(
        JSON.stringify({ success: false, error: 'User ID mismatch' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!telegram_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'telegram_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date().toISOString();

    // Get active events from database
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .order('priority', { ascending: false });

    if (error) {
      console.error('Error fetching events:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get player's event state for each active event
    const playerEventStates = await Promise.all(
      (events || []).map(async (event: any) => {
        const { data: playerState } = await supabase
          .from('player_event_state')
          .select('*')
          .eq('telegram_id', telegram_id)
          .eq('event_id', event.id)
          .single();
        
        return {
          event,
          playerState: playerState || {
            eventCurrency: 0,
            purchaseHistory: {},
            progress: {},
            rewardsClaimed: [],
          },
        };
      })
    );

    // Calculate combined multipliers
    const combinedMultipliers = {
      currency: 1,
      xp: 1,
      gacha_rate: 1,
      passive: 1,
    };

    for (const { event } of playerEventStates) {
      if (event.reward_multipliers) {
        const mult = event.reward_multipliers;
        if (mult.currency) combinedMultipliers.currency *= mult.currency;
        if (mult.xp) combinedMultipliers.xp *= mult.xp;
        if (mult.gacha_rate) combinedMultipliers.gacha_rate *= mult.gacha_rate;
        if (mult.passive) combinedMultipliers.passive *= mult.passive;
      }
    }

    // Check if it's a weekend
    const day = new Date().getUTCDay();
    const isWeekend = day === 0 || day === 6;

    return new Response(
      JSON.stringify({
        success: true,
        events: playerEventStates,
        combinedMultipliers,
        isWeekend,
        timestamp: now,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Get active event error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
