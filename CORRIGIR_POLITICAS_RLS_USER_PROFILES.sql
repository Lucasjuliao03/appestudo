DROP POLICY IF EXISTS read_own_profile ON public.user_profiles;
DROP POLICY IF EXISTS read_all_profiles_admin ON public.user_profiles;
DROP POLICY IF EXISTS update_profiles_admin ON public.user_profiles;
DROP POLICY IF EXISTS insert_profiles_admin ON public.user_profiles;

CREATE POLICY read_own_profile ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY insert_own_profile ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

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

CREATE POLICY read_all_profiles_admin ON public.user_profiles
  FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY update_profiles_admin ON public.user_profiles
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY insert_profiles_admin ON public.user_profiles
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
