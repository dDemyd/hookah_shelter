-- ============================================================
-- Сховище — initial schema
-- Source of truth: database-schema.md
-- ============================================================

-- ---------- Tables ----------

CREATE TABLE tobacco_brands (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  slug        text NOT NULL UNIQUE,
  logo_url    text,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_brands_slug ON tobacco_brands(slug);

CREATE TABLE flavor_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  slug        text NOT NULL UNIQUE,
  emoji       text,
  sort_order  int  NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tobaccos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id      uuid NOT NULL REFERENCES tobacco_brands(id) ON DELETE RESTRICT,
  category_id   uuid REFERENCES flavor_categories(id) ON DELETE SET NULL,
  name          text NOT NULL,
  description   text,
  strength      int  NOT NULL CHECK (strength BETWEEN 1 AND 5),
  smoke         int  NOT NULL DEFAULT 4 CHECK (smoke BETWEEN 1 AND 5),
  image_url     text,
  color         text NOT NULL DEFAULT '#ff4500'
                       CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  in_stock      boolean NOT NULL DEFAULT true,
  is_active     boolean NOT NULL DEFAULT true,
  popularity    int     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  UNIQUE (brand_id, name)
);

CREATE INDEX idx_tobaccos_brand     ON tobaccos(brand_id);
CREATE INDEX idx_tobaccos_category  ON tobaccos(category_id);
CREATE INDEX idx_tobaccos_in_stock  ON tobaccos(in_stock) WHERE in_stock = true;
CREATE INDEX idx_tobaccos_active    ON tobaccos(is_active) WHERE is_active = true;

CREATE TABLE preset_mixes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  description   text,
  image_url     text,
  is_signature  boolean NOT NULL DEFAULT false,
  is_new        boolean NOT NULL DEFAULT false,
  is_active     boolean NOT NULL DEFAULT true,
  sort_order    int     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE preset_mix_ingredients (
  preset_mix_id uuid NOT NULL REFERENCES preset_mixes(id) ON DELETE CASCADE,
  tobacco_id    uuid NOT NULL REFERENCES tobaccos(id)     ON DELETE RESTRICT,
  percentage    int  NOT NULL CHECK (percentage BETWEEN 1 AND 100),

  PRIMARY KEY (preset_mix_id, tobacco_id)
);

CREATE INDEX idx_preset_mix_ingredients_mix ON preset_mix_ingredients(preset_mix_id);

