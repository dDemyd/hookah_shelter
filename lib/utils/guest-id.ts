// Lightweight per-browser identity. Cookie holds a random UUID; first call
// generates and stores it, every subsequent call returns the same value.
// No backend session — server only sees the id when the client sends it with
// a request (e.g. POST /api/orders body). Suitable for anonymous guests where
// we just want to thread the same identifier through their orders + drafts.

const COOKIE_NAME = "shelter.guest_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  for (const part of document.cookie.split("; ")) {
    if (part.startsWith(prefix)) return decodeURIComponent(part.slice(prefix.length));
  }
  return null;
}

function writeCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function newGuestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback (very old browsers) — RFC4122-ish without crypto.
  return "guest-" + Date.now().toString(36) + "-" +
    Math.random().toString(36).slice(2, 10);
}

/**
 * Read the guest id, generating + persisting one if missing.
 * Client-only. Returns `null` if called during SSR (no document).
 */
export function getGuestId(): string | null {
  if (typeof document === "undefined") return null;
  const existing = readCookie(COOKIE_NAME);
  if (existing) return existing;
  const fresh = newGuestId();
  writeCookie(COOKIE_NAME, fresh, COOKIE_MAX_AGE);
  return fresh;
}
