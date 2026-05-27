ALTER TABLE tobacco_brands
  ADD COLUMN is_active boolean NOT NULL DEFAULT true;

CREATE INDEX idx_brands_active ON tobacco_brands(is_active) WHERE is_active = true;

DROP POLICY IF EXISTS "Public read brands" ON tobacco_brands;
CREATE POLICY "Public read brands" ON tobacco_brands
  FOR SELECT USING (is_active = true);
