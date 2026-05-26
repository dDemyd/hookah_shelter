-- Seed data. Runs after migrations on `supabase db reset` or `supabase start`.
-- Idempotent: every INSERT uses ON CONFLICT DO NOTHING so reruns are safe.

-- ---------- Flavor categories ----------
INSERT INTO flavor_categories (name, slug, emoji, sort_order) VALUES
  ('Цитрусові', 'citrus',   '🍋', 1),
  ('Ягоди',     'berries',  '🍓', 2),
  ('М''ята',    'mint',     '🌿', 3),
  ('Десерт',    'dessert',  '🍰', 4),
  ('Пряне',     'spicy',    '🌶️', 5),
  ('Тропіки',   'tropical', '🥭', 6),
  ('Тютюнові',  'tobacco',  '🚬', 7)
ON CONFLICT (slug) DO NOTHING;

-- ---------- Brands ----------
INSERT INTO tobacco_brands (name, slug) VALUES
  ('Darkside', 'darkside'),
  ('Musthave', 'musthave'),
  ('Element',  'element'),
  ('420',      '420'),
  ('Tangiers', 'tangiers'),
  ('Chefs',    'chefs')
ON CONFLICT (slug) DO NOTHING;

-- ---------- Tobaccos ----------
INSERT INTO tobaccos (id, brand_id, category_id, name, description, strength, smoke, color, in_stock, is_active, popularity)
SELECT
  seed.id,
  brand.id,
  category.id,
  seed.name,
  seed.description,
  seed.strength,
  seed.smoke,
  seed.color,
  seed.in_stock,
  seed.is_active,
  seed.popularity
FROM (
  VALUES
    ('11111111-1111-4111-8111-111111111111'::uuid, 'darkside', 'berries',  'Cherry Core',        'Спіла темна вишня з гірчинкою кісточки.', 4, 4, '#c5183a', true,  true,  5),
    ('11111111-1111-4111-8111-111111111112'::uuid, 'darkside', 'mint',     'Generation Mint',    'Холодний бриз для ягідних та цитрусових міксів.', 3, 5, '#1ec27a', true,  true,  5),
    ('11111111-1111-4111-8111-111111111113'::uuid, 'darkside', 'dessert',  'Code Cola',          'Ностальгійна кола з бульбашками.', 3, 4, '#7a3814', true,  true,  3),
    ('11111111-1111-4111-8111-111111111114'::uuid, 'musthave', 'tropical', 'Mango',              'Соковите тропічне манго без зайвої сиропності.', 2, 4, '#f0a523', true,  true,  5),
    ('11111111-1111-4111-8111-111111111115'::uuid, 'musthave', 'berries',  'Sour Grape',         'Зелений виноград із характерною кислинкою.', 3, 4, '#7a2bb8', true,  true,  4),
    ('11111111-1111-4111-8111-111111111116'::uuid, 'musthave', 'citrus',   'Citrus Mix',         'Грейпфрут, апельсин і лимон одним диханням.', 3, 4, '#ffb030', true,  true,  4),
    ('11111111-1111-4111-8111-111111111117'::uuid, 'element',  'dessert',  'Smoke Pear',         'Стигла груша з глибоким димним профілем.', 4, 5, '#a8b53a', true,  true,  5),
    ('11111111-1111-4111-8111-111111111118'::uuid, 'element',  'spicy',    'Cardamom',           'Гострий, пряний, з легкою гірчинкою.', 5, 3, '#8a5a2a', true,  true,  3),
    ('11111111-1111-4111-8111-111111111119'::uuid, '420',      'citrus',   'Pink Grapefruit',    'Гірчинка грейпфрута з холодком.', 3, 4, '#ff6b8a', true,  true,  5),
    ('11111111-1111-4111-8111-111111111120'::uuid, 'tangiers', 'tobacco',  'Cane Burley',        'Чистий тютюновий профіль для досвідчених гостей.', 5, 4, '#6d4a26', true, true, 2)
) AS seed(id, brand_slug, category_slug, name, description, strength, smoke, color, in_stock, is_active, popularity)
JOIN tobacco_brands brand ON brand.slug = seed.brand_slug
JOIN flavor_categories category ON category.slug = seed.category_slug
ON CONFLICT (id) DO NOTHING;

-- ---------- Preset mixes ----------
INSERT INTO preset_mixes (id, name, description, is_signature, is_new, is_active, sort_order)
VALUES
  ('22222222-2222-4222-8222-222222222221', 'Сховище', 'Хвойний дим, груша, крапля абсенту', true, false, true, 1),
  ('22222222-2222-4222-8222-222222222222', 'Цитрусовий вибух', 'Грейпфрут, лайм, холодний імбир', true, false, true, 2),
  ('22222222-2222-4222-8222-222222222223', 'Десерт ночі', 'Карамель, печений банан, какао', true, true, true, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO preset_mix_ingredients (preset_mix_id, tobacco_id, percentage)
VALUES
  ('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111117', 50),
  ('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111112', 25),
  ('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111120', 25),
  ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111119', 45),
  ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111116', 35),
  ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111112', 20),
  ('22222222-2222-4222-8222-222222222223', '11111111-1111-4111-8111-111111111113', 40),
  ('22222222-2222-4222-8222-222222222223', '11111111-1111-4111-8111-111111111117', 40),
  ('22222222-2222-4222-8222-222222222223', '11111111-1111-4111-8111-111111111115', 20)
ON CONFLICT (preset_mix_id, tobacco_id) DO NOTHING;

-- ---------- Tables (15 шт.) ----------
INSERT INTO tables (id, display_name)
SELECT n, 'Стіл №' || n
FROM generate_series(1, 15) AS n
ON CONFLICT (id) DO NOTHING;

-- ---------- App settings ----------
INSERT INTO app_settings (key, value, description) VALUES
  ('default_price',                   '350',  'Базова ціна кальяну в гривнях'),
  ('refill_price',                    '200',  'Ціна забивки (мікс із собою)'),
  ('day_loaner_price',                '350',  'Ціна міксу/послуги для кальяну «з собою на день» (₴, без залогу)'),
  ('day_loaner_deposit',              '1000', 'Застава за кальян «з собою на день» (₴, повертається)'),
  ('overpack_price',                  '50',   'Доплата за оверпак'),
  ('overpack_extra_grams',            '4',    'Додаткові грами тютюну при оверпаку (понад звичайних 18)'),
  ('max_ingredients_per_mix',         '4',    'Максимальна кількість тютюнів у міксі (3-4)'),
  ('coal_reminder_interval_minutes',  '0',    'Інтервал Telegram-нагадування струсити вугілля для виданих кальянів; 0 вимикає'),
  ('accepting_orders',                'true', 'Глобальний рубильник прийому замовлень'),
  ('telegram_notifications_chat_id',  '""',   'ID Telegram-чату для нотифікацій (заповнити вручну)')
ON CONFLICT (key) DO NOTHING;
