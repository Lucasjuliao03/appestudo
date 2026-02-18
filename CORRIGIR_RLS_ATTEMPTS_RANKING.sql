-- Corrigir políticas RLS da tabela attempts para permitir ranking
-- Todos os usuários autenticados devem poder ler dados agregados para ranking

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS read_own_attempts ON public.attempts;
DROP POLICY IF EXISTS read_all_attempts_ranking ON public.attempts;
DROP POLICY IF EXISTS insert_own_attempts ON public.attempts;

-- Política para ler próprias tentativas
CREATE POLICY read_own_attempts ON public.attempts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para ler todas as tentativas (para ranking)
-- Permite que qualquer usuário autenticado veja os dados agregados
CREATE POLICY read_all_attempts_ranking ON public.attempts
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política de inserção (cada usuário só pode inserir suas próprias tentativas)
CREATE POLICY insert_own_attempts ON public.attempts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Verificar se funcionou
SELECT 'Políticas RLS da tabela attempts configuradas!' as status;

