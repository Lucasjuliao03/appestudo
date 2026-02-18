import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { ClipboardList, Clock, Play, ChevronRight, ChevronLeft, CheckCircle2, XCircle, ArrowLeft, Loader2, Trophy, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Question } from "@/types/study";
import { questionsService, filtersService, subjectsService } from "@/services/supabase";
import { adaptQuestionFromSupabase } from "@/services/adapters/questionAdapter";
import { attemptsService } from "@/services/supabase/attempts";
import { userStatsService } from "@/services/supabase/userStats";
import { simuladosService, Simulado as SimuladoRecord } from "@/services/supabase/simulados";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type ViewState = 'config' | 'tema' | 'subtema' | 'simulado' | 'resultado';

interface SimuladoConfig {
  questionCount: number;
  timeMinutes: number;
  selectedTemas: string[];
  selectedSubtemas: string[];
}

interface Answer {
  questionId: string;
  selectedOption: string;
  isCorrect: boolean;
  answeredAt: Date;
}

interface SimuladoResult {
  total: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  timeSpent: number;
  xpEarned: number;
}

function QuestionCard({ 
  question, 
  questionNumber,
  totalQuestions,
  selectedOption,
  onSelect,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious
}: { 
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedOption: string | null;
  onSelect: (option: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}) {
  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Questão {questionNumber} de {totalQuestions}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {question.topic} {question.subtopic && `• ${question.subtopic}`}
        </div>
      </div>

      {/* Statement */}
      <div className="rounded-xl bg-card border border-border p-4">
        <p className="text-foreground leading-relaxed whitespace-pre-wrap">{question.statement}</p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {question.options.map((option) => {
          const isSelected = selectedOption === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className={cn(
                "w-full text-left rounded-xl border p-4 transition-all",
                isSelected
                  ? "bg-primary/10 border-primary text-foreground"
                  : "bg-card border-border text-foreground hover:border-primary/40"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 font-bold text-sm shrink-0",
                  isSelected
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-background border-border text-foreground"
                )}>
                  {option.id.toUpperCase()}
                </div>
                <p className="flex-1">{option.text}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2 pt-2">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button
          onClick={onNext}
          disabled={!canGoNext}
          className="flex items-center gap-2"
        >
          Próxima
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function QuestionDetailDialog({
  question,
  answer,
  isOpen,
  onClose
}: {
  question: Question;
  answer: Answer | undefined;
  isOpen: boolean;
  onClose: () => void;
}) {
  const isCorrect = answer?.isCorrect || false;
  const selectedOption = answer?.selectedOption || '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCorrect ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
            <span>Questão {isCorrect ? 'Correta' : 'Incorreta'}</span>
          </DialogTitle>
          <DialogDescription>
            {question.topic} {question.subtopic && `• ${question.subtopic}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Statement */}
          <div className="rounded-xl bg-card border border-border p-4">
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">{question.statement}</p>
          </div>

          {/* Options */}
          <div className="space-y-2">
            {question.options.map((option) => {
              const isSelected = selectedOption === option.id;
              const isCorrectOption = option.id === question.correctOption;
              
              return (
                <div
                  key={option.id}
                  className={cn(
                    "rounded-xl border p-4 transition-all",
                    isCorrectOption
                      ? "bg-success/10 border-success/30"
                      : isSelected && !isCorrectOption
                      ? "bg-destructive/10 border-destructive/30"
                      : "bg-card border-border"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full border-2 font-bold text-sm shrink-0",
                      isCorrectOption
                        ? "bg-success border-success text-success-foreground"
                        : isSelected
                        ? "bg-destructive border-destructive text-destructive-foreground"
                        : "bg-background border-border text-foreground"
                    )}>
                      {option.id.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className={cn(
                        isCorrectOption && "font-semibold"
                      )}>
                        {option.text}
                      </p>
                      {isCorrectOption && (
                        <p className="text-xs text-success mt-1">✓ Resposta correta</p>
                      )}
                      {isSelected && !isCorrectOption && (
                        <p className="text-xs text-destructive mt-1">✗ Sua resposta</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Explanation */}
          {question.explanation && (
            <div className={cn(
              "rounded-xl border p-4",
              isCorrect ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30"
            )}>
              <p className="text-sm font-semibold text-foreground mb-2">Explicação:</p>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {question.explanation}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResultScreen({ 
  result, 
  answers,
  questions,
  onRestart 
}: { 
  result: SimuladoResult;
  answers: Answer[];
  questions: Question[];
  onRestart: () => void;
}) {
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const accuracyColor = result.accuracy >= 70 ? "text-success" : result.accuracy >= 50 ? "text-warning" : "text-destructive";
  
  return (
    <div className="space-y-6 animate-slide-up">
      <div className="text-center space-y-2">
        <Trophy className="h-16 w-16 text-primary mx-auto" />
        <h2 className="text-2xl font-bold text-foreground">Simulado Finalizado!</h2>
        <p className="text-muted-foreground">Confira seu desempenho</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card border border-border p-4 text-center">
          <Target className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-3xl font-bold text-foreground">{result.correct}</p>
          <p className="text-xs text-muted-foreground">Acertos</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4 text-center">
          <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-3xl font-bold text-foreground">{result.incorrect}</p>
          <p className="text-xs text-muted-foreground">Erros</p>
        </div>
      </div>

      {/* Accuracy */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Acurácia</span>
          </div>
          <span className={cn("text-2xl font-bold", accuracyColor)}>
            {result.accuracy.toFixed(1)}%
          </span>
        </div>
        <Progress value={result.accuracy} className="h-3" />
      </div>

      {/* Time and XP */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-card border border-border p-3 text-center">
          <Clock className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
          <p className="text-sm font-medium text-foreground">
            {Math.floor(result.timeSpent / 60)}min {result.timeSpent % 60}s
          </p>
        </div>
        <div className="rounded-xl bg-card border border-border p-3 text-center">
          <Trophy className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-sm font-medium text-foreground">+{result.xpEarned} XP</p>
        </div>
      </div>

      {/* Detailed Results */}
      <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
        <h3 className="font-semibold text-foreground">Resultado por Questão</h3>
        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
          {questions.map((q, index) => {
            const answer = answers.find(a => a.questionId === q.id);
            const isCorrect = answer?.isCorrect || false;
            return (
              <button
                key={q.id}
                onClick={() => setSelectedQuestion(q)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all hover:scale-[1.02]",
                  isCorrect ? "bg-success/10 border-success/20" : "bg-destructive/10 border-destructive/20"
                )}
              >
                {isCorrect ? (
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Questão {index + 1}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {q.statement.substring(0, 50)}...
                  </p>
                </div>
                <Badge variant={isCorrect ? "default" : "destructive"} className="shrink-0">
                  {isCorrect ? "Correta" : "Errada"}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onRestart}
          className="flex-1"
        >
          Novo Simulado
        </Button>
        <Button
          onClick={() => window.location.href = '/'}
          className="flex-1"
        >
          Voltar ao Início
        </Button>
      </div>

      {/* Question Detail Dialog */}
      {selectedQuestion && (
        <QuestionDetailDialog
          question={selectedQuestion}
          answer={answers.find(a => a.questionId === selectedQuestion.id)}
          isOpen={selectedQuestion !== null}
          onClose={() => setSelectedQuestion(null)}
        />
      )}
    </div>
  );
}

export default function SimuladosPage() {
  const [viewState, setViewState] = useState<ViewState>('config');
  const [config, setConfig] = useState<SimuladoConfig>({
    questionCount: 20,
    timeMinutes: 60,
    selectedTemas: [],
    selectedSubtemas: [],
  });
  const [temas, setTemas] = useState<string[]>([]);
  const [allSubtemas, setAllSubtemas] = useState<Map<string, string[]>>(new Map());
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [result, setResult] = useState<SimuladoResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [simuladosHistory, setSimuladosHistory] = useState<SimuladoRecord[]>([]);

  const questionOptions = [10, 20, 30, 50];
  const timeOptions = [30, 60, 90, 120];

  // Carregar temas
  useEffect(() => {
    async function loadTemas() {
      try {
        const temasData = await filtersService.getTemas();
        setTemas(temasData);
      } catch (err: any) {
        console.error('Erro ao carregar temas:', err);
      }
    }
    if (viewState === 'tema') {
      loadTemas();
    }
  }, [viewState]);

  // Carregar histórico de simulados
  useEffect(() => {
    if (viewState === 'config') {
      loadSimuladosHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewState]);

  // Carregar todos os subtemas quando entrar na tela de subtemas ou quando temas mudarem
  useEffect(() => {
    async function loadAllSubtemas() {
      if (viewState !== 'subtema') return;
      
      // Se nenhum tema selecionado, não precisa carregar subtemas
      if (config.selectedTemas.length === 0) {
        setAllSubtemas(new Map());
        return;
      }
      
      try {
        setIsLoading(true);
        const subtemasMap = new Map<string, string[]>();
        
        for (const tema of config.selectedTemas) {
          try {
            const subtemasData = await filtersService.getSubtemas(tema);
            subtemasMap.set(tema, subtemasData);
          } catch (err) {
            console.error(`Erro ao carregar subtemas do tema ${tema}:`, err);
            subtemasMap.set(tema, []);
          }
        }
        
        setAllSubtemas(subtemasMap);
      } catch (err: any) {
        console.error('Erro ao carregar subtemas:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadAllSubtemas();
  }, [viewState, config.selectedTemas]);

  // Timer
  useEffect(() => {
    if (viewState !== 'simulado' || timeRemaining <= 0) {
      if (timeRemaining === 0 && viewState === 'simulado' && questions.length > 0) {
        handleFinishSimulado();
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [viewState, timeRemaining]);

  // Carregar questões quando iniciar simulado
  async function handleStartSimulado() {
    try {
      setIsLoading(true);
      setError(null);

      if (!isSupabaseConfigured()) {
        setError('Supabase não configurado.');
        return;
      }

      // Buscar questões de múltiplos temas e subtemas
      let allQuestions: any[] = [];
      
      if (config.selectedTemas.length === 0) {
        // Se nenhum tema selecionado, buscar de todos
        allQuestions = await questionsService.getAll({ limit: config.questionCount * 3 });
      } else {
        // Buscar questões de cada tema/subtema selecionado
        const questionPromises: Promise<any[]>[] = [];
        
        if (config.selectedSubtemas.length === 0) {
          // Se nenhum subtema selecionado, buscar todas as questões dos temas selecionados
          for (const tema of config.selectedTemas) {
            questionPromises.push(questionsService.getAll({ tema, limit: config.questionCount * 2 }));
          }
        } else {
          // Buscar questões dos subtemas selecionados
          for (const tema of config.selectedTemas) {
            const subtemasDoTema = config.selectedSubtemas.filter(st => {
              const subtemasDoTemaAtual = allSubtemas.get(tema) || [];
              return subtemasDoTemaAtual.includes(st);
            });
            
            if (subtemasDoTema.length > 0) {
              // Buscar questões dos subtemas deste tema
              for (const subtema of subtemasDoTema) {
                questionPromises.push(questionsService.getAll({ tema, subtema, limit: config.questionCount }));
              }
            } else {
              // Se nenhum subtema deste tema foi selecionado, buscar todas as questões do tema
              questionPromises.push(questionsService.getAll({ tema, limit: config.questionCount }));
            }
          }
        }
        
        const results = await Promise.all(questionPromises);
        allQuestions = results.flat();
      }
      
      // Remover duplicatas e embaralhar
      const uniqueQuestions = Array.from(
        new Map(allQuestions.map(q => [q.id, q])).values()
      );
      const shuffled = uniqueQuestions.sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffled.slice(0, config.questionCount);

      if (selectedQuestions.length === 0) {
        setError('Nenhuma questão encontrada com os filtros selecionados.');
        return;
      }

      const adaptedQuestions = selectedQuestions.map(q => adaptQuestionFromSupabase(q));
      setQuestions(adaptedQuestions);
      setTimeRemaining(config.timeMinutes * 60);
      setStartTime(new Date());
      setCurrentIndex(0);
      setAnswers(new Map());
      setViewState('simulado');
    } catch (err: any) {
      console.error('Erro ao iniciar simulado:', err);
      setError(`Erro ao iniciar simulado: ${err?.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFinishSimulado() {
    if (!startTime || questions.length === 0) return;

    const endTime = new Date();
    const timeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    // Calcular resultados
    const answerArray: Answer[] = questions.map(q => {
      const selected = answers.get(q.id);
      const isCorrect = selected === q.correctOption;
      return {
        questionId: q.id,
        selectedOption: selected || '',
        isCorrect,
        answeredAt: new Date(),
      };
    });

    const correct = answerArray.filter(a => a.isCorrect).length;
    const incorrect = answerArray.length - correct;
    const accuracy = answerArray.length > 0 ? (correct / answerArray.length) * 100 : 0;

    // Calcular XP
    let xpEarned = 0;
    if (accuracy >= 70) {
      xpEarned = 50;
    } else if (accuracy >= 50) {
      xpEarned = 30;
    } else {
      xpEarned = 10;
    }

    const simuladoResult: SimuladoResult = {
      total: answerArray.length,
      correct,
      incorrect,
      accuracy,
      timeSpent,
      xpEarned,
    };

    // Mostrar resultado imediatamente
    setResult(simuladoResult);
    setViewState('resultado');

    // Salvar em background (não bloquear a UI)
    (async () => {
      try {
        // Salvar tentativas em paralelo
        await Promise.all(
          answerArray.map(answer =>
            attemptsService.create({
              question_id: answer.questionId,
              selected_letter: (answer.selectedOption || 'A').toUpperCase() as 'A' | 'B' | 'C' | 'D' | 'E',
              is_correct: answer.isCorrect,
            })
          )
        );

        // Adicionar XP
        await userStatsService.addXP(xpEarned);

        // Salvar simulado no banco
        await simuladosService.create({
          total_questions: answerArray.length,
          correct_answers: correct,
          incorrect_answers: incorrect,
          accuracy,
          time_spent_seconds: timeSpent,
          xp_earned: xpEarned,
          temas_selecionados: config.selectedTemas.length > 0 ? config.selectedTemas : null,
          subtemas_selecionados: config.selectedSubtemas.length > 0 ? config.selectedSubtemas : null,
        });

        // Recarregar histórico após salvar
        await loadSimuladosHistory();
      } catch (err) {
        console.error('Erro ao salvar resultados:', err);
      }
    })();
  }

  async function loadSimuladosHistory() {
    try {
      const history = await simuladosService.getUserSimulados(10);
      // Remover duplicatas baseado no ID
      const uniqueHistory = Array.from(
        new Map(history.map(s => [s.id, s])).values()
      );
      setSimuladosHistory(uniqueHistory);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    }
  }

  function handleSelectOption(questionId: string, option: string) {
    setAnswers(prev => new Map(prev).set(questionId, option));
  }

  function handleRestart() {
    setViewState('config');
    setConfig({
      questionCount: 20,
      timeMinutes: 60,
      selectedTemas: [],
      selectedSubtemas: [],
    });
    setQuestions([]);
    setAnswers(new Map());
    setResult(null);
    setCurrentIndex(0);
    setTimeRemaining(0);
    setStartTime(null);
    setAllSubtemas(new Map());
  }

  function toggleTema(tema: string) {
    setConfig(prev => ({
      ...prev,
      selectedTemas: prev.selectedTemas.includes(tema)
        ? prev.selectedTemas.filter(t => t !== tema)
        : [...prev.selectedTemas, tema],
      selectedSubtemas: prev.selectedTemas.includes(tema)
        ? prev.selectedSubtemas.filter(st => {
            const subtemasDoTema = allSubtemas.get(tema) || [];
            return !subtemasDoTema.includes(st);
          })
        : prev.selectedSubtemas,
    }));
  }

  function toggleSubtema(subtema: string) {
    setConfig(prev => ({
      ...prev,
      selectedSubtemas: prev.selectedSubtemas.includes(subtema)
        ? prev.selectedSubtemas.filter(st => st !== subtema)
        : [...prev.selectedSubtemas, subtema],
    }));
  }

  // Tela de Configuração
  if (viewState === 'config') {
  return (
    <AppLayout>
      <div className="px-4 pt-6 space-y-5 animate-slide-up">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Simulado</h1>
        </div>

        <p className="text-sm text-muted-foreground">
          Configure sua prova simulada e teste seus conhecimentos em condições reais.
        </p>

        {/* Question count */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Número de questões</label>
          <div className="grid grid-cols-4 gap-2">
            {questionOptions.map((n) => (
              <button
                key={n}
                  onClick={() => setConfig(p => ({ ...p, questionCount: n }))}
                className={cn(
                  "rounded-xl border py-2.5 text-sm font-semibold transition-all active:scale-[0.95]",
                  config.questionCount === n
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-foreground hover:border-primary/40"
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Time */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" /> Tempo (minutos)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {timeOptions.map((t) => (
              <button
                key={t}
                  onClick={() => setConfig(p => ({ ...p, timeMinutes: t }))}
                className={cn(
                  "rounded-xl border py-2.5 text-sm font-semibold transition-all active:scale-[0.95]",
                  config.timeMinutes === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-foreground hover:border-primary/40"
                )}
              >
                {t}min
              </button>
            ))}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={() => setViewState('tema')}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-4 font-bold text-primary-foreground active:scale-[0.98] transition-all"
        >
          <Play className="h-5 w-5" /> Selecionar Tema
        </button>

        {/* Info */}
        <div className="rounded-2xl bg-card border border-border p-4 text-sm text-muted-foreground space-y-1.5">
          <p className="font-medium text-foreground text-xs uppercase tracking-wider">Sobre o simulado</p>
          <p>• Cronômetro regressivo durante a prova</p>
          <p>• Navegação livre entre questões</p>
          <p>• Relatório completo ao finalizar</p>
          <p className="text-accent font-medium">+50 XP ao completar (70%+ acertos)</p>
        </div>

        {/* Histórico de Simulados */}
        {simuladosHistory.length > 0 && (
          <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Histórico de Simulados</h3>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {simuladosHistory.map((simulado) => {
                const date = new Date(simulado.created_at);
                const accuracyColor = simulado.accuracy >= 70 ? "text-success" : simulado.accuracy >= 50 ? "text-warning" : "text-destructive";
                
                return (
                  <div
                    key={simulado.id}
                    className="rounded-lg border border-border p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {date.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <Badge variant="outline" className={cn("text-xs", accuracyColor)}>
                        {simulado.accuracy.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{simulado.correct_answers}</p>
                        <p className="text-muted-foreground">Acertos</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{simulado.incorrect_answers}</p>
                        <p className="text-muted-foreground">Erros</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-foreground">
                          {Math.floor(simulado.time_spent_seconds / 60)}min
                        </p>
                        <p className="text-muted-foreground">Tempo</p>
                      </div>
                    </div>
                    <Progress 
                      value={simulado.accuracy} 
                      className={cn(
                        "h-2",
                        simulado.accuracy >= 70 ? "[&>div]:bg-success" :
                        simulado.accuracy >= 50 ? "[&>div]:bg-warning" :
                        "[&>div]:bg-destructive"
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
        </div>
      </AppLayout>
    );
  }

  // Tela de Seleção de Tema
  if (viewState === 'tema') {
    return (
      <AppLayout>
        <div className="px-4 pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setViewState('config')} className="p-2 hover:bg-muted rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-foreground">Selecione o Tema</h1>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {config.selectedTemas.length === 0 
                    ? "Nenhum tema selecionado = todos os temas"
                    : `${config.selectedTemas.length} tema(s) selecionado(s)`}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (config.selectedTemas.length === temas.length) {
                      setConfig(p => ({ ...p, selectedTemas: [] }));
                    } else {
                      setConfig(p => ({ ...p, selectedTemas: [...temas] }));
                    }
                  }}
                >
                  {config.selectedTemas.length === temas.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {temas.map((tema) => {
                  const isSelected = config.selectedTemas.includes(tema);
                  return (
                    <button
                      key={tema}
                      onClick={() => toggleTema(tema)}
                      className={cn(
                        "rounded-xl border p-4 text-left transition-all",
                        isSelected
                          ? "bg-primary/10 border-primary text-foreground"
                          : "bg-card border-border text-foreground hover:border-primary/40"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm">{tema}</p>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <Button
                onClick={() => {
                  if (config.selectedTemas.length === 0) {
                    // Se nenhum tema selecionado, pode pular para iniciar simulado
                    handleStartSimulado();
                  } else {
                    setViewState('subtema');
                  }
                }}
                className="w-full"
                disabled={isLoading}
              >
                {config.selectedTemas.length === 0 
                  ? 'Iniciar com Todos os Temas'
                  : 'Continuar para Subtemas'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  // Tela de Seleção de Subtema
  if (viewState === 'subtema') {
    return (
      <AppLayout>
        <div className="px-4 pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setViewState('tema')} className="p-2 hover:bg-muted rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-foreground">Selecione o Subtema</h1>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {config.selectedSubtemas.length === 0 
                    ? "Nenhum subtema selecionado = todos os subtemas"
                    : `${config.selectedSubtemas.length} subtema(s) selecionado(s)`}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allSubtemasList = Array.from(allSubtemas.values()).flat();
                    if (config.selectedSubtemas.length === allSubtemasList.length) {
                      setConfig(p => ({ ...p, selectedSubtemas: [] }));
                    } else {
                      setConfig(p => ({ ...p, selectedSubtemas: allSubtemasList }));
                    }
                  }}
                >
                  {config.selectedSubtemas.length === Array.from(allSubtemas.values()).flat().length 
                    ? 'Desmarcar Todos' 
                    : 'Selecionar Todos'}
                </Button>
              </div>
              
              {config.selectedTemas.length > 0 && (
                <div className="space-y-3">
                  {config.selectedTemas.map((tema) => {
                    const subtemasDoTema = allSubtemas.get(tema) || [];
                    if (subtemasDoTema.length === 0) return null;
                    
                    return (
                      <div key={tema} className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">{tema}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {subtemasDoTema.map((subtema) => {
                            const isSelected = config.selectedSubtemas.includes(subtema);
                            return (
                              <button
                                key={subtema}
                                onClick={() => toggleSubtema(subtema)}
                                className={cn(
                                  "rounded-xl border p-3 text-left transition-all text-sm",
                                  isSelected
                                    ? "bg-primary/10 border-primary text-foreground"
                                    : "bg-card border-border text-foreground hover:border-primary/40"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <p className="font-medium truncate">{subtema}</p>
                                  {isSelected && (
                                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setConfig(p => ({ ...p, selectedSubtemas: [] }));
                    handleStartSimulado();
                  }}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Pular Seleção
                </Button>
                <Button
                  onClick={handleStartSimulado}
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Iniciar Simulado
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  // Tela de Resultado
  if (viewState === 'resultado' && result) {
    return (
      <AppLayout>
        <div className="px-4 pt-6 pb-20">
          <ResultScreen
            result={result}
            answers={questions.map(q => ({
              questionId: q.id,
              selectedOption: answers.get(q.id) || '',
              isCorrect: answers.get(q.id) === q.correctOption,
              answeredAt: new Date(),
            }))}
            questions={questions}
            onRestart={handleRestart}
          />
        </div>
      </AppLayout>
    );
  }

  // Tela de Simulado
  const currentQuestion = questions[currentIndex];
  const selectedOption = currentQuestion ? answers.get(currentQuestion.id) : null;

  return (
    <AppLayout>
      <div className="px-4 pt-6 space-y-4">
        {/* Timer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className={cn(
              "h-5 w-5",
              timeRemaining < 300 ? "text-destructive animate-pulse" : "text-muted-foreground"
            )} />
            <span className={cn(
              "font-mono font-bold text-lg",
              timeRemaining < 300 ? "text-destructive" : "text-foreground"
            )}>
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFinishSimulado}
          >
            Finalizar
          </Button>
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progresso</span>
            <span>{currentIndex + 1} / {questions.length}</span>
          </div>
          <Progress value={((currentIndex + 1) / questions.length) * 100} />
        </div>

        {/* Question */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : currentQuestion ? (
          <QuestionCard
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            selectedOption={selectedOption}
            onSelect={(option) => handleSelectOption(currentQuestion.id, option)}
            onNext={() => {
              if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
              } else {
                handleFinishSimulado();
              }
            }}
            onPrevious={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            canGoNext={currentIndex < questions.length - 1}
            canGoPrevious={currentIndex > 0}
          />
        ) : null}
      </div>
    </AppLayout>
  );
}
