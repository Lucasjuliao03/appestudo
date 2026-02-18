import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Question } from "@/types/study";
import { CheckCircle2, XCircle, ChevronRight, BookOpen, Loader2, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { questionsService, subjectsService } from "@/services/supabase";
import { adaptQuestionFromSupabase } from "@/services/adapters/questionAdapter";
import { attemptsService } from "@/services/supabase/attempts";
import { userStatsService } from "@/services/supabase/userStats";
import { isSupabaseConfigured } from "@/lib/supabase";
import { filtersService } from "@/services/supabase/filters";

type ViewState = 'tema' | 'subtema' | 'questions';

function QuestionCard({ 
  question, 
  subjectName,
  onNext 
}: { 
  question: Question; 
  subjectName?: string;
  onNext: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCorrect = selected === question.correctOption;

  const handleConfirm = async () => {
    if (!selected) return;
    
    setIsSubmitting(true);
    const selectedLetter = selected.toUpperCase() as 'A' | 'B' | 'C' | 'D' | 'E';
    const isCorrectAnswer = selected === question.correctOption;

    try {
      // Registrar tentativa
      await attemptsService.create({
        question_id: question.id,
        selected_letter: selectedLetter,
        is_correct: isCorrectAnswer,
      });

      // Atualizar estatísticas do usuário
      if (isCorrectAnswer) {
        const xpResult = await userStatsService.addXP(15);
        if (xpResult) {
          console.log('✅ XP adicionado! Total:', xpResult.xp_total);
        } else {
          console.warn('⚠️ Não foi possível adicionar XP (usuário não autenticado ou tabela não existe)');
        }
        await userStatsService.updateStreak(true);
      } else {
        await userStatsService.updateStreak(false);
      }
    } catch (error) {
      console.error('Erro ao salvar tentativa:', error);
      // Mostrar erro ao usuário
      alert('Erro ao salvar tentativa. Verifique se está logado e se as tabelas existem no Supabase.');
    } finally {
      setIsSubmitting(false);
      setConfirmed(true);
    }
  };

  const handleNext = () => {
    setSelected(null);
    setConfirmed(false);
    onNext();
  };

  const difficultyColor = {
    fácil: "bg-success/15 text-success border-success/20",
    média: "bg-warning/15 text-warning border-warning/20",
    difícil: "bg-destructive/15 text-destructive border-destructive/20",
  };

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        {subjectName && (
          <Badge variant="outline" className="text-xs border-primary/30 text-primary">
            {subjectName}
          </Badge>
        )}
        <Badge variant="outline" className={cn("text-xs", difficultyColor[question.difficulty])}>
          {question.difficulty}
        </Badge>
        <Badge variant="outline" className="text-xs border-border text-muted-foreground">
          {question.organ} · {question.year}
        </Badge>
      </div>

      {/* Statement */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <p className="text-sm leading-relaxed text-foreground">{question.statement}</p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {question.options.map((opt) => {
          const letter = opt.id.toUpperCase();
          const isSelected = selected === opt.id;
          const isRight = opt.id === question.correctOption;

          let optStyle = "bg-card border-border hover:border-primary/40";
          if (confirmed) {
            if (isRight) optStyle = "bg-success/10 border-success/40";
            else if (isSelected && !isRight) optStyle = "bg-destructive/10 border-destructive/40";
            else optStyle = "bg-card border-border opacity-50";
          } else if (isSelected) {
            optStyle = "bg-primary/10 border-primary/50 ring-1 ring-primary/30";
          }

          return (
            <button
              key={opt.id}
              onClick={() => !confirmed && setSelected(opt.id)}
              disabled={confirmed}
              className={cn(
                "w-full flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all active:scale-[0.98]",
                optStyle
              )}
            >
              <span className={cn(
                "flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold",
                confirmed && isRight ? "bg-success text-success-foreground" :
                confirmed && isSelected && !isRight ? "bg-destructive text-destructive-foreground" :
                isSelected ? "bg-primary text-primary-foreground" :
                "bg-muted text-muted-foreground"
              )}>
                {confirmed && isRight ? <CheckCircle2 className="h-4 w-4" /> :
                 confirmed && isSelected && !isRight ? <XCircle className="h-4 w-4" /> :
                 letter}
              </span>
              <span className="text-sm text-foreground leading-relaxed flex-1">{opt.text}</span>
            </button>
          );
        })}
      </div>

      {/* Action */}
      {!confirmed ? (
        <button
          onClick={handleConfirm}
          disabled={!selected || isSubmitting}
          className={cn(
            "w-full rounded-xl py-3.5 font-semibold text-sm transition-all flex items-center justify-center gap-2",
            selected && !isSubmitting
              ? "bg-primary text-primary-foreground active:scale-[0.98]"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Salvando...' : 'Confirmar Resposta'}
        </button>
      ) : (
        <div className="space-y-3 animate-slide-up">
          {/* Result feedback */}
          <div className={cn(
            "rounded-xl p-4 border",
            isCorrect
              ? "bg-success/10 border-success/30"
              : "bg-destructive/10 border-destructive/30"
          )}>
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <span className={cn("font-bold text-sm", isCorrect ? "text-success" : "text-destructive")}>
                {isCorrect ? "Resposta Correta!" : "Resposta Incorreta"}
              </span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{question.explanation}</p>
          </div>

          <button
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-semibold text-sm text-primary-foreground active:scale-[0.98] transition-all"
          >
            Próxima Questão <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function QuestoesPage() {
  const [viewState, setViewState] = useState<ViewState>('tema');
  const [selectedTema, setSelectedTema] = useState<string | null>(null);
  const [selectedSubtema, setSelectedSubtema] = useState<string | null>(null);
  const [temas, setTemas] = useState<string[]>([]);
  const [subtemas, setSubtemas] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Map<string, string>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true);
        setError(null);

        if (!isSupabaseConfigured()) {
          setError('Supabase não configurado. Crie um arquivo .env na raiz do projeto com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
          setIsLoading(false);
          return;
        }

        // Carregar matérias
        const subjectsData = await subjectsService.getAll();
        const subjectsMap = new Map(subjectsData.map(s => [s.id, s.name]));
        setSubjects(subjectsMap);

        // Carregar temas
        const temasData = await filtersService.getTemas();
        setTemas(temasData);

        if (temasData.length === 0) {
          setError('Nenhum tema encontrado. Verifique se há dados no banco de dados.');
        }
      } catch (err: any) {
        console.error('Erro ao carregar dados:', err);
        setError(`Erro ao carregar dados: ${err?.message || 'Erro desconhecido'}`);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    async function loadSubtemas() {
      if (!selectedTema) return;

      try {
        setIsLoading(true);
        const subtemasData = await filtersService.getSubtemas(selectedTema);
        setSubtemas(subtemasData);
      } catch (err: any) {
        console.error('Erro ao carregar subtemas:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (viewState === 'subtema' && selectedTema) {
      loadSubtemas();
    }
  }, [selectedTema, viewState]);

  useEffect(() => {
    async function loadQuestions() {
      if (!selectedTema) return;

      try {
        setIsLoading(true);
        const filters: any = { tema: selectedTema };
        if (selectedSubtema) {
          filters.subtema = selectedSubtema;
        }

        const questionsData = await questionsService.getAll({ ...filters, limit: 100 });
        const adaptedQuestions = questionsData.map(q => adaptQuestionFromSupabase(q, subjects.get(q.subject_id)));
        setQuestions(adaptedQuestions);
        setCurrentIndex(0);

        if (adaptedQuestions.length === 0) {
          setError('Nenhuma questão encontrada para os filtros selecionados.');
        }
      } catch (err: any) {
        console.error('Erro ao carregar questões:', err);
        setError(`Erro ao carregar questões: ${err?.message || 'Erro desconhecido'}`);
      } finally {
        setIsLoading(false);
      }
    }

    if (viewState === 'questions' && selectedTema) {
      loadQuestions();
    }
  }, [viewState, selectedTema, selectedSubtema, subjects]);

  const handleTemaSelect = (tema: string) => {
    setSelectedTema(tema);
    setSelectedSubtema(null);
    setViewState('subtema');
  };

  const handleSubtemaSelect = (subtema: string | null) => {
    setSelectedSubtema(subtema);
    setViewState('questions');
  };

  const handleBack = () => {
    if (viewState === 'questions') {
      setViewState('subtema');
      setSelectedSubtema(null);
    } else if (viewState === 'subtema') {
      setViewState('tema');
      setSelectedTema(null);
    }
  };

  const handleNext = () => {
    if (questions.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % questions.length);
    }
  };

  if (isLoading && viewState === 'tema') {
    return (
      <AppLayout>
        <div className="px-4 pt-6 space-y-4 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando temas...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error && viewState === 'tema') {
    return (
      <AppLayout>
        <div className="px-4 pt-6 space-y-4">
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4">
            <p className="text-sm text-destructive font-medium mb-2">{error}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Tela de seleção de Tema
  if (viewState === 'tema') {
    return (
      <AppLayout>
        <div className="px-4 pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Selecione o Tema</h1>
          </div>

          <div className="space-y-2">
            {temas.map((tema) => (
              <button
                key={tema}
                onClick={() => handleTemaSelect(tema)}
                className="w-full rounded-xl bg-card border border-border p-4 text-left hover:border-primary/40 transition-all active:scale-[0.98]"
              >
                <p className="font-medium text-foreground">{tema}</p>
                <ChevronRight className="h-4 w-4 text-muted-foreground float-right -mt-5" />
              </button>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  // Tela de seleção de Subtema
  if (viewState === 'subtema') {
    return (
      <AppLayout>
        <div className="px-4 pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <button onClick={handleBack} className="p-1 hover:bg-muted rounded-lg">
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <BookOpen className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Selecione o Subtema</h1>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleSubtemaSelect(null)}
              className="w-full rounded-xl bg-card border border-border p-4 text-left hover:border-primary/40 transition-all active:scale-[0.98]"
            >
              <p className="font-medium text-foreground">Todos os subtemas</p>
              <ChevronRight className="h-4 w-4 text-muted-foreground float-right -mt-5" />
            </button>
            {subtemas.map((subtema) => (
              <button
                key={subtema}
                onClick={() => handleSubtemaSelect(subtema)}
                className="w-full rounded-xl bg-card border border-border p-4 text-left hover:border-primary/40 transition-all active:scale-[0.98]"
              >
                <p className="font-medium text-foreground">{subtema}</p>
                <ChevronRight className="h-4 w-4 text-muted-foreground float-right -mt-5" />
              </button>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  // Tela de Questões
  if (isLoading) {
    return (
      <AppLayout>
        <div className="px-4 pt-6 space-y-4 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando questões...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (questions.length === 0) {
    return (
      <AppLayout>
        <div className="px-4 pt-6 space-y-4">
          <button onClick={handleBack} className="flex items-center gap-2 text-sm text-muted-foreground">
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </button>
          <div className="rounded-xl bg-card border border-border p-4 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma questão disponível para os filtros selecionados.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const currentQuestion = questions[currentIndex];
  const subjectName = subjects.get(currentQuestion.subjectId);

  return (
    <AppLayout>
      <div className="px-4 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={handleBack} className="p-1 hover:bg-muted rounded-lg">
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <BookOpen className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Questões</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Questão {currentIndex + 1} de {questions.length}</span>
          <span>·</span>
          <span className="text-primary font-medium">+15 XP por acerto</span>
        </div>

        <div className="text-xs text-muted-foreground">
          <span>Tema: {selectedTema}</span>
          {selectedSubtema && <span> · Subtema: {selectedSubtema}</span>}
        </div>

        <QuestionCard
          key={currentQuestion.id}
          question={currentQuestion}
          subjectName={subjectName}
          onNext={handleNext}
        />
      </div>
    </AppLayout>
  );
}
