# Setup Completo do Sistema

## Scripts SQL Necessários (Execute no Supabase SQL Editor)

Execute na seguinte ordem:

1. **CRIAR_TABELA_USER_PROFILES.sql** - Cria tabela de perfis de usuário
2. **CRIAR_FUNCAO_GET_USERS.sql** - Cria função para listar usuários (necessária para Admin)
3. **CRIAR_TABELA_USER_SETTINGS.sql** - Cria tabela de configurações do usuário
4. **CONFIRMAR_EMAIL_ADMIN.sql** - Confirma email do administrador
5. **CRIAR_ADMIN_INICIAL.sql** - Torna o usuário administrador

## Verificações

### 1. Verificar se o Admin aparece na navegação

- Faça login com o usuário administrador
- Verifique se o link "Admin" aparece na navegação inferior
- Se não aparecer, verifique:
  - Se o usuário tem `is_admin = true` na tabela `user_profiles`
  - Execute: `SELECT * FROM user_profiles WHERE user_id = 'SEU_USER_ID';`

### 2. Verificar Mapa de Domínio

O mapa de domínio agora calcula corretamente o desempenho por matéria baseado nas tentativas reais.

- Responda algumas questões
- Vá ao Perfil
- O mapa de domínio deve mostrar as estatísticas corretas

### 3. Configurações

A página de Configurações permite:
- Alterar nome de exibição
- Definir metas diárias (questões e flashcards)

**Importante**: Execute `CRIAR_TABELA_USER_SETTINGS.sql` antes de usar.

## Funcionalidades Implementadas

### ✅ Backend
- Autenticação completa (login/registro/logout)
- Sistema de permissões (admin/usuário)
- Estatísticas de usuário (XP, streak)
- Registro de tentativas
- Cálculo de desempenho por matéria
- Configurações do usuário

### ✅ Frontend
- Página de Login/Registro
- Página de Admin (gerenciar usuários)
- Página de Configurações
- Mapa de Domínio funcional
- Metas diárias personalizáveis
- Fluxo de seleção tema/subtema para questões e flashcards

## Troubleshooting

### Admin não aparece na navegação
1. Verifique se está logado
2. Verifique se o usuário é admin: `SELECT is_admin FROM user_profiles WHERE user_id = 'SEU_ID';`
3. Se não for admin, execute `CRIAR_ADMIN_INICIAL.sql`

### Mapa de domínio vazio
- Isso é normal se você ainda não respondeu questões
- Responda algumas questões e recarregue a página

### Erro ao acessar Configurações
- Execute `CRIAR_TABELA_USER_SETTINGS.sql`
- A tabela será criada automaticamente na primeira vez que acessar

### Erro ao listar usuários no Admin
- Execute `CRIAR_FUNCAO_GET_USERS.sql`
- Esta função é necessária para listar usuários sem service role key

