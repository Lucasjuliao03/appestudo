import { Flame, Zap, Target, ChevronRight, TrendingUp, BookOpen, Layers, Loader2 } from "lucide-react";
import { ranks } from "@/data/mockData";
import { AppLayout } from "@/components/AppLayout";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { userStatsService } from "@/services/supabase/userStats";
import { performanceService } from "@/services/supabase/performance";
import { attemptsService } from "@/services/supabase/attempts";
import { userSettingsService } from "@/services/supabase/userSettings";
import { questionsService } from "@/services/supabase/questions";
import { useAuth } from "@/contexts/AuthContext";

function StreakCard({ streak }: { streak: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Sequência</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-accent animate-streak-fire">
              {streak}
            </span>
            <span className="text-sm font-semibold text-accent">dias</span>
          </div>
        </div>
        <Flame className="h-12 w-12 text-accent opacity-80" strokeWidth={1.5} />
      </div>
    </div>
  );
}

function XpCard({ xp }: { xp: number }) {
  // Calcular nível baseado no XP
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
    <div className="rounded-2xl bg-gradient-to-br from-xp/20 to-xp/5 border border-xp/20 p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Patente</p>
          <p className="text-lg font-bold text-foreground">{currentRank.name}</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-xp/20 px-3 py-1">
          <Zap className="h-4 w-4 text-xp" />
          <span className="text-sm font-bold text-xp">{xp} XP</span>
        </div>
      </div>
      {nextRank && (
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{currentRank.name}</span>
            <span>{nextRank.name}</span>
          </div>
          <Progress value={xpProgress} className="h-2 bg-muted [&>div]:bg-xp" />
        </div>
      )}
    </div>
  );
}

function DailyGoalCard({ 
  questionsToday, 
  questionsTarget, 
  flashcardsToday, 
  flashcardsTarget 
}: { 
  questionsToday: number;
  questionsTarget: number;
  flashcardsToday: number;
  flashcardsTarget: number;
}) {
  const questionsPercent = questionsTarget > 0 ? (questionsToday / questionsTarget) * 100 : 0;
  const flashcardsPercent = flashcardsTarget > 0 ? (flashcardsToday / flashcardsTarget) * 100 : 0;

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <Target className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Meta Diária</h3>
      </div>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Questões</span>
            <span className="font-medium text-foreground">{questionsToday}/{questionsTarget}</span>
          </div>
          <Progress value={questionsPercent} className="h-2 bg-muted [&>div]:bg-primary" />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Flashcards</span>
            <span className="font-medium text-foreground">{flashcardsToday}/{flashcardsTarget}</span>
          </div>
          <Progress value={flashcardsPercent} className="h-2 bg-muted [&>div]:bg-accent" />
        </div>
      </div>
    </div>
  );
}

function QuickActions({ 
  questionsRealized, 
  questionsTotal, 
  flashcardsRealized, 
  flashcardsTotal 
}: { 
  questionsRealized: number;
  questionsTotal: number;
  flashcardsRealized: number;
  flashcardsTotal: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Link
        to="/questoes"
        className="flex flex-col gap-2 rounded-2xl bg-primary/10 border border-primary/20 p-4 transition-all active:scale-[0.97]"
      >
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary shrink-0" />
          <p className="font-semibold text-foreground text-sm">Questões</p>
        </div>
        <p className="text-xs text-muted-foreground leading-tight">
          <span className="font-medium text-foreground">{questionsRealized}</span> de <span className="font-medium text-foreground">{questionsTotal}</span> realizados
        </p>
      </Link>
      <Link
        to="/flashcards"
        className="flex flex-col gap-2 rounded-2xl bg-accent/10 border border-accent/20 p-4 transition-all active:scale-[0.97]"
      >
        <div className="flex items-center gap-3">
          <Layers className="h-8 w-8 text-accent shrink-0" />
          <p className="font-semibold text-foreground text-sm">Flashcards</p>
        </div>
        <p className="text-xs text-muted-foreground leading-tight">
          <span className="font-medium text-foreground">{flashcardsRealized}</span> de <span className="font-medium text-foreground">{flashcardsTotal}</span> realizados
        </p>
      </Link>
    </div>
  );
}

