/// <reference path="./deno-types.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createHmac } from "node:crypto";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const MAX_INIT_DATA_AGE_SECONDS = 86400;

interface ValidationResult {
  valid: boolean;
  userId: number | null;
  error?: string;
}

function parseUrlEncodedForm(formString: string): Map<string, string> {
  const params = new URLSearchParams(formString);
  const map = new Map<string, string>();
  for (const [key, value] of params) {
    map.set(key, value);
  }
  return map;
}

export function extractUserId(initData: string): number | null {
  const params = parseUrlEncodedForm(initData);
  const userStr = params.get("user");
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    return typeof user.id === "number" ? user.id : null;
  } catch {
    return null;
  }
}

export function validateRequest(initData: string): ValidationResult {
  if (!BOT_TOKEN) {
    return { valid: false, userId: null, error: "TELEGRAM_BOT_TOKEN not configured" };
  }

  const params = parseUrlEncodedForm(initData);
  const hash = params.get("hash");
  if (!hash) {
    return { valid: false, userId: null, error: "Missing hash in initData" };
  }

  const authDateStr = params.get("auth_date");
  if (!authDateStr) {
    return { valid: false, userId: null, error: "Missing auth_date" };
  }

  const authDate = parseInt(authDateStr, 10);
  if (isNaN(authDate)) {
    return { valid: false, userId: null, error: "Invalid auth_date" };
  }

  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (ageSeconds > MAX_INIT_DATA_AGE_SECONDS) {
    return { valid: false, userId: null, error: "initData too old" };
  }
  if (ageSeconds < 0) {
    return { valid: false, userId: null, error: "auth_date is in the future" };
  }

  const keys = [...params.keys()].filter(k => k !== "hash").sort();
  const dataCheckString = keys.map(k => `${k}=${params.get(k)}`).join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const computedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (computedHash !== hash) {
    return { valid: false, userId: null, error: "HMAC mismatch — initData is forged or corrupted" };
  }

  const userId = extractUserId(initData);

  return { valid: true, userId };
}
