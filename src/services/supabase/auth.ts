import { supabase } from '@/lib/supabase';

export interface AuthUser {
  id: string;
  email: string;
  isAdmin?: boolean;
  isActive?: boolean;
}

// Cache do perfil do usuário (evita requisições repetidas)
const profileCache: Map<string, { isAdmin: boolean; isActive: boolean; timestamp: number }> = new Map();
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutos

// Limpar cache (usar após logout ou mudanças de permissão)
function clearProfileCache() {
  profileCache.clear();
}

export const authService = {
  // Fazer login
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Se o erro for de email não confirmado, fornecer mensagem mais clara
      if (error.message?.includes('email_not_confirmed') || error.message?.includes('Email not confirmed')) {
        throw new Error('Email não confirmado. Verifique seu email ou execute o script CONFIRMAR_EMAIL_ADMIN.sql no Supabase.');
      }
      throw error;
    }

    return data;
  },

  // Registrar novo usuário
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  },

  // Fazer logout
  async signOut() {
    clearProfileCache(); // Limpar cache ao fazer logout
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  },

  // Obter usuário atual (otimizado com cache)
  async getCurrentUser() {
    // Primeiro, tentar obter da sessão persistida (sem requisição)
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return null;
    }

    const userId = session.user.id;

    // Verificar cache do perfil
    const cached = profileCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return {
        id: userId,
        email: session.user.email || '',
        isAdmin: cached.isAdmin,
        isActive: cached.isActive,
      } as AuthUser;
    }

    // Se não tem cache válido, buscar do banco
    let userProfile = { isAdmin: false, isActive: true };
    try {
      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_admin, is_active')
        .eq('user_id', userId)
        .single();
      
      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // Perfil não existe - usar valores padrão
          userProfile = { isAdmin: false, isActive: true };
        } else {
          console.warn('Erro ao buscar perfil do usuário:', profileError);
        }
      } else if (data) {
        userProfile = {
          isAdmin: data.is_admin || false,
          isActive: data.is_active !== false,
        };
      }

      // Atualizar cache
      profileCache.set(userId, {
        ...userProfile,
        timestamp: Date.now(),
      });
    } catch (error: any) {
      if (error?.code !== 'PGRST301') {
        console.warn('Erro ao buscar perfil do usuário:', error);
      }
    }

    return {
      id: userId,
      email: session.user.email || '',
      isAdmin: userProfile.isAdmin,
      isActive: userProfile.isActive,
    } as AuthUser;
  },

  // Verificar se usuário é admin
  async isAdmin(): Promise<boolean> {
    const user = await authService.getCurrentUser();
    return user?.isAdmin || false;
  },

  // Verificar se usuário está ativo
  async isActive(): Promise<boolean> {
    const user = await authService.getCurrentUser();
    return user?.isActive !== false;
  },

  // Observar mudanças de autenticação
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Limpar cache ao mudar sessão para garantir dados atualizados
        clearProfileCache();
        const user = await authService.getCurrentUser();
        callback(user);
      } else {
        clearProfileCache();
        callback(null);
      }
    });
  },
};

