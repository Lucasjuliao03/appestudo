import { supabase } from '@/lib/supabase';

export interface AuthUser {
  id: string;
  email: string;
  isAdmin?: boolean;
  isActive?: boolean;
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  },

  // Obter usuário atual
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    // Buscar informações adicionais do usuário (permissões)
    // Se a tabela não existir ou houver erro, retorna valores padrão
    let userProfile = null;
    try {
      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_admin, is_active')
        .eq('user_id', user.id)
        .single();
      
      if (profileError) {
        // Se não encontrou (PGRST116), o perfil não existe - criar com valores padrão
        if (profileError.code === 'PGRST116') {
          console.log('Perfil não encontrado, usando valores padrão');
        } else {
          console.warn('Erro ao buscar perfil do usuário:', profileError);
        }
      } else {
        userProfile = data;
      }
    } catch (error: any) {
      // Tabela pode não existir ainda ou erro de RLS - usar valores padrão
      if (error?.code !== 'PGRST301') { // Não logar erro de RLS (normal se não autenticado)
        console.warn('Erro ao buscar perfil do usuário:', error);
      }
    }

    return {
      id: user.id,
      email: user.email || '',
      isAdmin: userProfile?.is_admin || false,
      isActive: userProfile?.is_active !== false, // default true
    } as AuthUser;
  },

  // Verificar se usuário é admin
  async isAdmin(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.isAdmin || false;
  },

  // Verificar se usuário está ativo
  async isActive(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.isActive !== false;
  },

  // Observar mudanças de autenticação
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await this.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });
  },
};

