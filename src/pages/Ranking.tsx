import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Trophy, Medal, Award, TrendingUp, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { simuladosService, RankingUser } from "@/services/supabase/simulados";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

function RankingCard({ 
  user, 
  position, 
  isCurrentUser 
}: { 
  user: RankingUser;
  position: number;
  isCurrentUser: boolean;
}) {
  const getMedalIcon = () => {
    if (position === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (position === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (position === 3) return <Award className="h-6 w-6 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground w-6 text-center">{position}</span>;
  };

  const getPositionColor = () => {
    if (position === 1) return "bg-yellow-500/10 border-yellow-500/30";
    if (position === 2) return "bg-gray-400/10 border-gray-400/30";
    if (position === 3) return "bg-amber-600/10 border-amber-600/30";
    return "bg-card border-border";
  };

  const accuracyColor = user.accuracy >= 70 ? "text-success" : user.accuracy >= 50 ? "text-warning" : "text-destructive";

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all",
        getPositionColor(),
        isCurrentUser && "ring-2 ring-primary"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          {getMedalIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-foreground text-sm truncate">
              {user.display_name || user.email.split('@')[0] || 'Usuário'}
            </p>
            {isCurrentUser && (
              <Badge variant="outline" className="text-xs">Você</Badge>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Questões</p>
              <p className="font-semibold text-foreground">{user.total_questions}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Acertos</p>
              <p className="font-semibold text-foreground">{user.total_correct}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Acurácia</p>
              <p className={cn("font-semibold", accuracyColor)}>
                {user.accuracy.toFixed(1)}%
              </p>
            </div>
          </div>
          <Progress 
            value={user.accuracy} 
            className={cn(
              "h-2 mt-2",
              user.accuracy >= 70 ? "[&>div]:bg-success" :
              user.accuracy >= 50 ? "[&>div]:bg-warning" :
              "[&>div]:bg-destructive"
            )}
          />
        </div>
      </div>
    </div>
  );
}

export default function RankingPage() {
  const { user } = useAuth();
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRanking() {
      try {
        setIsLoading(true);
        setError(null);
        const rankingData = await simuladosService.getRanking(50);
        
        // Remover duplicatas baseado no user_id
        const uniqueRanking = Array.from(
          new Map(rankingData.map(u => [u.user_id, u])).values()
        );
        
        setRanking(uniqueRanking);
      } catch (err: any) {
        console.error('Erro ao carregar ranking:', err);
        setError(err.message || 'Erro ao carregar ranking. Verifique se a função get_ranking foi criada no banco de dados.');
      } finally {
        setIsLoading(false);
      }
    }

    loadRanking();
  }, []);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="px-4 pt-6 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando ranking...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="px-4 pt-6">
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 pt-6 space-y-4 animate-slide-up">
        <div className="text-center space-y-2">
          <Trophy className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Ranking</h1>
          <p className="text-sm text-muted-foreground">
            Classificação dos melhores desempenhos
          </p>
        </div>

        {ranking.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border p-8 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              Nenhum simulado realizado ainda. Seja o primeiro!
            </p>
            {error && (
              <p className="text-xs text-destructive mt-2">
                {error}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Top 3 destacados */}
            {ranking.slice(0, 3).length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Pódio
                </h2>
                <div className="grid grid-cols-1 gap-2">
                  {ranking.slice(0, 3).map((userData, index) => (
                    <RankingCard
                      key={userData.user_id}
                      user={userData}
                      position={index + 1}
                      isCurrentUser={user?.id === userData.user_id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Resto do ranking */}
            {ranking.slice(3).length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Classificação Geral
                </h2>
                <div className="space-y-2">
                  {ranking.slice(3).map((userData, index) => (
                    <RankingCard
                      key={userData.user_id}
                      user={userData}
                      position={index + 4}
                      isCurrentUser={user?.id === userData.user_id}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="rounded-2xl bg-card border border-border p-4 text-sm text-muted-foreground space-y-1.5">
          <p className="font-medium text-foreground text-xs uppercase tracking-wider">
            Como funciona
          </p>
          <p>• Ranking baseado no total de questões respondidas</p>
          <p>• Em caso de empate, considera a maior acurácia</p>
          <p>• Atualizado em tempo real</p>
        </div>
      </div>
    </AppLayout>
  );
}

