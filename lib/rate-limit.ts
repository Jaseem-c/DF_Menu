import "server-only";

/**
 * Best-effort login throttle. State lives in memory, so on serverless hosting it
 * only slows down bursts hitting the same instance. Supabase Auth applies its own
 * server-side rate limits on top (see README for enabling CAPTCHA).
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkLoginAllowed(key: string, now = Date.now()): boolean {
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) return true;
  return entry.count < MAX_ATTEMPTS;
}

export function recordLoginFailure(key: string, now = Date.now()): void {
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  entry.count += 1;
}

export function clearLoginFailures(key: string): void {
  attempts.delete(key);
}
