-- Criar função para listar usuários com perfis
-- Esta função permite que admins vejam todos os usuários sem precisar de service role key
-- Execute no SQL Editor do Supabase

-- Função para obter todos os usuários com seus perfis
CREATE OR REPLACE FUNCTION public.get_all_users_with_profiles()
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
  -- Verificar se o usuário atual é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores podem listar usuários.';
  END IF;

  -- Retornar usuários com seus perfis
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

-- Dar permissão para authenticated users executarem a função
GRANT EXECUTE ON FUNCTION public.get_all_users_with_profiles() TO authenticated;

-- Testar a função (apenas para admins)
-- SELECT * FROM public.get_all_users_with_profiles();

