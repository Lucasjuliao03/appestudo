import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/" element={<Index />} />
            <Route path="/questoes" element={<Questoes />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/simulados" element={<Simulados />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
