UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'EMAIL_DO_USUARIO_AQUI@exemplo.com';

SELECT 
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN 'Confirmado'
    ELSE 'Não Confirmado'
  END as status
FROM auth.users
WHERE email = 'EMAIL_DO_USUARIO_AQUI@exemplo.com';

