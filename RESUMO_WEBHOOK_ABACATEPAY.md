# ✅ Webhook do AbacatePay Configurado

## 📋 O que foi feito

1. ✅ **Rota de webhook criada:** `POST /api/webhooks/abacatepay`
2. ✅ **Webhook secret configurado:** `webh_prod_3yyWjuy3rDRgKjfLN2YTEUTP`
3. ✅ **Processamento automático** de pagamentos aprovados
4. ✅ **Criação automática de matrículas** quando pagamento confirmado
5. ✅ **Notificação WhatsApp** automática

## 🔗 URLs

### Desenvolvimento Local
```
http://localhost:3001/api/webhooks/abacatepay
```

### Produção (quando publicar)
```
https://seu-dominio.com/api/webhooks/abacatepay
```

## ⚙️ Configurar no Painel do AbacatePay

1. Acesse: https://abacatepay.com.br
2. Vá em **Configurações** → **Webhooks**
3. Configure:
   - **URL:** `http://localhost:3001/api/webhooks/abacatepay` (ou sua URL de produção)
   - **Secret:** `webh_prod_3yyWjuy3rDRgKjfLN2YTEUTP`
   - **Eventos:** Pagamentos aprovados/confirmados

## 🧪 Testar Localmente

Para testar localmente, você precisa expor sua aplicação. Use **ngrok**:

```bash
ngrok http 3001
```

Depois use a URL do ngrok no painel do AbacatePay.

## ✅ Pronto!

O webhook está configurado e pronto para receber notificações do AbacatePay!

