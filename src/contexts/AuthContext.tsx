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
    const { data: { subscription } } = authService.onAuthStateChange(async (user) => {
      if (mounted) {
        // Sempre atualizar quando há mudança de autenticação
        // Pequeno delay para garantir que a sessão foi persistida
        await new Promise(resolve => setTimeout(resolve, 100));
        if (mounted) {
          setUser(user);
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
      
      // Primeiro, verificar se há sessão no localStorage (mais rápido)
      const { supabase } = await import('@/lib/supabase');
      
      // Tentar múltiplas vezes para garantir que a sessão seja carregada
      let session = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (!session && attempts < maxAttempts) {
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.warn(`Tentativa ${attempts + 1}: Erro ao buscar sessão:`, sessionError);
          if (attempts === maxAttempts - 1) {
            setUser(null);
            setLoading(false);
            initializedRef.current = true;
            return;
          }
          await new Promise(resolve => setTimeout(resolve, 200));
          attempts++;
          continue;
        }
        
        session = data.session;
        
        if (!session && attempts < maxAttempts - 1) {
          // Aguardar um pouco e tentar novamente (pode ser que ainda esteja carregando)
          await new Promise(resolve => setTimeout(resolve, 200));
          attempts++;
        }
      }

      if (session?.user) {
        // Se tem sessão, buscar dados do usuário
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          console.log('✅ Sessão carregada do localStorage:', currentUser.email);
        } else {
          console.warn('⚠️ Sessão encontrada mas não foi possível obter dados do usuário');
          setUser(null);
        }
      } else {
        // Se não tem sessão, verificar se há token no localStorage
        const storedToken = localStorage.getItem('sb-auth-token');
        if (storedToken) {
          try {
            const parsed = JSON.parse(storedToken);
            if (parsed?.access_token || parsed?.currentSession?.access_token) {
              // Tentar obter sessão novamente (pode ter sido carregada enquanto verificávamos)
              await new Promise(resolve => setTimeout(resolve, 300));
              const { data: { session: retrySession } } = await supabase.auth.getSession();
              if (retrySession?.user) {
                const currentUser = await authService.getCurrentUser();
                if (currentUser) {
                  setUser(currentUser);
                  console.log('✅ Sessão restaurada do token:', currentUser.email);
                } else {
                  setUser(null);
                }
              } else {
                console.warn('⚠️ Token encontrado mas sessão não pôde ser restaurada');
                setUser(null);
              }
            } else {
              setUser(null);
            }
          } catch (e) {
            console.warn('⚠️ Erro ao restaurar sessão do token:', e);
            setUser(null);
          }
        } else {
          setUser(null);
          console.log('ℹ️ Nenhuma sessão encontrada');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar sessão:', error);
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

    // Aguardar para garantir que a sessão foi persistida no localStorage
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Verificar se a sessão foi realmente persistida
    const { supabase } = await import('@/lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      throw new Error('Falha ao criar sessão. Tente novamente.');
    }

    // Buscar usuário atualizado
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
    
    // Aguardar mais um pouco para garantir que o estado foi atualizado
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('✅ Login realizado com sucesso:', currentUser?.email);
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

