# 🔧 Aplicar Ranking de Questões Realizadas

## Problema
O ranking estava usando a tabela `simulados`, mas deveria usar a tabela `attempts` (questões realizadas).

## ✅ Solução

### 1. Execute os SQLs no Supabase

Execute **AMBOS** os arquivos SQL no Supabase Dashboard > SQL Editor:

#### a) Criar/Atualizar função de ranking:
**`CRIAR_FUNCAO_RANKING_QUESTOES.sql`**

#### b) Configurar políticas RLS da tabela attempts:
**`CORRIGIR_RLS_ATTEMPTS_RANKING.sql`**

---

## 📝 SQL 1: Função de Ranking

```sql
-- Criar função de ranking baseada em QUESTÕES REALIZADAS (tabela attempts)
DROP FUNCTION IF EXISTS public.get_ranking(int);

CREATE OR REPLACE FUNCTION public.get_ranking(limit_count int DEFAULT 50)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  email text,
  total_questions bigint,
  total_correct bigint,
  accuracy decimal
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  WITH user_question_stats AS (
    -- Agregar questões por usuário (contando questões únicas, não tentativas)
    SELECT 
      a.user_id,
      COUNT(DISTINCT a.question_id)::bigint as total_questions,
      COUNT(DISTINCT CASE WHEN a.is_correct = true THEN a.question_id END)::bigint as total_correct
    FROM public.attempts a
    GROUP BY a.user_id
    HAVING COUNT(DISTINCT a.question_id) > 0
  )
  SELECT 
    uqs.user_id,
    COALESCE(settings.display_name, NULL) as display_name,
    COALESCE(u.email::text, '') as email,
    uqs.total_questions,
    uqs.total_correct,
    CASE 
      WHEN uqs.total_questions > 0 
      THEN ROUND((uqs.total_correct::decimal / uqs.total_questions::decimal * 100)::numeric, 2)
      ELSE 0
    END as accuracy
  FROM user_question_stats uqs
  INNER JOIN auth.users u ON u.id = uqs.user_id
  LEFT JOIN public.user_settings settings ON settings.user_id = uqs.user_id
  ORDER BY uqs.total_questions DESC, accuracy DESC
  LIMIT limit_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_ranking(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ranking(int) TO anon;
```

---

## 📝 SQL 2: Políticas RLS da Tabela Attempts

```sql
-- Corrigir políticas RLS da tabela attempts para permitir ranking
DROP POLICY IF EXISTS read_own_attempts ON public.attempts;
DROP POLICY IF EXISTS read_all_attempts_ranking ON public.attempts;
DROP POLICY IF EXISTS insert_own_attempts ON public.attempts;

-- Política para ler próprias tentativas
CREATE POLICY read_own_attempts ON public.attempts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para ler todas as tentativas (para ranking)
CREATE POLICY read_all_attempts_ranking ON public.attempts
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política de inserção
CREATE POLICY insert_own_attempts ON public.attempts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## 🔍 O que mudou?

### Função SQL:
- **ANTES**: Usava tabela `simulados`
- **AGORA**: Usa tabela `attempts` (questões realizadas)
- **Conta questões ÚNICAS** (não tentativas repetidas)
- **Conta acertos** como questões únicas respondidas corretamente

### Código TypeScript:
- **Fallback atualizado** para usar `attempts` ao invés de `simulados`
- **Conta questões únicas** usando `Set` para evitar duplicatas
- **Melhor performance** com agregação correta

### Políticas RLS:
- **Permite leitura** de todas as tentativas para usuários autenticados (para ranking)
- **Mantém segurança** - cada usuário só pode inserir suas próprias tentativas

---

## 📊 Como funciona

1. **Agrega questões por usuário:**
   - Conta questões **únicas** (DISTINCT question_id)
   - Conta questões **acertadas** (DISTINCT question_id WHERE is_correct = true)

2. **Calcula estatísticas:**
   - `total_questions`: Total de questões únicas realizadas
   - `total_correct`: Total de questões únicas acertadas
   - `accuracy`: (total_correct / total_questions) * 100

3. **Ordena:**
   - Por total de questões (DESC)
   - Por acurácia (DESC)

---

## ✅ Verificar se funcionou

1. **Execute os SQLs** no Supabase
2. **Abra a página de Ranking** no app
3. **Verifique:**
   - Todos os usuários que fizeram questões aparecem
   - Os emails estão corretos
   - Os números estão corretos (questões únicas, não tentativas)
   - A ordenação está correta

---

## 🐛 Se ainda não funcionar

1. **Verificar se a tabela attempts existe:**
   ```sql
   SELECT * FROM public.attempts LIMIT 5;
   ```

2. **Verificar se há dados:**
   ```sql
   SELECT COUNT(*) FROM public.attempts;
   SELECT COUNT(DISTINCT user_id) FROM public.attempts;
   ```

3. **Testar função diretamente:**
   ```sql
   SELECT * FROM public.get_ranking(50);
   ```

4. **Verificar políticas RLS:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'attempts';
   ```

---

## 📝 Notas Importantes

- O ranking mostra apenas usuários que **fizeram pelo menos uma questão**
- Conta **questões únicas**, não tentativas (se responder a mesma questão 10 vezes, conta como 1 questão)
- A acurácia é baseada em **questões acertadas / questões realizadas**
- A ordenação prioriza quem fez mais questões, depois quem tem melhor acurácia

