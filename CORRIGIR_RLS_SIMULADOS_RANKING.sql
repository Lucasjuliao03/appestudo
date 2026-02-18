-- Remover políticas conflitantes
DROP POLICY IF EXISTS read_own_simulados ON public.simulados;
DROP POLICY IF EXISTS read_all_simulados_ranking ON public.simulados;

-- Política para ler próprios simulados
CREATE POLICY read_own_simulados ON public.simulados
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para ler todos os simulados (para ranking)
-- Esta política permite que qualquer usuário autenticado veja os dados agregados
CREATE POLICY read_all_simulados_ranking ON public.simulados
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Manter política de inserção
DROP POLICY IF EXISTS insert_own_simulados ON public.simulados;
CREATE POLICY insert_own_simulados ON public.simulados
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

