# ⚡ Resumo Rápido - Atualização Hostinger

## 🎯 O Que Fazer

**✅ NÃO precisa alterar NADA no site publicado na Hostinger!**

Apenas configure no Supabase:

---

## 📋 Passos (5 minutos)

### 1️⃣ Criar Função no Supabase
- Acesse: https://supabase.com/dashboard/project/qxgzazewwutbikmmpkms/edge-functions
- Clique: **Create Function**
- Nome: `send-whatsapp-notification`
- Cole o código de: `supabase-edge-function-example.ts`

### 2️⃣ Configurar Variáveis
- Settings → Edge Functions → Secrets
- Adicione:
  ```
  EVOLUTION_API_URL=https://mensadodo.dunis.com.br
  EVOLUTION_API_KEY=3B2F25CF7B2F-41F0-8EA1-2F021B2591FC
  EVOLUTION_INSTANCE_NAME=Dunis
  APP_URL=https://institutobex.com.br
  ```

### 3️⃣ Atualizar `confirm-purchase`
- Abra a função `confirm-purchase` no Supabase
- Adicione o código de envio de WhatsApp (ver `ATUALIZACAO_HOSTINGER.md` - Passo 2)
- Deploy

### 4️⃣ Testar
- Faça uma compra de teste
- Verifique se recebe WhatsApp

---

## ✅ Pronto!

O sistema agora envia WhatsApp automaticamente quando o pagamento é confirmado.

---

**Para detalhes completos, veja:** `ATUALIZACAO_HOSTINGER.md`

