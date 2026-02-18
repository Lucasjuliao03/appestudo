# Solução para Rate Limit de Email

## Problema
Ao criar usuários no painel admin, você pode receber o erro:
```
AuthApiError: email rate limit exceeded
```

Isso acontece porque o Supabase limita quantos emails de confirmação podem ser enviados em um período de tempo.

## Soluções

### Opção 1: Desabilitar Confirmação de Email (Recomendado para Desenvolvimento)

1. No Supabase Dashboard, vá em **Authentication > Settings**
2. Desabilite **"Enable email confirmations"**
3. Agora os usuários podem fazer login sem confirmar o email

### Opção 2: Confirmar Email Manualmente via SQL

Após criar o usuário, execute este SQL para confirmar o email:

```sql
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'email_do_usuario@exemplo.com';
```

### Opção 3: Aguardar o Rate Limit Resetar

O rate limit geralmente reseta após alguns minutos. Aguarde e tente novamente.

### Opção 4: Usar Service Role Key (Produção)

Em produção, você deve criar usuários usando o Service Role Key no backend, que não tem limite de rate.

## Como Implementar

### Para Desenvolvimento (Mais Fácil):
1. Desabilite a confirmação de email no Supabase Dashboard
2. Os usuários poderão fazer login imediatamente após criação

### Para Produção:
1. Crie um endpoint no backend que usa Service Role Key
2. O backend cria o usuário sem enviar email
3. Confirme o email via SQL ou envie email manualmente

## Script SQL para Confirmar Email em Lote

```sql
-- Confirmar email de todos os usuários não confirmados
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;
```

## Nota Importante

O rate limit existe para prevenir spam. Em produção, use sempre o Service Role Key no backend para criar usuários.

