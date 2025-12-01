# 🚀 Guia de Publicação na Hostinger

## 📋 Visão Geral

Este guia explica como publicar o projeto **Instituto Bex** na Hostinger, considerando:
- ✅ Frontend React/Vite (arquivos estáticos)
- ✅ Backend Supabase (já configurado)
- ✅ Integração WhatsApp (Evolution API)
- ✅ Integração AbacatePay (já configurada)

---

## ⚠️ IMPORTANTE: Limitações da Hostinger

A Hostinger oferece diferentes tipos de hospedagem:

### 1. **Hospedagem Compartilhada (Plano Básico)**
- ❌ **NÃO suporta Node.js**
- ✅ Suporta PHP, HTML, CSS, JavaScript estático
- ✅ Pode servir arquivos estáticos do frontend
- ⚠️ **Problema:** As APIs do WhatsApp (`server.js`) não funcionarão

### 2. **Hospedagem Cloud/VPS (Planos Avançados)**
- ✅ **Suporta Node.js**
- ✅ Pode rodar o servidor completo
- ✅ Melhor opção para este projeto

### 3. **Hospedagem WordPress**
- ❌ Não é adequada para este projeto

---

## 🎯 Opções de Publicação

### **OPÇÃO 1: Hostinger Cloud/VPS com Node.js** ⭐ RECOMENDADO

Se você tem um plano Cloud ou VPS da Hostinger que suporta Node.js:

#### Passo 1: Preparar Arquivos

1. **Arquivos a serem enviados:**
   ```
   ✅ index.html
   ✅ manifest.webmanifest
   ✅ sw.js
   ✅ registerSW.js
   ✅ workbox-b833909e.js
   ✅ robots.txt
   ✅ sitemap.xml
   ✅ favicon.ico
   ✅ icon-192.png
   ✅ icon-512.png
   ✅ assets/ (pasta completa)
   ✅ server.js
   ✅ whatsapp-api.js
   ✅ package.json
   ✅ .env (criar - ver abaixo)
   ```

2. **Arquivos que NÃO devem ser enviados:**
   ```
   ❌ node_modules/ (será instalado no servidor)
   ❌ test-*.js (arquivos de teste)
   ❌ *.md (documentação)
   ❌ start.bat / start.sh (scripts locais)
   ❌ default.php (se existir)
   ```

#### Passo 2: Criar Arquivo .env

Crie um arquivo `.env` na raiz do projeto com:

```env
# Evolution WhatsApp API
EVOLUTION_API_URL=https://mensadodo.dunis.com.br
EVOLUTION_API_KEY=3B2F25CF7B2F-41F0-8EA1-2F021B2591FC
EVOLUTION_INSTANCE_NAME=Dunis
EVOLUTION_NUMBER=5511948248421

# URL da Aplicação
APP_URL=https://institutobex.com.br

# Porta do Servidor (ajustar conforme necessário)
PORT=3000

# Node Environment
NODE_ENV=production
```

**⚠️ IMPORTANTE:** 
- Não compartilhe o arquivo `.env` publicamente
- Adicione `.env` ao `.gitignore` se usar Git
- Configure as variáveis diretamente no painel da Hostinger se preferir

#### Passo 3: Acessar o Servidor via SSH

1. Acesse o painel da Hostinger (hPanel)
2. Vá em **SSH Access** ou **Terminal**
3. Conecte-se via SSH ao servidor

#### Passo 4: Fazer Upload dos Arquivos

**Opção A: Via FTP/SFTP**
1. Use FileZilla ou similar
2. Conecte-se ao servidor
3. Faça upload dos arquivos para a pasta `public_html` ou `www`

**Opção B: Via Git (se disponível)**
```bash
cd /home/usuario/public_html
git clone seu-repositorio.git .
```

#### Passo 5: Instalar Dependências

No terminal SSH:
```bash
cd /home/usuario/public_html
npm install --production
```

#### Passo 6: Configurar Process Manager (PM2)

Instale o PM2 para manter o servidor rodando:
```bash
npm install -g pm2
pm2 start server.js --name institutobex
pm2 save
pm2 startup
```

#### Passo 7: Configurar Proxy Reverso (Nginx)

Se a Hostinger usar Nginx, configure o proxy reverso:

1. Acesse o arquivo de configuração do Nginx (geralmente em `/etc/nginx/sites-available/`)
2. Adicione:

