# 🌐 Configurar Domínio para API do Backend (Portainer)

## 🐛 Problema

Tentando acessar `https://institutobex.com.br:3001/health` mas recebe erro:
```
DNS_PROBE_FINISHED_NXDOMAIN
```

## 🎯 Causa

- ✅ Domínio `institutobex.com.br` está na Hostinger
- ✅ Backend está no Portainer (servidor diferente)
- ❌ Porta `3001` não está configurada no DNS/Proxy

---

## ✅ Soluções

---

## ✅ Solução 1: Usar Subdomínio (Recomendado)

### **Configurar Subdomínio na Hostinger**

1. **Acesse o painel da Hostinger**
2. **DNS** → **Gerenciar DNS**
3. **Adicionar registro**:
   - **Tipo**: `A`
   - **Nome**: `api` (ou `backend`)
   - **Valor**: `IP_DO_SERVIDOR_PORTAINER` (IP onde está o Portainer)
   - **TTL**: `3600`

**Resultado**: `api.institutobex.com.br` aponta para o servidor do Portainer

---

### **Configurar Proxy Reverso (Nginx) na Hostinger**

Se você tem acesso ao servidor da Hostinger:

1. **Instalar Nginx** (se não tiver):
   ```bash
   sudo apt-get update
   sudo apt-get install nginx
   ```

2. **Configurar proxy reverso**:
   ```nginx
   # /etc/nginx/sites-available/api.institutobex.com.br
   server {
       listen 80;
       server_name api.institutobex.com.br;
       
       location / {
           proxy_pass http://IP_DO_SERVIDOR_PORTAINER:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **Habilitar site**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/api.institutobex.com.br /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Configurar SSL (Let's Encrypt)**:
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.institutobex.com.br
   ```

**Resultado**: `https://api.institutobex.com.br/health` funciona!

---

## ✅ Solução 2: Usar IP Direto (Temporário)

Para testar rapidamente, use o IP diretamente:

```
http://IP_DO_SERVIDOR_PORTAINER:3001/health
```

**Exemplo**: `http://192.168.1.100:3001/health`

**Limitação**: Não funciona com HTTPS e não é profissional.

---

## ✅ Solução 3: Configurar Proxy na Hostinger (Se Tiver Acesso)

Se o site na Hostinger usa Nginx/Apache, configure proxy reverso:

### **Nginx (Hostinger)**

```nginx
# Adicionar no arquivo de configuração do site
location /api/ {
    proxy_pass http://IP_DO_SERVIDOR_PORTAINER:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**Resultado**: `https://institutobex.com.br/api/health` funciona!

---

## ✅ Solução 4: Usar Cloudflare (Gratuito)

1. **Adicionar domínio no Cloudflare**
2. **Configurar DNS**:
   - Tipo: `A`
   - Nome: `api`
   - Conteúdo: `IP_DO_SERVIDOR_PORTAINER`
3. **Configurar Page Rules** (opcional):
   - URL: `api.institutobex.com.br/*`
   - Forwarding URL: `http://IP_DO_SERVIDOR_PORTAINER:3001/$1`

**Vantagem**: SSL gratuito e proteção DDoS.

---

## 📋 Passo a Passo Completo (Solução Recomendada)

### **1. Descobrir IP do Servidor Portainer**

No console do container:
```bash
ip route | grep default | awk '{print $3}'
```

**Anotar IP** (ex: `45.123.45.67`)

---

### **2. Configurar DNS na Hostinger**

1. **Painel Hostinger** → **DNS** → **Gerenciar DNS**
2. **Adicionar registro**:
   - **Tipo**: `A`
   - **Nome**: `api`
   - **Valor**: `45.123.45.67` (IP do servidor Portainer)
   - **TTL**: `3600`
3. **Salvar**

**Aguardar propagação DNS** (pode levar até 24h, geralmente alguns minutos)

---

### **3. Configurar Proxy Reverso no Servidor Portainer**

Se você tem acesso SSH ao servidor do Portainer:

1. **Instalar Nginx**:
   ```bash
   sudo apt-get update
   sudo apt-get install nginx
   ```

2. **Criar configuração**:
   ```bash
   sudo nano /etc/nginx/sites-available/api.institutobex.com.br
   ```

3. **Adicionar configuração**:
   ```nginx
   server {
       listen 80;
       server_name api.institutobex.com.br;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

4. **Habilitar site**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/api.institutobex.com.br /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. **Configurar SSL**:
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.institutobex.com.br
   ```

---

### **4. Configurar Backend**

1. **Containers** → `institutobex-backend` → **Environment**
2. **Adicionar/Editar**:
   - **Name**: `API_URL`
   - **Value**: `https://api.institutobex.com.br`
   - **Name**: `APP_URL`
   - **Value**: `https://institutobex.com.br`
   - **Name**: `CORS_ORIGIN`
   - **Value**: `https://institutobex.com.br`

---

### **5. Testar**

Após configurar DNS e proxy:

```
https://api.institutobex.com.br/health
```

**Deve retornar**:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "..."
}
```

---

## 🔍 Verificar DNS

### **No seu computador:**

```bash
# Windows
nslookup api.institutobex.com.br

# Linux/Mac
dig api.institutobex.com.br
# ou
host api.institutobex.com.br
```

**Deve retornar** o IP do servidor Portainer.

---

## 🐛 Problemas Comuns

### **Problema 1: DNS não resolve**

**Solução**: Aguardar propagação DNS (pode levar até 24h).

### **Problema 2: Porta não acessível**

**Solução**: Verificar se porta `3001` está aberta no firewall do servidor Portainer.

### **Problema 3: SSL não funciona**

**Solução**: Configurar certificado SSL com Let's Encrypt (certbot).

---

## 📋 Checklist

- [ ] Descobrir IP do servidor Portainer
- [ ] Configurar DNS na Hostinger (registro A para `api`)
- [ ] Configurar proxy reverso (Nginx) no servidor Portainer
- [ ] Configurar SSL (Let's Encrypt)
- [ ] Configurar variáveis de ambiente no backend
- [ ] Testar `https://api.institutobex.com.br/health`
- [ ] Atualizar frontend para usar nova URL

---

## 🔗 Referências

- `ACESSAR_APIS_E_CONFIGURAR_FRONTEND.md` - Configurar frontend
- `URL_API_BACKEND.md` - URL da API

---

## ✅ Resumo

**Problema**: Domínio na Hostinger, backend no Portainer (servidor diferente).

**Solução**:
1. ✅ Criar subdomínio `api.institutobex.com.br`
2. ✅ Configurar DNS apontando para IP do servidor Portainer
3. ✅ Configurar proxy reverso (Nginx) no servidor Portainer
4. ✅ Configurar SSL (Let's Encrypt)
5. ✅ Usar `https://api.institutobex.com.br` no frontend

**Pronto!** Configure o subdomínio para acessar a API! 🚀





