# 🚀 Guia de Deploy - Firebase Functions

Este guia explica como fazer o deploy do backend no Firebase Functions com Cloud SQL (PostgreSQL).

## 📋 Pré-requisitos

1. **Firebase CLI instalado**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login no Firebase**
   ```bash
   firebase login
   ```

3. **Acesso ao projeto Firebase**
   - Você deve ter recebido um convite para o projeto
   - Aceite o convite no Firebase Console

## 🔧 Configuração Inicial

### 1. Configurar o Projeto Firebase

```bash
# No diretório raiz do projeto
firebase use --add
# Selecione o projeto correto
```

Ou edite `.firebaserc` manualmente:
```json
{
  "projects": {
    "default": "seu-projeto-id"
  }
}
```

### 2. Criar Instância Cloud SQL (PostgreSQL)

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em **SQL** > **Create Instance**
3. Escolha **PostgreSQL**
4. Configure:
   - **Instance ID**: `institutobex-db`
   - **Password**: Defina uma senha forte
   - **Region**: Escolha a mesma região das Functions (ex: `us-central1`)
   - **Database version**: PostgreSQL 15 ou superior
   - **Machine type**: Escolha conforme necessidade (db-f1-micro para testes)

5. Após criar, anote:
   - **Connection name**: `PROJECT_ID:REGION:INSTANCE_NAME`
   - **Public IP**: Se necessário

### 3. Configurar Banco de Dados

1. **Criar banco de dados**:
   - No Cloud SQL, vá em **Databases** > **Create database**
   - Nome: `institutobex`

2. **Executar migrations**:
   - Use o Cloud SQL Proxy ou conecte via IP público
   - Execute o script `backend/schema/schema-completo-adaptado.sql`

### 4. Configurar Variáveis de Ambiente

No Firebase Console:
1. Vá em **Functions** > **Configuration**
2. Adicione as variáveis:

```bash
# Cloud SQL
CLOUD_SQL_CONNECTION_NAME=PROJECT_ID:REGION:INSTANCE_NAME
DB_HOST=IP_PUBLICO_DO_CLOUD_SQL
DB_PORT=5432
DB_NAME=institutobex
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
DB_SSL=true

# JWT
JWT_SECRET=seu_jwt_secret_forte_aqui

# API URLs
API_URL=https://us-central1-PROJECT_ID.cloudfunctions.net/api
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

**Ou via CLI:**
```bash
firebase functions:config:set \
  cloud_sql.connection_name="PROJECT_ID:REGION:INSTANCE_NAME" \
  db.host="IP_PUBLICO" \
  db.port="5432" \
  db.name="institutobex" \
  db.user="postgres" \
  db.password="senha" \
  db.ssl="true" \
  jwt.secret="seu_jwt_secret" \
  api.url="https://us-central1-PROJECT_ID.cloudfunctions.net/api" \
  app.url="https://institutobex.com.br"
```

### 5. Instalar Dependências

```bash
cd functions
npm install
cd ..
```

## 🚀 Deploy

### Deploy das Functions

```bash
# Deploy completo
firebase deploy --only functions

# Deploy apenas da função API
firebase deploy --only functions:api
```

### Verificar Deploy

Após o deploy, você receberá uma URL:
```
https://us-central1-PROJECT_ID.cloudfunctions.net/api
```

Teste a health check:
```bash
curl https://us-central1-PROJECT_ID.cloudfunctions.net/api/health
```

## 🔒 Configuração de Segurança

### 1. IAM e Permissões

Certifique-se de que a conta de serviço das Functions tem permissão para acessar Cloud SQL:
- **Cloud SQL Client** role

### 2. CORS

Ajuste o CORS em `functions/index.js` para permitir apenas seu domínio:
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://institutobex.com.br',
  credentials: true
}));
```

### 3. Rate Limiting

O rate limiting já está configurado. Ajuste conforme necessário em `functions/index.js`.

## 📊 Monitoramento

### Logs

```bash
# Ver logs em tempo real
firebase functions:log

# Ver logs de uma função específica
firebase functions:log --only api
```

### Métricas

Acesse o Firebase Console > Functions para ver:
- Número de invocações
- Latência
- Erros
- Uso de memória

## 🔄 Atualizações

Para atualizar o código:

```bash
# 1. Fazer alterações no código
# 2. Testar localmente (se necessário)
# 3. Deploy
firebase deploy --only functions:api
```

## 🧪 Teste Local (Opcional)

Para testar localmente com emulador:

```bash
# Instalar emuladores
firebase init emulators

# Iniciar emuladores
firebase emulators:start --only functions

# A API estará disponível em:
# http://localhost:5001/PROJECT_ID/us-central1/api
```

## 🐛 Troubleshooting

### Erro de Conexão com Cloud SQL

1. Verifique se `CLOUD_SQL_CONNECTION_NAME` está correto
2. Verifique permissões IAM
3. Tente usar IP público temporariamente para debug

### Erro de Timeout

Aumente o timeout em `functions/index.js`:
```javascript
export const api = onRequest({
  timeoutSeconds: 120, // Aumentar se necessário
  // ...
}, app);
```

### Erro de Memória

Aumente a memória em `functions/index.js`:
```javascript
export const api = onRequest({
  memory: '1GB', // Aumentar se necessário
  // ...
}, app);
```

## 📝 Próximos Passos

1. ✅ Configurar Cloud SQL
2. ✅ Executar migrations
3. ✅ Configurar variáveis de ambiente
4. ✅ Fazer deploy
5. ✅ Testar endpoints
6. ✅ Atualizar frontend para usar nova URL da API
7. ✅ Configurar domínio customizado (opcional)

## 🔗 Links Úteis

- [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- [Cloud SQL Docs](https://cloud.google.com/sql/docs/postgres)
- [Firebase Console](https://console.firebase.google.com/)

