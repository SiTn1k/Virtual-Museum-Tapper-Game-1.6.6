import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { validateRequest } from "../_shared/validate-init-data.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Consider a session "active" if last activity was within this time
const SESSION_TIMEOUT_SECONDS = 30;

interface CheckDuplicateRequest {
  telegram_id: number;
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
    const body: CheckDuplicateRequest = await req.json();
    const { telegram_id, init_data } = body;

    if (!telegram_id || typeof telegram_id !== "number" || telegram_id <= 0) {
      return jsonResponse({ error: "Invalid telegram_id" }, 400);
    }

    if (!init_data) {
      return jsonResponse({ error: "Missing init_data" }, 400);
    }

    // Validate HMAC signature
    const validation = validateRequest(init_data);
    if (!validation.valid) {
      console.warn(`HMAC validation failed for check-duplicate-session: ${validation.error}`);
      return jsonResponse({ error: validation.error }, 401);
    }

    if (validation.userId !== telegram_id) {
      console.warn(`User ID mismatch in check-duplicate-session: expected ${validation.userId}, got ${telegram_id}`);
      return jsonResponse({ error: "User ID mismatch" }, 403);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const now = new Date();
    const timeoutThreshold = new Date(now.getTime() - SESSION_TIMEOUT_SECONDS * 1000).toISOString();

    // Check for active sessions (player_sessions)
    const { data: activeSessions } = await supabase
      .from("player_sessions")
      .select("id, session_started_at, last_activity_at")
      .eq("telegram_id", telegram_id)
      .gte("last_activity_at", timeoutThreshold)
      .order("last_activity_at", { ascending: false })
      .limit(1);

    // Also check for recent game_progress updates
    const { data: recentProgress } = await supabase
      .from("game_progress")
      .select("telegram_id, last_online_at, last_saved_at")
      .eq("telegram_id", telegram_id)
      .single();

    let isDuplicate = false;
    let duplicateSource: string | null = null;

    // Check player_sessions for active session
    if (activeSessions && activeSessions.length > 0) {
      const session = activeSessions[0];
      const sessionAge = now.getTime() - new Date(session.last_activity_at as string).getTime();
      
      if (sessionAge < SESSION_TIMEOUT_SECONDS * 1000) {
        isDuplicate = true;
        duplicateSource = "player_sessions";
      }
    }

    // Also check last_online_at in game_progress (fallback detection)
    if (!isDuplicate && recentProgress?.last_online_at) {
      const lastOnline = new Date(recentProgress.last_online_at as string);
      const timeSinceLastOnline = now.getTime() - lastOnline.getTime();
      
      // If user was online within the last 60 seconds, could be a duplicate
      if (timeSinceLastOnline < 60000 && timeSinceLastOnline > 0) {
        isDuplicate = true;
        duplicateSource = "game_progress";
      }
    }

    // Log the check for audit purposes
    console.log(`Duplicate check: user=${telegram_id}, is_duplicate=${isDuplicate}, source=${duplicateSource}, session_count=${activeSessions?.length || 0}`);

    return jsonResponse({
      is_duplicate: isDuplicate,
      duplicate_source: duplicateSource,
      checked_at: now.toISOString(),
    });
  } catch (err) {
    console.error("Check duplicate session error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});