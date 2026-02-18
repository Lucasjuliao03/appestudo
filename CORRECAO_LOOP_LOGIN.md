# 🔧 Correção: Loop de Login no PWA

## Problema
Após fazer login no PWA instalado, o app ficava em loop infinito, não entrava nem saía, apenas mostrava loading.

## ✅ Correções Aplicadas

### 1. **Melhorado fluxo de autenticação após login**
- Adicionado delay de 300ms após `signIn` para garantir que a sessão foi persistida
- Verificação explícita da sessão antes de redirecionar
- Uso de `window.location.href` em vez de `navigate()` para forçar reload completo e evitar problemas com service worker

### 2. **Simplificado ProtectedRoute e LoginRoute**
- Removida lógica complexa de `hasChecked`
- Timeout reduzido para 5 segundos
- Lógica mais direta: se loading → mostrar spinner, se não tem user → redirecionar login, se tem user → mostrar conteúdo

### 3. **Melhorado onAuthStateChange**
- Ignorado evento `TOKEN_REFRESHED` para evitar loops desnecessários
- Adicionado delay de 100ms antes de buscar usuário após mudança de sessão
- Adicionado flag `mounted` para evitar atualizações após desmontagem

### 4. **Ajustado Service Worker**
- Auth sempre `NetworkOnly` (nunca cache)
- Timeout aumentado para 10 segundos em requisições de auth
- Removido cache de auth que poderia causar problemas

### 5. **Melhorado signIn no AuthContext**
- Adicionado delay de 100ms após login para garantir persistência
- Adicionado delay de 100ms antes de atualizar estado
- Garantida sincronização entre sessão e estado

## 📝 Mudanças Principais

### `src/pages/Login.tsx`
```typescript
// Agora verifica sessão antes de redirecionar
const { data: { session } } = await supabase.auth.getSession();
if (session?.user) {
  window.location.href = "/"; // Força reload completo
}
```

### `src/App.tsx`
```typescript
// Lógica simplificada
if (loading && !timeoutReached) {
  return <Loader />;
}
if (!user || timeoutReached) {
  return <Navigate to="/login" />;
}
return <>{children}</>;
```

### `src/services/supabase/auth.ts`
```typescript
// Ignora TOKEN_REFRESHED para evitar loops
if (event === 'TOKEN_REFRESHED') {
  return;
}
```

## 🧪 Como Testar

1. **Limpar cache e service workers:**
```javascript
// No console do navegador
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
});
```

2. **Rebuild:**
```bash
npm run build
npm run preview
```

3. **Testar login:**
   - Abrir PWA instalado
   - Fazer login
   - Deve redirecionar para home sem loop

## ⚠️ Se Ainda Houver Problema

1. **Verificar console:**
   - Abrir DevTools (F12)
   - Verificar erros em vermelho
   - Verificar logs de autenticação

2. **Desinstalar e reinstalar PWA:**
   - Desinstalar completamente
   - Limpar cache do navegador
   - Reinstalar

3. **Testar sem PWA:**
   - Abrir no navegador normal
   - Se funcionar, problema é específico do PWA
   - Se não funcionar, problema é no código

4. **Verificar service worker:**
   - Application > Service Workers
   - Verificar se há erros
   - Desregistrar se necessário

## 🔍 Debug

### Verificar Sessão
```javascript
// No console
import('@/lib/supabase').then(m => {
  m.supabase.auth.getSession().then(({ data }) => {
    console.log('Sessão:', data.session);
  });
});
```

### Verificar Estado do Auth
```javascript
// No console (após login)
// Verificar se user está definido no AuthContext
```

## ✅ Checklist

Após as correções, verifique:

- [ ] Login funciona sem loop
- [ ] Redireciona para home após login
- [ ] Sessão persiste entre aberturas
- [ ] Não há erros no console
- [ ] Service worker não interfere
- [ ] Funciona tanto no navegador quanto no PWA

