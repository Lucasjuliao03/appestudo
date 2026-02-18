CREATE OR REPLACE FUNCTION public.get_user_email(user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_uuid;
  
  RETURN COALESCE(user_email, '');
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_email(uuid) TO authenticated;

