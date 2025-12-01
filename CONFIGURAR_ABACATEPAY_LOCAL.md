# 🔧 Como Configurar AbacatePay para Teste Local

## ⚠️ Problema Identificado

O backend está tentando chamar a API do AbacatePay, mas está configurado incorretamente:
- ❌ **URL errada**: Está usando URL do Supabase Edge Function
- ❌ **API Key errada**: Está usando o webhook secret (que é apenas para validar webhooks recebidos)

## ✅ Solução

### 1. Obter as Credenciais Corretas do AbacatePay

Você precisa de **DUAS coisas diferentes**:

1. **API Key do AbacatePay** (para fazer chamadas à API)
   - Acesse o painel do AbacatePay
   - Vá em "Configurações" ou "API"
   - Copie a **API Key** (não o webhook secret!)

2. **URL da API do AbacatePay**
   - Geralmente é: `https://api.abacatepay.com.br`
   - Ou verifique na documentação do AbacatePay

### 2. Configurar no arquivo `.env`

Edite o arquivo `backend/.env` e configure:

```env
# URL da API do AbacatePay (NÃO a URL do Supabase!)
ABACATEPAY_API_URL=https://api.abacatepay.com.br

# API Key do AbacatePay (NÃO o webhook secret!)
ABACATEPAY_API_KEY=sua_api_key_real_aqui

# Webhook secret (apenas para validar webhooks recebidos)
ABACATEPAY_WEBHOOK_SECRET=webh_prod_3yyWjuy3rDRgKjfLN2YTEUTP
```

### 3. Diferença entre API Key e Webhook Secret

- **API Key**: Usada para **FAZER CHAMADAS** à API do AbacatePay (criar pagamentos, verificar status)
- **Webhook Secret**: Usado apenas para **VALIDAR** webhooks que o AbacatePay envia para você

### 4. Como Obter a API Key

1. Acesse o painel do AbacatePay
2. Vá em "Configurações" → "API" ou "Integrações"
3. Procure por "API Key" ou "Chave de API"
4. Copie a chave (geralmente começa com algo diferente de `webh_`)

### 5. Reiniciar o Servidor

Após configurar, reinicie o servidor backend:

```bash
cd backend
# Pare o servidor (Ctrl+C)
# Inicie novamente
npm start
```

## 🔍 Verificação

Após configurar, quando você tentar criar um pagamento PIX, os logs devem mostrar:

```
📡 Chamando AbacatePay: https://api.abacatepay.com.br
✅ Pagamento PIX criado com sucesso, billingId: ...
```

Se ainda houver erro, verifique:
- ✅ A API Key está correta?
- ✅ A URL da API está correta?
- ✅ Você tem permissões para criar pagamentos na sua conta do AbacatePay?

## 📞 Suporte

Se não conseguir encontrar a API Key:
1. Entre em contato com o suporte do AbacatePay
2. Peça a "API Key" ou "Chave de API" para integração
3. Explique que precisa para fazer chamadas à API (não para webhooks)

