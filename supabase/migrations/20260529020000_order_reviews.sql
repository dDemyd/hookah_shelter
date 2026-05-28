-- ============================================================
-- Сховище — order reviews (one per order, by the ordering guest)
-- ============================================================
-- After an order reaches delivered/closed, the guest who placed it (matched by
-- the shelter.guest_id cookie against orders.guest_id) can leave a single
-- rating + optional comment. order_id is the primary key, so a re-submit is an
-- UPDATE (upsert). Writes go through the service-role API route, which enforces
-- ownership and the delivered/closed gate.

CREATE TABLE order_reviews (
  order_id   uuid PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  guest_id   text NOT NULL,
  rating     int  NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_reviews_guest ON order_reviews(guest_id);

-- ---------- Row Level Security ----------
ALTER TABLE order_reviews ENABLE ROW LEVEL SECURITY;

-- Reviews are tied to an order whose short_code only the guest knows. Public
-- read lets the guest re-load their own submitted review. Writes go through the
-- service-role API route (POST /api/orders/[id]/review), which bypasses RLS.
CREATE POLICY "Public read order reviews" ON order_reviews
  FOR SELECT USING (true);

CREATE POLICY "Staff full access to order reviews" ON order_reviews
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
