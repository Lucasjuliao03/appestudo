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
    let processing = false;
    let lastProcessedUserId: string | null = null;
    let lastProcessedTime = 0;
    
    // Função auxiliar para processar sessão
    const processSession = async (session: any, source: string) => {
      console.log(`🔄 processSession chamado de ${source}, session:`, session?.user?.email || 'null');
      
      if (!session?.user) {
        console.log('ℹ️ Sem sessão, chamando callback(null)');
        lastProcessedUserId = null;
        clearProfileCache();
        callback(null);
        return;
      }

      // Se já processamos este user recentemente (últimos 300ms), ignorar (evita duplicação)
      const now = Date.now();
      if (lastProcessedUserId === session.user.id && (now - lastProcessedTime) < 300) {
        console.log(`ℹ️ Sessão do usuário ${session.user.email} já foi processada há ${now - lastProcessedTime}ms, ignorando...`);
        return;
      }

      // Evitar processamento simultâneo (mas permitir se passou tempo suficiente)
      if (processing && (now - lastProcessedTime) < 300) {
        console.log(`ℹ️ Já processando sessão, ignorando chamada de ${source}`);
        return;
      }

      processing = true;
      lastProcessedUserId = session.user.id;
      lastProcessedTime = now;
      clearProfileCache();
      
      console.log(`⏳ Processando sessão de ${session.user.email} via ${source}...`);
      
      // Aguardar um pouco para garantir que a sessão foi persistida
      await new Promise(resolve => setTimeout(resolve, 200));
      
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          console.log(`✅ User obtido via ${source}:`, user.email);
          callback(user);
        } else {
          // Se não conseguiu buscar perfil, criar user básico
          console.log('⚠️ Não conseguiu buscar perfil, criando user básico');
          const basicUser = {
            id: session.user.id,
            email: session.user.email || '',
            isAdmin: false,
            isActive: true,
          } as AuthUser;
          callback(basicUser);
        }
      } catch (error) {
        console.warn('⚠️ Erro ao buscar user:', error);
        // Se der erro, criar user básico da sessão
        const basicUser = {
          id: session.user.id,
          email: session.user.email || '',
          isAdmin: false,
          isActive: true,
        } as AuthUser;
        callback(basicUser);
      } finally {
        processing = false;
        console.log(`✅ Processamento de ${source} concluído`);
      }
    };

    // Primeiro, verificar se já há uma sessão ativa
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        console.log('🔄 Sessão encontrada ao configurar listener, processando...');
        await processSession(session, 'verificação inicial');
      } else {
        console.log('ℹ️ Nenhuma sessão encontrada na verificação inicial');
        callback(null);
      }
    });

    // Depois, configurar o listener para mudanças futuras
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change event:', event, session?.user?.email || 'no user');
      
      // Processar TODOS os eventos relevantes
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED' || 
          event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        
        await processSession(session, `onAuthStateChange (${event})`);
      }
    });
  },
};

