import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { userSettingsService, UserSettings } from "@/services/supabase/userSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Settings, Save, ChevronLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [dailyQuestionsTarget, setDailyQuestionsTarget] = useState(10);
  const [dailyFlashcardsTarget, setDailyFlashcardsTarget] = useState(10);

  useEffect(() => {
    async function loadSettings() {
      try {
        setIsLoading(true);
        const userSettings = await userSettingsService.get();
        
        if (userSettings) {
          setSettings(userSettings);
          setDisplayName(userSettings.display_name || "");
          setDailyQuestionsTarget(userSettings.daily_questions_target);
          setDailyFlashcardsTarget(userSettings.daily_flashcards_target);
        } else {
          // Criar configurações padrão
          const newSettings = await userSettingsService.create();
          if (newSettings) {
            setSettings(newSettings);
            setDisplayName(newSettings.display_name || "");
            setDailyQuestionsTarget(newSettings.daily_questions_target);
            setDailyFlashcardsTarget(newSettings.daily_flashcards_target);
          }
        }
      } catch (err: any) {
        console.error('Erro ao carregar configurações:', err);
        setError('Erro ao carregar configurações. A tabela user_settings pode não existir.');
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      loadSettings();
    }
  }, [user]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const updated = await userSettingsService.update({
        display_name: displayName.trim() || null,
        daily_questions_target: dailyQuestionsTarget,
        daily_flashcards_target: dailyFlashcardsTarget,
      });

      if (updated) {
        setSettings(updated);
        toast.success("Configurações salvas com sucesso!");
      } else {
        throw new Error("Erro ao salvar configurações");
      }
    } catch (err: any) {
      console.error('Erro ao salvar configurações:', err);
      setError(err.message || 'Erro ao salvar configurações');
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="px-4 pt-6 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando configurações...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 pt-6 space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/perfil")} className="p-1 hover:bg-muted rounded-lg">
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <Settings className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Configurações</h1>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
            <p className="text-xs mt-2">
              Execute o script CRIAR_TABELA_USER_SETTINGS.sql no Supabase para criar a tabela.
            </p>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>Personalize suas informações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Nome de Exibição</Label>
              <Input
                id="displayName"
                type="text"
                placeholder={user?.email || "Seu nome"}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                Este nome será exibido no seu perfil
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metas Diárias</CardTitle>
            <CardDescription>Defina suas metas de estudo diárias</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="questionsTarget">Questões por Dia</Label>
              <Input
                id="questionsTarget"
                type="number"
                min="1"
                max="100"
                value={dailyQuestionsTarget}
                onChange={(e) => setDailyQuestionsTarget(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <p className="text-xs text-muted-foreground">
                Meta de questões a responder por dia
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="flashcardsTarget">Flashcards por Dia</Label>
              <Input
                id="flashcardsTarget"
                type="number"
                min="1"
                max="100"
                value={dailyFlashcardsTarget}
                onChange={(e) => setDailyFlashcardsTarget(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <p className="text-xs text-muted-foreground">
                Meta de flashcards a revisar por dia
              </p>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full"
          size="lg"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </AppLayout>
  );
}

