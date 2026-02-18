INSERT INTO public.user_profiles (user_id, is_admin, is_active)
SELECT id, true, true
FROM auth.users
WHERE email = 'lucasjuliao03@gmail.com'
ON CONFLICT (user_id) DO UPDATE 
SET is_admin = true, is_active = true, updated_at = now();

SELECT 
  u.email,
  up.is_admin,
  up.is_active
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
WHERE u.email = 'lucasjuliao03@gmail.com';

