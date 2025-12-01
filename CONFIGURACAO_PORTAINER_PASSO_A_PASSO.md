# 📖 Configuração Portainer - Passo a Passo Detalhado

## 🎯 Objetivo

Configurar backend Node.js e banco PostgreSQL no Portainer usando a interface web.

---

## 📋 PASSO 1: Preparar Arquivos no Servidor

### Opção A: Via Git (Recomendado)

```bash
# Conectar ao servidor via SSH
ssh usuario@seu-servidor

# Navegar para diretório de projetos
cd /opt  # ou outro diretório de sua escolha

# Clonar repositório (se usar Git)
git clone seu-repositorio institutobex
cd institutobex
```

### Opção B: Via Upload Manual

1. Compacte o projeto no seu computador
2. Faça upload via SCP:
   ```bash
   scp -r projeto.zip usuario@servidor:/opt/
   ```
3. No servidor, descompacte:
   ```bash
   cd /opt
   unzip projeto.zip -d institutobex
   cd institutobex
   ```

---

## 📋 PASSO 2: Criar Network no Portainer

1. **Acesse o Portainer**
2. No menu lateral, clique em **Networks**
3. Clique em **Add network**
4. Preencha:
   - **Name**: `institutobex-network`
   - **Driver**: `bridge`
   - Deixe o resto como padrão
5. Clique em **Create the network**

✅ **Network criada!**

---

## 📋 PASSO 3: Criar Volume para PostgreSQL

⚠️ **IMPORTANTE**: Se já existe um volume chamado `postgres_data` no Portainer, você tem duas opções:

### Opção A: Usar Volume Existente (Recomendado se for compartilhado)

Se o volume `postgres_data` existente pode ser usado, pule este passo e use-o no Passo 4.

### Opção B: Criar Novo Volume com Nome Diferente

1. No menu lateral, clique em **Volumes**
2. Clique em **Add volume**
3. Preencha:
   - **Name**: `institutobex_postgres_data` (nome diferente para evitar conflito)
   - **Driver**: `local`
4. Clique em **Create the volume**

✅ **Volume criado!**

**Nota**: Se escolher esta opção, use `institutobex_postgres_data` no Passo 4 ao invés de `postgres_data`.

---

## 📋 PASSO 4: Criar Container PostgreSQL

1. No menu lateral, clique em **Containers**
2. Clique em **Add container**

### Aba "Container configuration"

**Name**: `institutobex-db`

**Image**: `postgres:15-alpine`

### Aba "Network ports configuration"

⚠️ **IMPORTANTE**: Se a porta 5432 já está em uso, use uma porta diferente!

**Verificar porta disponível:**
- No Portainer, vá em **Containers** e verifique quais portas estão em uso
- Ou use uma porta alta como `5433`, `5434`, `15432`, etc.

Clique em **map additional ports**:
- **Container**: `5432` (sempre 5432 dentro do container)
- **Host**: `5433` (ou outra porta disponível, ex: 5434, 15432)

⚠️ **Se usar porta diferente de 5432 no Host**, você precisará ajustar a conexão do backend (veja nota no Passo 5).

### Aba "Volumes"

Clique em **map additional volume**:
- **Volume**: Selecione `postgres_data` (se reutilizar existente) OU `institutobex_postgres_data` (se criou novo)
- **Container**: `/var/lib/postgresql/data`

⚠️ **ATENÇÃO**: 
- Se o volume `postgres_data` já existe e tem dados de outro projeto, **NÃO** reutilize! Crie um novo com nome diferente.
- Se o volume está vazio ou pode ser compartilhado, pode reutilizar.

### Aba "Env"

Clique em **add environment variable** e adicione:

```
POSTGRES_DB = institutobex
POSTGRES_USER = postgres
POSTGRES_PASSWORD = sua_senha_forte_aqui
PGDATA = /var/lib/postgresql/data/pgdata
```

