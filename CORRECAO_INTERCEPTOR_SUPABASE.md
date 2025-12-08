# 🔧 Correção do Interceptor do Supabase para Hostinger

## 🎯 Problema Identificado

O site publicado na Hostinger estava tentando fazer chamadas diretas para o Supabase antigo (`elusfwlvtqafvzplnooh.supabase.co`), causando erros de autenticação.

**Erro no console:**
```
POST https://elusfwlvtqafvzplnooh.supabase.co/auth/v1/token?grant_type=password 400 (Bad Request)
```

## ✅ Solução Implementada

Foi criado/atualizado um **interceptor do lado do cliente** que redireciona todas as chamadas do Supabase para o backend de produção.

### Arquivos Modificados/Criados:

1. **`supabase-interceptor.js`** (raiz do projeto)
   - Interceptor atualizado para interceptar chamadas de autenticação (`/auth/v1/token`)
   - Intercepta chamadas para Edge Functions (`/functions/v1/*`)
   - Intercepta chamadas REST do Supabase (`/rest/v1/*`)

2. **`index.html`** (raiz do projeto)
   - Adicionado `<script src="/supabase-interceptor.js"></script>` ANTES do código compilado

3. **`publicado/public_html/supabase-interceptor.js`**
   - Cópia do interceptor atualizado para a pasta de publicação

4. **`publicado/public_html/index.html`**
   - Atualizado para incluir o interceptor

## 📋 O que o Interceptor Faz

### 1. Intercepta Autenticação (`/auth/v1/token`)
- Captura chamadas de login do Supabase
- Redireciona para `/api/auth/signin` do backend
- Converte a resposta do backend para o formato esperado pelo Supabase
- Salva o token no localStorage no formato Supabase

### 2. Intercepta Edge Functions (`/functions/v1/*`)
- Mapeia funções do Supabase para endpoints do backend:
  - `create-purchase` → `/api/purchases`
  - `create-payment-pix` → `/api/purchases/payment/pix`
  - `create-payment-card` → `/api/purchases/payment/card`
  - `abacatepay-check-status` → `/api/purchases/payment/status`
  - `confirm-purchase` → `/api/purchases/confirm`
  - `validate-coupon` → `/api/coupons/validate`
  - `reconcile-pending-payments` → `/api/purchases/reconcile`
  - `auto-create-admin` → `/api/auth/auto-create-admin`

### 3. Intercepta REST API (`/rest/v1/*`)
- Redireciona chamadas REST do Supabase para `/api/*` do backend

## 🚀 Como Publicar na Hostinger

### Passo 1: Fazer Upload dos Arquivos Atualizados

1. **Fazer upload do arquivo `supabase-interceptor.js`** para a raiz de `public_html/`
2. **Fazer upload do arquivo `index.html` atualizado** para a raiz de `public_html/`

### Passo 2: Verificar Estrutura

A estrutura final em `public_html/` deve ser:

```
public_html/
├── index.html (✅ ATUALIZADO - inclui o interceptor)
├── supabase-interceptor.js (✅ NOVO - deve ser enviado)
├── manifest.webmanifest
├── favicon.ico
├── icon-192.png
├── icon-512.png
├── robots.txt
├── sitemap.xml
├── sw.js
├── registerSW.js
├── workbox-b833909e.js
├── .htaccess
└── assets/
    └── ... (todos os arquivos)
```

### Passo 3: Limpar Cache

Após fazer upload:
1. Limpar cache do navegador (Ctrl+Shift+R ou Ctrl+F5)
2. Testar o login novamente

## 🔍 Verificação

Após publicar, verifique no console do navegador (F12):

1. **Deve aparecer:**
   ```
   ✅ Interceptor do Supabase carregado!
   ```

2. **Ao fazer login, deve aparecer:**
   ```
   🔄 Interceptando chamada de autenticação do Supabase
   🔄 Redirecionando login para: http://46.224.47.128:3001/api/auth/signin
   ```

3. **NÃO deve aparecer mais:**
   ```
   POST https://elusfwlvtqafvzplnooh.supabase.co/auth/v1/token 400 (Bad Request)
   ```

## ⚙️ Configuração do Backend

O interceptor está configurado para usar:
- **Backend URL:** `http://46.224.47.128:3001`

Se o backend estiver em outro endereço, edite a linha 9 do `supabase-interceptor.js`:
```javascript
const BACKEND_URL = 'http://SEU_IP:PORTA';
```

## 🐛 Solução de Problemas

### Problema: Interceptor não está carregando

**Solução:**
1. Verificar se `supabase-interceptor.js` está na raiz de `public_html/`
2. Verificar se o `index.html` tem a tag `<script src="/supabase-interceptor.js"></script>` ANTES do código compilado
3. Verificar permissões do arquivo (deve ser 644)

### Problema: Login ainda não funciona

**Solução:**
1. Verificar se o backend está rodando em `http://46.224.47.128:3001`
2. Verificar se o endpoint `/api/auth/signin` está funcionando
3. Verificar CORS no backend (deve aceitar requisições do domínio da Hostinger)

### Problema: Erro de CORS

**Solução:**
1. Configurar CORS no backend para aceitar requisições do domínio da Hostinger
2. Adicionar o domínio em `CORS_ORIGIN` no backend

## 📝 Notas Importantes

- O interceptor funciona **apenas no lado do cliente** (navegador)
- Não é necessário Node.js na Hostinger
- O interceptor intercepta as chamadas **antes** que elas saiam do navegador
- O backend deve estar acessível publicamente (não pode estar apenas em localhost)

## ✅ Checklist de Publicação

- [ ] Fazer upload de `supabase-interceptor.js` para `public_html/`
- [ ] Fazer upload de `index.html` atualizado para `public_html/`
- [ ] Verificar se o arquivo está na raiz (não dentro de subpastas)
- [ ] Limpar cache do navegador
- [ ] Testar login
- [ ] Verificar console do navegador para mensagens do interceptor
- [ ] Verificar se não há mais erros de conexão com Supabase antigo

---

**Última atualização:** 05/12/2025
**Status:** ✅ Pronto para publicação

