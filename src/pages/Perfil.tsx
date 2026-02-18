import { AppLayout } from "@/components/AppLayout";
import { ranks } from "@/data/mockData";
import { Progress } from "@/components/ui/progress";
import { User, Flame, Zap, Award, Settings, ChevronRight, LogOut, Loader2, Shield, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { userStatsService } from "@/services/supabase/userStats";
import { performanceService } from "@/services/supabase/performance";
import { userSettingsService } from "@/services/supabase/userSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function PerfilPage() {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState<{ xp_total: number; streak_current: number; streak_best: number } | null>(null);
  const [userSettings, setUserSettings] = useState<{ display_name: string | null } | null>(null);
  const [subjectPerformance, setSubjectPerformance] = useState<Array<{ subjectId: string; name: string; accuracy: number; totalAttempts: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        // Carregar configurações
        const settings = await userSettingsService.get();
        if (settings) {
          setUserSettings({ display_name: settings.display_name });
        }

        // Carregar estatísticas
        const stats = await userStatsService.get();
        if (stats) {
          setUserStats(stats);
        }

        // Calcular desempenho por matéria
        const performance = await performanceService.getSubjectPerformance();
        setSubjectPerformance(performance);
      } catch (error) {
        console.error('Erro ao carregar dados do perfil:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();

    // Recarregar dados periodicamente
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="px-4 pt-6 space-y-5 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando perfil...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Calcular nível baseado no XP
  const xp = userStats?.xp_total || 0;
  const currentRank = ranks.find((r, index) => {
    const nextRank = ranks[index + 1];
    return xp >= r.xpRequired && (!nextRank || xp < nextRank.xpRequired);
  }) || ranks[0];
  
  const currentRankIndex = ranks.findIndex(r => r.level === currentRank.level);
  const nextRank = ranks[currentRankIndex + 1];

  const xpProgress = nextRank
    ? ((xp - currentRank.xpRequired) / (nextRank.xpRequired - currentRank.xpRequired)) * 100
    : 100;

  return (
    <AppLayout>
      <div className="px-4 pt-6 space-y-5 animate-slide-up">
        {/* Profile header */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/15 border border-primary/25">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{userSettings?.display_name || user?.email?.split('@')[0] || currentRank.name}</h1>
            <p className="text-sm text-muted-foreground">{currentRank.name}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-card border border-border p-3 text-center">
            <Flame className="h-5 w-5 text-accent mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{userStats?.streak_current || 0}</p>
            <p className="text-[10px] text-muted-foreground">Streak</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-3 text-center">
            <Zap className="h-5 w-5 text-xp mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{xp}</p>
            <p className="text-[10px] text-muted-foreground">XP Total</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-3 text-center">
            <Award className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">Nv.{currentRank.level}</p>
            <p className="text-[10px] text-muted-foreground">{currentRank.name}</p>
          </div>
        </div>

        {/* Rank progress */}
        {nextRank && (
          <div className="rounded-2xl bg-card border border-border p-4">
            <p className="text-sm font-medium text-foreground mb-2">Próxima patente: {nextRank.name}</p>
            <Progress
              value={xpProgress}
              className="h-2 bg-muted [&>div]:bg-xp"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              {nextRank.xpRequired - xp} XP restantes
            </p>
          </div>
        )}

        {/* Mapa de domínio */}
        <div className="rounded-2xl bg-card border border-border p-4">
          <h3 className="font-semibold text-foreground mb-3">Mapa de Domínio</h3>
          {subjectPerformance.length === 0 ? (
            <p className="text-sm text-muted-foreground">Complete algumas questões para ver seu desempenho por matéria.</p>
          ) : (
            <div className="space-y-3">
              {subjectPerformance.map((sp) => {
                const level = sp.accuracy >= 75 ? "Forte" : sp.accuracy >= 50 ? "Médio" : "Fraco";
                const levelColor = sp.accuracy >= 75 ? "text-success" : sp.accuracy >= 50 ? "text-warning" : "text-destructive";
                return (
                  <div key={sp.subjectId} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground font-medium">{sp.name}</span>
                        <span className={cn("text-xs font-bold", levelColor)}>
                          {sp.accuracy > 0 ? `${level} · ${sp.accuracy}%` : 'Sem dados'}
                        </span>
                      </div>
                      {sp.accuracy > 0 && (
                        <div className="flex gap-0.5 mt-1">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "h-1.5 flex-1 rounded-full",
                                i < Math.round(sp.accuracy / 10)
                                  ? sp.accuracy >= 75 ? "bg-success" : sp.accuracy >= 50 ? "bg-warning" : "bg-destructive"
                                  : "bg-muted"
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Menu items */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          {[
            { icon: Trophy, label: "Ranking", action: () => navigate("/ranking") },
            ...(isAdmin ? [{ icon: Shield, label: "Painel Admin", action: () => navigate("/admin") }] : []),
            { icon: Settings, label: "Configurações", action: () => navigate("/configuracoes") },
            { icon: LogOut, label: "Sair", action: handleLogout, destructive: true },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium transition-colors",
                i > 0 && "border-t border-border",
                (item as any).destructive ? "text-destructive" : "text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
