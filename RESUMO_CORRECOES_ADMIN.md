# Correções Aplicadas - Painel Admin

## Problemas Corrigidos

### 1. Erro 400 na função RPC `get_all_users_with_profiles`
**Problema**: A função não existia ou tinha nome diferente.

**Solução**:
- Criado arquivo `CRIAR_FUNCAO_GET_USERS_CORRIGIDA.sql` com a função correta
- A função agora usa `is_admin()` para evitar recursão
- Adicionado fallback no código para buscar usuários mesmo se a função RPC falhar

### 2. Rate Limit de Email
**Problema**: Limite de criação de usuários excedido.

**Solução**:
- Mensagem de erro melhorada explicando o problema
- Sugestão para desabilitar confirmação de email no Supabase

## Scripts SQL Necessários

Execute estes scripts na ordem:

1. **CORRIGIR_POLITICAS_RLS_USER_PROFILES.sql**
   - Corrige recursão infinita nas políticas RLS
   - Cria função `is_admin()` sem recursão

2. **CRIAR_FUNCAO_GET_USERS_CORRIGIDA.sql**
   - Cria função `get_all_user_profiles()` para listar usuários
   - Usa `is_admin()` para verificar permissões

3. **CRIAR_ADMIN_SIMPLES.sql**
   - Torna seu usuário administrador

## Como Resolver Rate Limit

### Opção 1: Desabilitar Confirmação de Email (Recomendado)

1. Supabase Dashboard → Authentication → Settings
2. Desmarque "Enable email confirmations"
3. Salve

Agora você pode criar usuários sem limite.

### Opção 2: Aguardar

O rate limit reseta após alguns minutos. Aguarde e tente novamente.

### Opção 3: Confirmar Email Manualmente

Após criar usuário, execute:
```sql
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'email_do_usuario@exemplo.com';
```

## Verificar se Funcionou

1. Execute os scripts SQL acima
2. Faça logout e login novamente
3. Acesse o painel Admin
4. Deve aparecer a lista de usuários sem erro 400
5. O link "Admin" deve aparecer na navegação

## Troubleshooting

### Erro 400 persiste:
- Verifique se executou `CRIAR_FUNCAO_GET_USERS_CORRIGIDA.sql`
- Verifique se a função `is_admin()` existe
- Verifique se você é admin (execute `CRIAR_ADMIN_SIMPLES.sql`)

### Rate limit persiste:
- Desabilite confirmação de email no Supabase
- Ou aguarde alguns minutos entre criações de usuário

### Lista de usuários vazia:
- Normal se você é o único usuário
- Crie mais usuários para testar

