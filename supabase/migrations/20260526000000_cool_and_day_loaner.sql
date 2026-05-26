-- ============================================================
-- Сховище — Холодок (cool/menthol intensity) + day-loaner service
-- ============================================================
-- Two unrelated product additions:
--
-- 1. "Холодок" — a free add-on to any mix (mint/cool agent). Strength is on a
--    1-5 scale; 0 means the add-on is off. Stored on the order so we know
--    how strong to load the kalyud cup, and it shows up in the Telegram alert.
--
-- 2. "Кальян з собою на день" (day_loaner) — guest takes the full hookah,
--    bowl, tongs, kalyud etc. home for the day. We charge the mix price plus
--    a refundable deposit (default 1000 ₴) tracked via app_settings.

ALTER TABLE orders
  ADD COLUMN cool_intensity smallint NOT NULL DEFAULT 0
    CHECK (cool_intensity BETWEEN 0 AND 5);

COMMENT ON COLUMN orders.cool_intensity IS
  'Холодок strength 1-5; 0 means off. Free add-on, independent of overpack.';

ALTER TABLE orders DROP CONSTRAINT orders_service_type_check;
ALTER TABLE orders ADD CONSTRAINT orders_service_type_check
  CHECK (service_type IN ('hookah', 'refill', 'day_loaner'));

-- Refundable deposit stored on the order so accounting can match returns
-- even if admin later changes the global default.
ALTER TABLE orders
  ADD COLUMN deposit_amount integer NOT NULL DEFAULT 0
    CHECK (deposit_amount >= 0);

COMMENT ON COLUMN orders.deposit_amount IS
  'Refundable deposit (₴) held against day_loaner orders. Returned when guest brings the hookah back.';

INSERT INTO app_settings (key, value, description) VALUES
  ('day_loaner_deposit', '1000', 'Застава за кальян «з собою на день» (₴, повертається)')
ON CONFLICT (key) DO NOTHING;
