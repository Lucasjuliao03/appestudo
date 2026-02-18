-- Script completo para configurar o painel admin
-- Execute no SQL Editor do Supabase

-- 1. Criar função is_admin (se não existir)
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

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- 2. Criar função para buscar email de usuário
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

-- 3. Criar função principal para listar todos os usuários
CREATE OR REPLACE FUNCTION public.get_all_user_profiles()
RETURNS TABLE (
  user_id uuid,
  email text,
  is_admin boolean,
  is_active boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores podem listar usuários.';
  END IF;

  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email::text as email,
    COALESCE(up.is_admin, false) as is_admin,
    COALESCE(up.is_active, true) as is_active,
    u.created_at as created_at
  FROM auth.users u
  LEFT JOIN public.user_profiles up ON u.id = up.user_id
  ORDER BY u.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_user_profiles() TO authenticated;

-- Verificar se funcionou
SELECT 'Funções criadas com sucesso!' as status;

