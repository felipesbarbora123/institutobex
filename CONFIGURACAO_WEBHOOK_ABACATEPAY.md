# 🔗 Configuração do Webhook do AbacatePay

## ✅ Webhook Configurado

### Credenciais Fornecidas

- **URL do Webhook (antiga - Supabase):** `https://onjzrwghvrbbtcxfavlm.supabase.co/functions/v1/webhook-abacatepay`
- **Webhook Secret:** `webh_prod_3yyWjuy3rDRgKjfLN2YTEUTP`

### Nova URL do Webhook (Backend Local)

**Para desenvolvimento local:**
```
http://localhost:3001/api/webhooks/abacatepay
```

**Para produção (quando publicar):**
```
https://seu-dominio.com/api/webhooks/abacatepay
```

## 📋 O que foi feito

1. ✅ **Rota de webhook criada** em `backend/routes/webhooks.js`
2. ✅ **Webhook secret adicionado** ao arquivo `.env`
3. ✅ **Processamento automático** de pagamentos aprovados
4. ✅ **Criação automática de matrículas** quando pagamento confirmado
5. ✅ **Notificação WhatsApp** automática após confirmação

## 🔧 Como Funciona

Quando o AbacatePay confirma um pagamento:

1. **AbacatePay envia webhook** → `POST /api/webhooks/abacatepay`
2. **Backend valida webhook** → Verifica secret (se configurado)
3. **Registra no log** → Salva em `webhook_logs`
4. **Processa pagamento**:
   - Atualiza status da compra para `paid`
   - Cria matrícula no curso
   - Envia notificação WhatsApp
5. **Retorna confirmação** → AbacatePay recebe resposta

## ⚙️ Configuração no Painel do AbacatePay

### 1. Acesse o Painel do AbacatePay

1. Faça login no painel: https://abacatepay.com.br
2. Vá em **Configurações** → **Webhooks**

### 2. Configure o Webhook

**URL do Webhook:**
```
http://localhost:3001/api/webhooks/abacatepay
```
(Em produção, use sua URL pública)

**Eventos para escutar:**
- ✅ `payment.approved` ou `PAID`
- ✅ `payment.confirmed`
- ✅ Qualquer evento de pagamento

**Webhook Secret (opcional):**
```
webh_prod_3yyWjuy3rDRgKjfLN2YTEUTP
```

### 3. Teste o Webhook

O AbacatePay geralmente permite testar o webhook. Use essa funcionalidade para verificar se está funcionando.

## 🧪 Testar Localmente

### Opção 1: Usar ngrok (Recomendado)

Para testar webhooks localmente, você precisa expor sua aplicação:

1. **Instale o ngrok:**
   ```bash
   # Windows: baixe de https://ngrok.com
   # Ou use: choco install ngrok
   ```

2. **Exponha a porta 3001:**
   ```bash
   ngrok http 3001
   ```

3. **Use a URL do ngrok no AbacatePay:**
   ```
   https://seu-id.ngrok.io/api/webhooks/abacatepay
   ```

### Opção 2: Testar Manualmente

Você pode simular um webhook manualmente:

```bash
curl -X POST http://localhost:3001/api/webhooks/abacatepay \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: webh_prod_3yyWjuy3rDRgKjfLN2YTEUTP" \
  -d '{
    "type": "payment.approved",
    "status": "PAID",
    "billingId": "test_billing_123",
    "externalId": "purchase_123",
    "amount": 100.00
  }'
```

## 📊 Logs

Todos os webhooks são registrados na tabela `webhook_logs`:

```sql
SELECT * FROM webhook_logs 
WHERE source = 'abacatepay' 
ORDER BY created_at DESC 
LIMIT 10;
```

## ⚠️ Importante

1. **Em produção**, use HTTPS para o webhook
2. **Valide sempre o webhook secret** para segurança
3. **Teste o webhook** antes de colocar em produção
4. **Monitore os logs** para verificar se está funcionando

## 🔐 Segurança

O webhook valida o secret se fornecido no header `X-Webhook-Secret`. Certifique-se de:

1. ✅ Configurar o secret no `.env`
2. ✅ Configurar o mesmo secret no painel do AbacatePay
3. ✅ Usar HTTPS em produção

## 📝 Checklist

- [x] Rota de webhook criada
- [x] Webhook secret configurado no `.env`
- [x] Processamento de pagamentos implementado
- [x] Criação automática de matrículas
- [x] Notificação WhatsApp integrada
- [ ] Webhook configurado no painel do AbacatePay
- [ ] Testado em ambiente de desenvolvimento
- [ ] URL de produção configurada (quando publicar)

## 🚀 Próximos Passos

1. **Configure o webhook no painel do AbacatePay** com a nova URL
2. **Teste com um pagamento real** (use valor mínimo)
3. **Verifique os logs** para confirmar que está funcionando
4. **Em produção**, atualize a URL do webhook para sua URL pública

