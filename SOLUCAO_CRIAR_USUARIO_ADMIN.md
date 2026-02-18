# Solução: Criar Usuário no Admin

## Problemas Corrigidos

### 1. Login Automático ao Criar Usuário
**Problema**: Quando o admin cria um usuário, o Supabase automaticamente faz login com esse usuário.

**Solução**:
- Após criar o usuário, fazemos logout imediatamente
- Redirecionamos para a página de login
- O admin precisa fazer login novamente

### 2. Novo Usuário Não Aparece na Lista
**Problema**: O novo usuário criado não aparece na lista de usuários do admin.

**Solução**:
- Criamos o perfil do usuário ANTES de fazer logout
- Criamos um trigger SQL que cria o perfil automaticamente quando um usuário é criado
- Garantimos que o perfil seja criado mesmo se o trigger falhar

## Scripts SQL Necessários

Execute estes scripts na ordem:

1. **CRIAR_TRIGGER_PERFIL_AUTOMATICO.sql**
   - Cria um trigger que automaticamente cria o perfil quando um novo usuário é criado
   - Isso garante que todos os usuários tenham um perfil

2. **CRIAR_FUNCAO_CRIAR_PERFIL.sql** (Opcional)
   - Cria uma função auxiliar para criar perfis manualmente se necessário

## Como Funciona Agora

1. Admin preenche email e senha do novo usuário
2. Clica em "Criar Usuário"
3. Sistema cria o usuário no Supabase Auth
4. Sistema cria o perfil do usuário (ou o trigger cria automaticamente)
5. Sistema faz logout (porque o Supabase fez login automático)
6. Sistema redireciona para a página de login
7. Admin faz login novamente
8. Novo usuário aparece na lista

## Verificar se Funcionou

1. Execute `CRIAR_TRIGGER_PERFIL_AUTOMATICO.sql`
2. Crie um novo usuário no painel admin
3. Faça login novamente como admin
4. O novo usuário deve aparecer na lista

## Nota Importante

⚠️ **Atenção**: Após criar um usuário, você será deslogado e precisará fazer login novamente. Isso é necessário porque o Supabase faz login automático após criar um usuário.

## Troubleshooting

### Novo usuário ainda não aparece:
1. Verifique se o trigger foi criado: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
2. Verifique se o perfil foi criado: `SELECT * FROM user_profiles WHERE user_id = 'ID_DO_USUARIO';`
3. Execute `CRIAR_TRIGGER_PERFIL_AUTOMATICO.sql` novamente

### Ainda faz login automaticamente:
- Isso é comportamento padrão do Supabase
- O código agora faz logout imediatamente após criar o usuário
- Se ainda acontecer, verifique se o código foi atualizado

