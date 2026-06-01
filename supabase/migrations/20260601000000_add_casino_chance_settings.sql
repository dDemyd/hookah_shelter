-- Сховище — admin-tunable chances for the random-mix slot machine.
--
-- All three are stored as integer percent (0..100). The public-settings API
-- divides by 100 before exposing them, so guest code keeps working with
-- decimal probabilities. Defaults match the previous hard-coded constants.

INSERT INTO app_settings (key, value, description) VALUES
  ('jackpot_chance_percent', '1',  'Шанс джекпоту в рандомному міксі (0..100 %).'),
  ('overpack_chance_percent', '5',  'Шанс випадання оверпаку (0..100 %).'),
  ('cool_chance_percent',    '25', 'Шанс випадання холодку (0..100 %).')
ON CONFLICT (key) DO NOTHING;
