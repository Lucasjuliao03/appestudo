# 🔧 Aplicar Correção do Ranking

## Problema
O ranking não está trazendo todos os usuários cadastrados. Há 4 usuários no Supabase Auth, mas o ranking não está funcionando corretamente.

## ✅ Solução

### 1. Execute o SQL no Supabase

Abra o **SQL Editor** no Supabase Dashboard e execute o arquivo:
**`REFATORAR_FUNCAO_RANKING_COMPLETA.sql`**

Ou cole e execute este SQL:

```sql
-- Refatorar função get_ranking para usar auth.users diretamente
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
  WITH user_stats AS (
    SELECT 
      s.user_id,
      SUM(s.total_questions)::bigint as total_questions,
      SUM(s.correct_answers)::bigint as total_correct
    FROM public.simulados s
    GROUP BY s.user_id
    HAVING SUM(s.total_questions) > 0
  )
  SELECT 
    us.user_id,
    COALESCE(settings.display_name, NULL) as display_name,
    COALESCE(u.email::text, '') as email,
    us.total_questions,
    us.total_correct,
    CASE 
      WHEN us.total_questions > 0 
      THEN ROUND((us.total_correct::decimal / us.total_questions::decimal * 100)::numeric, 2)
      ELSE 0
    END as accuracy
  FROM user_stats us
  INNER JOIN auth.users u ON u.id = us.user_id
  LEFT JOIN public.user_settings settings ON settings.user_id = us.user_id
  ORDER BY us.total_questions DESC, accuracy DESC
  LIMIT limit_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_ranking(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ranking(int) TO anon;
```

## 🔍 O que mudou?

### Antes:
- Subquery para buscar email (causava ambiguidade)
- Acesso direto a `auth.users` sem JOIN explícito
- Podia falhar com erro de ambiguidade

### Agora:
- **CTE (Common Table Expression)** para agregar dados primeiro
- **INNER JOIN** explícito com `auth.users` para garantir acesso aos emails
- **LEFT JOIN** com `user_settings` para buscar display_name
- Sem ambiguidade - todas as colunas são explicitamente qualificadas

## 📊 Como funciona

1. **CTE `user_stats`**: Agrega todos os simulados por usuário
2. **INNER JOIN com auth.users**: Garante que apenas usuários reais apareçam
3. **LEFT JOIN com user_settings**: Busca display_name se existir
4. **Ordenação**: Por total de questões e depois por acurácia

## ✅ Verificar se funcionou

Após executar o SQL:

1. Abra a página de Ranking no app
2. Verifique se todos os usuários que fizeram simulados aparecem
3. Verifique se os emails estão corretos
4. Verifique se a ordenação está correta

## 🐛 Se ainda não funcionar

1. **Verificar logs no console:**
   - Abra DevTools (F12)
   - Veja se há erros no console
   - Verifique se a função RPC está sendo chamada

2. **Testar função diretamente:**
   ```sql
   SELECT * FROM public.get_ranking(50);
   ```
   - Execute no SQL Editor
   - Deve retornar todos os usuários com simulados

3. **Verificar permissões:**
   - A função tem `SECURITY DEFINER` e `SET search_path = public, auth`
   - Deve ter acesso a `auth.users`

4. **Usar fallback:**
   - Se a função RPC falhar, o código usa `getRankingFallback`
   - Isso busca dados diretamente e usa `get_user_email` RPC

## 📝 Notas

- O ranking mostra apenas usuários que **fizeram simulados**
- Se um usuário não fez nenhum simulado, não aparecerá no ranking
- A ordenação é por: total de questões (DESC) → acurácia (DESC)
- O limite padrão é 50 usuários

