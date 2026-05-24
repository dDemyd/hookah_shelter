-- Avoid recursive staff_profiles RLS checks by moving role lookup into a
-- SECURITY DEFINER helper owned by the migration role.

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

DROP POLICY IF EXISTS "Admin manage brands" ON tobacco_brands;
CREATE POLICY "Admin manage brands" ON tobacco_brands
  FOR ALL TO authenticated
  USING (public.has_staff_role('admin'))
  WITH CHECK (public.has_staff_role('admin'));

DROP POLICY IF EXISTS "Admin manage categories" ON flavor_categories;
CREATE POLICY "Admin manage categories" ON flavor_categories
  FOR ALL TO authenticated
  USING (public.has_staff_role('admin'))
  WITH CHECK (public.has_staff_role('admin'));

DROP POLICY IF EXISTS "Admin manage settings" ON app_settings;
CREATE POLICY "Admin manage settings" ON app_settings
  FOR ALL TO authenticated
  USING (public.has_staff_role('admin'))
  WITH CHECK (public.has_staff_role('admin'));

DROP POLICY IF EXISTS "Admin sees all profiles" ON staff_profiles;
CREATE POLICY "Admin sees all profiles" ON staff_profiles
  FOR ALL TO authenticated
  USING (public.has_staff_role('admin'))
  WITH CHECK (public.has_staff_role('admin'));
