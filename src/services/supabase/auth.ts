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
    try {
      // Uma única chamada - sem retries para evitar LockManager timeout
      const { data: { session }, error } = await supabase.auth.getSession();
      
      // Se houver erro ou não houver sessão, retornar null
      if (error || !session?.user) {
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
    } catch (error: any) {
      // Se der erro (incluindo LockManager timeout), retornar null silenciosamente
      // O onAuthStateChange vai tentar novamente quando a sessão estiver disponível
      console.warn('⚠️ Erro ao obter usuário atual:', error?.message || error);
      return null;
    }
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
    // Primeiro, verificar se já há uma sessão ativa e processar imediatamente
    // Isso garante que INITIAL_SESSION seja processado mesmo se o evento não for acionado
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        console.log('🔄 Sessão encontrada ao configurar listener, processando...');
        // Processar sessão inicial imediatamente
        setTimeout(async () => {
          try {
            const user = await authService.getCurrentUser();
            if (user) {
              callback(user);
            } else {
              callback({
                id: session.user.id,
                email: session.user.email || '',
                isAdmin: false,
                isActive: true,
              } as AuthUser);
            }
          } catch (error) {
            callback({
              id: session.user.id,
              email: session.user.email || '',
              isAdmin: false,
              isActive: true,
            } as AuthUser);
          }
        }, 100);
      }
    });

    // Depois, configurar o listener para mudanças futuras
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change event:', event, session?.user?.email || 'no user');
      
      // Processar TODOS os eventos relevantes
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED' || 
          event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        
        if (session?.user) {
          // Limpar cache ao mudar sessão para garantir dados atualizados
          clearProfileCache();
          
          // Aguardar um pouco para garantir que a sessão foi persistida
          // INITIAL_SESSION precisa de mais tempo
          const delay = event === 'INITIAL_SESSION' ? 200 : 150;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          try {
            const user = await authService.getCurrentUser();
            if (user) {
              console.log('✅ User obtido via getCurrentUser:', user.email);
              callback(user);
            } else {
              // Se não conseguiu buscar perfil, criar user básico
              console.log('⚠️ Não conseguiu buscar perfil, criando user básico');
              callback({
                id: session.user.id,
                email: session.user.email || '',
                isAdmin: false,
                isActive: true,
              } as AuthUser);
            }
          } catch (error) {
            console.warn('⚠️ Erro ao buscar user no onAuthStateChange:', error);
            // Se der erro, criar user básico da sessão
            callback({
              id: session.user.id,
              email: session.user.email || '',
              isAdmin: false,
              isActive: true,
            } as AuthUser);
          }
        } else {
          // Sem sessão = logout
          console.log('ℹ️ Sem sessão, fazendo logout');
          clearProfileCache();
          callback(null);
        }
      }
    });
  },
};

