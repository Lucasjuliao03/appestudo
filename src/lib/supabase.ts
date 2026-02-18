import { createClient } from '@supabase/supabase-js';

// Variáveis de ambiente - você precisará configurar essas no seu .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Verificar se está configurado
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_project_url' && supabaseAnonKey !== 'your_supabase_anon_key');
};

if (!isSupabaseConfigured()) {
  console.warn('⚠️ Supabase não configurado. Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-auth-token',
    flowType: 'pkce',
  },
  global: {
    headers: {
      'x-client-info': 'appestudocho',
    },
  },
});

