-- ============================================================
-- Сховище — finer strength scale + 'closed' status + overpack
-- ============================================================
-- Three connected changes:
--
-- 1. Bump tobacco strength scale from 1..5 to 1..12. The old scale lost too
--    much resolution between "light" and "very heavy"; barmen want at least
--    a dozen grades.
--
-- 2. Add a terminal 'closed' status to orders. The lifecycle is now:
--      pending → accepted → preparing → ready → delivered → closed
--    "Delivered" now means the kalyanchik gave the hookah to the guest and the
--    guest is actively smoking; the order stays visible to admins until the
--    guest leaves the table, at which point the kalyanchik marks it closed.
--
-- 3. Add an overpack flag to orders. "Оверпак" = +4 g of tobacco above the
--    usual 18 g, slightly stronger smoke, +50 ₴.

-- ---- 1. Strength scale ----
ALTER TABLE tobaccos DROP CONSTRAINT tobaccos_strength_check;
ALTER TABLE tobaccos ADD CONSTRAINT tobaccos_strength_check
  CHECK (strength BETWEEN 1 AND 12);

-- ---- 2. 'closed' status ----
ALTER TABLE orders DROP CONSTRAINT orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'accepted', 'preparing', 'ready', 'delivered', 'closed', 'cancelled'));

-- ---- 3. Overpack flag ----
ALTER TABLE orders ADD COLUMN is_overpack boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN orders.is_overpack IS
  'When true, kalyanchik packs an extra portion (configured in app_settings.overpack_extra_grams) and the order is charged an extra fee (app_settings.overpack_price).';
