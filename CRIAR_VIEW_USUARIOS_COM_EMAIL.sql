-- Criar view para facilitar busca de usuários com emails
-- Esta view junta auth.users com user_profiles

CREATE OR REPLACE VIEW public.users_with_profiles AS
SELECT 
  u.id as user_id,
  u.email,
  COALESCE(up.is_admin, false) as is_admin,
  COALESCE(up.is_active, true) as is_active,
  u.created_at
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id;

-- Política RLS para a view (herda das tabelas base)
-- Admins podem ver todos
-- Usuários podem ver seu próprio registro

-- Nota: Views não suportam RLS diretamente, mas podemos criar uma função que usa a view
CREATE OR REPLACE FUNCTION public.get_users_with_emails()
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

GRANT EXECUTE ON FUNCTION public.get_users_with_emails() TO authenticated;

