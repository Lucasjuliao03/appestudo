-- Criar tabela para perfis de usuário (controle de permissões)
-- Execute no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_user_profiles_admin ON public.user_profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(is_active);

-- Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver seu próprio perfil
DROP POLICY IF EXISTS read_own_profile ON public.user_profiles;
CREATE POLICY read_own_profile ON public.user_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Política: Apenas admins podem ver todos os perfis
DROP POLICY IF EXISTS read_all_profiles_admin ON public.user_profiles;
CREATE POLICY read_all_profiles_admin ON public.user_profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Política: Apenas admins podem atualizar perfis
DROP POLICY IF EXISTS update_profiles_admin ON public.user_profiles;
CREATE POLICY update_profiles_admin ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Política: Apenas admins podem inserir perfis
DROP POLICY IF EXISTS insert_profiles_admin ON public.user_profiles;
CREATE POLICY insert_profiles_admin ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verificar se a tabela foi criada
SELECT * FROM public.user_profiles LIMIT 1;

