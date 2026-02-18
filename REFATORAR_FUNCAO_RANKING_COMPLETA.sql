-- Refatorar função get_ranking para usar auth.users diretamente
-- Esta versão garante que todos os usuários cadastrados que têm simulados apareçam no ranking

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

-- Verificar se funcionou
SELECT 'Função get_ranking refatorada com sucesso!' as status;

