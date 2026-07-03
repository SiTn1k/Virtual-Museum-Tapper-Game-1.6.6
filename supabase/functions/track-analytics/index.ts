// Track Analytics Edge Function v2
// Handles batch analytics event ingestion with HMAC validation and batching
// Supports: session_start, session_end, level_up, epoch_unlock, prestige,
// currency_earned, currency_spent, generator_purchase, ad_watched, ad_completed,
// offer_viewed, offer_purchased, referral_sent, leaderboard_viewed,
// achievement_unlocked, daily_task_completed

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac, timingSafeEqual } from 'node:crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// HMAC secret for analytics validation (should match client-side)
const ANALYTICS_HMAC_SECRET = Deno.env.get('ANALYTICS_HMAC_SECRET') ?? '';

// Batching configuration
const BATCH_SIZE = 100;
const MAX_EVENTS_PER_REQUEST = 500;

interface AnalyticsEvent {
  event_type: string;
  timestamp: string;
  session_id: string;
  telegram_id: number;
  properties: Record<string, unknown>;
  value?: number;
  ab_test_variant?: string;
}

interface TrackRequest {
  events: AnalyticsEvent[];
  telegram_id: number;
  signature?: string;
  timestamp?: number;
}

// Valid analytics event types (aligned with AnalyticsEventType in src/types/liveops.ts)
const VALID_EVENT_TYPES = new Set([
  // Session events
  'session_start', 'session_end', 'session_heartbeat',
  // Progression events
  'level_up', 'epoch_unlock', 'prestige', 'tap_power_upgrade',
  // Economy events
  'currency_earned', 'currency_spent', 'generator_purchase', 'gacha_opened',
  'artifact_collected', 'artifact_upgraded',
  // Engagement events
  'daily_claimed', 'streak_continued', 'streak_broken',
  'ad_watched', 'ad_skipped', 'offer_viewed', 'offer_purchased',
  'mission_completed', 'achievement_earned', 'season_tier_reached',
  // Social events
  'referral_sent', 'referral_completed', 'leaderboard_viewed',
  'leaderboard_rank_up', 'leaderboard_top_10', 'share_clicked',
  // LiveOps events
  'event_started', 'event_completed', 'event_reward_claimed',
  'season_started', 'season_purchased', 'season_challenge_completed',
  'comeback_reward_claimed', 'notification_clicked',
  // Energy events
  'energy_full', 'energy_low',
  // Commerce events
  'iap_started', 'iap_completed', 'purchase_failed',
  // Funnel events
  'tutorial_completed', 'ftue_completed',
  'error_occurred', 'settings_changed', 'notification_settings_changed',
]);

/**
 * Validate HMAC signature for request authentication
 */
