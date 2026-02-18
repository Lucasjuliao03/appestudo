# Como Resolver "Email Not Confirmed"

## Solução Rápida: Confirmar Email Manualmente

Execute o arquivo `CONFIRMAR_EMAIL_ADMIN.sql` no SQL Editor do Supabase.

Este script confirma o email do usuário administrador diretamente no banco de dados.

## Solução Permanente: Desabilitar Confirmação de Email

### Opção 1: Via Interface do Supabase (Recomendado)

1. Acesse o painel do Supabase
2. Vá em **Authentication** > **Settings**
3. Role até a seção **Email Auth**
4. Desmarque a opção **"Enable email confirmations"**
5. Clique em **Save**

Agora novos usuários não precisarão confirmar o email.

### Opção 2: Confirmar Email via SQL (Para usuários existentes)

Execute este SQL para confirmar todos os emails pendentes:

```sql
-- Confirmar todos os emails não confirmados
-- Nota: confirmed_at é uma coluna gerada automaticamente, não precisa ser atualizada
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email_confirmed_at IS NULL;
```

### Opção 3: Auto-confirmar ao criar usuário

Ao criar usuários via interface do Supabase:
1. Vá em **Authentication** > **Users** > **Add User**
2. Marque a opção **"Auto Confirm User"**
3. O usuário será criado já confirmado

## Verificar Status do Email

Execute esta query para ver o status de confirmação:

```sql
SELECT 
  email,
  email_confirmed_at,
  confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN 'Confirmado'
    ELSE 'Não Confirmado'
  END as status
FROM auth.users
WHERE email = 'lucasjuliao03@gmail.com';
```

## Para Desenvolvimento/Testes

Se você está em desenvolvimento e não quer lidar com confirmação de email:

1. **Desabilite a confirmação** (Opção 1 acima)
2. **Confirme emails existentes** (Opção 2 acima)

Isso permite que você teste o sistema sem precisar confirmar emails manualmente.

## Nota de Segurança

⚠️ **Atenção**: Desabilitar confirmação de email reduz a segurança do sistema. 
- Em produção, mantenha a confirmação habilitada
- Em desenvolvimento/testes, pode ser desabilitada para facilitar

