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

// Helper para garantir que localStorage está disponível
const getStorage = () => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  
  try {
    // Testar se localStorage está disponível e funcionando
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return window.localStorage;
  } catch (e) {
    console.warn('⚠️ localStorage não disponível, usando memória:', e);
    // Fallback para um objeto em memória (não persiste, mas evita erros)
    const memoryStorage: Storage = {
      getItem: (key: string) => (memoryStorage as any)[key] || null,
      setItem: (key: string, value: string) => { (memoryStorage as any)[key] = value; },
      removeItem: (key: string) => { delete (memoryStorage as any)[key]; },
      clear: () => { Object.keys(memoryStorage).forEach(k => delete (memoryStorage as any)[k]); },
      get length() { return Object.keys(memoryStorage).filter(k => !['getItem', 'setItem', 'removeItem', 'clear', 'length'].includes(k)).length; },
      key: (index: number) => Object.keys(memoryStorage).filter(k => !['getItem', 'setItem', 'removeItem', 'clear', 'length'].includes(k))[index] || null,
    };
    return memoryStorage;
  }
};

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: getStorage(),
    storageKey: 'sb-auth-token',
    flowType: 'pkce',
  },
  global: {
    headers: {
      'x-client-info': 'appestudocho',
    },
  },
});

