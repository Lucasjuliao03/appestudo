-- Políticas RLS para permitir acesso anônimo (leitura apenas)
-- Use este SQL se quiser que usuários não autenticados possam ver questões
-- Execute no SQL Editor do Supabase

-- SUBJECTS: Permitir leitura para anônimos e autenticados
DROP POLICY IF EXISTS read_subjects_auth ON public.subjects;
DROP POLICY IF EXISTS read_subjects_public ON public.subjects;

CREATE POLICY read_subjects_public ON public.subjects
  FOR SELECT TO anon, authenticated USING (true);

-- QUESTIONS: Permitir leitura para anônimos e autenticados
DROP POLICY IF EXISTS read_questions_auth ON public.questions;
DROP POLICY IF EXISTS read_questions_public ON public.questions;

CREATE POLICY read_questions_public ON public.questions
  FOR SELECT TO anon, authenticated USING (true);

-- OPTIONS: Permitir leitura para anônimos e autenticados
DROP POLICY IF EXISTS read_options_auth ON public.options;
DROP POLICY IF EXISTS read_options_public ON public.options;

CREATE POLICY read_options_public ON public.options
  FOR SELECT TO anon, authenticated USING (true);

-- ATTEMPTS e USER_STATS: Continuam exigindo autenticação
-- (não altere essas políticas, pois contêm dados específicos do usuário)

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