```nginx
server {
    listen 80;
    server_name institutobex.com.br www.institutobex.com.br;

    # Servir arquivos estáticos diretamente
    location / {
        root /home/usuario/public_html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy para API Node.js
    location /api/ {
        proxy_pass http://localhost:3000;
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

3. Reinicie o Nginx:
```bash
sudo systemctl restart nginx
```

#### Passo 8: Configurar SSL (HTTPS)

1. No painel da Hostinger, ative o SSL gratuito (Let's Encrypt)
2. Ou configure manualmente no Nginx

#### Passo 9: Testar

1. Acesse: `https://institutobex.com.br`
2. Teste o envio de WhatsApp (fazer uma compra de teste)
3. Verifique os logs: `pm2 logs institutobex`

---

### **OPÇÃO 2: Hostinger Compartilhada + Serviço Externo para API** 💡 ALTERNATIVA

Se você tem apenas hospedagem compartilhada (sem Node.js):

#### Estratégia:
- ✅ Frontend: Hostinger (arquivos estáticos)
- ✅ Backend API: Serviço externo (Vercel, Railway, Render, etc.)

#### Passo 1: Publicar Frontend na Hostinger

1. **Arquivos a enviar:**
   ```
   ✅ index.html
   ✅ manifest.webmanifest
   ✅ sw.js
   ✅ registerSW.js
   ✅ workbox-b833909e.js
   ✅ robots.txt
   ✅ sitemap.xml
   ✅ favicon.ico
   ✅ icon-192.png
   ✅ icon-512.png
   ✅ assets/ (pasta completa)
   ```

2. **Fazer upload via FTP** para `public_html`

3. **Configurar .htaccess** (se usar Apache):
   ```apache
   RewriteEngine On
   RewriteBase /
   RewriteRule ^index\.html$ - [L]
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule . /index.html [L]
   ```

#### Passo 2: Publicar API em Serviço Externo

**Opção A: Vercel (Recomendado - Grátis)**

1. Crie conta em: https://vercel.com
2. Instale Vercel CLI: `npm i -g vercel`
3. Crie arquivo `vercel.json`:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "server.js"
       }
     ]
   }
   ```
4. Faça deploy: `vercel --prod`
5. Anote a URL gerada (ex: `https://institutobex-api.vercel.app`)

**Opção B: Railway (Recomendado - Pago mas barato)**

1. Crie conta em: https://railway.app
2. Conecte seu repositório Git
3. Configure variáveis de ambiente
4. Railway detecta automaticamente Node.js e faz deploy

**Opção C: Render (Recomendado - Grátis com limitações)**

1. Crie conta em: https://render.com
2. Crie novo "Web Service"
3. Conecte repositório Git
4. Configure:
   - Build Command: `npm install`
   - Start Command: `node server.js`

#### Passo 3: Atualizar Frontend para Usar API Externa

Você precisará modificar o código do frontend para chamar a API externa. Como o código está compilado, você tem duas opções:

**Opção A: Usar Supabase Edge Functions** (Melhor)

Crie uma Edge Function no Supabase que chama a Evolution API:

1. No Supabase Dashboard, vá em **Edge Functions**
2. Crie nova função `send-whatsapp-notification`
3. Código da função:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL') || 'https://mensadodo.dunis.com.br'
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY') || '3B2F25CF7B2F-41F0-8EA1-2F021B2591FC'
const EVOLUTION_INSTANCE = Deno.env.get('EVOLUTION_INSTANCE_NAME') || 'Dunis'

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const { name, phone, courseTitle, amount } = await req.json()

    // Enviar mensagem via Evolution API
    const message = `🎉 *Pagamento Confirmado - Instituto Bex*\n\nOlá ${name}! 👋\n\n✅ *Seu pagamento foi recebido com sucesso!*\n\n${courseTitle ? `📚 *Curso:* ${courseTitle}\n` : ''}${amount ? `💰 *Valor:* R$ ${parseFloat(amount).toFixed(2).replace('.', ',')}\n` : ''}\n🎓 *A partir de agora, você está apto a acessar todo o conteúdo da plataforma do Instituto Bex!*\n\nAcesse sua conta e comece a estudar agora mesmo:\n🔗 Acesse: https://institutobex.com.br\n\nBons estudos! 📖✨\n\n---\n_Instituto Bex - Transformando vidas através da educação_`

    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        number: phone.replace(/\D/g, ''),
        text: message
      })
    })

    const result = await response.json()

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

4. Configure as variáveis de ambiente no Supabase
5. Atualize a Edge Function `confirm-purchase` para chamar esta função

**Opção B: Modificar Código Compilado** (Não recomendado)

Se precisar modificar o código compilado, você terá que:
1. Recompilar o projeto React
2. Atualizar as URLs da API
3. Fazer upload novamente

---

### **OPÇÃO 3: Hostinger + Supabase Edge Functions** ⭐⭐ MAIS SIMPLES

**Esta é a opção mais simples e recomendada!**

