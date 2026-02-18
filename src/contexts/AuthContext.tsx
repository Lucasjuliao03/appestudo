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
    // Carregar sessão persistida primeiro (mais rápido)
    loadInitialSession();

    // Observar mudanças de autenticação
    const { data: { subscription } } = authService.onAuthStateChange(async (user) => {
      if (initializedRef.current) {
        // Só atualizar se já inicializou (evita duplicar requisições)
        setUser(user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadInitialSession() {
    try {
      // Tentar carregar da sessão persistida primeiro (sem requisição)
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Erro ao carregar sessão:', error);
      setUser(null);
    } finally {
      setLoading(false);
      initializedRef.current = true;
    }
  }

  async function signIn(email: string, password: string) {
    await authService.signIn(email, password);
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
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