⚠️ **IMPORTANTE**: Use uma senha forte! Exemplo:
```bash
# No servidor, gere uma senha:
openssl rand -base64 32
```

### Aba "Restart policy"

Selecione: **Unless stopped**

### Aba "Networks"

Selecione: `institutobex-network`

### Aba "Advanced mode" (Opcional - Health Check)

Role até **Health check** e configure:
- **Test**: `["CMD-SHELL", "pg_isready -U postgres"]`
- **Interval**: `10`
- **Timeout**: `5`
- **Retries**: `5`

### Deploy

Clique em **Deploy the container**

✅ **Container PostgreSQL criado e rodando!**

---

## 📋 PASSO 5: Criar Container Backend

1. No menu lateral, clique em **Containers**
2. Clique em **Add container**

### Aba "Container configuration"

**Name**: `institutobex-backend`

**Image**: `node:20-alpine`

### Aba "Network ports configuration"

Clique em **map additional ports**:
- **Container**: `3001`
- **Host**: `3001` (ou outra porta se 3001 estiver ocupada)

### Aba "Volumes"

Clique em **map additional volume**:
- **Volume**: Selecione **Bind**
- **Container**: `/app`
- **Host**: `/opt/institutobex/backend` (ou o caminho onde está o backend)

⚠️ **IMPORTANTE**: Ajuste o caminho conforme o local dos arquivos no servidor!

### Aba "Command & Logging"

**Working directory**: `/app`

**Command**: 
```
sh -c "npm install && npm start"
```

### Aba "Env"

Clique em **add environment variable** e adicione **TODAS** as variáveis:

```
# Database
DB_HOST = postgres
DB_PORT = 5432
DB_NAME = institutobex
DB_USER = postgres
DB_PASSWORD = mesma_senha_do_postgres
DB_SSL = false
```

⚠️ **IMPORTANTE**: 
- `DB_HOST = postgres` (nome do container, não IP!)
- `DB_PORT = 5432` (sempre 5432, pois é a porta dentro do container)
- Se você mapeou uma porta diferente no Host (ex: 5433), isso não afeta o `DB_PORT` aqui, pois os containers se comunicam pela network interna usando a porta do container (5432).

# JWT
JWT_SECRET = gere_um_secret_forte_aqui

# API URLs
API_URL = https://api.institutobex.com.br
APP_URL = https://institutobex.com.br

# CORS
CORS_ORIGIN = https://institutobex.com.br

# Port
PORT = 3001

# Node Environment
NODE_ENV = production

# AbacatePay
ABACATEPAY_API_URL = https://api.abacatepay.com
ABACATEPAY_API_KEY = sua_chave_abacatepay

# Evolution API (WhatsApp)
EVOLUTION_API_URL = https://sua-evolution-api-url.com
EVOLUTION_API_KEY = sua_chave_evolution
EVOLUTION_INSTANCE_NAME = nome_da_instancia

# Supabase (se necessário)
SUPABASE_ANON_KEY = sua_chave_supabase
```

⚠️ **IMPORTANTE**: 
- `DB_PASSWORD` deve ser a MESMA senha do PostgreSQL
- `JWT_SECRET` deve ser uma string forte e aleatória
- Ajuste as URLs conforme seu domínio

### Aba "Restart policy"

Selecione: **Unless stopped**

### Aba "Networks"

Selecione: `institutobex-network`

### Aba "Advanced mode" (Opcional - Health Check)

Role até **Health check** e configure:
- **Test**: `["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/health"]`
- **Interval**: `30`
- **Timeout**: `10`
- **Retries**: `3`

### Deploy

Clique em **Deploy the container**

✅ **Container Backend criado!**

---

## 📋 PASSO 6: Verificar se Está Funcionando

### 6.1 Verificar Logs

1. **PostgreSQL**:
   - Containers > `institutobex-db` > **Logs**
   - Deve mostrar: `database system is ready to accept connections`

2. **Backend**:
   - Containers > `institutobex-backend` > **Logs**
   - Deve mostrar: `🚀 Servidor rodando na porta 3001`
   - Deve mostrar: `✅ Conectado ao PostgreSQL`

### 6.2 Testar Health Check

No servidor ou do seu computador:
```bash
curl http://seu-servidor-ip:3001/health
```

Deve retornar:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "..."
}
```

