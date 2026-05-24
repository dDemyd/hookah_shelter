-- ============================================================
-- Сховище — anonymous guest identity per browser
-- ============================================================
-- The guest device generates a random UUID, stores it in a cookie, and sends
-- it with every order. We persist it here so admins can see "this is the same
-- guest who ordered yesterday" without a full account system.
--
-- Nullable on purpose: pre-existing orders don't have one, and a malformed
-- request from a misbehaving client must not block order creation.

ALTER TABLE orders
  ADD COLUMN guest_id text;

CREATE INDEX idx_orders_guest_id ON orders(guest_id) WHERE guest_id IS NOT NULL;

COMMENT ON COLUMN orders.guest_id IS
  'Client-generated UUID kept in the shelter.guest_id cookie. Identifies a browser, not a person.';
