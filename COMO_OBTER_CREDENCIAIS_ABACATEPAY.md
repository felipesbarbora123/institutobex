# 🔑 Como Obter Credenciais do AbacatePay

## 📋 Visão Geral

Para usar a API direta do AbacatePay (sem passar pelo Supabase), você precisa de:
1. **API URL** - URL base da API do AbacatePay
2. **API Key** - Chave de autenticação para fazer chamadas à API

## 🚀 Passo a Passo

### 1. Acesse o Painel do AbacatePay

1. Acesse o site do AbacatePay: https://abacatepay.com.br (ou o URL do painel que você usa)
2. Faça login na sua conta

### 2. Navegue até a Seção de API/Integrações

No painel do AbacatePay, procure por:
- **"API"** ou **"Integrações"**
- **"Configurações"** → **"API"**
- **"Desenvolvedores"** ou **"Developer"**
- **"Credenciais"** ou **"Credentials"**

### 3. Localize as Credenciais

Procure por:
- **API Key** ou **Chave de API**
- **API URL** ou **URL da API**
- **Base URL** ou **Endpoint**

### 4. Copie as Credenciais

Você deve encontrar algo como:

**API URL:**
```
https://api.abacatepay.com.br
```
ou
```
https://api.abacatepay.com.br/v1
```

**API Key:**
```
ak_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
ou
```
ak_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## ⚙️ Configuração no Backend

### 1. Edite o arquivo `backend/.env`

Adicione ou atualize as seguintes linhas:

```env
# URL da API do AbacatePay (direta, não via Supabase)
ABACATEPAY_API_URL=https://api.abacatepay.com.br

# API Key do AbacatePay (obtida do painel)
ABACATEPAY_API_KEY=ak_live_sua_chave_aqui

# Webhook Secret (para validar webhooks recebidos)
ABACATEPAY_WEBHOOK_SECRET=webh_prod_3yyWjuy3rDRgKjfLN2YTEUTP
```

### 2. Diferença entre API Key e Webhook Secret

- **API Key**: Usada para **FAZER CHAMADAS** à API do AbacatePay
  - Criar pagamentos
  - Verificar status
  - Consultar transações
  
- **Webhook Secret**: Usado apenas para **VALIDAR** webhooks que o AbacatePay envia para você
  - Não é usado para fazer chamadas
  - Apenas para verificar se o webhook é legítimo

### 3. Reinicie o Servidor

Após configurar, reinicie o servidor backend:

```bash
cd backend
# Pare o servidor (Ctrl+C)
# Inicie novamente
npm start
```

## 🔍 Onde Encontrar no Painel

### Opções Comuns de Localização:

1. **Menu Lateral:**
   - Configurações → API
   - Integrações → Credenciais
   - Desenvolvedores → API Keys

2. **Dashboard:**
   - Card "API" ou "Integrações"
   - Seção "Credenciais de API"

3. **Perfil/Conta:**
   - Minha Conta → API
   - Configurações da Conta → Credenciais

## 📞 Se Não Encontrar

Se você não conseguir encontrar as credenciais no painel:

1. **Entre em contato com o suporte do AbacatePay:**
   - Email de suporte
   - Chat do painel
   - Telefone de suporte

2. **Peça especificamente:**
   - "Preciso da API Key para fazer chamadas à API"
   - "Preciso da URL base da API"
   - "Preciso das credenciais para integração via API"

3. **Mencione que precisa para:**
   - Criar pagamentos PIX
   - Verificar status de pagamentos
   - Integração via API REST

## ⚠️ Importante

- **API Key de Produção**: Começa com `ak_live_` (para ambiente real)
- **API Key de Teste**: Começa com `ak_test_` (para ambiente de testes)
- **Nunca compartilhe** sua API Key publicamente
- **Mantenha segura** no arquivo `.env` (não commite no Git)

## 🧪 Teste

Após configurar, teste criando um pagamento PIX. O sistema deve:
1. ✅ Conectar diretamente à API do AbacatePay
2. ✅ Gerar o QR Code corretamente
3. ✅ Não mais usar a Edge Function do Supabase

## 📝 Exemplo de Configuração Completa

```env
# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=institutobex
DB_USER=postgres
DB_PASSWORD=admin

# JWT
JWT_SECRET=seu_jwt_secret_aqui

# AbacatePay (API Direta)
ABACATEPAY_API_URL=https://api.abacatepay.com.br
ABACATEPAY_API_KEY=ak_live_sua_chave_aqui
ABACATEPAY_WEBHOOK_SECRET=webh_prod_3yyWjuy3rDRgKjfLN2YTEUTP

# WhatsApp (Evolution API)
EVOLUTION_API_URL=https://mensadodo.dunis.com.br
EVOLUTION_API_KEY=3B2F25CF7B2F-41F0-8EA1-2F021B2591FC
```

---

**Nota:** Se você preferir continuar usando a Edge Function do Supabase, você ainda precisará da `SUPABASE_ANON_KEY` para autenticar as chamadas à Edge Function. Mas usar a API direta do AbacatePay é mais simples e direto!

