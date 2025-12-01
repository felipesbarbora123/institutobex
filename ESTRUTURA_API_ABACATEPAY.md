# 📋 Estrutura da API do AbacatePay - Implementada

## ✅ Endpoints Implementados

### 1. **Criar QR Code PIX** ✅

**Endpoint:** `POST /v1/pixQrCode/create`

**URL Completa:** `https://api.abacatepay.com/v1/pixQrCode/create`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "amount": 12300,           // Valor em centavos (ex: 123.00 = 12300)
  "expiresIn": 3600,         // Tempo de expiração em segundos (1 hora)
  "description": "Pagamento do curso - CURSO123",
  "customer": {
    "name": "Daniel Lima",
    "cellphone": "(11) 4002-8922",
    "email": "daniel_lima@abacatepay.com",
    "taxId": "123.456.789-01"
  },
  "metadata": {
    "externalId": "CURSO123"
  }
}
```

**Resposta Esperada:**
```json
{
  "id": "billing_id_aqui",
  "qrCode": "base64_ou_url_do_qrcode",
  "copyPaste": "código_pix_copia_cola",
  "expiresAt": "2025-11-27T04:00:00Z"
}
```

**Implementado em:** `backend/routes/purchases.js` → `POST /api/purchases/payment/pix`

---

### 2. **Verificar Status do Pagamento** ✅

**Endpoint:** `GET /v1/pixQrCode/check`

**URL Completa:** `https://api.abacatepay.com/v1/pixQrCode/check?id=<billing_id>`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `id`: ID do QR Code (billing_id)

**Resposta Esperada:**
```json
{
  "status": "PAID",  // ou "PENDING", "CANCELLED"
  "paidAt": "2025-11-27T03:30:00Z"
}
```

**Implementado em:** `backend/routes/purchases.js` → `GET /api/purchases/payment/status/:billingId`

---

### 3. **Criar Cobrança (Cartão)** ✅

**Endpoint:** `POST /v1/billing/create`

**URL Completa:** `https://api.abacatepay.com/v1/billing/create`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "frequency": "ONE_TIME",
  "methods": ["PIX", "CREDIT_CARD", "DEBIT_CARD"],
  "products": [
    {
      "externalId": "course_id",
      "name": "Nome do Curso",
      "description": "Acesso ao curso: Nome do Curso",
      "quantity": 1,
      "price": 12300  // Valor em centavos
    }
  ],
  "returnUrl": "https://example.com/checkout/success",
  "completionUrl": "https://example.com/checkout/success",
  "customer": {
    "name": "Daniel Lima",
    "cellphone": "(11) 4002-8922",
    "email": "daniel_lima@abacatepay.com",
    "taxId": "123.456.789-01"
  },
  "allowCoupons": false,
  "coupons": [],
  "externalId": "CURSO123",
  "metadata": {
    "externalId": "CURSO123",
    "courseId": "course_id"
  }
}
```

**Resposta Esperada:**
```json
{
  "id": "billing_id_aqui",
  "paymentUrl": "https://abacatepay.com/pay/xxx"
}
```

**Implementado em:** `backend/routes/purchases.js` → `POST /api/purchases/payment/card`

---

## 🔧 Ajustes Realizados

### 1. **Conversão de Valores**
- ✅ Valores convertidos para **centavos** (API espera valores inteiros)
- Exemplo: R$ 123.00 → 12300 centavos

### 2. **Formato de Dados do Cliente**
- ✅ Mapeamento correto: `phone` → `cellphone`
- ✅ Formato mantido: `name`, `email`, `taxId`

### 3. **Estrutura de Resposta**
- ✅ Código adaptado para diferentes formatos de resposta
- ✅ Suporte a `qrCode`/`qr_code`, `copyPaste`/`copy_paste`, etc.

### 4. **Endpoints Corretos**
- ✅ PIX: `/v1/pixQrCode/create`
- ✅ Status: `/v1/pixQrCode/check?id=xxx`
- ✅ Cartão: `/v1/billing/create`

---

## 📝 Configuração no `.env`

```env
# URL base da API do AbacatePay
ABACATEPAY_API_URL=https://api.abacatepay.com

# API Key do AbacatePay
ABACATEPAY_API_KEY=abc_prod_C1tn1DMEDR0sFPrPAD3FfpwD

# Webhook Secret (para validar webhooks recebidos)
ABACATEPAY_WEBHOOK_SECRET=webh_prod_3yyWjuy3rDRgKjfLN2YTEUTP

# URL da aplicação (para returnUrl e completionUrl)
APP_URL=http://localhost:3000
```

---

## 🧪 Teste

Após configurar, reinicie o servidor e teste:

1. **Criar pagamento PIX:**
   - Deve gerar QR Code corretamente
   - Valor convertido para centavos automaticamente

2. **Verificar status:**
   - Deve retornar status correto (PAID, PENDING, etc.)

3. **Criar pagamento Cartão:**
   - Deve retornar URL de pagamento
   - Deve incluir produtos corretamente

---

## ✅ Status

- ✅ Endpoint PIX implementado
- ✅ Endpoint Status implementado
- ✅ Endpoint Cartão implementado
- ✅ Conversão de valores para centavos
- ✅ Formato de dados correto
- ✅ Tratamento de erros melhorado

**Pronto para testar!** 🚀

