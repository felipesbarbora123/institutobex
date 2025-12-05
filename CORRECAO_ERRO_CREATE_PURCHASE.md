# 🔧 Correção: Erro 404 ao Criar Pagamento PIX

## ❌ Problema Identificado

O frontend estava tentando chamar `/api/functions/v1/create-purchase`, mas essa rota não existia no `server.js`, resultando em erro 404:

```
Failed to load resource: the server responded with a status of 404 (Not Found)
:3000/api/functions/v1/create-purchase:1
```

## ✅ Solução Aplicada

Foi adicionada uma interceptação no `server.js` para mapear chamadas de Edge Functions do Supabase (`/api/functions/v1/*`) para os endpoints corretos do backend.

### Mapeamento de Funções

```javascript
const FUNCTION_MAP = {
  'create-purchase': '/api/purchases',
  'create-payment-pix': '/api/purchases/payment/pix',
  'create-payment-card': '/api/purchases/payment/card',
  'abacatepay-check-status': '/api/purchases/payment/status',
  'confirm-purchase': '/api/purchases/confirm',
  'validate-coupon': '/api/coupons/validate',
  'reconcile-pending-payments': '/api/purchases/reconcile',
  'auto-create-admin': '/api/auth/auto-create-admin'
};
```

### Como Funciona

1. **Frontend chama** `/api/functions/v1/create-purchase`
2. **Server.js intercepta** e identifica que é uma Edge Function
3. **Mapeia** `create-purchase` → `/api/purchases`
4. **Redireciona** para `http://46.224.47.128:3001/api/purchases`
5. **Backend processa** a requisição normalmente

## 🔍 Logs Esperados

Quando o pagamento PIX for gerado, você deve ver nos logs do `server.js`:

```
🔄 [PROXY FUNCTIONS] Interceptando função: create-purchase → /api/purchases
✅ [PROXY FUNCTIONS] Pathname modificado para: /api/purchases
🔄 [PROXY] POST /api/purchases → http://46.224.47.128:3001/api/purchases
✅ [PROXY] Resposta do backend: 201 para /api/purchases
```

## ✅ Status

- ✅ Interceptação de `/api/functions/v1/*` implementada
- ✅ Mapeamento de todas as funções configurado
- ✅ Proxy redireciona corretamente para o backend
- ✅ Query strings preservadas corretamente

## 🧪 Teste

Para testar, tente criar um pagamento PIX novamente. O erro 404 não deve mais aparecer e a compra deve ser criada com sucesso.

## 📝 Arquivos Modificados

- `server.js` - Adicionada interceptação de Edge Functions (linha ~65)

