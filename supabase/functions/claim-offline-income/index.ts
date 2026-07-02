import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { validateRequest } from "../_shared/validate-init-data.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

/**
 * Claim Offline Income Edge Function
 *
 * Server-authoritative offline income calculation.
 * Uses server timestamps to prevent device clock manipulation.
 *
 * Race condition protection:
 * - Advisory lock (pg_advisory_xact_lock) prevents concurrent claims
 * - Atomic swap of last_online_at ensures only one claim per session
 * - All operations in single transaction for consistency
 */

interface ClaimOfflineRequest {
  telegram_id: number;
  x2_boost?: boolean;
  init_data: string;
}

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body: ClaimOfflineRequest = await req.json();
    const { telegram_id, x2_boost = false, init_data } = body;

    if (!init_data) {
      return jsonResponse({ error: "Missing init_data" }, 400);
    }

    const validation = validateRequest(init_data);
    if (!validation.valid) {
      return jsonResponse({ error: validation.error }, 401);
    }

    if (validation.userId !== telegram_id) {
      return jsonResponse({ error: "User ID mismatch" }, 403);
    }

    if (!telegram_id || typeof telegram_id !== "number" || telegram_id <= 0) {
      return jsonResponse({ error: "Invalid telegram_id" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const now = new Date();

    // Execute entire claim process in a single RPC call with advisory lock
    // This ensures atomicity and prevents race conditions
    const { data: result, error: rpcError } = await supabase.rpc(
      "claim_offline_income_atomic",
      {
        p_telegram_id: telegram_id,
        p_new_time: now.toISOString(),
        p_x2_boost: x2_boost,
      }
    );

    if (rpcError) {
      console.error("RPC error:", rpcError);
      return jsonResponse({ error: "Failed to process offline claim" }, 500);
    }

    if (!result) {
      return jsonResponse({ error: "No result from claim process" }, 500);
    }

    // result contains: { success, xp, currency, offline_seconds, message }
    return jsonResponse(result);

  } catch (err) {
    console.error("Claim offline error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