---

## 📋 PASSO 7: Executar Migrations

1. No Portainer, vá em **Containers** > `institutobex-backend`
2. Clique em **Console**
3. Selecione: **sh** ou **/bin/sh**
4. Clique em **Connect**
5. Execute:
   ```bash
   npm run migrate
   ```

✅ **Migrations executadas!**

---

## 📋 PASSO 8: Importar Dados (Opcional)

Se você tem dados para importar:

1. No console do container backend (mesmo processo do passo 7)
2. Execute:
   ```bash
   npm run import-data
   ```

✅ **Dados importados!**

---

## 📋 PASSO 9: Configurar Firewall (Importante!)

### No Servidor (Linux)

```bash
# Permitir porta 3001 (backend)
sudo ufw allow 3001/tcp

# NÃO exponha a porta 5432 (PostgreSQL) publicamente!
# Ela só deve ser acessível internamente
```

### No Portainer (se usar firewall do Portainer)

Configure as regras de firewall para permitir apenas:
- Porta 3001 (backend) - apenas do frontend
- Porta 5432 (PostgreSQL) - apenas internamente

---

## 📋 PASSO 10: Configurar Domínio (Opcional)

### Usando Nginx como Reverse Proxy

1. Instale Nginx no servidor:
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. Crie configuração:
   ```bash
   sudo nano /etc/nginx/sites-available/api.institutobex.com.br
   ```

3. Cole:
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

4. Ative:
   ```bash
   sudo ln -s /etc/nginx/sites-available/api.institutobex.com.br /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. Configure DNS para apontar `api.institutobex.com.br` para o IP do servidor

6. Configure SSL com Let's Encrypt:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.institutobex.com.br
   ```

---

## ✅ Checklist Final

- [ ] Network `institutobex-network` criada
- [ ] Volume `postgres_data` criado
- [ ] Container PostgreSQL rodando
- [ ] Container Backend rodando
- [ ] Variáveis de ambiente configuradas
- [ ] Logs sem erros
- [ ] Health check funcionando
- [ ] Migrations executadas
- [ ] Dados importados (se necessário)
- [ ] Firewall configurado
- [ ] Domínio configurado (opcional)
- [ ] SSL configurado (opcional)

---

## 🐛 Problemas Comuns

### Container backend não inicia

**Solução:**
1. Verifique os logs: Containers > `institutobex-backend` > **Logs**
2. Verifique se o caminho do volume está correto
3. Verifique permissões: `chmod -R 755 /opt/institutobex/backend`

### Erro: "Cannot connect to database"

**Solução:**
1. Verifique se `DB_HOST=postgres` (nome do container, não IP)
2. Verifique se ambos containers estão na mesma network
3. Verifique se a senha está correta
4. Verifique se o PostgreSQL está rodando

### Erro: "Port already in use"

**Solução:**
1. Mude a porta no Portainer
2. Ou pare o serviço que está usando a porta:
   ```bash
   sudo lsof -i :3001
   sudo kill -9 PID
   ```

### Erro de permissões

**Solução:**
```bash
# No servidor
sudo chown -R 1000:1000 /opt/institutobex/backend
sudo chmod -R 755 /opt/institutobex/backend
```

---

## 🎉 Pronto!

Seu backend está rodando no Portainer! 

**URL da API**: `http://seu-servidor:3001` ou `https://api.institutobex.com.br`

Para mais detalhes, consulte `GUIA_PORTAINER.md`.

