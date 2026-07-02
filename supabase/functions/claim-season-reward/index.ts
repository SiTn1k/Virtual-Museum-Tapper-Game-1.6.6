// Claim Season Reward Edge Function
// Handles season/battle pass reward claims with server-side validation

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClaimRequest {
  telegram_id: number;
  season_id: string;
  tier: number;
  is_premium: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { telegram_id, season_id, tier, is_premium }: ClaimRequest = await req.json();
    
    if (!telegram_id || !season_id || tier === undefined) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get season configuration
    const { data: season, error: seasonError } = await supabase
      .from('seasons')
      .select('*')
      .eq('id', season_id)
      .single();

    if (seasonError || !season) {
      return new Response(
        JSON.stringify({ success: false, error: 'Season not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if season is active
    const now = new Date();
    const seasonStart = new Date(season.start_date);
    const seasonEnd = new Date(season.end_date);
    
    if (now < seasonStart || now > seasonEnd) {
      return new Response(
        JSON.stringify({ success: false, error: 'Season is not active' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get player's season state
    const { data: playerSeason, error: playerSeasonError } = await supabase
      .from('player_seasons')
      .select('*')
      .eq('telegram_id', telegram_id)
      .eq('season_id', season_id)
      .single();

    if (playerSeasonError || !playerSeason) {
      return new Response(
        JSON.stringify({ success: false, error: 'Player has not started this season' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if tier is already claimed
    const claimedTiers = playerSeason.claimed_tiers || [];
    if (claimedTiers.includes(tier)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Tier already claimed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if tier is achievable (player has enough XP)
    if (playerSeason.total_xp < season.rewards[tier - 1]?.xp_required) {
      return new Response(
        JSON.stringify({ success: false, error: 'Tier not yet achieved' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check premium requirement
    if (is_premium && !playerSeason.premium_purchased) {
      return new Response(
        JSON.stringify({ success: false, error: 'Premium not purchased' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the reward
    const reward = is_premium 
      ? season.premium_rewards?.[tier - 1] 
      : season.free_rewards?.[tier - 1];

    if (!reward) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid tier' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process rewards
    const rewards: any[] = [];
    
    // Add rewards based on type
    if (reward.type === 'currency' && reward.amount) {
      rewards.push({ type: 'currency', amount: reward.amount });
    }
    if (reward.type === 'xp' && reward.amount) {
      rewards.push({ type: 'xp', amount: reward.amount });
    }
    if (reward.type === 'artifact_fragment' && reward.amount) {
      rewards.push({ 
        type: 'artifact_fragment', 
        amount: reward.amount,
        rarity: reward.rarity 
      });
    }
    if (reward.type === 'gacha_ticket' && reward.amount) {
      rewards.push({ type: 'gacha_ticket', amount: reward.amount });
    }

    // Update claimed tiers
    const newClaimedTiers = [...claimedTiers, tier];
    const { error: updateError } = await supabase
      .from('player_seasons')
      .update({ 
        claimed_tiers: newClaimedTiers,
        updated_at: new Date().toISOString()
      })
      .eq('telegram_id', telegram_id)
      .eq('season_id', season_id);

    if (updateError) {
      console.error('Error updating season state:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to claim reward' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Apply rewards to player's game state
    for (const rewardItem of rewards) {
      if (rewardItem.type === 'currency') {
        await supabase.rpc('add_currency', {
          p_telegram_id: telegram_id,
          p_amount: rewardItem.amount,
        }).catch(() => {});
      } else if (rewardItem.type === 'gacha_ticket') {
        await supabase.rpc('add_gacha_ticket', {
          p_telegram_id: telegram_id,
          p_amount: rewardItem.amount,
        }).catch(() => {});
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        rewards,
        newClaimedTiers,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Claim season reward error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
