# 🔒 Solução para Erro SSL/Mixed Content

## 🎯 Problema

Ao acessar o site via HTTPS (`https://institutobex.com`), ocorre o erro:
```
ERR_SSL_VERSION_OR_CIPHER_MISMATCH
Não foi possível estabelecer uma conexão segura com este site
```

**Causa:** O site está em HTTPS, mas o interceptor está tentando fazer requisições HTTP para o backend (`http://46.224.47.128:3001`). Navegadores modernos bloqueiam requisições HTTP de páginas HTTPS (Mixed Content).

## ✅ Solução Implementada

Foi criado um **proxy PHP** que funciona como intermediário entre o frontend HTTPS e o backend HTTP.

### Como Funciona:

1. **Frontend (HTTPS)** → Faz requisição para `/api-proxy.php` (HTTPS)
2. **Proxy PHP** → Recebe a requisição HTTPS e faz proxy para o backend HTTP
3. **Backend (HTTP)** → Processa a requisição e retorna resposta
4. **Proxy PHP** → Retorna a resposta para o frontend (HTTPS)

### Arquivos Criados/Modificados:

1. **`api-proxy.php`** (raiz e `publicado/public_html/`)
   - Proxy PHP que redireciona requisições HTTPS para o backend HTTP
   - Resolve o problema de Mixed Content

2. **`supabase-interceptor.js`** (atualizado)
   - Detecta se está em HTTPS
   - Usa `/api-proxy.php` quando em HTTPS
   - Usa HTTP direto quando em HTTP (desenvolvimento local)

## 📋 Como Publicar na Hostinger

### Passo 1: Fazer Upload dos Arquivos

1. **Fazer upload de `api-proxy.php`** para a raiz de `public_html/`
2. **Fazer upload de `supabase-interceptor.js` atualizado** para a raiz de `public_html/`

### Passo 2: Verificar Permissões

Certifique-se de que o arquivo `api-proxy.php` tem permissões de execução:
- Permissões: `644` ou `755`
- No File Manager da Hostinger, clique com botão direito → **Change Permissions** → `755`

### Passo 3: Testar

1. Acesse o site via HTTPS: `https://institutobex.com`
2. Abra o console do navegador (F12)
3. Tente fazer login
4. Verifique se não há mais erros de SSL/Mixed Content

## 🔍 Verificação

### No Console do Navegador:

**Deve aparecer:**
```
✅ Interceptor do Supabase carregado!
🔄 Interceptando chamada de autenticação do Supabase
🔄 Redirecionando login para: /api-proxy.php/api/auth/signin
```

**NÃO deve aparecer mais:**
```
ERR_SSL_VERSION_OR_CIPHER_MISMATCH
Mixed Content: The page was loaded over HTTPS, but requested an insecure resource
```

### Testar o Proxy Diretamente:

Acesse no navegador:
```
https://institutobex.com/api-proxy.php/api/auth/signin
```

Deve retornar um erro de método (esperado, pois precisa ser POST), mas não deve dar erro de SSL.

## ⚙️ Configuração Alternativa

Se preferir usar HTTPS direto no backend (sem proxy), você pode:

### Opção 1: Configurar SSL no Backend

1. Configurar certificado SSL no servidor do backend
2. Atualizar `supabase-interceptor.js` linha 23:
   ```javascript
   const BACKEND_URL = isHTTPS ? 'https://46.224.47.128:3001' : 'http://46.224.47.128:3001';
   ```

### Opção 2: Usar Subdomínio com SSL

1. Criar subdomínio `api.institutobex.com` na Hostinger
2. Configurar SSL para o subdomínio
3. Configurar proxy reverso para o backend
4. Atualizar `supabase-interceptor.js` linha 25:
   ```javascript
   const BACKEND_URL = isHTTPS ? 'https://api.institutobex.com' : 'http://46.224.47.128:3001';
   ```

### Opção 3: Usar Proxy Relativo (se backend estiver no mesmo servidor)

Se o backend estiver rodando no mesmo servidor da Hostinger:

1. Configurar proxy reverso no `.htaccess` ou Nginx
2. Atualizar `supabase-interceptor.js` linha 20:
   ```javascript
   const BACKEND_URL = isHTTPS ? '' : 'http://46.224.47.128:3001';
   ```

## 🐛 Solução de Problemas

### Problema: Proxy PHP não funciona

**Solução:**
1. Verificar se PHP está habilitado na Hostinger
2. Verificar permissões do arquivo (deve ser 644 ou 755)
3. Verificar se cURL está habilitado no PHP
4. Verificar logs de erro do PHP no painel da Hostinger

### Problema: Erro 500 no proxy

**Solução:**
1. Verificar se a URL do backend está correta em `api-proxy.php` (linha 15)
2. Verificar se o backend está acessível
3. Verificar logs de erro do PHP

### Problema: CORS ainda bloqueando

**Solução:**
1. Verificar se os headers CORS estão corretos em `api-proxy.php`
2. Verificar se o backend aceita requisições do domínio da Hostinger

## 📝 Notas Importantes

- O proxy PHP funciona apenas para requisições do frontend
- O backend continua usando HTTP (não precisa de SSL)
- O proxy adiciona uma camada extra, mas resolve o problema de Mixed Content
- Para produção, recomenda-se configurar SSL no backend ou usar subdomínio

## ✅ Checklist de Publicação

- [ ] Fazer upload de `api-proxy.php` para `public_html/`
- [ ] Fazer upload de `supabase-interceptor.js` atualizado para `public_html/`
- [ ] Verificar permissões do `api-proxy.php` (644 ou 755)
- [ ] Testar acesso via HTTPS
- [ ] Verificar console do navegador para erros
- [ ] Testar login
- [ ] Verificar se não há mais erros de SSL/Mixed Content

---

**Última atualização:** 05/12/2025
**Status:** ✅ Solução implementada