function PerformanceOverview({ subjectPerformance }: { subjectPerformance: Array<{ subjectId: string; name: string; accuracy: number }> }) {
  if (subjectPerformance.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-success" />
            <h3 className="font-semibold text-foreground">Desempenho</h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Complete algumas questões para ver seu desempenho.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-success" />
          <h3 className="font-semibold text-foreground">Desempenho</h3>
        </div>
        <Link to="/perfil" className="text-xs text-primary font-medium flex items-center gap-0.5">
          Ver tudo <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="space-y-2.5">
        {subjectPerformance.slice(0, 4).map((sp) => (
          <div key={sp.subjectId} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-foreground font-medium truncate">{sp.name}</span>
                <span className={`font-bold ${sp.accuracy >= 70 ? "text-success" : sp.accuracy >= 50 ? "text-warning" : "text-destructive"}`}>
                  {sp.accuracy}%
                </span>
              </div>
              <Progress
                value={sp.accuracy}
                className="h-1.5 bg-muted [&>div]:transition-all"
                style={{ ["--tw-progress-color" as string]: sp.accuracy >= 70 ? "hsl(var(--success))" : sp.accuracy >= 50 ? "hsl(var(--warning))" : "hsl(var(--destructive))" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<{ xp_total: number; streak_current: number } | null>(null);
  const [userSettings, setUserSettings] = useState<{ display_name: string | null; daily_questions_target: number; daily_flashcards_target: number } | null>(null);
  const [questionsToday, setQuestionsToday] = useState(0);
  const [flashcardsToday, setFlashcardsToday] = useState(0);
  const [questionsTotal, setQuestionsTotal] = useState(0);
  const [flashcardsTotal, setFlashcardsTotal] = useState(0);
  const [questionsRealized, setQuestionsRealized] = useState(0);
  const [flashcardsRealized, setFlashcardsRealized] = useState(0);
  const [subjectPerformance, setSubjectPerformance] = useState<Array<{ subjectId: string; name: string; accuracy: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calcular patente baseado no XP
  const xp = userStats?.xp_total || 0;
  const currentRank = ranks.find((r, index) => {
    const nextRank = ranks[index + 1];
    return xp >= r.xpRequired && (!nextRank || xp < nextRank.xpRequired);
  }) || ranks[0];

  // Nome do usuário: display_name ou email ou "Recruta"
  const displayName = userSettings?.display_name || user?.email?.split('@')[0] || 'Recruta';

  useEffect(() => {
    async function loadData() {
      try {
        // Carregar configurações do usuário
        const settings = await userSettingsService.get();
        if (settings) {
          setUserSettings({
            display_name: settings.display_name,
            daily_questions_target: settings.daily_questions_target,
            daily_flashcards_target: settings.daily_flashcards_target,
          });
        }

        // Carregar estatísticas do usuário
        const stats = await userStatsService.get();
        if (stats) {
          setUserStats(stats);
        }

        // Carregar tentativas
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const attempts = await attemptsService.getUserAttempts();
        
        // Filtrar tentativas de hoje
        const todayAttempts = attempts.filter(a => {
          const attemptDate = new Date(a.answered_at);
          attemptDate.setHours(0, 0, 0, 0);
          return attemptDate.getTime() === today.getTime();
        });
        
        // Contar questões ÚNICAS realizadas (não tentativas)
        const uniqueQuestions = new Set(attempts.map(a => a.question_id));
        const uniqueQuestionsToday = new Set(todayAttempts.map(a => a.question_id));
        
        setQuestionsToday(uniqueQuestionsToday.size);
        setQuestionsRealized(uniqueQuestions.size);
        
        // Contar total de questões
        const totalQuestions = await questionsService.count();
        setQuestionsTotal(totalQuestions);
        
        // Contar total de flashcards (questões com explicação não nula)
        const flashcardsCount = await questionsService.countFlashcards();
        setFlashcardsTotal(flashcardsCount);
        
        // Contar flashcards realizados (questões com explicação que foram respondidas)
        try {
          const uniqueQuestionIds = Array.from(uniqueQuestions);
          const uniqueQuestionsTodayIds = Array.from(uniqueQuestionsToday);
          
          if (uniqueQuestionIds.length > 0) {
            // Buscar IDs das questões respondidas que têm explicação
            const flashcardIds = await questionsService.getFlashcardIds(uniqueQuestionIds);
            
            // Contar flashcards realizados
            const flashcardsRealizedCount = uniqueQuestionIds.filter(id => 
              flashcardIds.has(id)
            ).length;
            
            // Contar flashcards de hoje
            const flashcardsTodayCount = uniqueQuestionsTodayIds.filter(id => 
              flashcardIds.has(id)
            ).length;
            
            setFlashcardsRealized(flashcardsRealizedCount);
            setFlashcardsToday(flashcardsTodayCount);
          } else {
            setFlashcardsRealized(0);
            setFlashcardsToday(0);
          }
        } catch (err) {
          console.error('Erro ao contar flashcards realizados:', err);
          setFlashcardsRealized(0);
          setFlashcardsToday(0);
        }

        // Calcular desempenho por matéria
        const performance = await performanceService.getSubjectPerformance();
        setSubjectPerformance(performance.map(p => ({
          subjectId: p.subjectId,
          name: p.name,
          accuracy: p.accuracy,
        })));
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();

    // Recarregar dados apenas a cada 30 segundos (reduz requisições)
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="px-4 pt-6 space-y-4 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 pt-6 space-y-4 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Olá, {displayName}! 🎯</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{currentRank.name} — Continue firme.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StreakCard streak={userStats?.streak_current || 0} />
          <XpCard xp={userStats?.xp_total || 0} />
        </div>

        <DailyGoalCard 
          questionsToday={questionsToday} 
          questionsTarget={userSettings?.daily_questions_target || 10}
          flashcardsToday={flashcardsToday}
          flashcardsTarget={userSettings?.daily_flashcards_target || 10}
        />
        <QuickActions 
          questionsRealized={questionsRealized}
          questionsTotal={questionsTotal}
          flashcardsRealized={flashcardsRealized}
          flashcardsTotal={flashcardsTotal}
        />
        <PerformanceOverview subjectPerformance={subjectPerformance} />
      </div>
    </AppLayout>
  );
}
