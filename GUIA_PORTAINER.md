# 🐳 Guia Completo - Deploy no Portainer

Este guia explica como configurar o backend e banco de dados PostgreSQL no Portainer.

## 📋 Pré-requisitos

- ✅ Acesso ao painel do Portainer
- ✅ Acesso SSH ao servidor (opcional, para upload de arquivos)
- ✅ Arquivos do projeto prontos

## 🚀 Método 1: Usando Docker Compose (Recomendado)

### Passo 1: Preparar Arquivos

1. **Criar arquivo `docker-compose.yml`** na raiz do projeto (já criado)
2. **Criar arquivo `.env`** com as variáveis de ambiente:

```env
# Database
DB_PASSWORD=sua_senha_forte_aqui

# JWT
JWT_SECRET=seu_jwt_secret_forte_aqui

# API URLs
API_URL=https://api.institutobex.com.br
APP_URL=https://institutobex.com.br

# CORS
CORS_ORIGIN=https://institutobex.com.br

# AbacatePay
ABACATEPAY_API_URL=https://api.abacatepay.com
ABACATEPAY_API_KEY=sua_chave_abacatepay

# Evolution API (WhatsApp)
EVOLUTION_API_URL=https://sua-evolution-api-url.com
EVOLUTION_API_KEY=sua_chave_evolution
EVOLUTION_INSTANCE_NAME=nome_da_instancia

# Supabase (se necessário)
SUPABASE_ANON_KEY=sua_chave_supabase
```

### Passo 2: Upload dos Arquivos

**Opção A: Via Git (Recomendado)**
```bash
# No servidor
git clone seu-repositorio
cd institutobex
```

**Opção B: Via SCP/SFTP**
```bash
# Do seu computador
scp -r . usuario@servidor:/caminho/para/institutobex
```

**Opção C: Via Portainer (Stack)**
- Use o editor de texto do Portainer para criar os arquivos

### Passo 3: Criar Stack no Portainer

1. Acesse o Portainer
2. Vá em **Stacks** > **Add stack**
3. Nome: `institutobex`
4. Método: **Web editor** ou **Repository**
5. Cole o conteúdo do `docker-compose.yml`
6. Clique em **Deploy the stack**

### Passo 4: Configurar Variáveis de Ambiente

1. Na stack criada, clique em **Editor**
2. Adicione as variáveis de ambiente no `docker-compose.yml` ou:
3. Vá em cada container > **Duplicate/Edit** > **Environment variables**
4. Adicione todas as variáveis do `.env`

### Passo 5: Executar Migrations

1. Acesse o container do backend: **Containers** > `institutobex-backend`
2. Clique em **Console**
3. Execute:
```bash
npm run migrate
```

### Passo 6: Importar Dados (Opcional)

```bash
# No console do container backend
npm run import-data
```

## 🔧 Método 2: Criar Containers Manualmente

### Passo 1: Criar Network

1. Vá em **Networks** > **Add network**
2. Nome: `institutobex-network`
3. Driver: `bridge`
4. Clique em **Create the network**

### Passo 2: Criar Volume para PostgreSQL

⚠️ **IMPORTANTE**: Se já existe um volume `postgres_data`, você tem duas opções:

**Opção A: Reutilizar volume existente**
- Use o volume `postgres_data` existente (apenas se estiver vazio ou puder ser compartilhado)

**Opção B: Criar novo volume**
1. Vá em **Volumes** > **Add volume**
2. Nome: `institutobex_postgres_data` (nome diferente para evitar conflito)
3. Driver: `local`
4. Clique em **Create the volume**

### Passo 3: Criar Container PostgreSQL

1. Vá em **Containers** > **Add container**
2. **Name**: `institutobex-db`
3. **Image**: `postgres:15-alpine`
4. **Network**: Selecione `institutobex-network`
5. **Port mapping**:
   - Container: `5432` (sempre 5432 dentro do container)
   - Host: `5433` (ou outra porta disponível se 5432 estiver ocupada)
   - ⚠️ **IMPORTANTE**: Se 5432 já está em uso, use 5433, 5434 ou outra porta no Host
6. **Volumes**:
   - Container: `/var/lib/postgresql/data`
   - Volume: `postgres_data` (se reutilizar) OU `institutobex_postgres_data` (se criou novo)
   
   ⚠️ **ATENÇÃO**: Se o volume existente tem dados de outro projeto, crie um novo!
7. **Environment variables**:
   ```
   POSTGRES_DB=institutobex
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=sua_senha_forte_aqui
   PGDATA=/var/lib/postgresql/data/pgdata
   ```
8. **Restart policy**: `Unless stopped`
9. Clique em **Deploy the container**

### Passo 4: Criar Container Backend

1. Vá em **Containers** > **Add container**
2. **Name**: `institutobex-backend`
3. **Image**: `node:20-alpine`
4. **Network**: Selecione `institutobex-network`
5. **Port mapping**:
   - Container: `3001`
   - Host: `3001` (ou outra porta disponível)
6. **Volumes**:
   - Container: `/app`
   - Bind: `/caminho/para/backend` (caminho no servidor)
