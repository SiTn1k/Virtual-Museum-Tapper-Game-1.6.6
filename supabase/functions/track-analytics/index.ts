// Track Analytics Edge Function
// Handles batch analytics event ingestion for LiveOps optimization

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyticsEvent {
  event_type: string;
  timestamp: string;
  session_id: string;
  telegram_id: number;
  properties: Record<string, unknown>;
  value?: number;
  ab_test_variant?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { events, telegram_id } = await req.json();
    
    if (!Array.isArray(events) || events.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No events provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert events into analytics_events table
    const analyticsEvents = events.map((event: AnalyticsEvent) => ({
      event_type: event.event_type,
      timestamp: event.timestamp,
      session_id: event.session_id,
      telegram_id: event.telegram_id,
      properties: event.properties,
      value: event.value,
      ab_test_variant: event.ab_test_variant,
    }));

    const { error } = await supabase
      .from('analytics_events')
      .insert(analyticsEvents);

    if (error) {
      console.error('Analytics insert error:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process specific event types for real-time metrics
    for (const event of events) {
      await processEvent(supabase, event);
    }

    return new Response(
      JSON.stringify({ success: true, processed: events.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Analytics error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processEvent(supabase: any, event: AnalyticsEvent) {
  const { event_type, telegram_id, properties, value } = event;

  switch (event_type) {
    case 'session_start':
      await updateDAU(supabase, telegram_id);
      break;
    case 'session_end':
      await updateSessionMetrics(supabase, telegram_id, properties);
      break;
    case 'level_up':
      await updatePlayerLevel(supabase, telegram_id, properties);
      break;
    case 'purchase_completed':
      await updateRevenueMetrics(supabase, telegram_id, value || 0);
      break;
    case 'ad_watched':
      await updateAdMetrics(supabase, telegram_id, properties);
      break;
    case 'streak_continued':
    case 'streak_broken':
      await updateRetentionMetrics(supabase, telegram_id, event_type);
      break;
    case 'gacha_opened':
      await updateEconomyMetrics(supabase, telegram_id, 'sink', properties);
      break;
    default:
      break;
  }
}

async function updateDAU(supabase: any, telegramId: number) {
  const today = new Date().toISOString().split('T')[0];
  await supabase.rpc('increment_dau', {
    p_date: today,
    p_telegram_id: telegramId,
  }).catch(() => {});
}

async function updateSessionMetrics(supabase: any, telegramId: number, properties: Record<string, unknown>) {
  const sessionId = properties.session_id as string;
  const durationMs = properties.duration_ms as number;
  
  if (sessionId && durationMs) {
    await supabase
      .from('player_sessions')
      .update({
        ended_at: new Date().toISOString(),
        duration_ms: durationMs,
      })
      .eq('session_id', sessionId)
      .catch(() => {});
  }
}

async function updatePlayerLevel(supabase: any, telegramId: number, properties: Record<string, unknown>) {
  const level = properties.level as number;
  if (level) {
    await supabase
      .from('game_progress')
      .update({ level })
      .eq('telegram_id', telegramId)
      .eq('level', '<' + level)
      .catch(() => {});
  }
}

async function updateRevenueMetrics(supabase: any, telegramId: number, amount: number) {
  await supabase.rpc('increment_player_spend', {
    p_telegram_id: telegramId,
    p_amount: amount,
  }).catch(() => {});
}

async function updateAdMetrics(supabase: any, telegramId: number, properties: Record<string, unknown>) {
  const adType = properties.ad_type as string;
  await supabase
    .from('ad_views')
    .insert({
      telegram_id: telegramId,
      ad_type: adType || 'unknown',
      viewed_at: new Date().toISOString(),
    })
    .catch(() => {});
}

async function updateRetentionMetrics(supabase: any, telegramId: number, eventType: string) {
  const today = new Date().toISOString().split('T')[0];
  if (eventType === 'streak_continued') {
    await supabase.rpc('increment_retention', {
      p_date: today,
      p_telegram_id: telegramId,
    }).catch(() => {});
  }
}

async function updateEconomyMetrics(supabase: any, telegramId: number, type: string, properties: Record<string, unknown>) {
  const amount = properties.amount as number || 0;
  const currencyType = properties.currency_type as string || 'standard';
  await supabase
    .from('economy_logs')
    .insert({
      telegram_id: telegramId,
      log_type: type,
      amount,
      currency_type: currencyType,
      logged_at: new Date().toISOString(),
    })
    .catch(() => {});
}
