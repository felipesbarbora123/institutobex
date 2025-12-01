# 📋 Resumo Rápido - Portainer

## 🚀 Deploy Rápido

### 1. Criar Network
- Name: `institutobex-network`
- Driver: `bridge`

### 2. Criar Volume
- **Opção A**: Reutilizar `postgres_data` existente (se vazio/compartilhado)
- **Opção B**: Criar novo volume: `institutobex_postgres_data`
- Driver: `local`

### 3. Container PostgreSQL
- **Image**: `postgres:15-alpine`
- **Name**: `institutobex-db`
- **Port**: `5433:5432` (Host:5433 → Container:5432)
  - ⚠️ Ajuste se 5432 estiver ocupada
- **Volume**: `postgres_data:/var/lib/postgresql/data`
- **Network**: `institutobex-network`
- **Env**:
  ```
  POSTGRES_DB=institutobex
  POSTGRES_USER=postgres
  POSTGRES_PASSWORD=sua_senha_forte
  PGDATA=/var/lib/postgresql/data/pgdata
  ```

### 4. Container Backend
- **Image**: `node:20-alpine`
- **Name**: `institutobex-backend`
- **Port**: `3001:3001`
- **Volume**: `/caminho/backend:/app` (bind)
- **Network**: `institutobex-network`
- **Command**: `sh -c "npm install && npm start"`
- **Working dir**: `/app`
- **Env** (principais):
  ```
  DB_HOST=postgres
  DB_PORT=5432
  DB_NAME=institutobex
  DB_USER=postgres
  DB_PASSWORD=sua_senha_forte
  JWT_SECRET=seu_jwt_secret
  PORT=3001
  NODE_ENV=production
  ```

### 5. Executar Migrations
- Console do container backend > `npm run migrate`

## 📝 Variáveis de Ambiente Completas

Veja `CONFIGURACAO_PORTAINER_PASSO_A_PASSO.md` para lista completa.

## 🔗 URLs

- **API**: `http://servidor:3001`
- **Health**: `http://servidor:3001/health`

## 📚 Documentação Completa

- **Guia Completo**: `GUIA_PORTAINER.md`
- **Passo a Passo**: `CONFIGURACAO_PORTAINER_PASSO_A_PASSO.md`

