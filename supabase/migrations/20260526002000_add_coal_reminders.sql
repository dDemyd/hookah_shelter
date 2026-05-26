-- Сховище — Telegram coal reminders for delivered table hookahs.
--
-- When an order is in `delivered`, cron can remind staff every configured
-- interval to shake the coals. `last_coal_reminder_at` prevents duplicate
-- reminders on every cron tick.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS last_coal_reminder_at timestamptz;

COMMENT ON COLUMN orders.last_coal_reminder_at IS
  'Last time the Telegram coal reminder was sent for this delivered order.';

INSERT INTO app_settings (key, value, description) VALUES
  ('coal_reminder_interval_minutes', '0', 'Інтервал Telegram-нагадування струсити вугілля для виданих кальянів; 0 вимикає')
ON CONFLICT (key) DO UPDATE
SET value = '0',
    description = EXCLUDED.description;
