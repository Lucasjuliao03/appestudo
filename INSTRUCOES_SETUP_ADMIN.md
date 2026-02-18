# Instruções para Configurar o Sistema de Autenticação e Admin

## Passo 1: Criar a Tabela de Perfis de Usuário

Execute o arquivo `CRIAR_TABELA_USER_PROFILES.sql` no SQL Editor do Supabase.

Este script cria:
- Tabela `user_profiles` para controlar permissões
- Políticas RLS para segurança
- Funções e triggers necessários

## Passo 2: Criar a Função para Listar Usuários

Execute o arquivo `CRIAR_FUNCAO_GET_USERS.sql` no SQL Editor do Supabase.

Esta função permite que administradores vejam todos os usuários sem precisar da service role key.

## Passo 3: Criar o Usuário Administrador

### Opção A: Criar via Interface do Supabase (Recomendado)

1. Acesse o painel do Supabase
2. Vá em **Authentication** > **Users**
3. Clique em **Add User** > **Create new user**
4. Preencha:
   - **Email**: `lucasjuliao03@gmail.com`
   - **Password**: `31012011`
   - **Auto Confirm User**: ✅ (marque esta opção - IMPORTANTE!)
5. Clique em **Create User**
6. Copie o **User ID** do usuário criado

**⚠️ IMPORTANTE**: Se você esqueceu de marcar "Auto Confirm User", execute o script `CONFIRMAR_EMAIL_ADMIN.sql` para confirmar o email manualmente.

### Opção B: Criar via SQL (Alternativa)

Se preferir criar via SQL, você pode usar:

```sql
-- Criar usuário (requer extensão pgcrypto)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'lucasjuliao03@gmail.com',
  crypt('31012011', gen_salt('bf')),
  now(),
  now(),
  now()
);
```

## Passo 4: Confirmar o Email (Se necessário)

Se você receber erro "email not confirmed" ao fazer login:

1. Execute o arquivo `CONFIRMAR_EMAIL_ADMIN.sql` no SQL Editor do Supabase
2. Ou veja as instruções completas em `DESABILITAR_CONFIRMACAO_EMAIL.md`

## Passo 5: Tornar o Usuário Administrador

Execute o arquivo `CRIAR_ADMIN_INICIAL.sql` no SQL Editor do Supabase.

Este script:
- Busca o usuário pelo email `lucasjuliao03@gmail.com`
- Cria o perfil de administrador
- Define `is_admin = true` e `is_active = true`

**OU** se você tem o User ID, execute:

```sql
-- Substitua 'USER_ID_AQUI' pelo ID copiado
INSERT INTO public.user_profiles (user_id, is_admin, is_active)
VALUES ('USER_ID_AQUI', true, true)
ON CONFLICT (user_id) DO UPDATE 
SET is_admin = true, is_active = true;
```

## Passo 6: Verificar se Funcionou

Execute esta query para verificar:

```sql
SELECT 
  u.email,
  up.is_admin,
  up.is_active,
  up.created_at
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
WHERE u.email = 'lucasjuliao03@gmail.com';
```

Você deve ver:
- `is_admin = true`
- `is_active = true`

## Passo 7: Testar no Aplicativo

1. Inicie o servidor: `npm run dev`
2. Acesse a aplicação
3. Vá em `/login`
4. Faça login com:
   - Email: `lucasjuliao03@gmail.com`
   - Senha: `31012011`
5. Você deve ver o link "Admin" na navegação inferior
6. Acesse `/admin` para gerenciar usuários

## Funcionalidades do Painel Admin

- **Listar Usuários**: Ver todos os usuários cadastrados
- **Autorizar**: Ativar usuários bloqueados
- **Bloquear**: Desativar usuários
- **Tornar Admin**: Dar permissões de administrador
- **Remover Admin**: Remover permissões de administrador

## Segurança

- Apenas usuários com `is_admin = true` podem acessar `/admin`
- As políticas RLS protegem os dados
- Usuários bloqueados (`is_active = false`) não podem usar o sistema completamente

## Troubleshooting

### Erro: "Acesso negado" ao tentar listar usuários
- Verifique se você executou `CRIAR_FUNCAO_GET_USERS.sql`
- Verifique se seu usuário tem `is_admin = true` na tabela `user_profiles`

### Erro: "Usuário não encontrado" ao criar admin
- Certifique-se de que o usuário foi criado no Authentication
- Verifique se o email está correto: `lucasjuliao03@gmail.com`

### Não consigo acessar /admin
- Verifique se você está logado
- Verifique se seu usuário tem `is_admin = true`
- Limpe o cache do navegador e faça login novamente

