ALTER TABLE tobaccos
  ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#ff4500';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tobaccos_color_hex_check'
  ) THEN
    ALTER TABLE tobaccos
      ADD CONSTRAINT tobaccos_color_hex_check
      CHECK (color ~ '^#[0-9A-Fa-f]{6}$');
  END IF;
END $$;
