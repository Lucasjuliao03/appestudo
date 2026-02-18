CREATE OR REPLACE FUNCTION public.create_user_profile(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, is_admin, is_active)
  VALUES (user_uuid, false, true)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_user_profile(uuid) TO authenticated;

