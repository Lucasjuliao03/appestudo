# 🚀 Guia Completo: Deploy no Render

Este guia vai te ajudar a fazer o deploy da aplicação no Render passo a passo.

## 📋 Pré-requisitos

1. Conta no Render (gratuita): https://render.com
2. Conta no Supabase (já configurada)
3. Git instalado no seu computador
4. Repositório Git (GitHub, GitLab ou Bitbucket)

---

## 📝 Passo 1: Preparar o Projeto

### 1.1 Verificar arquivos necessários

Certifique-se de que os seguintes arquivos existem:

- ✅ `package.json`
- ✅ `vite.config.ts`
- ✅ `.env.example` (opcional, mas recomendado)

### 1.2 Criar arquivo `.env.example` (se não existir)

Crie um arquivo `.env.example` na raiz do projeto com:

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**⚠️ IMPORTANTE:** NUNCA commite o arquivo `.env` com valores reais no Git!

### 1.3 Verificar scripts no package.json

Seu `package.json` deve ter os scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 1.4 Criar arquivo `render.yaml` (Opcional, mas recomendado)

Crie um arquivo `render.yaml` na raiz do projeto:

```yaml
services:
  - type: web
    name: appestudocho
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    envVars:
      - key: VITE_SUPABASE_URL
        sync: false
      - key: VITE_SUPABASE_ANON_KEY
        sync: false
```

---

## 📝 Passo 2: Preparar o Repositório Git

### 2.1 Inicializar Git (se ainda não tiver)

```bash
git init
git add .
git commit -m "Initial commit"
```

### 2.2 Criar repositório no GitHub/GitLab/Bitbucket

1. Acesse GitHub: https://github.com
2. Clique em "New repository"
3. Dê um nome (ex: `appestudocho`)
4. **NÃO** marque "Initialize with README"
5. Clique em "Create repository"

### 2.3 Conectar repositório local ao remoto

```bash
git remote add origin https://github.com/Lucasjuliao03/appestudo.git
git branch -M main
git push -u origin main
```

---

## 📝 Passo 3: Configurar no Render

### 3.1 Criar conta no Render

1. Acesse: https://render.com
2. Clique em "Get Started for Free"
3. Faça login com GitHub/GitLab/Bitbucket

### 3.2 Criar novo serviço

1. No dashboard do Render, clique em **"New +"**
2. Selecione **"Static Site"** (para aplicações React/Vite)

### 3.3 Conectar repositório

1. **Connect Repository:**
   - Selecione seu provedor (GitHub/GitLab/Bitbucket)
   - Autorize o Render a acessar seus repositórios
   - Selecione o repositório `appestudocho`

2. **Configure o serviço:**
   - **Name:** `appestudocho` (ou o nome que preferir)
   - **Branch:** `main` (ou `master`)
   - **Root Directory:** (deixe vazio, ou `.` se necessário)
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

### 3.4 Configurar variáveis de ambiente

1. Na seção **"Environment Variables"**, clique em **"Add Environment Variable"**

2. Adicione as seguintes variáveis:

   ```
   VITE_SUPABASE_URL = https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY = sua-chave-anon-aqui
   ```

   **⚠️ IMPORTANTE:**
   - Use os valores do seu arquivo `.env` local
   - Não use espaços antes ou depois do `=`
   - Os valores são sensíveis, mantenha-os seguros

### 3.5 Configurar plano

1. Selecione **"Free"** (plano gratuito)
2. O plano gratuito tem algumas limitações:
   - Site pode "dormir" após 15 minutos de inatividade
   - Pode levar alguns segundos para "acordar"
   - Para produção, considere o plano pago

### 3.6 Criar serviço

1. Clique em **"Create Static Site"**
2. O Render vai começar a fazer o build automaticamente

---

## 📝 Passo 4: Acompanhar o Deploy

### 4.1 Logs do Build

1. Na página do serviço, você verá os logs do build
2. Aguarde o build completar (pode levar 2-5 minutos na primeira vez)

### 4.2 Verificar erros

