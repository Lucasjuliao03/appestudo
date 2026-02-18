-- 1. Corrigir políticas RLS da tabela simulados
DROP POLICY IF EXISTS read_own_simulados ON public.simulados;
DROP POLICY IF EXISTS read_all_simulados_ranking ON public.simulados;
DROP POLICY IF EXISTS insert_own_simulados ON public.simulados;

-- Política para ler próprios simulados
CREATE POLICY read_own_simulados ON public.simulados
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para ler todos os simulados (para ranking)
-- Permite que qualquer usuário autenticado veja os dados agregados
CREATE POLICY read_all_simulados_ranking ON public.simulados
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política de inserção
CREATE POLICY insert_own_simulados ON public.simulados
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 2. Recriar função de ranking com acesso correto ao auth.users
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
  SELECT 
    s.user_id,
    COALESCE(us.display_name, NULL) as display_name,
    COALESCE(
      (SELECT email FROM auth.users WHERE id = s.user_id LIMIT 1),
      ''
    ) as email,
    SUM(s.total_questions)::bigint as total_questions,
    SUM(s.correct_answers)::bigint as total_correct,
    CASE 
      WHEN SUM(s.total_questions) > 0 
      THEN ROUND((SUM(s.correct_answers)::decimal / SUM(s.total_questions)::decimal * 100)::numeric, 2)
      ELSE 0
    END as accuracy
  FROM public.simulados s
  LEFT JOIN public.user_settings us ON s.user_id = us.user_id
  GROUP BY s.user_id, us.display_name
  HAVING SUM(s.total_questions) > 0
  ORDER BY total_questions DESC, accuracy DESC
  LIMIT limit_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_ranking(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ranking(int) TO anon;