#### Estratégia:
- ✅ Frontend: Hostinger (arquivos estáticos)
- ✅ API WhatsApp: Supabase Edge Functions (já tem Supabase configurado)

#### Vantagens:
- ✅ Não precisa de servidor Node.js
- ✅ Não precisa de serviço externo adicional
- ✅ Já usa Supabase (que você já tem)
- ✅ Escalável e confiável

#### Passo 1: Publicar Frontend na Hostinger

Siga os passos da **OPÇÃO 2 - Passo 1**

#### Passo 2: Criar Edge Function no Supabase

Siga os passos da **OPÇÃO 2 - Passo 3 - Opção A**

#### Passo 3: Integrar com Confirmação de Pagamento

Atualize a Edge Function `confirm-purchase` do Supabase para chamar a função de WhatsApp quando o pagamento for confirmado.

---

## 📝 Checklist de Publicação

### Antes de Publicar:

- [ ] Verificar se todas as credenciais estão corretas
- [ ] Testar localmente com `npm start`
- [ ] Verificar se a Evolution API está funcionando
- [ ] Testar envio de WhatsApp localmente
- [ ] Verificar se o Supabase está configurado corretamente
- [ ] Verificar se o AbacatePay está configurado

### Durante a Publicação:

- [ ] Fazer backup dos arquivos atuais (se houver)
- [ ] Fazer upload dos arquivos corretos
- [ ] Configurar variáveis de ambiente
- [ ] Instalar dependências Node.js (se aplicável)
- [ ] Configurar process manager (PM2) (se aplicável)
- [ ] Configurar proxy reverso (se aplicável)
- [ ] Configurar SSL/HTTPS
- [ ] Configurar domínio e DNS

### Após Publicar:

- [ ] Testar acesso ao site
- [ ] Testar login/cadastro
- [ ] Testar compra e pagamento
- [ ] Testar envio de WhatsApp
- [ ] Verificar logs de erro
- [ ] Testar em diferentes navegadores
- [ ] Testar em dispositivos móveis
- [ ] Verificar PWA (instalação)

---

## 🔧 Configurações Importantes

### 1. Variáveis de Ambiente

Certifique-se de configurar:

```env
EVOLUTION_API_URL=https://mensadodo.dunis.com.br
EVOLUTION_API_KEY=3B2F25CF7B2F-41F0-8EA1-2F021B2591FC
EVOLUTION_INSTANCE_NAME=Dunis
EVOLUTION_NUMBER=5511948248421
APP_URL=https://institutobex.com.br
```

### 2. URLs da API

Se usar serviço externo para API, atualize as URLs no código:
- Substitua `http://localhost:3000` pela URL de produção
- Configure CORS se necessário

### 3. Supabase

O Supabase já está configurado no frontend. Verifique:
- ✅ URL: `https://qxgzazewwutbikmmpkms.supabase.co`
- ✅ Chave anon está no código compilado
- ✅ Edge Functions configuradas

### 4. AbacatePay

Verifique as configurações de webhook:
- URL de callback deve apontar para seu servidor
- Se usar Supabase Edge Functions, configure o webhook para chamar a função

---

## 🐛 Solução de Problemas

### Erro: "Cannot find module"
- **Solução:** Execute `npm install` no servidor

### Erro: "Port already in use"
- **Solução:** Altere a porta no `server.js` ou pare o processo que está usando a porta

### Erro: "API WhatsApp não funciona"
- **Solução:** Verifique se as credenciais da Evolution API estão corretas
- Verifique se a instância está conectada
- Verifique os logs: `pm2 logs` ou logs do serviço

### Erro: "CORS"
- **Solução:** Configure CORS no servidor ou no serviço externo

### Site não carrega
- **Solução:** Verifique se o `index.html` está na raiz
- Verifique as permissões dos arquivos (chmod 644)
- Verifique o `.htaccess` (se usar Apache)

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do servidor
2. Verifique os logs do navegador (F12)
3. Teste as APIs individualmente
4. Verifique a documentação da Hostinger
5. Entre em contato com o suporte da Hostinger

---

## 🎯 Recomendação Final

**Para este projeto, recomendo a OPÇÃO 3:**
- ✅ Mais simples de implementar
- ✅ Não requer servidor Node.js na Hostinger
- ✅ Usa Supabase (que você já tem)
- ✅ Mais fácil de manter
- ✅ Escalável

**Passos resumidos:**
1. Publique frontend na Hostinger (arquivos estáticos)
2. Crie Edge Function no Supabase para WhatsApp
3. Integre com confirmação de pagamento
4. Pronto! 🚀

---

**Última atualização:** 17/11/2025
**Status:** ✅ Pronto para publicação

