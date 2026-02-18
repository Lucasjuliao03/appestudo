CREATE OR REPLACE FUNCTION public.create_user_without_email_confirmation(
  user_email text,
  user_password text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas administradores podem criar usuários';
  END IF;

  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    confirmation_token,
    recovery_sent_at,
    recovery_token,
    email_change_sent_at,
    email_change,
    email_change_token_new,
    email_change_token_current,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    last_sign_in_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    confirmed_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
  )
  SELECT
    '00000000-0000-0000-0000-000000000000'::uuid,
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
    now(),
    now(),
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    '',
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    NULL,
    NULL,
    NULL,
    '',
    '',
    NULL,
    now(),
    '',
    0,
    NULL,
    '',
    NULL,
    false,
    NULL
  RETURNING id INTO new_user_id;

  INSERT INTO public.user_profiles (user_id, is_admin, is_active)
  VALUES (new_user_id, false, true)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_user_without_email_confirmation(text, text) TO authenticated;

