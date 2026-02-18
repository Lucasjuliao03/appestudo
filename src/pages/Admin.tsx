import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { adminService, UserProfile } from "@/services/supabase/admin";
import { authService } from "@/services/supabase/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Shield, ShieldCheck, ShieldOff, UserCheck, UserX, AlertCircle, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/login");
        return;
      }
      if (!isAdmin) {
        navigate("/");
        return;
      }
      loadUsers();
    }
  }, [user, isAdmin, authLoading, navigate]);

  async function loadUsers() {
    try {
      setIsLoading(true);
      setError(null);
      const usersList = await adminService.getAllUsers();
      setUsers(usersList);
    } catch (err: any) {
      console.error('Erro ao carregar usuários:', err);
      setError(err.message || 'Erro ao carregar lista de usuários. Verifique se a função get_all_users_with_profiles foi criada.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateUser() {
    if (!newUserEmail || !newUserPassword) {
      toast.error("Preencha email e senha");
      return;
    }

    if (newUserPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    // Salvar credenciais do admin atual para fazer login novamente
    const currentAdminEmail = user?.email;
    const currentAdminPassword = ''; // Não temos a senha, mas vamos tentar manter a sessão

    try {
      setIsCreating(true);
      
      // Criar usuário via signUp
      // Nota: Em produção, isso deveria ser feito via backend com service role
      const { data, error } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        const newUserId = data.user.id;
        
        // Criar perfil para o novo usuário ANTES de fazer logout
        // Neste momento ainda estamos autenticados como o novo usuário (signUp faz login automático)
        try {
          await supabase
            .from('user_profiles')
            .insert({
              user_id: newUserId,
              is_admin: false,
              is_active: true,
            });
          console.log('✅ Perfil criado para o novo usuário');
        } catch (profileError: any) {
          // Se já existir (criado pelo trigger), tudo bem
          if (profileError.code !== '23505') { // 23505 = unique_violation
            console.warn('Aviso ao criar perfil (pode já existir):', profileError);
          }
        }
        
        // IMPORTANTE: Fazer logout imediatamente para não ficar logado como o novo usuário
        // O Supabase faz login automaticamente após signUp, precisamos reverter isso
        await supabase.auth.signOut();
        
        toast.success("Usuário criado com sucesso! Faça login novamente como administrador.");
        
        // Redirecionar para login após um delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        
        return; // Sair da função aqui
      } else {
        toast.success("Solicitação de criação enviada. Verifique o email do usuário ou confirme manualmente via SQL.");
      }

      setNewUserEmail("");
      setNewUserPassword("");
      setShowCreateUser(false);
      await loadUsers();
    } catch (err: any) {
      console.error('Erro ao criar usuário:', err);
      
      // Mensagens de erro mais amigáveis
      let errorMessage = "Erro ao criar usuário";
      
      if (err.message) {
        if (err.message.includes('rate limit') || err.message.includes('rate_limit')) {
          errorMessage = "Limite de criação de usuários excedido. Aguarde alguns minutos ou desabilite a confirmação de email no Supabase (Authentication > Settings).";
        } else if (err.message.includes('already registered') || err.message.includes('already exists') || err.message.includes('User already registered')) {
          errorMessage = "Este email já está cadastrado.";
        } else if (err.message.includes('invalid email') || err.message.includes('Invalid email')) {
          errorMessage = "Email inválido. Verifique o formato do email.";
        } else if (err.message.includes('Password')) {
          errorMessage = "Senha inválida. A senha deve ter no mínimo 6 caracteres.";
        } else {
          errorMessage = err.message;
        }
      }
      
      toast.error(errorMessage, {
        duration: 5000,
      });
    } finally {
      setIsCreating(false);
    }
  }

  async function handleAuthorize(userId: string) {
    try {
      setUpdating(userId);
      await adminService.authorizeUser(userId);
      toast.success("Usuário autorizado!");
      await loadUsers();
    } catch (err: any) {
      console.error('Erro ao autorizar usuário:', err);
      toast.error(err.message || 'Erro ao autorizar usuário');
    } finally {
      setUpdating(null);
    }
  }

  async function handleBlock(userId: string) {
    try {
      setUpdating(userId);
      await adminService.blockUser(userId);
      toast.success("Usuário bloqueado!");
      await loadUsers();
    } catch (err: any) {
      console.error('Erro ao bloquear usuário:', err);
      toast.error(err.message || 'Erro ao bloquear usuário');
    } finally {
      setUpdating(null);
    }
  }

  async function handleMakeAdmin(userId: string) {
    try {
      setUpdating(userId);
      await adminService.makeAdmin(userId);
      toast.success("Usuário promovido a administrador!");
      await loadUsers();
    } catch (err: any) {
      console.error('Erro ao tornar admin:', err);
      toast.error(err.message || 'Erro ao tornar usuário admin');
    } finally {
      setUpdating(null);
    }
  }

  async function handleRemoveAdmin(userId: string) {
    try {
      setUpdating(userId);
      await adminService.removeAdmin(userId);
      toast.success("Permissões de admin removidas!");
      await loadUsers();
    } catch (err: any) {
      console.error('Erro ao remover admin:', err);
      toast.error(err.message || 'Erro ao remover permissões de admin');
    } finally {
      setUpdating(null);
    }
  }

  if (authLoading || isLoading) {
    return (
      <AppLayout>
        <div className="px-4 pt-6 flex items-center justify-center min-h-[60vh]">
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
      <div className="px-4 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Painel Administrativo
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie usuários e permissões do sistema
            </p>
          </div>
          <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Crie uma nova conta de usuário no sistema
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newEmail">Email</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    placeholder="usuario@exemplo.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    minLength={6}
                  />
                </div>
                <Button
                  onClick={handleCreateUser}
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Criar Usuário
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Usuários do Sistema</CardTitle>
            <CardDescription>
              {users.length} usuário(s) cadastrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum usuário encontrado
                </p>
              ) : (
                users.map((userProfile) => {
                  const isUpdating = updating === userProfile.user_id;
                  const isCurrentUser = user?.id === userProfile.user_id;

                  return (
                    <div
                      key={userProfile.user_id}
                      className={cn(
                        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border transition-colors",
                        isCurrentUser && "bg-primary/5 border-primary/20"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <p className="font-semibold text-foreground text-sm break-words">{userProfile.email}</p>
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-xs shrink-0">Você</Badge>
                          )}
                          {userProfile.is_admin && (
                            <Badge className="bg-primary text-primary-foreground text-xs shrink-0">
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                          {!userProfile.is_active && (
                            <Badge variant="destructive" className="text-xs shrink-0">
                              <ShieldOff className="h-3 w-3 mr-1" />
                              Bloqueado
                            </Badge>
                          )}
                          {userProfile.is_active && !userProfile.is_admin && (
                            <Badge variant="outline" className="text-success border-success text-xs shrink-0">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Ativo
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Cadastrado em {new Date(userProfile.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {!userProfile.is_admin && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMakeAdmin(userProfile.user_id)}
                            disabled={isUpdating || isCurrentUser}
                          >
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <ShieldCheck className="h-4 w-4 mr-1" />
                                Tornar Admin
                              </>
                            )}
                          </Button>
                        )}

                        {userProfile.is_admin && !isCurrentUser && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveAdmin(userProfile.user_id)}
                            disabled={isUpdating}
                          >
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <ShieldOff className="h-4 w-4 mr-1" />
                                Remover Admin
                              </>
                            )}
                          </Button>
                        )}

                        {userProfile.is_active ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleBlock(userProfile.user_id)}
                            disabled={isUpdating || isCurrentUser}
                          >
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <UserX className="h-4 w-4 mr-1" />
                                Bloquear
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleAuthorize(userProfile.user_id)}
                            disabled={isUpdating}
                          >
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-1" />
                                Autorizar
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
