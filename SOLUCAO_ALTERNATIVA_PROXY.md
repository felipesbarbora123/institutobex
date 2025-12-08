# 🔧 Solução Alternativa para Erro SSL

## 🎯 Problema

O erro "Protocolo não compatível" persiste mesmo após as correções no proxy PHP. Isso pode indicar:
1. Problema com o certificado SSL do próprio site
2. Algum recurso sendo carregado via HTTPS incorretamente
3. Problema com a configuração do proxy PHP

## ✅ Solução Alternativa: Usar Proxy via .htaccess

Se o proxy PHP não funcionar, podemos usar um proxy via `.htaccess` que redireciona requisições `/api/*` para o backend.

### Passo 1: Atualizar .htaccess

Adicione estas regras no `.htaccess` (antes das regras existentes):

```apache
# Proxy para backend (apenas se mod_proxy estiver habilitado)
<IfModule mod_proxy.c>
  ProxyPreserveHost On
  ProxyPass /api-proxy http://46.224.47.128:3001/api
  ProxyPassReverse /api-proxy http://46.224.47.128:3001/api
</IfModule>
```

**⚠️ IMPORTANTE:** Esta solução só funciona se o módulo `mod_proxy` estiver habilitado na Hostinger. Muitas hospedagens compartilhadas não permitem isso.

## ✅ Solução Recomendada: Usar Subdomínio com SSL

A melhor solução é criar um subdomínio `api.institutobex.com` com SSL e configurar um proxy reverso.

### Passo 1: Criar Subdomínio

1. No painel da Hostinger, vá em **Domínios** → **Subdomínios**
2. Crie um subdomínio: `api.institutobex.com`
3. Configure SSL gratuito (Let's Encrypt) para o subdomínio

### Passo 2: Configurar Proxy Reverso

Se a Hostinger permitir acesso ao Nginx/Apache, configure:

**Nginx:**
```nginx
server {
    listen 443 ssl;
    server_name api.institutobex.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://46.224.47.128:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**Apache (.htaccess no subdomínio):**
```apache
<IfModule mod_proxy.c>
  ProxyPreserveHost On
  ProxyPass / http://46.224.47.128:3001/
  ProxyPassReverse / http://46.224.47.128:3001/
</IfModule>
```

### Passo 3: Atualizar Interceptor

Atualize o `supabase-interceptor.js`:

```javascript
const BACKEND_URL = isHTTPS ? 'https://api.institutobex.com' : 'http://46.224.47.128:3001';
```

## ✅ Solução Rápida: Desabilitar SSL Temporariamente

Se você precisar testar rapidamente, pode acessar o site via HTTP:

```
http://institutobex.com
```

Isso evitará o problema de Mixed Content, mas não é recomendado para produção.

## 🔍 Diagnóstico

Para identificar a causa exata do problema:

### 1. Verificar Certificado SSL

Acesse: https://www.ssllabs.com/ssltest/analyze.html?d=institutobex.com

Verifique se há problemas com o certificado.

### 2. Verificar Console do Navegador

Abra o console (F12) e verifique:
- Quais recursos estão sendo bloqueados
- Se há erros de Mixed Content
- Se há tentativas de conexão com Supabase antigo

### 3. Verificar Network Tab

No Network tab do DevTools:
- Veja quais requisições estão falhando
- Verifique os headers das requisições
- Veja se há redirecionamentos HTTPS → HTTP

## 🐛 Solução de Problemas

### Problema: Proxy PHP não funciona

**Possíveis causas:**
1. cURL não está habilitado no PHP
2. Firewall bloqueando conexões do servidor
3. Backend não está acessível do servidor da Hostinger

**Solução:**
1. Verificar se cURL está habilitado: `php -m | grep curl`
2. Testar conexão do servidor: `curl http://46.224.47.128:3001/health`
3. Verificar logs de erro do PHP

### Problema: Certificado SSL inválido

**Solução:**
1. Renovar certificado SSL no painel da Hostinger
2. Verificar se o certificado está configurado corretamente
3. Aguardar propagação DNS (pode levar até 24h)

### Problema: Mixed Content ainda ocorre

**Solução:**
1. Verificar se todos os recursos estão sendo carregados via HTTPS
2. Usar Content Security Policy (CSP) para forçar HTTPS
3. Verificar se não há recursos hardcoded com HTTP

## 📝 Recomendação Final

**Para produção, recomendo:**

1. ✅ Criar subdomínio `api.institutobex.com` com SSL
2. ✅ Configurar proxy reverso no subdomínio
3. ✅ Atualizar interceptor para usar o subdomínio
4. ✅ Testar todas as funcionalidades

Isso resolve o problema de Mixed Content de forma definitiva e é a solução mais segura.

---

**Última atualização:** 05/12/2025
**Status:** ⚠️ Solução alternativa documentada