function validateHMAC(telegramId: number, signature: string | undefined, timestamp: number | undefined): boolean {
  // If no HMAC secret configured, allow all requests (development mode)
  if (!ANALYTICS_HMAC_SECRET) {
    console.warn('[Analytics] HMAC validation disabled - no secret configured');
    return true;
  }

  if (!signature || !timestamp) {
    return false;
  }

  // Check timestamp is within 5 minutes
  const ageSeconds = Math.floor(Date.now() / 1000) - timestamp;
  if (ageSeconds > 300 || ageSeconds < -10) {
    console.warn('[Analytics] HMAC timestamp too old or in future:', ageSeconds);
    return false;
  }

  // Compute expected signature: HMAC-SHA256(telegram_id:timestamp)
  const data = `${telegramId}:${timestamp}`;
  const expectedSignature = createHmac('sha256', ANALYTICS_HMAC_SECRET)
    .update(data)
    .digest('hex');

  try {
    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    
    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }
    
    return timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Validate event data integrity
 */
function validateEvent(event: AnalyticsEvent): { valid: boolean; error?: string } {
  if (!event.event_type || typeof event.event_type !== 'string') {
    return { valid: false, error: 'Missing or invalid event_type' };
  }

  if (!VALID_EVENT_TYPES.has(event.event_type)) {
    return { valid: false, error: `Invalid event_type: ${event.event_type}` };
  }

  if (!event.telegram_id || typeof event.telegram_id !== 'number') {
    return { valid: false, error: 'Missing or invalid telegram_id' };
  }

  if (!event.timestamp || typeof event.timestamp !== 'string') {
    return { valid: false, error: 'Missing or invalid timestamp' };
  }

  if (!event.session_id || typeof event.session_id !== 'string') {
    return { valid: false, error: 'Missing or invalid session_id' };
  }

  return { valid: true };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body: TrackRequest = await req.json();
    const { events, telegram_id, signature, timestamp } = body;

    // Validate request
    if (!Array.isArray(events) || events.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No events provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (events.length > MAX_EVENTS_PER_REQUEST) {
      return new Response(
        JSON.stringify({ success: false, error: `Too many events. Max: ${MAX_EVENTS_PER_REQUEST}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!telegram_id || typeof telegram_id !== 'number') {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing or invalid telegram_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate HMAC signature
    if (!validateHMAC(telegram_id, signature, timestamp)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and filter events
    const validEvents: AnalyticsEvent[] = [];
    const invalidEvents: { index: number; error: string }[] = [];

    for (let i = 0; i < events.length; i++) {
      const validation = validateEvent(events[i]);
      if (validation.valid) {
        // Normalize telegram_id to match request
        validEvents.push({
          ...events[i],
          telegram_id, // Use authenticated telegram_id
        });
      } else {
        invalidEvents.push({ index: i, error: validation.error || 'Unknown error' });
      }
    }

    if (validEvents.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No valid events',
          invalid_events: invalidEvents,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Batch insert events for performance
    const insertResults = { inserted: 0, failed: 0 };
    
    // Process in batches
    for (let i = 0; i < validEvents.length; i += BATCH_SIZE) {
      const batch = validEvents.slice(i, i + BATCH_SIZE);
      
      const analyticsEvents = batch.map((event) => ({
        event_type: event.event_type,
        timestamp: event.timestamp,
        session_id: event.session_id,
        telegram_id: event.telegram_id,
        properties: event.properties || {},
        value: event.value,
        ab_test_variant: event.ab_test_variant,
      }));

      const { error } = await supabase
        .from('analytics_events')
        .insert(analyticsEvents);

      if (error) {
        console.error(`[Analytics] Batch insert error (${i}-${i + batch.length}):`, error);
        insertResults.failed += batch.length;
      } else {
        insertResults.inserted += batch.length;
      }
    }

    // Process session events
    await processSessionEvents(supabase, validEvents);

    // Process real-time metric updates
    await processRealTimeMetrics(supabase, validEvents);

    const processingTime = Date.now() - startTime;

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: validEvents.length,
        failed: insertResults.failed,
        invalid: invalidEvents.length,
        processing_time_ms: processingTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Analytics] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Process session-related events
 */
async function processSessionEvents(supabase: any, events: AnalyticsEvent[]) {
  for (const event of events) {
    const { event_type, telegram_id, properties, timestamp } = event;

    if (event_type === 'session_start') {
      // Create new session record
      const sessionId = properties.session_id as string;
      const platform = properties.platform as string || 'telegram_miniapp';
      
      await supabase
        .from('analytics_sessions')
        .upsert({
          session_id: sessionId,
          telegram_id,
          started_at: timestamp,
          platform,
          device_info: properties.device_info || {},
        }, {
          onConflict: 'session_id',
        })
        .catch((err: Error) => console.error('[Analytics] Session create error:', err));

      // Update DAU
      const today = timestamp ? new Date(timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      await updateDAU(supabase, telegram_id, today);

    } else if (event_type === 'session_end') {
      // End session and calculate duration
      const sessionId = properties.session_id as string;
      const durationMs = properties.duration_ms as number;
      const endedAt = properties.ended_at ? new Date(properties.ended_at as string).toISOString() : new Date().toISOString();
      
      await supabase
        .from('analytics_sessions')
        .update({
          ended_at: endedAt,
          duration_ms: durationMs,
          updated_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId)
        .catch((err: Error) => console.error('[Analytics] Session end error:', err));
    }
  }
}

/**
 * Process real-time metric updates
 */
async function processRealTimeMetrics(supabase: any, events: AnalyticsEvent[]) {
  for (const event of events) {
    const { event_type, telegram_id, properties, value } = event;

    switch (event_type) {
      case 'level_up':
        await updatePlayerLevel(supabase, telegram_id, properties);
        break;
      case 'iap_completed':
        await updateRevenueMetrics(supabase, telegram_id, value || 0);
        break;
      case 'ad_watched':
        await updateAdMetrics(supabase, telegram_id, properties);
        break;
      case 'streak_continued':
        await updateRetentionMetrics(supabase, telegram_id);
        break;
      case 'gacha_opened':
        await updateEconomyMetrics(supabase, telegram_id, 'sink', properties);
        break;
      case 'currency_earned':
        await updateEconomyMetrics(supabase, telegram_id, 'source', properties);
        break;
      case 'currency_spent':
      case 'generator_purchase':
        await updateEconomyMetrics(supabase, telegram_id, 'sink', properties);
        break;
      default:
        break;
    }
  }
}

async function updateDAU(supabase: any, telegramId: number, date: string) {
  try {
    await supabase.rpc('increment_dau', {
      p_date: date,
      p_telegram_id: telegramId,
    });
  } catch (err) {
    console.warn('[Analytics] DAU update skipped (function may not exist):', err);
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
  try {
    await supabase.rpc('increment_player_spend', {
      p_telegram_id: telegramId,
      p_amount: amount,
    });
  } catch {
    // RPC may not exist, skip silently
  }
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

async function updateRetentionMetrics(supabase: any, telegramId: number) {
  const today = new Date().toISOString().split('T')[0];
  try {
    await supabase.rpc('increment_retention', {
      p_date: today,
      p_telegram_id: telegramId,
    });
  } catch {
    // RPC may not exist, skip silently
  }
}

async function updateEconomyMetrics(
  supabase: any, 
  telegramId: number, 
  type: 'source' | 'sink',
  properties: Record<string, unknown>
) {
  const amount = properties.amount as number || 0;
  const currencyType = properties.currency_type as string || 
                      properties.source as string || 
                      properties.destination as string || 
                      'standard';
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
