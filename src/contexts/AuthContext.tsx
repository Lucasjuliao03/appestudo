import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { authService, AuthUser } from '@/services/supabase/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    
    // Carregar sessão persistida primeiro (mais rápido)
    loadInitialSession();

    // Observar mudanças de autenticação
    // Isso vai ser acionado quando a sessão for carregada ou mudar
    const { data: { subscription } } = authService.onAuthStateChange(async (user) => {
      if (mounted) {
        // Aguardar um pouco para garantir que o estado foi atualizado
        await new Promise(resolve => setTimeout(resolve, 50));
        
        if (mounted) {
          setUser(user);
          // Atualizar loading quando receber resposta do onAuthStateChange
          if (initializedRef.current) {
            setLoading(false);
          }
          
          if (user) {
            console.log('✅ Auth state changed - User logged in:', user.email);
          } else {
            console.log('✅ Auth state changed - User logged out');
          }
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function loadInitialSession() {
    try {
      // Aguardar um pouco para garantir que o Supabase está pronto
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verificar sessão diretamente do Supabase
      const { supabase } = await import('@/lib/supabase');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.warn('⚠️ Erro ao buscar sessão inicial:', sessionError);
        setUser(null);
        setLoading(false);
        initializedRef.current = true;
        return;
      }

      if (session?.user) {
        // Se tem sessão, buscar dados do usuário
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          console.log('✅ Sessão carregada do localStorage:', currentUser.email);
        } else {
          // Se não conseguiu buscar perfil, criar user básico
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            isAdmin: false,
            isActive: true,
          });
          console.log('✅ Sessão carregada (sem perfil):', session.user.email);
        }
      } else {
        setUser(null);
        console.log('ℹ️ Nenhuma sessão encontrada');
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar sessão inicial:', error);
      setUser(null);
    } finally {
      setLoading(false);
      initializedRef.current = true;
    }
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await authService.signIn(email, password);
    
    if (error) {
      throw error;
    }

    // Aguardar um pouco para o onAuthStateChange processar
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Tentar atualizar o user imediatamente (não depender apenas do onAuthStateChange)
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        console.log('✅ Login realizado com sucesso:', currentUser.email);
      }
    } catch (e) {
      // Se der erro, o onAuthStateChange vai atualizar
      console.log('ℹ️ Login realizado, aguardando onAuthStateChange...');
    }
  }

  async function signUp(email: string, password: string) {
    await authService.signUp(email, password);
    // Após registro, o usuário precisa confirmar o email (dependendo da configuração do Supabase)
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
  }

  async function signOut() {
    await authService.signOut();
    setUser(null);
    // Limpar cache do React Query também
    if (typeof window !== 'undefined' && (window as any).queryClient) {
      (window as any).queryClient.clear();
    }
  }

  const isAdmin = user?.isAdmin || false;
  const isActive = user?.isActive !== false;

  // Debug: log para verificar se isAdmin está sendo calculado
  useEffect(() => {
    if (user) {
      console.log('🔐 AuthContext - User:', { 
        id: user.id, 
        email: user.email, 
        isAdmin: user.isAdmin, 
        isActive: user.isActive,
        calculatedIsAdmin: isAdmin
      });
    }
  }, [user, isAdmin]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        isAdmin,
        isActive,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

