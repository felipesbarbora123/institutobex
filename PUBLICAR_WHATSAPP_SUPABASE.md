# 🚀 Guia: Publicar Integração WhatsApp no Supabase

## ✅ O que vamos fazer

1. **Criar Edge Function** para enviar notificações WhatsApp
2. **Modificar Edge Function** `confirm-purchase` para chamar WhatsApp quando pagamento for confirmado
3. **Configurar variáveis de ambiente** no Supabase

---

## 📋 Passo 1: Criar Edge Function `send-whatsapp-notification`

### 1.1. Acessar Edge Functions no Supabase

1. Acesse: https://supabase.com/dashboard/project/qxgzazewwutbikmmpkms/edge-functions
2. Clique em **"Create Function"** ou **"New Function"**

### 1.2. Configurar a Função

- **Nome da função:** `send-whatsapp-notification`
- **Template:** Escolha "Blank" ou "Hello World"

### 1.3. Copiar o Código

Abra o arquivo `supabase-edge-function-example.ts` e copie TODO o conteúdo.

Cole no editor da Edge Function no Supabase.

### 1.4. Fazer Deploy

1. Clique em **"Deploy"** ou **"Save"**
2. Aguarde o deploy completar (pode levar alguns segundos)

---

## 📋 Passo 2: Configurar Variáveis de Ambiente

### 2.1. Acessar Configurações

1. No painel do Supabase, vá em **Settings** → **Edge Functions**
2. Ou acesse: https://supabase.com/dashboard/project/qxgzazewwutbikmmpkms/settings/edge-functions

### 2.2. Adicionar Secrets

Clique em **"Secrets"** ou **"Environment Variables"** e adicione:

```
EVOLUTION_API_URL=https://mensadodo.dunis.com.br
EVOLUTION_API_KEY=3B2F25CF7B2F-41F0-8EA1-2F021B2591FC
EVOLUTION_INSTANCE_NAME=Dunis
APP_URL=https://institutobex.com.br
```

**⚠️ IMPORTANTE:** 
- Adicione cada variável separadamente
- Clique em **"Save"** após adicionar cada uma

---

## 📋 Passo 3: Modificar Edge Function `confirm-purchase`

### 3.1. Localizar a Função

1. Acesse: https://supabase.com/dashboard/project/qxgzazewwutbikmmpkms/edge-functions
2. Encontre a função **`confirm-purchase`**
3. Clique para abrir o código

### 3.2. Adicionar Código do WhatsApp

1. Localize onde a **matrícula é criada** (inserção em `course_enrollments`)
2. Procure por algo como:
   ```typescript
   await supabase.from('course_enrollments').insert(...)
   ```
3. **APÓS** essa linha, adicione o código do arquivo `codigo-para-confirm-purchase.ts`

### 3.3. Ajustar Campos (se necessário)

⚠️ **IMPORTANTE:** Verifique como os dados estão armazenados na sua tabela:

1. No Supabase Dashboard, vá em **Table Editor**
2. Abra a tabela **`course_purchases`**
3. Veja um registro de compra
4. Verifique como está o campo **`customer_data`**

**Exemplo de `customer_data`:**
```json
{
  "name": "João Silva",
  "phone": "5511999999999",
  "email": "joao@email.com"
}
```

Se os campos forem diferentes (ex: `phone_number` ao invés de `phone`), ajuste o código:

```typescript
const customerPhone = purchase.customer_data?.phone || 
                     purchase.customer_data?.phone_number ||  // ← Adicione aqui
                     purchase.customer_data?.telefone ||
                     purchase.phone;
```

### 3.4. Fazer Deploy

1. Clique em **"Deploy"** ou **"Save"**
2. Aguarde o deploy completar

---

## 📋 Passo 4: Testar a Integração

### 4.1. Teste Manual da Edge Function

Você pode testar a função `send-whatsapp-notification` diretamente:

1. No painel do Supabase, abra a função `send-whatsapp-notification`
2. Clique em **"Invoke"** ou **"Test"**
3. Use este JSON no body:

```json
{
  "name": "João Silva",
  "phone": "5511999999999",
  "courseTitle": "Curso de Teste",
  "amount": 199.90
}
```

4. Clique em **"Run"** ou **"Invoke"**
5. Verifique se a mensagem foi enviada no WhatsApp

### 4.2. Teste com Pagamento Real

1. Faça uma compra de teste no site
2. Complete o pagamento
3. Verifique se a mensagem WhatsApp foi enviada automaticamente

---

## ✅ Checklist de Publicação

- [ ] Edge Function `send-whatsapp-notification` criada e deployada
- [ ] Variáveis de ambiente configuradas:
  - [ ] `EVOLUTION_API_URL`
  - [ ] `EVOLUTION_API_KEY`
  - [ ] `EVOLUTION_INSTANCE_NAME`
  - [ ] `APP_URL`
- [ ] Edge Function `confirm-purchase` modificada com código do WhatsApp
- [ ] Campos ajustados conforme estrutura do `customer_data`
- [ ] Deploy da `confirm-purchase` realizado
- [ ] Teste manual da função realizado com sucesso
- [ ] Teste com pagamento real realizado

---

## 🐛 Solução de Problemas

### Erro: "Function not found"
- **Causa:** A função `send-whatsapp-notification` não foi criada
- **Solução:** Crie a função seguindo o Passo 1

### Erro: "Environment variable not found"
- **Causa:** Variáveis de ambiente não foram configuradas
- **Solução:** Configure as variáveis seguindo o Passo 2

### Erro: "Cannot read property 'phone' of undefined"
- **Causa:** Estrutura do `customer_data` é diferente
- **Solução:** Ajuste os campos conforme o Passo 3.3

### Mensagem não é enviada
- **Causa:** Número não tem WhatsApp ou API Evolution está offline
- **Solução:** 
  1. Verifique se o número tem WhatsApp
  2. Verifique se a API Evolution está funcionando
  3. Veja os logs da Edge Function no Supabase

---

## 📞 URLs Importantes

- **Dashboard Supabase:** https://supabase.com/dashboard/project/qxgzazewwutbikmmpkms
- **Edge Functions:** https://supabase.com/dashboard/project/qxgzazewwutbikmmpkms/edge-functions
- **Settings:** https://supabase.com/dashboard/project/qxgzazewwutbikmmpkms/settings/edge-functions
- **Table Editor:** https://supabase.com/dashboard/project/qxgzazewwutbikmmpkms/editor

---

## 📝 Notas Importantes

1. **O código está preparado para não falhar** se o WhatsApp não funcionar
2. **O pagamento será confirmado** mesmo se o WhatsApp falhar
3. **A mensagem só é enviada** se o número tiver WhatsApp
4. **Os logs ficam disponíveis** no painel do Supabase

---

**Data:** 17/11/2025  
**Status:** ✅ Pronto para publicação


