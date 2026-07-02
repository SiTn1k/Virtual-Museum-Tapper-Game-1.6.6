/// <reference path="../_shared/deno-types.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@^2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ApplyReferralBonusRequest {
  init_data: string;
  referrer_id: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const body: ApplyReferralBonusRequest = await req.json();
    const { init_data, referrer_id } = body;

    if (!init_data) {
      return new Response(JSON.stringify({ error: 'Missing init_data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate HMAC
    const { validateRequest } = await import('../_shared/validate-init-data.ts');
    const validation = validateRequest(init_data);
    
    if (!validation.valid || !validation.userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create admin client for database operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get current values for referrer
    const { data: referrer, error: fetchError } = await supabaseAdmin
      .from('game_progress')
      .select('currency, total_currency_earned, referrals_count, referral_earnings')
      .eq('telegram_id', referrer_id)
      .maybeSingle();

    if (fetchError || !referrer) {
      console.error('Failed to fetch referrer:', fetchError);
      return new Response(JSON.stringify({ error: 'Referrer not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Calculate new values
    const REFERRER_BONUS = 100;
    const newCurrency = (referrer.currency || 0) + REFERRER_BONUS;
    const newTotalEarned = (referrer.total_currency_earned || 0) + REFERRER_BONUS;
    const newReferralsCount = (referrer.referrals_count || 0) + 1;
    const newReferralEarnings = (referrer.referral_earnings || 0) + REFERRER_BONUS;

    // Update referrer's progress
    const { error: updateError } = await supabaseAdmin
      .from('game_progress')
      .update({
        currency: newCurrency,
        total_currency_earned: newTotalEarned,
        referrals_count: newReferralsCount,
        referral_earnings: newReferralEarnings,
      })
      .eq('telegram_id', referrer_id);

    if (updateError) {
      console.error('Failed to update referrer:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to apply bonus' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      bonus: REFERRER_BONUS,
      new_currency: newCurrency,
      new_referrals_count: newReferralsCount
    }), {
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
