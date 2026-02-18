import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import Questoes from "./pages/Questoes";
import Flashcards from "./pages/Flashcards";
import Simulados from "./pages/Simulados";
import Perfil from "./pages/Perfil";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Configuracoes from "./pages/Configuracoes";
import Ranking from "./pages/Ranking";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

// Configurar React Query com cache agressivo
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos - dados considerados frescos
      gcTime: 1000 * 60 * 30, // 30 minutos - tempo de garbage collection (antes era cacheTime)
      refetchOnWindowFocus: false, // Não recarregar ao focar na janela
      refetchOnMount: false, // Não recarregar ao montar componente
      refetchOnReconnect: true, // Recarregar apenas ao reconectar
      retry: 1, // Tentar apenas 1 vez em caso de erro
      retryDelay: 1000, // 1 segundo entre tentativas
    },
    mutations: {
      retry: 1,
    },
  },
});

// Componente para rotas protegidas
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [timeoutReached, setTimeoutReached] = useState(false);

  // Timeout de 10 segundos para evitar loading infinito
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setTimeoutReached(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading && !timeoutReached) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || timeoutReached) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Componente para rota de login (redireciona se já logado)
function LoginRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [timeoutReached, setTimeoutReached] = useState(false);

  // Timeout de 10 segundos para evitar loading infinito
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setTimeoutReached(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading && !timeoutReached) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginRoute><Login /></LoginRoute>} />
    <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
    <Route path="/questoes" element={<ProtectedRoute><Questoes /></ProtectedRoute>} />
    <Route path="/flashcards" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
    <Route path="/simulados" element={<ProtectedRoute><Simulados /></ProtectedRoute>} />
    <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
    <Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />
    <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

// Expor queryClient globalmente para limpar cache no logout
if (typeof window !== 'undefined') {
  (window as any).queryClient = queryClient;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
