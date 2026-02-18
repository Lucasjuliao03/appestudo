CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_admin ON public.user_profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(is_active);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS read_own_profile ON public.user_profiles;
CREATE POLICY read_own_profile ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS insert_own_profile ON public.user_profiles;
CREATE POLICY insert_own_profile ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS update_own_profile ON public.user_profiles;
CREATE POLICY update_own_profile ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.user_profiles WHERE user_id = user_uuid),
    false
  );
$$;

DROP POLICY IF EXISTS read_all_profiles_admin ON public.user_profiles;
CREATE POLICY read_all_profiles_admin ON public.user_profiles
  FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS update_profiles_admin ON public.user_profiles;
CREATE POLICY update_profiles_admin ON public.user_profiles
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS insert_profiles_admin ON public.user_profiles;
CREATE POLICY insert_profiles_admin ON public.user_profiles
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

