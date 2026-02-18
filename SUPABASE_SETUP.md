# Configuração do Supabase

Este projeto está configurado para se comunicar com o banco de dados Supabase. Siga os passos abaixo para configurar:

## 1. Obter credenciais do Supabase

1. Acesse o painel do seu projeto no Supabase: https://app.supabase.com
2. Vá em **Settings** > **API**
3. Copie os seguintes valores:
   - **Project URL** (URL do projeto)
   - **anon public** key (chave pública anônima)

## 2. Configurar variáveis de ambiente

1. Crie um arquivo `.env` na raiz do projeto (copie do `.env.example`)
2. Adicione as seguintes variáveis:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
```

**Importante**: Substitua `sua_url_do_supabase` e `sua_chave_anon_do_supabase` pelos valores reais obtidos no passo 1.

## 3. Estrutura do banco de dados

O projeto espera as seguintes tabelas no Supabase (já criadas conforme o SQL fornecido):

- `subjects` - Matérias/Temas
- `questions` - Questões
- `options` - Alternativas das questões
- `attempts` - Tentativas/Respostas do usuário
- `user_stats` - Estatísticas do usuário (XP, streak, etc.)

## 4. Autenticação e Políticas RLS

O projeto usa autenticação do Supabase. As políticas RLS (Row Level Security) estão configuradas para exigir autenticação para leitura de dados.

### Opção 1: Usar com autenticação (Recomendado)

1. A autenticação está habilitada no seu projeto Supabase
2. As políticas RLS estão configuradas conforme o SQL fornecido (exigem `authenticated`)
3. Os usuários precisam estar autenticados para acessar os dados

**Para permitir acesso anônimo (apenas leitura de questões):**

Se você quiser permitir que usuários não autenticados vejam questões, modifique as políticas RLS no Supabase:

```sql
-- Permitir leitura anônima de subjects, questions e options
DROP POLICY IF EXISTS read_subjects_auth ON public.subjects;
CREATE POLICY read_subjects_public ON public.subjects
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS read_questions_auth ON public.questions;
CREATE POLICY read_questions_public ON public.questions
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS read_options_auth ON public.options;
CREATE POLICY read_options_public ON public.options
  FOR SELECT TO anon, authenticated USING (true);
```

**Nota:** As tabelas `attempts` e `user_stats` sempre exigirão autenticação, pois contêm dados específicos do usuário.

## 5. Testar a conexão

Após configurar as variáveis de ambiente:

1. Reinicie o servidor de desenvolvimento: `npm run dev`
2. Acesse a aplicação e verifique se os dados estão sendo carregados
3. Verifique o console do navegador para erros de conexão

## Troubleshooting

### Erro: "Supabase URL e/ou Anon Key não configurados"
- Verifique se o arquivo `.env` existe na raiz do projeto
- Certifique-se de que as variáveis começam com `VITE_`
- Reinicie o servidor após criar/modificar o `.env`

### Erro: "Nenhuma questão encontrada"
- Verifique se há dados nas tabelas `questions` e `options` do Supabase
- Verifique se as políticas RLS permitem leitura (podem exigir autenticação ou podem ser configuradas para permitir acesso anônimo)
- Se as políticas exigem autenticação, você precisará implementar login ou modificar as políticas para permitir acesso anônimo

### Erro: "Usuário não autenticado" (no console)
- Este é um aviso normal quando o usuário não está logado
- A aplicação funciona sem autenticação para visualizar questões (se as políticas RLS permitirem)
- As tentativas e estatísticas só serão salvas se o usuário estiver autenticado
- Para remover completamente esses avisos, implemente autenticação ou ajuste as políticas RLS

### Erro de autenticação
- Certifique-se de que a autenticação está habilitada no Supabase
- Verifique se as políticas RLS estão configuradas corretamente

## Estrutura de serviços

Os serviços estão organizados em `src/services/supabase/`:

- `subjects.ts` - Gerenciamento de matérias
- `questions.ts` - Gerenciamento de questões
- `options.ts` - Gerenciamento de alternativas
- `attempts.ts` - Gerenciamento de tentativas
- `userStats.ts` - Gerenciamento de estatísticas do usuário

Cada serviço exporta funções para interagir com as respectivas tabelas do banco de dados.

