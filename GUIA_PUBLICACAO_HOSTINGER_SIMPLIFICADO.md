# 🚀 Guia de Publicação na Hostinger - Frontend Estático

## 📋 Visão Geral

Este guia explica como publicar o **frontend estático** do Instituto Bex na Hostinger.

**⚠️ IMPORTANTE:** 
- O frontend é estático (React/Vite compilado)
- O backend está rodando em produção em `http://46.224.47.128:3001`
- Não é necessário Node.js na Hostinger (apenas hospedagem compartilhada)

---

## 📦 Arquivos para Enviar

### ✅ **Arquivos na RAIZ (public_html/)**

Envie estes arquivos diretamente para a pasta `public_html`:

```
✅ index.html
✅ manifest.webmanifest
✅ favicon.ico
✅ icon-192.png
✅ icon-512.png
✅ robots.txt
✅ sitemap.xml
✅ sw.js
✅ registerSW.js
✅ workbox-b833909e.js
```

### ✅ **Pasta COMPLETA**

```
✅ assets/ (pasta completa com todos os arquivos dentro)
```

### ❌ **Arquivos que NÃO devem ser enviados:**

```
❌ default.php (pode deletar ou substituir)
❌ node_modules/ (não existe no build)
❌ backend/ (não é necessário)
❌ *.md (documentação)
❌ server.js (não é necessário - backend está em produção)
❌ package.json (não é necessário)
❌ .env (não é necessário)
❌ Qualquer arquivo de teste ou desenvolvimento
```

---

## 📝 Passo a Passo

### **Passo 1: Preparar os Arquivos Localmente**

1. Certifique-se de que você tem todos os arquivos listados acima
2. Organize-os em uma pasta temporária para facilitar o upload

### **Passo 2: Fazer Backup (IMPORTANTE!)**

1. Acesse o painel da Hostinger (hPanel)
2. Vá em **File Manager**
3. Faça backup da pasta `public_html` atual (renomeie para `public_html_backup`)

### **Passo 3: Limpar a Pasta public_html**

1. Delete ou mova o arquivo `default.php` (se existir)
2. Delete arquivos antigos que não são mais necessários

### **Passo 4: Fazer Upload dos Arquivos**

**Opção A: Via File Manager (Recomendado para iniciantes)**

1. Acesse **File Manager** no hPanel
2. Navegue até `public_html`
3. Faça upload de cada arquivo:
   - Clique em **Upload**
   - Selecione os arquivos da raiz
   - Aguarde o upload
4. Para a pasta `assets`:
   - Crie a pasta `assets` se não existir
   - Faça upload de TODOS os arquivos dentro de `assets/`

**Opção B: Via FTP/SFTP (Mais rápido para muitos arquivos)**

1. Use FileZilla ou similar
2. Conecte-se ao servidor:
   - Host: `ftp.seu-dominio.com` ou IP do servidor
   - Usuário: seu usuário FTP
   - Senha: sua senha FTP
   - Porta: 21 (FTP) ou 22 (SFTP)
3. Navegue até `public_html`
4. Arraste e solte os arquivos

**⚠️ IMPORTANTE:**
- Mantenha a estrutura de pastas (assets/ deve estar dentro de public_html/)
- Todos os arquivos devem estar na raiz de `public_html/`

### **Passo 5: Configurar .htaccess (Apache)**

Crie um arquivo `.htaccess` na raiz de `public_html/` com o seguinte conteúdo:

```apache
# Habilitar RewriteEngine
RewriteEngine On
RewriteBase /

# Redirecionar para index.html para rotas do React Router
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Configurações de cache para assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/x-javascript "access plus 1 month"
</IfModule>

# Compressão GZIP
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Segurança
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>
```

### **Passo 6: Verificar Permissões**

Certifique-se de que os arquivos têm as permissões corretas:

- Arquivos: `644` (rw-r--r--)
- Pastas: `755` (rwxr-xr-x)

No File Manager, você pode alterar as permissões clicando com o botão direito no arquivo/pasta.

### **Passo 7: Testar o Site**

1. Acesse seu domínio: `https://institutobex.com.br`
2. Verifique se o site carrega corretamente
3. Teste a navegação entre páginas
4. Verifique o console do navegador (F12) para erros

---

## 🔍 Verificação Pós-Publicação

### ✅ Checklist:

- [ ] Site carrega corretamente
- [ ] Todas as páginas funcionam (Home, Cursos, Login, etc.)
- [ ] Imagens e assets carregam
- [ ] Navegação entre páginas funciona
- [ ] Login/cadastro funciona
- [ ] Compra e pagamento funcionam
- [ ] Console do navegador não mostra erros críticos
- [ ] PWA funciona (pode instalar como app)

### 🐛 Problemas Comuns:

**1. Site mostra "404 Not Found" ou página em branco:**
- Verifique se `index.html` está na raiz de `public_html/`
- Verifique se o `.htaccess` está configurado corretamente
- Verifique as permissões dos arquivos

**2. Assets não carregam (CSS/JS/imagens):**
- Verifique se a pasta `assets/` está dentro de `public_html/`
- Verifique os caminhos no `index.html` (devem começar com `/assets/`)
- Limpe o cache do navegador (Ctrl+Shift+R)

**3. Rotas do React não funcionam:**
- Verifique se o `.htaccess` está configurado corretamente
- Certifique-se de que o RewriteEngine está ativo

**4. Erros de CORS:**
- O backend já está configurado para aceitar requisições do domínio
- Se houver problemas, verifique as configurações do backend

---

## 📂 Estrutura Final Esperada

Após o upload, a estrutura deve ficar assim:

```
public_html/
├── index.html
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
    ├── index-DZwxJa6p.js
    ├── index-EgoNZk16.css
    ├── Checkout-V11RnDwE.js
    ├── Profile-BrAVgkB9.js
    └── ... (todos os outros arquivos)
```

---

## 🎯 Resumo Rápido

1. ✅ Fazer backup do `public_html` atual
2. ✅ Limpar arquivos antigos (especialmente `default.php`)
3. ✅ Fazer upload de todos os arquivos da raiz
4. ✅ Fazer upload da pasta `assets/` completa
5. ✅ Criar arquivo `.htaccess` com as configurações
6. ✅ Verificar permissões dos arquivos
7. ✅ Testar o site

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs de erro no console do navegador (F12)
2. Verifique os logs do servidor no hPanel
3. Teste em modo anônimo/privado do navegador
4. Limpe o cache do navegador
5. Entre em contato com o suporte da Hostinger se necessário

---

**Última atualização:** 05/12/2025
**Status:** ✅ Pronto para publicação


