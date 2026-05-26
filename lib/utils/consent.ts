// Per-browser 18+ acceptance flag stored in a cookie. Mirrors guest-id.ts:
// purely client-side, no SDK, no backend session.

const COOKIE_NAME = "shelter.consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
const CURRENT_VERSION = "1";

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
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

/** True if this browser has accepted the 18+/disclaimer at the current version. */
export function hasAcceptedDisclaimer(): boolean {
  return readCookie(COOKIE_NAME) === CURRENT_VERSION;
}

/** Record acceptance. Persists for 1 year. */
export function acceptDisclaimer(): void {
  writeCookie(COOKIE_NAME, CURRENT_VERSION, COOKIE_MAX_AGE);
}
