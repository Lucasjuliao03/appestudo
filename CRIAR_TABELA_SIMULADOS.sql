CREATE TABLE IF NOT EXISTS public.simulados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_questions int NOT NULL,
  correct_answers int NOT NULL,
  incorrect_answers int NOT NULL,
  accuracy decimal(5,2) NOT NULL,
  time_spent_seconds int NOT NULL,
  xp_earned int NOT NULL DEFAULT 0,
  temas_selecionados text[],
  subtemas_selecionados text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_simulados_user ON public.simulados(user_id);
CREATE INDEX IF NOT EXISTS idx_simulados_created_at ON public.simulados(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_simulados_accuracy ON public.simulados(accuracy DESC);

ALTER TABLE public.simulados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS read_own_simulados ON public.simulados;
CREATE POLICY read_own_simulados ON public.simulados
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS insert_own_simulados ON public.simulados;
CREATE POLICY insert_own_simulados ON public.simulados
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS read_all_simulados_ranking ON public.simulados;
CREATE POLICY read_all_simulados_ranking ON public.simulados
  FOR SELECT
  USING (true);

