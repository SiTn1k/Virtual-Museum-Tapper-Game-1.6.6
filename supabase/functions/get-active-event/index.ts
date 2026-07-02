// Get Active Event Edge Function
// Returns current active events for a player

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { telegram_id } = await req.json();
    
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
