# 🔧 Correção: LockManager Timeout e Ícones 404

## Problemas Identificados

1. **Navigator LockManager timeout** - Múltiplas tentativas simultâneas de acessar localStorage causavam timeout
2. **Timeout ao carregar sessão** - O timeout de 5 segundos estava sendo atingido
3. **Ícones 404** - Ícones que não existem no diretório public estavam no manifest

## ✅ Correções Aplicadas

### 1. **Simplificado carregamento de sessão**
- **ANTES**: Múltiplas tentativas (até 3x) com delays e retries
- **AGORA**: Uma única chamada simples, sem retries
- Removido timeout que causava erro
- O `onAuthStateChange` cuida de tentar novamente se necessário

### 2. **Melhorado getCurrentUser**
- **ANTES**: Podia fazer múltiplas chamadas simultâneas
- **AGORA**: Uma única chamada com try/catch
- Retorna `null` silenciosamente em caso de erro (incluindo LockManager timeout)
- O `onAuthStateChange` vai tentar novamente quando a sessão estiver disponível

### 3. **Removidos ícones inexistentes**
- Removidos do manifest: `icon-128x128.png`, `icon-152x152.png`, `icon-384x384.png`
- Mantidos apenas os que existem: `icon-72x72.png`, `icon-96x96.png`, `icon-144x144.png`, `icon-192x192.png`, `icon-512x512.png`

## 📝 Mudanças Principais

### `src/contexts/AuthContext.tsx`
```typescript
// ANTES: Múltiplas tentativas com retries
async function loadInitialSession() {
  let attempts = 0;
  while (!session && attempts < maxAttempts) {
    // ... múltiplas tentativas
  }
}

// AGORA: Uma única chamada simples
async function loadInitialSession() {
  const currentUser = await authService.getCurrentUser();
  setUser(currentUser);
}
```

### `src/services/supabase/auth.ts`
```typescript
// ANTES: Sem tratamento de erro adequado
async getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  // ...
}

// AGORA: Com try/catch e tratamento de LockManager timeout
async getCurrentUser() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) {
      return null;
    }
    // ... resto do código
  } catch (error: any) {
    // Retorna null silenciosamente - onAuthStateChange vai tentar novamente
    return null;
  }
}
```

### `public/manifest.json` e `vite.config.ts`
- Removidos ícones que não existem
- Mantidos apenas os ícones disponíveis

## 🧪 Como Testar

1. **Limpar cache:**
```javascript
// No console
localStorage.clear();
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
});
location.reload();
```

2. **Fazer login:**
   - Deve funcionar sem timeout
   - Não deve aparecer erro de LockManager

3. **Fechar e reabrir:**
   - Sessão deve persistir
   - Não deve dar timeout

4. **Verificar ícones:**
   - Não deve aparecer erro 404 de ícones
   - PWA deve instalar corretamente

## 🔍 Debug

### Verificar se LockManager timeout foi resolvido
- Abrir Console (F12)
- Não deve aparecer: `Acquiring an exclusive Navigator LockManager lock "lock:sb-auth-token" timed out`
- Não deve aparecer: `Timeout ao carregar sessão`

### Verificar ícones
- Abrir Console (F12)
- Não deve aparecer: `Failed to load resource: the server responded with a status of 404`
- Não deve aparecer: `Error while trying to use the following icon from the Manifest`

## ⚠️ Por que isso resolve?

1. **LockManager timeout acontece quando:**
   - Múltiplas chamadas simultâneas a `getSession()`
   - Retries muito rápidos
   - Acesso concorrente ao localStorage

2. **Solução:**
   - Uma única chamada por vez
   - Sem retries manuais
   - Deixar o Supabase gerenciar a sessão internamente
   - `onAuthStateChange` cuida de atualizações automáticas

3. **Ícones 404:**
   - Manifest listava ícones que não existiam
   - Removidos do manifest e do vite.config

## ✅ Checklist

Após as correções, verifique:

- [ ] Não há erro de LockManager timeout
- [ ] Não há erro de timeout ao carregar sessão
- [ ] Login funciona normalmente
- [ ] Sessão persiste após fechar e reabrir
- [ ] Não há erros 404 de ícones
- [ ] PWA instala corretamente
- [ ] Console não mostra erros relacionados