Se houver erros, verifique:

- ✅ Variáveis de ambiente estão configuradas corretamente?
- ✅ Build command está correto?
- ✅ Publish directory está correto (`dist`)?
- ✅ Dependências estão no `package.json`?

### 4.3 URL do site

Após o build bem-sucedido, você terá uma URL como:
```
https://appestudocho.onrender.com
```

---

## 📝 Passo 5: Configurar Domínio Personalizado (Opcional)

### 5.1 Adicionar domínio

1. No dashboard do serviço, vá em **"Settings"**
2. Role até **"Custom Domains"**
3. Clique em **"Add Custom Domain"**
4. Digite seu domínio (ex: `app.seudominio.com`)
5. Siga as instruções para configurar DNS

### 5.2 Configurar DNS

No seu provedor de domínio, adicione um registro CNAME:

```
Tipo: CNAME
Nome: app (ou @ para domínio raiz)
Valor: appestudocho.onrender.com
```

---

## 🔧 Troubleshooting (Solução de Problemas)

### Problema 1: Build falha

**Erro:** `Command 'npm run build' exited with code 1`

**Solução:**
- Verifique se todas as dependências estão no `package.json`
- Teste o build localmente: `npm run build`
- Verifique os logs de erro no Render

### Problema 2: Variáveis de ambiente não funcionam

**Erro:** `VITE_SUPABASE_URL is not defined`

**Solução:**
- Verifique se as variáveis começam com `VITE_`
- Reinicie o serviço após adicionar variáveis
- Verifique se não há espaços extras nos valores

### Problema 3: Site não carrega

**Solução:**
- Verifique se o `Publish Directory` está como `dist`
- Verifique os logs de erro no console do navegador
- Verifique se o Supabase está configurado corretamente

### Problema 4: Site "dorme" após inatividade

**Solução:**
- Isso é normal no plano gratuito
- O site "acorda" automaticamente quando alguém acessa
- Para evitar isso, use o plano pago ou configure um "ping" periódico

---

## 🔄 Atualizações Futuras

### Como fazer deploy de atualizações

1. Faça suas alterações no código
2. Commit e push para o repositório:

```bash
git add .
git commit -m "Descrição das alterações"
git push origin main
```

3. O Render detecta automaticamente e faz novo deploy
4. Aguarde o build completar (geralmente 2-5 minutos)

---

## 📊 Monitoramento

### Ver logs em tempo real

1. No dashboard do serviço, clique em **"Logs"**
2. Você verá logs de:
   - Build
   - Deploy
   - Erros (se houver)

### Métricas

No plano gratuito, você tem acesso limitado a métricas. No plano pago, você tem:
- Uptime
- Response time
- Bandwidth usage

---

## ✅ Checklist Final

Antes de considerar o deploy completo, verifique:

- [ ] Repositório Git configurado e código commitado
- [ ] Render conectado ao repositório
- [ ] Build command configurado: `npm install && npm run build`
- [ ] Publish directory configurado: `dist`
- [ ] Variáveis de ambiente configuradas:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] Build completou com sucesso
- [ ] Site está acessível na URL fornecida
- [ ] Testou login e funcionalidades principais

---

## 🎉 Pronto!

Seu sistema está no ar! Compartilhe a URL com seus usuários.

**URL do exemplo:** `https://appestudocho.onrender.com`

---

## 📞 Suporte

Se tiver problemas:

1. Verifique os logs no Render
2. Verifique o console do navegador (F12)
3. Verifique se o Supabase está funcionando
4. Consulte a documentação do Render: https://render.com/docs

---

## 💡 Dicas Extras

1. **Performance:** O plano gratuito pode ser lento. Considere otimizar imagens e assets.

2. **Backup:** Mantenha backups do seu código e banco de dados.

3. **Segurança:** Nunca commite arquivos `.env` com valores reais.

4. **CI/CD:** O Render faz deploy automático a cada push. Isso é ótimo para desenvolvimento contínuo.

5. **Ambientes:** Considere criar ambientes separados (staging e production) no plano pago.

