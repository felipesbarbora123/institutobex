# 🔥 Configuração Firebase - Passo a Passo

## 1️⃣ Login e Configuração Inicial

```bash
# Instalar Firebase CLI (se ainda não tiver)
npm install -g firebase-tools

# Login
firebase login

# Verificar projetos disponíveis
firebase projects:list

# Usar o projeto correto
firebase use seu-projeto-id
```

## 2️⃣ Criar Cloud SQL Instance

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em **SQL** (ou pesquise por "SQL")
3. Clique em **Create Instance**
4. Escolha **PostgreSQL**
5. Preencha:
   - **Instance ID**: `institutobex-db`
   - **Root password**: Defina uma senha forte (anote!)
   - **Region**: `us-central1` (ou a região das Functions)
   - **Database version**: PostgreSQL 15
   - **Machine type**: `db-f1-micro` (para começar, pode aumentar depois)

6. Clique em **Create**

7. Após criar, anote:
   - **Connection name**: Aparece na página da instância
     - Formato: `PROJECT_ID:REGION:INSTANCE_NAME`
     - Exemplo: `institutobex-12345:us-central1:institutobex-db`

## 3️⃣ Configurar Banco de Dados

### 3.1 Criar Database

1. Na página da instância Cloud SQL, vá em **Databases**
2. Clique em **Create database**
3. Nome: `institutobex`
4. Clique em **Create**

### 3.2 Executar Migrations

**Opção A: Via Cloud SQL Proxy (Recomendado)**

```bash
# Instalar Cloud SQL Proxy
# Windows: Baixar de https://cloud.google.com/sql/docs/postgres/sql-proxy

# Conectar
cloud-sql-proxy.exe PROJECT_ID:REGION:INSTANCE_NAME

# Em outro terminal, conectar ao banco
psql -h 127.0.0.1 -U postgres -d institutobex
```

**Opção B: Via IP Público**

1. Na instância Cloud SQL, vá em **Connections**
2. Habilite **Public IP**
3. Adicione seu IP nas **Authorized networks**
4. Conecte usando o IP público:
```bash
psql -h IP_PUBLICO -U postgres -d institutobex
```

**Executar SQL:**
```bash
# Copiar o conteúdo de backend/schema/schema-completo-adaptado.sql
# Colar e executar no psql
```

## 4️⃣ Configurar Variáveis de Ambiente

### Via Firebase Console (Recomendado)

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione o projeto
3. Vá em **Functions** > **Configuration**
4. Clique em **Environment variables**
5. Adicione cada variável:

```
CLOUD_SQL_CONNECTION_NAME = PROJECT_ID:REGION:INSTANCE_NAME
DB_HOST = (deixe vazio se usar socket)
DB_PORT = 5432
DB_NAME = institutobex
DB_USER = postgres
DB_PASSWORD = sua_senha_aqui
DB_SSL = true
JWT_SECRET = gere_um_secret_forte_aqui
API_URL = https://us-central1-PROJECT_ID.cloudfunctions.net/api
APP_URL = https://institutobex.com.br
CORS_ORIGIN = https://institutobex.com.br
ABACATEPAY_API_URL = https://api.abacatepay.com
ABACATEPAY_API_KEY = sua_chave_abacatepay
EVOLUTION_API_URL = sua_evolution_api_url
EVOLUTION_API_KEY = sua_chave_evolution
EVOLUTION_INSTANCE_NAME = nome_da_instancia
```

### Via CLI (Alternativa)

```bash
firebase functions:config:set \
  cloud_sql.connection_name="PROJECT_ID:REGION:INSTANCE_NAME" \
  db.host="" \
  db.port="5432" \
  db.name="institutobex" \
  db.user="postgres" \
  db.password="senha" \
  db.ssl="true" \
  jwt.secret="seu_jwt_secret" \
  api.url="https://us-central1-PROJECT_ID.cloudfunctions.net/api" \
  app.url="https://institutobex.com.br"
```

## 5️⃣ Instalar Dependências e Deploy

```bash
# Ir para o diretório functions
cd functions

# Instalar dependências
npm install

# Voltar para raiz
cd ..

# Deploy
firebase deploy --only functions:api
```

## 6️⃣ Verificar Deploy

Após o deploy, você receberá uma URL como:
```
https://us-central1-PROJECT_ID.cloudfunctions.net/api
```

Teste:
```bash
curl https://us-central1-PROJECT_ID.cloudfunctions.net/api/health
```

Deve retornar:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "..."
}
```

## 7️⃣ Configurar Permissões IAM

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em **IAM & Admin** > **IAM**
3. Encontre a conta de serviço: `PROJECT_ID@appspot.gserviceaccount.com`
4. Clique em **Edit**
5. Adicione role: **Cloud SQL Client**
6. Salve

## 8️⃣ Importar Dados (Opcional)

Se você tem dados para importar:

1. Conecte ao Cloud SQL (via Proxy ou IP público)
2. Execute os scripts SQL de `backend/data/`

## ✅ Checklist Final

- [ ] Cloud SQL criado e configurado
- [ ] Database `institutobex` criado
- [ ] Migrations executadas
- [ ] Variáveis de ambiente configuradas
- [ ] Permissões IAM configuradas
- [ ] Functions deployadas
- [ ] Health check funcionando
- [ ] Dados importados (se necessário)

## 🐛 Problemas Comuns

### Erro: "Cloud SQL connection failed"
- Verifique `CLOUD_SQL_CONNECTION_NAME`
- Verifique permissões IAM
- Tente usar IP público temporariamente

### Erro: "Connection timeout"
- Verifique se o Cloud SQL está rodando
- Verifique firewall/redes autorizadas
- Aumente `connectionTimeoutMillis` em `database.js`

### Erro: "Authentication failed"
- Verifique `DB_USER` e `DB_PASSWORD`
- Verifique se o usuário existe no Cloud SQL

## 📞 Suporte

Consulte `GUIA_DEPLOY_FIREBASE.md` para mais detalhes.

