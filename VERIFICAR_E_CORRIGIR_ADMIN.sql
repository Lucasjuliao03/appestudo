-- Script para verificar e corrigir permissões de admin
-- Execute no SQL Editor do Supabase

-- 1. Verificar se a tabela user_profiles existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
) as tabela_existe;

-- 2. Verificar usuário atual e seu perfil
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  up.is_admin,
  up.is_active,
  up.created_at as perfil_criado_em
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
WHERE u.email = 'lucasjuliao03@gmail.com';

-- 3. Se o perfil não existir ou is_admin for false, criar/corrigir
DO $$
DECLARE
  admin_user_id uuid;
  admin_exists boolean;
BEGIN
  -- Buscar user_id
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'lucasjuliao03@gmail.com'
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    -- Verificar se perfil existe
    SELECT EXISTS (
      SELECT 1 FROM public.user_profiles WHERE user_id = admin_user_id
    ) INTO admin_exists;

    IF admin_exists THEN
      -- Atualizar para admin
      UPDATE public.user_profiles
      SET is_admin = true, is_active = true, updated_at = now()
      WHERE user_id = admin_user_id;
      
      RAISE NOTICE 'Perfil atualizado para admin: %', admin_user_id;
    ELSE
      -- Criar perfil de admin
      INSERT INTO public.user_profiles (user_id, is_admin, is_active)
      VALUES (admin_user_id, true, true)
      ON CONFLICT (user_id) DO UPDATE 
      SET is_admin = true, is_active = true, updated_at = now();
      
      RAISE NOTICE 'Perfil de admin criado para: %', admin_user_id;
    END IF;
  ELSE
    RAISE NOTICE 'Usuário com email lucasjuliao03@gmail.com não encontrado.';
  END IF;
END $$;

-- 4. Verificar resultado final
SELECT 
  u.email,
  up.is_admin,
  up.is_active
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
WHERE u.email = 'lucasjuliao03@gmail.com';

