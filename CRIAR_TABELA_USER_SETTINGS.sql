-- Criar tabela para configurações do usuário
-- Execute no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  daily_questions_target int NOT NULL DEFAULT 10,
  daily_flashcards_target int NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON public.user_settings(user_id);

-- Habilitar RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver/atualizar suas próprias configurações
DROP POLICY IF EXISTS read_own_settings ON public.user_settings;
CREATE POLICY read_own_settings ON public.user_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS update_own_settings ON public.user_settings;
CREATE POLICY update_own_settings ON public.user_settings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS insert_own_settings ON public.user_settings;
CREATE POLICY insert_own_settings ON public.user_settings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();

