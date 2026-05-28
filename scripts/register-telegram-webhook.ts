/**
 * One-off: tell Telegram where to POST updates.
 *
 *   npm run tg:webhook:register
 *   npm run tg:webhook:delete
 *
 * Reads TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, and NEXT_PUBLIC_APP_URL
 * from .env.local. Re-runnable; setWebhook overwrites any previous registration.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Lightweight .env.local loader so the script works without `dotenv`.
function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  try {
    const contents = readFileSync(path, "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith("\"") && value.endsWith("\"")) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // No .env.local — rely on caller's environment.
  }
}

async function main() {
  loadEnv();

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token === "placeholder-token") {
    throw new Error("TELEGRAM_BOT_TOKEN is missing in .env.local");
  }
  const base = `https://api.telegram.org/bot${token}`;
  const wantsDelete = process.argv.includes("--delete");

  if (wantsDelete) {
    const res = await fetch(`${base}/deleteWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drop_pending_updates: false }),
    });
    const body = await res.json();
    console.log("[deleteWebhook]", body);
    if (!body.ok) process.exit(1);
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!appUrl) throw new Error("NEXT_PUBLIC_APP_URL is missing");
  if (!secret || secret === "placeholder-webhook-secret") {
    throw new Error("TELEGRAM_WEBHOOK_SECRET is missing");
  }
  if (appUrl.startsWith("http://localhost")) {
    throw new Error(
      "Cannot register webhook for localhost. Use a public URL (Vercel deployment or ngrok).",
    );
  }

  const url = `${appUrl.replace(/\/$/, "")}/api/telegram/webhook`;

  const res = await fetch(`${base}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      secret_token: secret,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: false,
    }),
  });
  const body = await res.json();
  console.log("[setWebhook]", body);
  if (!body.ok) process.exit(1);

  // Confirm
  const info = await fetch(`${base}/getWebhookInfo`).then((r) => r.json());
  console.log("[getWebhookInfo]", info);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