CREATE TABLE tables (
  id           int PRIMARY KEY,
  display_name text,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code         text NOT NULL UNIQUE,
  table_id           int  REFERENCES tables(id),
  guest_name         text,
  guest_contact      text,
  preset_mix_id      uuid REFERENCES preset_mixes(id),
  notes              text,
  status             text NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','accepted','preparing','ready','delivered','cancelled')),
  status_changed_at  timestamptz NOT NULL DEFAULT now(),
  cancelled_reason   text,
  accepted_by        uuid REFERENCES auth.users(id),
  price              int  NOT NULL DEFAULT 350,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_status     ON orders(status);
CREATE INDEX idx_orders_table      ON orders(table_id);
CREATE INDEX idx_orders_created    ON orders(created_at DESC);
CREATE INDEX idx_orders_short_code ON orders(short_code);

CREATE TABLE order_ingredients (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tobacco_id       uuid REFERENCES tobaccos(id) ON DELETE SET NULL,
  tobacco_snapshot jsonb NOT NULL,
  percentage       int   NOT NULL CHECK (percentage BETWEEN 1 AND 100),
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_ingredients_order ON order_ingredients(order_id);

CREATE TABLE staff_profiles (
  id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        text NOT NULL,
  role             text NOT NULL CHECK (role IN ('kalyanchik','admin')),
  telegram_chat_id bigint,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app_settings (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  description text,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid REFERENCES auth.users(id)
);


-- ---------- Functions & triggers ----------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_brands       BEFORE UPDATE ON tobacco_brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_tobaccos     BEFORE UPDATE ON tobaccos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_preset_mixes BEFORE UPDATE ON preset_mixes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_orders       BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_app_settings BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Bumps status_changed_at when status actually changes (kept separate from updated_at
-- so we know when a kalyanchik moved the order forward vs. an arbitrary edit).
CREATE OR REPLACE FUNCTION bump_order_status_changed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_changed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_status_changed_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION bump_order_status_changed_at();

-- Short_code generator (no 0/O/1/I confusion).
CREATE OR REPLACE FUNCTION generate_order_short_code()
RETURNS text AS $$
DECLARE
  chars  text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i      int;
BEGIN
  FOR i IN 1..4 LOOP
    result := result || substr(chars, (random() * 31)::int + 1, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.has_staff_role(required_role text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff_profiles
    WHERE id = auth.uid()
      AND role = required_role
      AND is_active = true
  );
$$;


-- ---------- Row Level Security ----------

ALTER TABLE tobacco_brands         ENABLE ROW LEVEL SECURITY;
ALTER TABLE flavor_categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tobaccos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE preset_mixes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE preset_mix_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_ingredients      ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings           ENABLE ROW LEVEL SECURITY;

-- Public read of the catalog (anon + authenticated).
CREATE POLICY "Public read brands"            ON tobacco_brands
  FOR SELECT USING (true);

CREATE POLICY "Public read categories"        ON flavor_categories
  FOR SELECT USING (true);

CREATE POLICY "Public read active tobaccos"   ON tobaccos
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read active presets"    ON preset_mixes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read preset ingredients" ON preset_mix_ingredients
  FOR SELECT USING (true);

CREATE POLICY "Public read active tables"     ON tables
  FOR SELECT USING (is_active = true);

-- Guests can create orders + their ingredients.
CREATE POLICY "Anyone can create orders"            ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can create order ingredients" ON order_ingredients
  FOR INSERT WITH CHECK (true);

-- Guests read orders by short_code (protected by unguessable code at app layer).
CREATE POLICY "Public read orders"             ON orders
  FOR SELECT USING (true);

CREATE POLICY "Public read order ingredients"  ON order_ingredients
  FOR SELECT USING (true);

-- Any authenticated staff user has full access to working tables.
CREATE POLICY "Staff full access to orders"             ON orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staff full access to order ingredients"  ON order_ingredients
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staff manage tobaccos"                   ON tobaccos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staff manage preset mixes"               ON preset_mixes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staff manage preset ingredients"         ON preset_mix_ingredients
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staff manage tables"                     ON tables
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Admin-only: brands, categories, settings.
CREATE POLICY "Admin manage brands" ON tobacco_brands
  FOR ALL TO authenticated
  USING (public.has_staff_role('admin'))
  WITH CHECK (public.has_staff_role('admin'));

CREATE POLICY "Admin manage categories" ON flavor_categories
  FOR ALL TO authenticated
  USING (public.has_staff_role('admin'))
  WITH CHECK (public.has_staff_role('admin'));

CREATE POLICY "Admin manage settings" ON app_settings
  FOR ALL TO authenticated
  USING (public.has_staff_role('admin'))
  WITH CHECK (public.has_staff_role('admin'));

-- Authenticated users can read settings (e.g. accepting_orders flag).
CREATE POLICY "Staff read settings" ON app_settings
  FOR SELECT TO authenticated USING (true);

-- Profiles: each user sees their own; admins see all.
CREATE POLICY "Users see own profile" ON staff_profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "Admin sees all profiles" ON staff_profiles
  FOR ALL TO authenticated
  USING (public.has_staff_role('admin'))
  WITH CHECK (public.has_staff_role('admin'));


-- ---------- Realtime ----------

-- Guests subscribe to their own order by short_code; admin dashboard subscribes
-- to all order updates. Realtime requires the table to be in this publication.
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_ingredients;
