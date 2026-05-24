-- ============================================================
-- Сховище — order service type (full hookah vs. refill)
-- ============================================================
-- Guests can now choose between a full hookah service (350 ₴, default) and
-- a "забивка" — refill of the bowl only for guests who already have a hookah
-- on the table (200 ₴). Stored on each order so price + Telegram message can
-- reflect the choice.

ALTER TABLE orders
  ADD COLUMN service_type text NOT NULL DEFAULT 'hookah'
    CHECK (service_type IN ('hookah', 'refill'));

COMMENT ON COLUMN orders.service_type IS
  'Service tier: hookah = full setup, refill = bowl-only (забивка).';
