DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'lucasjuliao03@gmail.com'
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_profiles (user_id, is_admin, is_active)
    VALUES (admin_user_id, true, true)
    ON CONFLICT (user_id) DO UPDATE 
    SET is_admin = true, is_active = true, updated_at = now();
    
    RAISE NOTICE 'Perfil de administrador criado para o usuário: %', admin_user_id;
  ELSE
    RAISE NOTICE 'Usuário com email lucasjuliao03@gmail.com não encontrado. Crie o usuário primeiro no Authentication.';
  END IF;
END $$;

SELECT 
  u.email,
  up.is_admin,
  up.is_active,
  up.created_at
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
WHERE u.email = 'lucasjuliao03@gmail.com';
