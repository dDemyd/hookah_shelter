-- Сховище — one featured preset shown first to guests.

ALTER TABLE preset_mixes
  ADD COLUMN IF NOT EXISTS is_mix_of_day boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_preset_mixes_single_mix_of_day
  ON preset_mixes (is_mix_of_day)
  WHERE is_mix_of_day = true;
