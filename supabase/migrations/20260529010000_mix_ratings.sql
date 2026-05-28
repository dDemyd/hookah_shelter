-- ============================================================
-- Сховище — preset mix ratings (anonymous, per-guest, 5 stars)
-- ============================================================
-- A guest (identified by the shelter.guest_id cookie) can rate an authored
-- preset mix once. The (preset_mix_id, guest_id) primary key makes the rating
-- a single row per guest; re-rating is an UPDATE (upsert). Denormalized
-- rating_avg / rating_count on preset_mixes are kept in sync by a trigger so
-- cards can read the score without an aggregate per mix.

CREATE TABLE mix_ratings (
  preset_mix_id uuid NOT NULL REFERENCES preset_mixes(id) ON DELETE CASCADE,
  guest_id      text NOT NULL,
  stars         int  NOT NULL CHECK (stars BETWEEN 1 AND 5),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (preset_mix_id, guest_id)
);

CREATE INDEX idx_mix_ratings_mix ON mix_ratings(preset_mix_id);

ALTER TABLE preset_mixes
  ADD COLUMN rating_avg   numeric(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN rating_count int          NOT NULL DEFAULT 0;

-- Recompute the denormalized aggregate for the affected preset mix.
CREATE OR REPLACE FUNCTION sync_mix_rating_aggregate()
RETURNS TRIGGER AS $$
DECLARE
  target uuid := COALESCE(NEW.preset_mix_id, OLD.preset_mix_id);
BEGIN
  UPDATE preset_mixes p
  SET rating_count = agg.cnt,
      rating_avg   = agg.avg
  FROM (
    SELECT
      COUNT(*)                                   AS cnt,
      COALESCE(ROUND(AVG(stars)::numeric, 2), 0) AS avg
    FROM mix_ratings
    WHERE preset_mix_id = target
  ) agg
  WHERE p.id = target;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_mix_rating
  AFTER INSERT OR UPDATE OR DELETE ON mix_ratings
  FOR EACH ROW EXECUTE FUNCTION sync_mix_rating_aggregate();

-- ---------- Row Level Security ----------
ALTER TABLE mix_ratings ENABLE ROW LEVEL SECURITY;

-- Rating rows are not sensitive (guest_id is a random per-browser UUID). Public
-- read lets a guest hydrate their own rating client-side. Writes go through the
-- service-role API route (POST /api/presets/[id]/rate), which bypasses RLS.
CREATE POLICY "Public read mix ratings" ON mix_ratings
  FOR SELECT USING (true);

CREATE POLICY "Staff full access to mix ratings" ON mix_ratings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
