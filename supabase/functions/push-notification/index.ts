import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Types for push notification
interface PushNotificationPayload {
  user_id: number;
  title: string;
  message: string;
  action?: {
    label: string;
    url: string;
  };
}

interface ScheduledNotification {
  id: string;
  telegram_id: number;
  notification_type: string;
  scheduled_for: string;
  payload: PushNotificationPayload;
  created_at: string;
}

/**
 * Send push notification via Telegram Bot API
 */
async function sendTelegramPush(
  userId: number,
  title: string,
  message: string,
  action?: { label: string; url: string }
): Promise<{ success: boolean; error?: string }> {
  if (!TELEGRAM_BOT_TOKEN) {
    return { success: false, error: "Bot token not configured" };
  }

  // Format message with HTML
  const fullMessage = `<b>${title}</b>\n\n${message}`;
  
  // Build inline keyboard if action provided
  const replyMarkup = action
    ? JSON.stringify({
        inline_keyboard: [[{ text: action.label, url: action.url }]],
      })
    : undefined;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: userId,
          text: fullMessage,
          parse_mode: "HTML",
          reply_markup,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.ok) {
      console.error("Telegram API error:", data);
      return { success: false, error: data.description || "Failed to send message" };
    }

    return { success: true };
  } catch (err) {
    console.error("Error sending Telegram message:", err);
    return { success: false, error: "Network error" };
  }
}

/**
 * Store notification for later sending (for scheduled notifications)
 */
async function scheduleNotification(
  supabase: ReturnType<typeof createClient>,
  notification: Omit<ScheduledNotification, "id" | "created_at">
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("scheduled_notifications")
      .insert({
        telegram_id: notification.telegram_id,
        notification_type: notification.notification_type,
        scheduled_for: notification.scheduled_for,
        payload: notification.payload,
      });

    if (error) {
      console.error("Error scheduling notification:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error scheduling notification:", err);
    return { success: false, error: "Database error" };
  }
}

/**
 * Check if user has allowed notifications
 */
async function hasAllowedNotifications(
  supabase: ReturnType<typeof createClient>,
  telegramId: number
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("game_progress")
      .select("notification_settings")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    if (!data) return false;

    const settings = (data.notification_settings as Record<string, unknown>) || {};
    return (settings.enabled as boolean) !== false;
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { action, telegram_id, title, message, action_url, action_label, schedule_for } = body as {
      action: "send" | "schedule";
      telegram_id?: number;
      title?: string;
      message?: string;
      action_url?: string;
      action_label?: string;
      schedule_for?: string;
    };

    // Validate required fields for send action
    if (action === "send") {
      if (!telegram_id || !title || !message) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: telegram_id, title, message" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      
      // Check if user allows notifications
      const allowed = await hasAllowedNotifications(supabase, telegram_id);
      if (!allowed) {
        return new Response(
          JSON.stringify({ success: false, error: "Notifications disabled by user" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send the notification
      const actionObj = action_url && action_label
        ? { label: action_label, url: action_url }
        : undefined;

      const result = await sendTelegramPush(telegram_id, title, message, actionObj);

      return new Response(
        JSON.stringify(result),
        { status: result.success ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required fields for schedule action
    if (action === "schedule") {
      if (!telegram_id || !title || !message || !schedule_for) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: telegram_id, title, message, schedule_for" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const actionObj = action_url && action_label
        ? { label: action_label, url: action_url }
        : undefined;

      const result = await scheduleNotification(supabase, {
        telegram_id,
        notification_type: "custom",
        scheduled_for: schedule_for,
        payload: {
          user_id: telegram_id,
          title,
          message,
          action: actionObj,
        },
      });

      return new Response(
        JSON.stringify(result),
        { status: result.success ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'send' or 'schedule'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Push notification error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
