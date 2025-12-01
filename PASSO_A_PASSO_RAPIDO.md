# ⚡ Passo a Passo Rápido - Publicar WhatsApp

## 🎯 Você tem acesso ao Supabase pelo Lovable? Perfeito!

Siga estes passos na ordem:

---

## ✅ PASSO 1: Criar Edge Function no Supabase (5 minutos)

### 1.1. Acessar Edge Functions
- URL: https://supabase.com/dashboard/project/qxgzazewwutbikmmpkms/edge-functions
- Clique em **"Create Function"**

### 1.2. Configurar
- **Nome:** `send-whatsapp-notification`
- **Template:** Blank

### 1.3. Copiar Código
- Abra o arquivo: **`supabase-edge-function-example.ts`**
- Copie TODO o conteúdo
- Cole no editor do Supabase

### 1.4. Deploy
- Clique em **"Deploy"**
- Aguarde alguns segundos

---

## ✅ PASSO 2: Configurar Variáveis de Ambiente (2 minutos)

### 2.1. Acessar Settings
- URL: https://supabase.com/dashboard/project/qxgzazewwutbikmmpkms/settings/edge-functions
- Vá em **"Secrets"** ou **"Environment Variables"**

### 2.2. Adicionar (uma por vez):
```
EVOLUTION_API_URL = https://mensadodo.dunis.com.br
EVOLUTION_API_KEY = 3B2F25CF7B2F-41F0-8EA1-2F021B2591FC
EVOLUTION_INSTANCE_NAME = Dunis
APP_URL = https://institutobex.com.br
```

---

## ✅ PASSO 3: Modificar `confirm-purchase` (5 minutos)

### 3.1. Abrir Função
- URL: https://supabase.com/dashboard/project/qxgzazewwutbikmmpkms/edge-functions
- Encontre: **`confirm-purchase`**
- Clique para abrir

### 3.2. Localizar Onde Criar Matrícula
- Procure por: `course_enrollments.insert(...)`
- Ou: `supabase.from('course_enrollments').insert(...)`

### 3.3. Adicionar Código
- Abra o arquivo: **`codigo-para-confirm-purchase.ts`**
- Copie TODO o conteúdo
- Cole **APÓS** a linha que cria a matrícula

### 3.4. Ajustar Campos (se necessário)
- No Supabase, vá em **Table Editor**
- Abra a tabela **`course_purchases`**
- Veja um registro e verifique como está o campo **`customer_data`**
- Se for diferente (ex: `phone_number` ao invés de `phone`), ajuste o código

### 3.5. Deploy
- Clique em **"Deploy"**

---

## ✅ PASSO 4: Testar (2 minutos)

### 4.1. Teste Manual
1. No Supabase, abra a função `send-whatsapp-notification`
2. Clique em **"Invoke"** ou **"Test"**
3. Cole este JSON:
```json
{
  "name": "João Silva",
  "phone": "5511999999999",
  "courseTitle": "Curso de Teste",
  "amount": 199.90
}
```
4. Clique em **"Run"**
5. Verifique se a mensagem chegou no WhatsApp

### 4.2. Teste Real
- Faça uma compra de teste no site
- Complete o pagamento
- Verifique se a mensagem WhatsApp foi enviada

---

## ✅ Pronto! 🎉

Agora, quando um pagamento for confirmado:
1. ✅ O sistema cria a matrícula
2. ✅ Envia mensagem WhatsApp automaticamente
3. ✅ Cliente recebe notificação no WhatsApp

---

## 🐛 Problemas?

Consulte o arquivo **`PUBLICAR_WHATSAPP_SUPABASE.md`** para solução de problemas detalhada.

---

## 📋 Checklist Final

- [ ] Edge Function `send-whatsapp-notification` criada
- [ ] Variáveis de ambiente configuradas
- [ ] Função `confirm-purchase` modificada
- [ ] Deploy realizado
- [ ] Teste manual funcionando
- [ ] Teste com pagamento real funcionando

---

**Tempo total estimado:** ~15 minutos  
**Dificuldade:** ⭐⭐ (Fácil)


