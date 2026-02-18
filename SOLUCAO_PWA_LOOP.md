# 🔧 Solução: PWA em Loop

## Problema
O PWA instalado fica em loop, não abre o app, apenas mostra o ícone carregando.

## ✅ Correções Aplicadas

### 1. Removido registro duplo do Service Worker
- Removido registro manual no `main.tsx`
- Deixado apenas o registro automático do `vite-plugin-pwa`

### 2. Ajustado cache do Service Worker
- Auth sempre da rede (NetworkOnly) - nunca cache
- Adicionado `navigateFallback` para SPA
- Adicionado `skipWaiting` e `clientsClaim` para atualização imediata

### 3. Adicionado timeout no loading
- Timeout de 10 segundos para evitar loading infinito
- Redireciona para login se timeout atingido

### 4. Melhorado manifest
- Adicionado `scope: "/"` explicitamente
- Adicionado `prefer_related_applications: false`

## 🛠️ Como Resolver o Problema

### Passo 1: Desregistrar Service Workers Antigos

1. Abra o app no navegador (não como PWA)
2. Abra o Console (F12)
3. Execute:
```javascript
// Desregistrar todos os service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
  console.log('Service Workers desregistrados');
});
```

Ou use a função helper:
```javascript
window.unregisterAllSW()
```

### Passo 2: Limpar Cache

1. No Console, vá em **Application** > **Storage**
2. Clique em **Clear site data**
3. Ou limpe manualmente:
   - **Application** > **Cache Storage** > Delete all
   - **Application** > **Service Workers** > Unregister

### Passo 3: Rebuild e Reinstalar

```bash
# Limpar build anterior
rm -rf dist
rm -rf node_modules/.vite

# Rebuild
npm run build

# Testar localmente
npm run preview
```

### Passo 4: Reinstalar PWA

1. Desinstale o PWA antigo:
   - Android: Configurações > Apps > Estudo Cho > Desinstalar
   - iOS: Remova da tela inicial
   - Desktop: Desinstale pelo navegador

2. Acesse o site novamente
3. Instale o PWA novamente

## 🔍 Debug

### Verificar Service Worker

No Console do navegador:
```javascript
// Ver status
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('SWs:', regs);
  regs.forEach(reg => {
    console.log('Scope:', reg.scope);
    console.log('Active:', reg.active);
  });
});
```

### Verificar Manifest

No Console:
```javascript
// Ver manifest
navigator.getInstalledRelatedApps().then(apps => {
  console.log('Apps instalados:', apps);
});
```

### Verificar Erros

1. Abra DevTools (F12)
2. Vá em **Application** > **Service Workers**
3. Verifique se há erros
4. Vá em **Console** e veja erros em vermelho

## ⚠️ Problemas Comuns

### 1. Service Worker em Loop

**Sintoma:** App fica carregando infinitamente

**Solução:**
- Desregistre todos os SWs (veja Passo 1)
- Limpe cache
- Rebuild e reinstale

### 2. App não abre

**Sintoma:** Clica no ícone mas não abre

**Solução:**
- Verifique se o `start_url` no manifest está correto (`/`)
- Verifique se há erros no Console
- Tente abrir pelo navegador primeiro

### 3. Erro 404 ao abrir PWA

**Sintoma:** Abre mas mostra erro 404

**Solução:**
- Verifique se `navigateFallback` está configurado
- Verifique se o build gerou `dist/index.html`

### 4. Cache antigo

**Sintoma:** Mudanças não aparecem

**Solução:**
- Limpe cache do Service Worker
- Force atualização: `skipWaiting: true` já está configurado
- Desinstale e reinstale o PWA

## 📱 Testar PWA

### Desktop (Chrome/Edge)

1. Abra o site
2. Clique no ícone de instalação na barra de endereço
3. Ou: Menu > Instalar app

### Android

1. Abra no Chrome
2. Menu (3 pontos) > Adicionar à tela inicial
3. Ou: Menu > Instalar app

### iOS

1. Abra no Safari
2. Compartilhar > Adicionar à Tela de Início

## ✅ Checklist

Após as correções, verifique:

- [ ] Service Worker registrado corretamente (1 apenas)
- [ ] Manifest carregando sem erros
- [ ] App abre normalmente quando instalado
- [ ] Não há loops de redirecionamento
- [ ] Login funciona corretamente
- [ ] Sessão persiste entre aberturas
- [ ] Não há erros no Console

## 🚨 Se Ainda Não Funcionar

1. **Desabilite Service Worker temporariamente:**
   - No `vite.config.ts`, mude `registerType: "autoUpdate"` para `registerType: null`
   - Rebuild e teste

2. **Teste sem PWA:**
   - Acesse pelo navegador normal
   - Se funcionar, o problema é no PWA
   - Se não funcionar, o problema é no código

3. **Verifique logs:**
   - Console do navegador
   - Network tab (F12 > Network)
   - Application > Service Workers

4. **Teste em modo incógnito:**
   - Abra em janela anônima
   - Instale o PWA
   - Veja se funciona

