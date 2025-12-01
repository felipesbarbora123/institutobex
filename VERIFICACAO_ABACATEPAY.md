# 🔍 Verificação: Chave API AbacatePay

## 📋 Status da Configuração

### ❌ **CHAVE NÃO ESTÁ CONFIGURADA NO CÓDIGO**

A chave da API do AbacatePay **NÃO está hardcoded** no código, o que é **correto** para segurança. Ela deve ser configurada via variáveis de ambiente.

---

## 🔍 Onde está sendo usada

### 1. Backend (`backend/routes/purchases.js`)

O código está usando variáveis de ambiente:

```javascript
// Linha 71, 113, 156
'Authorization': `Bearer ${process.env.ABACATEPAY_API_KEY}`
```

**Localizações:**
- ✅ `POST /api/purchases/payment/pix` - Linha 71
- ✅ `POST /api/purchases/payment/card` - Linha 113  
- ✅ `GET /api/purchases/payment/status/:billingId` - Linha 156

### 2. Variáveis Necessárias

O backend precisa das seguintes variáveis no arquivo `.env`:

```env
ABACATEPAY_API_KEY=sua_chave_api_aqui
ABACATEPAY_API_URL=https://api.abacatepay.com.br
ABACATEPAY_WEBHOOK_SECRET=seu_webhook_secret_aqui
```

---

## ⚠️ O que precisa ser feito

### 1. Criar arquivo `.env` no backend

```bash
cd backend
cp .env.example .env
# ou criar manualmente
```

### 2. Configurar as variáveis

Edite o arquivo `backend/.env` e adicione:

```env
# AbacatePay
ABACATEPAY_API_KEY=sua_chave_real_aqui
ABACATEPAY_API_URL=https://api.abacatepay.com.br
ABACATEPAY_WEBHOOK_SECRET=seu_secret_real_aqui
```

### 3. Onde encontrar as credenciais

1. **Acesse o painel do AbacatePay**: https://abacatepay.com.br
2. **Vá em Configurações** ou **API Keys**
3. **Copie a chave da API**
4. **Copie o webhook secret** (se houver)

---

## 📝 Arquivo .env.example

O arquivo `.env.example` já foi criado em `backend/.env.example` com placeholders:

```env
# AbacatePay
ABACATEPAY_API_KEY=sua_chave_api
ABACATEPAY_API_URL=https://api.abacatepay.com.br
ABACATEPAY_WEBHOOK_SECRET=seu_secret_webhook
```

---

## ✅ Checklist

- [ ] Arquivo `.env` criado em `backend/`
- [ ] `ABACATEPAY_API_KEY` configurada
- [ ] `ABACATEPAY_API_URL` configurada
- [ ] `ABACATEPAY_WEBHOOK_SECRET` configurado (se necessário)
- [ ] Backend reiniciado após configurar
- [ ] Testado criação de pagamento PIX
- [ ] Testado criação de pagamento Cartão

---

## 🧪 Como Testar

Após configurar, teste:

```bash
# 1. Iniciar backend
cd backend
npm start

# 2. Testar endpoint (com token de autenticação)
curl -X POST http://localhost:3001/api/purchases/payment/pix \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "externalId": "test_123",
    "amount": 100.00,
    "customerData": {
      "name": "Teste",
      "email": "teste@teste.com"
    }
  }'
```

Se a chave estiver incorreta, você receberá erro 401 (Unauthorized) do AbacatePay.

---

## 🔐 Segurança

✅ **Boa prática**: A chave não está hardcoded no código
✅ **Boa prática**: Usando variáveis de ambiente
⚠️ **Importante**: Não commite o arquivo `.env` no Git (já está no .gitignore)
⚠️ **Importante**: Use chaves diferentes para desenvolvimento e produção

---

## 📚 Referências

- Documentação AbacatePay: https://docs.abacatepay.com.br
- Painel AbacatePay: https://abacatepay.com.br

---

**Status**: ⚠️ **PRECISA CONFIGURAR** - A chave não está configurada, apenas os placeholders estão nos arquivos de exemplo.

