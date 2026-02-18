# 🔧 Correção: Persistência de Sessão e Loop de Login

## Problema
1. Ao logar pela primeira vez, funciona
2. Ao sair do PWA/site e voltar, pede para logar novamente
3. Quando tenta logar novamente, entra em loop e não loga
4. No console aparece `🔄 Auth state change event: SIGNED_IN` mas não entra
5. A sessão não está persistindo corretamente

## ✅ Correções Aplicadas

### 1. **Melhorado carregamento inicial da sessão**
- **ANTES**: `loading = false` imediatamente, sem aguardar sessão
- **AGORA**: Aguarda a sessão ser carregada antes de definir `loading = false`
- Verifica sessão diretamente do Supabase antes de buscar perfil
- Se não conseguir buscar perfil, cria user básico da sessão

### 2. **Melhorado onAuthStateChange**
- Processa `INITIAL_SESSION` corretamente (evento mais importante)
- Aguarda 150ms antes de buscar user (garante persistência)
- Se der erro ao buscar perfil, cria user básico da sessão
- Atualiza `loading` quando recebe resposta

### 3. **Melhorado ProtectedRoute**
- Aguarda 1 segundo para dar tempo da sessão ser carregada
- Não redireciona imediatamente se `loading = false` mas ainda não tem user
- Evita loop de redirecionamento

### 4. **Melhorado handleSignIn**
- Aguarda 500ms após login para garantir persistência
- Verifica se user foi atualizado antes de redirecionar
- Timeout de segurança de 2 segundos

### 5. **Adicionado listener de token refresh**
- Monitora quando o token é renovado automaticamente
- Logs para debug

## 📝 Mudanças Principais

### `src/contexts/AuthContext.tsx`
```typescript
// ANTES: loading = false imediatamente
setLoading(false);
initializedRef.current = true;

// AGORA: Aguarda sessão ser carregada
const { data: { session } } = await supabase.auth.getSession();
if (session?.user) {
  const currentUser = await authService.getCurrentUser();
  setUser(currentUser);
}
setLoading(false);
```

### `src/services/supabase/auth.ts`
```typescript
// Processa INITIAL_SESSION corretamente
if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || 
    event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED' || 
    event === 'INITIAL_SESSION') {
  // Aguarda 150ms antes de buscar user
  await new Promise(resolve => setTimeout(resolve, 150));
  const user = await authService.getCurrentUser();
  callback(user);
}
```

### `src/App.tsx`
```typescript
// ProtectedRoute agora aguarda 1 segundo
useEffect(() => {
  if (loading) {
    const timer = setTimeout(() => {
      setHasWaited(true);
    }, 1000);
    return () => clearTimeout(timer);
  }
}, [loading]);
```

## 🔍 Como Funciona Agora

### 1. **Primeira vez (Login)**
1. Usuário faz login
2. `signIn` salva sessão no localStorage
3. `onAuthStateChange` detecta `SIGNED_IN`
4. Busca dados do usuário
5. Atualiza `user` no contexto
6. `useEffect` no Login detecta user atualizado
7. Redireciona para home

### 2. **Voltar ao app (Sessão persistida)**
1. App carrega
2. `loadInitialSession` busca sessão do localStorage
3. Se encontrar sessão, busca dados do usuário
4. `onAuthStateChange` detecta `INITIAL_SESSION`
5. Atualiza `user` no contexto
6. `ProtectedRoute` aguarda 1 segundo
7. Se tem user, mostra conteúdo
8. Se não tem user, redireciona para login

### 3. **Renovação automática de token**
1. Supabase renova token automaticamente (a cada ~1 hora)
2. `onAuthStateChange` detecta `TOKEN_REFRESHED`
3. Atualiza sessão no localStorage
4. User continua logado

## ⏱️ Duração da Sessão

- **Token de acesso**: 1 hora (renovado automaticamente)
- **Refresh token**: 30 dias (padrão Supabase)
- **Sessão persiste**: Enquanto o refresh token for válido
- **Logout automático**: Apenas se:
  - Refresh token expirar (30 dias de inatividade)
  - Usuário clicar em "Sair"
  - Token for revogado manualmente

## ✅ Checklist

Após as correções, verifique:

- [ ] Login funciona na primeira vez
- [ ] Sessão persiste após fechar e reabrir app
- [ ] Não pede login novamente ao voltar
- [ ] Não entra em loop ao tentar logar novamente
- [ ] Token é renovado automaticamente
- [ ] Sessão persiste por vários dias
- [ ] Logout manual funciona corretamente

## 🐛 Se Ainda Não Funcionar

1. **Limpar tudo e testar:**
```javascript
// No console
localStorage.clear();
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
});
location.reload();
```

2. **Verificar sessão no localStorage:**
```javascript
// No console
console.log('Token:', localStorage.getItem('sb-auth-token'));
```

3. **Verificar sessão no Supabase:**
```javascript
// No console
import('@/lib/supabase').then(m => {
  m.supabase.auth.getSession().then(({ data, error }) => {
    console.log('Sessão:', data.session);
    console.log('Erro:', error);
  });
});
```

4. **Verificar logs:**
- Abrir Console (F12)
- Procurar por:
  - `✅ Sessão carregada do localStorage`
  - `🔄 Auth state change event: INITIAL_SESSION`
  - `✅ Auth state changed - User logged in`
  - `🔄 Token renovado automaticamente`

## 📝 Notas Importantes

- A sessão persiste no **localStorage** do navegador
- O Supabase renova o token **automaticamente** a cada ~1 hora
- A sessão expira apenas após **30 dias de inatividade**
- O logout manual limpa a sessão imediatamente
- O PWA mantém a sessão mesmo após fechar completamente

