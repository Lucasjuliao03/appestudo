-- Script SIMPLES para tornar o usuário admin
-- Execute no SQL Editor do Supabase

-- Primeiro, verifique se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
);

-- Se a tabela não existir, execute primeiro: CRIAR_TABELA_USER_PROFILES.sql

-- Depois, execute este para tornar admin:
INSERT INTO public.user_profiles (user_id, is_admin, is_active)
SELECT id, true, true
FROM auth.users
WHERE email = 'lucasjuliao03@gmail.com'
ON CONFLICT (user_id) DO UPDATE 
SET is_admin = true, is_active = true, updated_at = now();

-- Verificar se funcionou
SELECT 
  u.email,
  up.is_admin,
  up.is_active
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
WHERE u.email = 'lucasjuliao03@gmail.com';

