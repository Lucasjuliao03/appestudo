import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Layers, RotateCcw, X, Check, HelpCircle, Loader2, ChevronLeft, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { questionsService, subjectsService } from "@/services/supabase";
import { filtersService } from "@/services/supabase/filters";
import { isSupabaseConfigured } from "@/lib/supabase";
import { userStatsService } from "@/services/supabase/userStats";

type ViewState = 'tema' | 'subtema' | 'flashcards';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  tema: string;
  subtema: string | null;
  subjectName?: string;
}

function FlashcardViewer({ 
  card, 
  onRate 
}: {
  card: Flashcard;
  onRate: (rating: "wrong" | "almost" | "correct") => void;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center gap-2">
        {card.subjectName && (
        <Badge variant="outline" className="text-xs border-primary/30 text-primary">
            {card.subjectName}
        </Badge>
        )}
        <Badge variant="outline" className="text-xs border-border text-muted-foreground">
          {card.tema}
        </Badge>
        {card.subtema && (
          <Badge variant="outline" className="text-xs border-border text-muted-foreground">
            {card.subtema}
          </Badge>
        )}
      </div>

      {/* Card */}
      <button
        onClick={() => setFlipped(!flipped)}
        className="w-full min-h-[280px] rounded-2xl border border-border bg-card p-6 text-left transition-all active:scale-[0.98] relative overflow-hidden"
      >
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {flipped ? "VERSO" : "FRENTE"} · toque para virar
          </span>
        </div>

        {!flipped ? (
          <div className="flex items-center justify-center h-full pt-4">
            <p className="text-base font-medium text-foreground leading-relaxed text-center">
              {card.front}
            </p>
          </div>
        ) : (
          <div className="pt-4 animate-flip-in">
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
              {card.back}
            </p>
          </div>
        )}
      </button>

      {/* Rating */}
      {flipped ? (
        <div className="space-y-2 animate-slide-up">
          <p className="text-xs text-center text-muted-foreground">Como foi?</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                setFlipped(false);
                onRate("wrong");
              }}
              className="flex flex-col items-center gap-1.5 rounded-xl bg-destructive/10 border border-destructive/20 py-3 active:scale-[0.95] transition-all"
            >
              <X className="h-5 w-5 text-destructive" />
              <span className="text-xs font-medium text-destructive">Errei</span>
            </button>
            <button
              onClick={() => {
                setFlipped(false);
                onRate("almost");
              }}
              className="flex flex-col items-center gap-1.5 rounded-xl bg-warning/10 border border-warning/20 py-3 active:scale-[0.95] transition-all"
            >
              <HelpCircle className="h-5 w-5 text-warning" />
              <span className="text-xs font-medium text-warning">Quase</span>
            </button>
            <button
              onClick={() => {
                setFlipped(false);
                onRate("correct");
              }}
              className="flex flex-col items-center gap-1.5 rounded-xl bg-success/10 border border-success/20 py-3 active:scale-[0.95] transition-all"
            >
              <Check className="h-5 w-5 text-success" />
              <span className="text-xs font-medium text-success">Acertei</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setFlipped(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-semibold text-sm text-primary-foreground active:scale-[0.98] transition-all"
        >
          <RotateCcw className="h-4 w-4" /> Revelar Resposta
        </button>
      )}
    </div>
  );
}