7. **Working directory**: `/app`
8. **Command**: `sh -c "npm install && npm start"`
9. **Environment variables** (adicionar todas):
   ```
   DB_HOST=postgres
   DB_PORT=5432
   DB_NAME=institutobex
   DB_USER=postgres
   DB_PASSWORD=sua_senha_forte_aqui
   DB_SSL=false
   JWT_SECRET=seu_jwt_secret_forte_aqui
   API_URL=https://api.institutobex.com.br
   APP_URL=https://institutobex.com.br
   CORS_ORIGIN=https://institutobex.com.br
   PORT=3001
   NODE_ENV=production
   ABACATEPAY_API_URL=https://api.abacatepay.com
   ABACATEPAY_API_KEY=sua_chave_abacatepay
   EVOLUTION_API_URL=https://sua-evolution-api-url.com
   EVOLUTION_API_KEY=sua_chave_evolution
   EVOLUTION_INSTANCE_NAME=nome_da_instancia
   ```
10. **Restart policy**: `Unless stopped`
11. **Depends on**: Selecione `institutobex-db`
12. Clique em **Deploy the container**

## 📝 Configuração Detalhada - Portainer

### Container PostgreSQL

**Configurações Recomendadas:**
- **Memory limit**: 512MB (mínimo) - 1GB (recomendado)
- **CPU limit**: 0.5 cores (mínimo) - 1 core (recomendado)
- **Health check**: 
  - Test: `pg_isready -U postgres`
  - Interval: 10s
  - Timeout: 5s
  - Retries: 5

### Container Backend

**Configurações Recomendadas:**
- **Memory limit**: 512MB (mínimo) - 1GB (recomendado)
- **CPU limit**: 0.5 cores (mínimo) - 1 core (recomendado)
- **Health check**:
  - Test: `wget --quiet --tries=1 --spider http://localhost:3001/health`
  - Interval: 30s
  - Timeout: 10s
  - Retries: 3

## 🔒 Segurança

### 1. Senhas Fortes
- Use senhas fortes para `DB_PASSWORD` e `JWT_SECRET`
- Gere com: `openssl rand -base64 32`

### 2. Firewall
- Configure o firewall para permitir apenas:
  - Porta 3001 (backend) - apenas do frontend
  - Porta 5433 (ou a porta que você mapeou para PostgreSQL) - apenas do backend (não expor publicamente)

### 3. SSL/TLS
- Configure reverse proxy (Nginx/Traefik) com SSL
- Use Let's Encrypt para certificados gratuitos

## 🌐 Configurar Reverse Proxy (Nginx)

### Exemplo de Configuração Nginx

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

## 📊 Monitoramento

### Logs

1. **Ver logs do backend**:
   - Portainer > Containers > `institutobex-backend` > **Logs**

2. **Ver logs do PostgreSQL**:
   - Portainer > Containers > `institutobex-db` > **Logs**

### Health Checks

Teste a API:
```bash
curl http://localhost:3001/health
```

Deve retornar:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "..."
}
```

## 🔄 Atualizações

### Atualizar Código

1. **Via Git**:
   ```bash
   # No servidor
   cd /caminho/do/projeto
   git pull
   # Reiniciar container backend
   ```

2. **Via Portainer**:
   - Containers > `institutobex-backend` > **Recreate**
   - Ou **Restart** se apenas reiniciar

### Atualizar Variáveis de Ambiente

1. Containers > `institutobex-backend` > **Duplicate/Edit**
2. Edite as variáveis em **Environment variables**
3. Clique em **Deploy the container**

## 🐛 Troubleshooting

### Container não inicia

1. Verifique os logs: Containers > [container] > **Logs**
2. Verifique variáveis de ambiente
3. Verifique portas disponíveis
4. Verifique volumes/permissões

### Erro de conexão com banco

1. Verifique se o container do PostgreSQL está rodando
2. Verifique `DB_HOST=postgres` (nome do container)
3. Verifique se estão na mesma network
4. Verifique credenciais (user, password, database)

### Erro de permissões

1. Verifique permissões dos volumes
2. No Linux: `chown -R 1000:1000 /caminho/do/volume`

### Porta já em uso

1. Mude a porta no Portainer
2. Ou pare o serviço que está usando a porta

## 📝 Checklist Final

- [ ] Network criada
- [ ] Volume do PostgreSQL criado
- [ ] Container PostgreSQL rodando
- [ ] Container Backend rodando
- [ ] Variáveis de ambiente configuradas
- [ ] Migrations executadas
- [ ] Health check funcionando
- [ ] Logs sem erros
- [ ] Reverse proxy configurado (se necessário)
- [ ] SSL configurado (se necessário)

## 🔗 URLs

Após configurar:
- **Backend API**: `http://seu-servidor:3001` ou `https://api.institutobex.com.br`
- **Health Check**: `http://seu-servidor:3001/health`

## 📞 Próximos Passos

1. ✅ Configurar containers
2. ✅ Executar migrations
3. ✅ Testar API
4. ✅ Configurar domínio (opcional)
5. ✅ Configurar SSL (opcional)
6. ✅ Atualizar frontend para usar nova URL da API

