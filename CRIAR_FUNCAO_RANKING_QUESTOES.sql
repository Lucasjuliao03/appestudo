-- Criar função de ranking baseada em QUESTÕES REALIZADAS (tabela attempts)
-- Não em simulados!

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

-- Verificar se funcionou
SELECT 'Função get_ranking criada para questões realizadas!' as status;