export default function FlashcardsPage() {
  const [viewState, setViewState] = useState<ViewState>('tema');
  const [selectedTema, setSelectedTema] = useState<string | null>(null);
  const [selectedSubtema, setSelectedSubtema] = useState<string | null>(null);
  const [temas, setTemas] = useState<string[]>([]);
  const [subtemas, setSubtemas] = useState<string[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
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
    async function loadFlashcards() {
      if (!selectedTema) return;

      try {
        setIsLoading(true);
        const filters: any = { tema: selectedTema };
        if (selectedSubtema) {
          filters.subtema = selectedSubtema;
        }

        // Buscar questões e converter em flashcards
        const questionsData = await questionsService.getAll({ ...filters, limit: 100 });
        
        // Converter questões em flashcards (statement = front, explanation = back)
        const cards: Flashcard[] = questionsData
          .filter(q => q.explanation && q.explanation.trim() !== '') // Apenas questões com explicação
          .map(q => ({
            id: q.id,
            front: q.statement,
            back: q.explanation || '',
            tema: q.tema,
            subtema: q.subtema,
            subjectName: subjects.get(q.subject_id),
          }));

        setFlashcards(cards);
        setCurrentIndex(0);

        if (cards.length === 0) {
          setError('Nenhum flashcard encontrado para os filtros selecionados. Certifique-se de que as questões têm explicações.');
        }
      } catch (err: any) {
        console.error('Erro ao carregar flashcards:', err);
        setError(`Erro ao carregar flashcards: ${err?.message || 'Erro desconhecido'}`);
      } finally {
        setIsLoading(false);
      }
    }

    if (viewState === 'flashcards' && selectedTema) {
      loadFlashcards();
    }
  }, [viewState, selectedTema, selectedSubtema, subjects]);

  const handleTemaSelect = (tema: string) => {
    setSelectedTema(tema);
    setSelectedSubtema(null);
    setViewState('subtema');
  };

  const handleSubtemaSelect = (subtema: string | null) => {
    setSelectedSubtema(subtema);
    setViewState('flashcards');
  };

  const handleBack = () => {
    if (viewState === 'flashcards') {
      setViewState('subtema');
      setSelectedSubtema(null);
    } else if (viewState === 'subtema') {
      setViewState('tema');
      setSelectedTema(null);
    }
  };

  const handleRate = async (rating: "wrong" | "almost" | "correct") => {
    // Adicionar XP baseado na avaliação
    try {
      if (rating === "correct") {
        await userStatsService.addXP(5);
      } else if (rating === "almost") {
        await userStatsService.addXP(2);
      }
    } catch (error) {
      console.error('Erro ao salvar XP:', error);
    }

    // Próximo card
    if (flashcards.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % flashcards.length);
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
            <Layers className="h-5 w-5 text-accent" />
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
                <ChevronLeft className="h-4 w-4 text-muted-foreground float-right -mt-5 rotate-180" />
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
            <Layers className="h-5 w-5 text-accent" />
            <h1 className="text-xl font-bold text-foreground">Selecione o Subtema</h1>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleSubtemaSelect(null)}
              className="w-full rounded-xl bg-card border border-border p-4 text-left hover:border-primary/40 transition-all active:scale-[0.98]"
            >
              <p className="font-medium text-foreground">Todos os subtemas</p>
              <ChevronLeft className="h-4 w-4 text-muted-foreground float-right -mt-5 rotate-180" />
            </button>
            {subtemas.map((subtema) => (
              <button
                key={subtema}
                onClick={() => handleSubtemaSelect(subtema)}
                className="w-full rounded-xl bg-card border border-border p-4 text-left hover:border-primary/40 transition-all active:scale-[0.98]"
              >
                <p className="font-medium text-foreground">{subtema}</p>
                <ChevronLeft className="h-4 w-4 text-muted-foreground float-right -mt-5 rotate-180" />
              </button>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  // Tela de Flashcards
  if (isLoading) {
    return (
      <AppLayout>
        <div className="px-4 pt-6 space-y-4 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando flashcards...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (flashcards.length === 0) {
    return (
      <AppLayout>
        <div className="px-4 pt-6 space-y-4">
          <button onClick={handleBack} className="flex items-center gap-2 text-sm text-muted-foreground">
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </button>
          <div className="rounded-xl bg-card border border-border p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum flashcard disponível para os filtros selecionados.
              <br />
              Certifique-se de que as questões têm explicações.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={handleBack} className="p-1 hover:bg-muted rounded-lg">
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <Layers className="h-5 w-5 text-accent" />
            <h1 className="text-xl font-bold text-foreground">Flashcards</h1>
          </div>
          <span className="text-xs text-muted-foreground">
            {currentIndex + 1} / {flashcards.length}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="text-accent font-medium">+5 XP por acerto</span>
          <span>·</span>
          <span>Tema: {selectedTema}</span>
          {selectedSubtema && <span> · Subtema: {selectedSubtema}</span>}
        </div>

        <FlashcardViewer
          key={flashcards[currentIndex].id}
          card={flashcards[currentIndex]}
          onRate={handleRate}
        />
      </div>
    </AppLayout>
  );
}
