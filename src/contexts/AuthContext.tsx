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
        setUser(user);
        if (user) {
          console.log('✅ Auth state changed - User logged in:', user.email);
        } else {
          console.log('✅ Auth state changed - User logged out');
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function loadInitialSession() {
    // Definir loading como false IMEDIATAMENTE para não travar a UI
    // O onAuthStateChange vai atualizar o user quando a sessão estiver pronta
    setLoading(false);
    initializedRef.current = true;
    
    // Tentar carregar sessão de forma assíncrona (não bloqueia)
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        console.log('✅ Sessão carregada:', currentUser.email);
      } else {
        setUser(null);
        console.log('ℹ️ Nenhuma sessão encontrada');
      }
    } catch (error) {
      // Se der erro, apenas definir como não logado
      // O onAuthStateChange vai tentar novamente quando a sessão estiver disponível
      setUser(null);
      console.warn('⚠️ Erro ao carregar sessão (onAuthStateChange vai tentar novamente):', error);
    }
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await authService.signIn(email, password);
    
    if (error) {
      throw error;
    }

    // O onAuthStateChange vai atualizar o user automaticamente
    // Não precisamos fazer nada aqui, apenas aguardar um pouco para garantir
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Verificar se a sessão foi criada (o onAuthStateChange já deve ter atualizado)
    const currentUser = await authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      console.log('✅ Login realizado com sucesso:', currentUser.email);
    } else {
      // Se ainda não tem user, o onAuthStateChange vai atualizar em breve
      console.log('ℹ️ Login realizado, aguardando atualização de sessão...');
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

