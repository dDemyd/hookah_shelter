-- ============================================================
-- Сховище — tobacco likes (anonymous, per-guest, deduped)
-- ============================================================
-- A guest (identified by the shelter.guest_id cookie) can like a tobacco once.
-- The (tobacco_id, guest_id) primary key makes the like idempotent; toggling
-- off is a DELETE. A denormalized likes_count on tobaccos is kept in sync by a
-- trigger so the catalog can read the count without an aggregate per card.

CREATE TABLE tobacco_likes (
  tobacco_id uuid NOT NULL REFERENCES tobaccos(id) ON DELETE CASCADE,
  guest_id   text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (tobacco_id, guest_id)
);

CREATE INDEX idx_tobacco_likes_tobacco ON tobacco_likes(tobacco_id);
CREATE INDEX idx_tobacco_likes_guest   ON tobacco_likes(guest_id);

ALTER TABLE tobaccos
  ADD COLUMN likes_count int NOT NULL DEFAULT 0;

-- Keep tobaccos.likes_count in sync with the like rows.
CREATE OR REPLACE FUNCTION sync_tobacco_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tobaccos SET likes_count = likes_count + 1 WHERE id = NEW.tobacco_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tobaccos SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.tobacco_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_tobacco_likes
  AFTER INSERT OR DELETE ON tobacco_likes
  FOR EACH ROW EXECUTE FUNCTION sync_tobacco_likes_count();

-- ---------- Row Level Security ----------
ALTER TABLE tobacco_likes ENABLE ROW LEVEL SECURITY;

-- Like rows are not sensitive (guest_id is a random per-browser UUID). Public
-- read lets a guest hydrate their own liked set client-side. Writes go through
-- the service-role API route (POST /api/tobaccos/[id]/like), which bypasses RLS.
CREATE POLICY "Public read tobacco likes" ON tobacco_likes
  FOR SELECT USING (true);

CREATE POLICY "Staff full access to tobacco likes" ON tobacco_likes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
