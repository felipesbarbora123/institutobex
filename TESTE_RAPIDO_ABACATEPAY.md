# ⚡ Teste Rápido - AbacatePay

## 🚀 Início Rápido (5 minutos)

### 1. Configurar `.env` do backend

Edite `backend/.env` e adicione:
```env
ABACATEPAY_API_KEY=sua_chave_aqui
ABACATEPAY_WEBHOOK_SECRET=webh_prod_3yyWjuy3rDRgKjfLN2YTEUTP
```

### 2. Iniciar Backend

```bash
cd backend
npm start
```

✅ Deve mostrar: `✅ Conectado ao PostgreSQL`

### 3. Iniciar Frontend (novo terminal)

```bash
node server.js
```

✅ Deve mostrar: `🚀 Servidor iniciado com sucesso!`

### 4. Testar no Navegador

1. Abra: `http://localhost:3000`
2. Abra Console (F12) → Deve ver: `✅ Substituição completa do Supabase carregada!`
3. Vá para um curso → Clique em "Comprar"
4. Preencha dados → Selecione PIX
5. Clique em "Finalizar com PIX"
6. ✅ QR Code deve aparecer!

### 5. Verificar

**Console (F12):**
- ✅ `🔄 Chamando backend: create-payment-pix`
- ❌ Sem erros

**Network (F12):**
- ✅ `POST http://localhost:3001/api/purchases/payment/pix`
- ❌ Sem requisições para `supabase.co`

**Backend (terminal):**
- ✅ Logs da requisição
- ✅ Chamada ao AbacatePay

---

## 🐛 Problemas Comuns

| Problema | Solução |
|----------|---------|
| QR Code não aparece | Verifique `ABACATEPAY_API_KEY` no `.env` |
| Erro de CORS | Verifique `CORS_ORIGIN=http://localhost:3000` |
| Erro de banco | Verifique se PostgreSQL está rodando |
| Frontend não carrega | Verifique se `node server.js` está rodando |

---

## 📞 Precisa de Ajuda?

Consulte o guia completo: `GUIA_TESTE_LOCAL_ABACATEPAY.md`

