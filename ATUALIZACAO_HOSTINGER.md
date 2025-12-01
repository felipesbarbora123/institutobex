# 🔄 Guia de Atualização - Hostinger (Projeto Já Publicado)

## 📋 Situação Atual

✅ **Projeto já publicado na Hostinger:**
- Localização: `C:\Users\felip\Downloads\institutobex.com\public_html\`
- Tipo: Frontend estático (React/Vite compilado)
- Status: Funcionando normalmente
- Backend: Supabase (Edge Functions)

## 🎯 O Que Precisa Ser Feito

**NÃO precisa alterar nada no frontend publicado!** ✅

Apenas precisamos:
1. ✅ Criar Edge Function no Supabase para WhatsApp
2. ✅ Integrar com a função `confirm-purchase` existente

---

## 📝 Passo a Passo

### **PASSO 1: Criar Edge Function no Supabase** ⭐

1. **Acesse o Dashboard do Supabase:**
   ```
   https://supabase.com/dashboard/project/qxgzazewwutbikmmpkms
   ```

2. **Vá em Edge Functions:**
   - Menu lateral → **Edge Functions**
   - Clique em **Create Function**

3. **Configure a função:**
   - **Nome:** `send-whatsapp-notification`
   - **Template:** Empty Function

4. **Cole o código:**
   - Abra o arquivo `supabase-edge-function-example.ts` deste projeto
   - Copie TODO o conteúdo
   - Cole no editor do Supabase

5. **Configure Variáveis de Ambiente:**
   - No Supabase, vá em **Settings** → **Edge Functions** → **Secrets**
   - Adicione as seguintes variáveis:
     ```
     EVOLUTION_API_URL=https://mensadodo.dunis.com.br
     EVOLUTION_API_KEY=3B2F25CF7B2F-41F0-8EA1-2F021B2591FC
     EVOLUTION_INSTANCE_NAME=Dunis
     APP_URL=https://institutobex.com.br
     ```

6. **Faça Deploy:**
   - Clique em **Deploy**
   - Aguarde o deploy completar

7. **Teste a função:**
   - Vá em **Edge Functions** → `send-whatsapp-notification` → **Invoke**
   - Use este JSON de teste:
     ```json
     {
       "name": "Teste",
       "phone": "5511999999999",
       "courseTitle": "Curso de Teste",
       "amount": 199.90
     }
     ```
   - ⚠️ **IMPORTANTE:** Use um número real que você tenha acesso para testar

---

### **PASSO 2: Integrar com `confirm-purchase`**

Agora precisamos modificar a Edge Function `confirm-purchase` existente para chamar a função de WhatsApp.

1. **Acesse a função `confirm-purchase`:**
   - No Supabase Dashboard → **Edge Functions**
   - Clique em `confirm-purchase`

2. **Localize onde a matrícula é criada:**
   - Procure por código que insere em `course_enrollments`
   - Geralmente após confirmar o pagamento

3. **Adicione o código para enviar WhatsApp:**
   
   **Adicione ANTES do final da função, após criar a matrícula:**
   
   ```typescript
   // ============================================
   // ENVIAR NOTIFICAÇÃO WHATSAPP
   // ============================================
   try {
     // Buscar dados completos da compra
     const { data: purchase, error: purchaseError } = await supabase
       .from('course_purchases')
       .select(`
         *,
         courses (title),
         profiles (first_name, last_name)
       `)
       .eq('external_id', externalId)
       .single();
     
     if (!purchaseError && purchase) {
       // Extrair telefone do customer_data
       const customerPhone = purchase.customer_data?.phone || 
                            purchase.customer_data?.phone_number ||
                            purchase.phone;
       
       if (customerPhone) {
         // Montar nome do cliente
         const customerName = purchase.customer_data?.name || 
                             purchase.customer_data?.full_name ||
                             `${purchase.profiles?.first_name || ''} ${purchase.profiles?.last_name || ''}`.trim() ||
                             'Cliente';
         
         // Chamar função de WhatsApp
         const whatsappResponse = await fetch(
           `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-whatsapp-notification`,
           {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
             },
             body: JSON.stringify({
               name: customerName,
               phone: customerPhone,
               courseTitle: purchase.courses?.title || null,
               amount: purchase.amount || null
             })
           }
         );
         
         if (whatsappResponse.ok) {
           const whatsappResult = await whatsappResponse.json();
           console.log('✅ Notificação WhatsApp enviada:', whatsappResult);
         } else {
           const errorText = await whatsappResponse.text();
           console.warn('⚠️ Erro ao enviar WhatsApp:', errorText);
           // Não falha o processo se WhatsApp falhar
         }
       } else {
         console.log('ℹ️ Telefone não encontrado, WhatsApp não será enviado');
       }
     }
   } catch (whatsappError) {
     console.error('❌ Erro ao processar WhatsApp:', whatsappError);
     // Não falha o processo de confirmação se WhatsApp falhar
   }
   ```

4. **Salve e faça Deploy:**
   - Clique em **Deploy**
   - Aguarde o deploy completar

---

### **PASSO 3: Verificar Configuração**

1. **Verifique se as variáveis de ambiente estão configuradas:**
   - Settings → Edge Functions → Secrets
   - Deve ter: `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE_NAME`, `APP_URL`

2. **Verifique se a função está ativa:**
   - Edge Functions → `send-whatsapp-notification`
   - Status deve estar como "Active"

---

### **PASSO 4: Testar**

1. **Faça uma compra de teste no site:**
   - Acesse: https://institutobex.com.br
   - Faça login
   - Selecione um curso
   - Complete o checkout
   - Faça o pagamento (PIX ou Cartão)

2. **Aguarde a confirmação:**
   - O sistema confirmará o pagamento automaticamente
   - A função `confirm-purchase` será chamada
   - A função de WhatsApp será acionada

3. **Verifique o WhatsApp:**
   - O cliente deve receber a mensagem no número cadastrado
   - Verifique os logs no Supabase se não receber

4. **Verifique os logs:**
   - No Supabase Dashboard → Edge Functions → `confirm-purchase` → Logs
   - Procure por mensagens de sucesso ou erro do WhatsApp

---

## ✅ Checklist Final

- [ ] Edge Function `send-whatsapp-notification` criada
- [ ] Variáveis de ambiente configuradas
- [ ] Função `confirm-purchase` atualizada
- [ ] Deploy realizado com sucesso
- [ ] Teste realizado com compra real
- [ ] WhatsApp recebido pelo cliente

---

## 🐛 Solução de Problemas

### Erro: "Function not found"
- **Solução:** Verifique se o nome da função está correto: `send-whatsapp-notification`
- Verifique se fez deploy da função

### Erro: "Unauthorized" ou "401"
- **Solução:** Verifique se está usando `SUPABASE_ANON_KEY` corretamente
- Verifique se a chave está configurada nas variáveis de ambiente

### Erro: "Evolution API error"
- **Solução:** Verifique se as credenciais da Evolution API estão corretas
- Verifique se a instância "Dunis" está conectada
- Teste a API diretamente: `https://mensadodo.dunis.com.br/instance/fetchInstances`

### WhatsApp não é enviado
- **Solução:** 
  1. Verifique os logs da função `confirm-purchase`
  2. Verifique se o telefone está no formato correto (com DDD e código do país)
  3. Verifique se o número tem WhatsApp cadastrado
  4. Teste a função `send-whatsapp-notification` manualmente

### Telefone não encontrado
- **Solução:** Verifique como o telefone está armazenado em `course_purchases.customer_data`
- Pode estar em: `phone`, `phone_number`, `telefone`, etc.
- Ajuste o código para buscar no campo correto

---

## 📝 Notas Importantes

1. **Não precisa alterar o frontend:** O código já publicado na Hostinger continua funcionando normalmente.

2. **Tudo acontece no Supabase:** As funções rodam no Supabase, não na Hostinger.

3. **Se WhatsApp falhar:** O processo de confirmação de pagamento NÃO é interrompido. O cliente ainda recebe acesso ao curso.

4. **Logs:** Sempre verifique os logs no Supabase para diagnosticar problemas.

5. **Testes:** Sempre teste com um número real antes de colocar em produção.

---

## 🔗 Arquivos de Referência

- **Código da Edge Function:** `supabase-edge-function-example.ts`
- **Documentação completa:** `GUIA_PUBLICACAO_HOSTINGER.md`
- **Integração WhatsApp:** `INTEGRACAO_WHATSAPP_PAGAMENTO.md`

---

## 📞 Próximos Passos Após Implementação

1. ✅ Monitorar logs por alguns dias
2. ✅ Verificar se todas as compras estão gerando WhatsApp
3. ✅ Coletar feedback dos clientes
4. ✅ Ajustar mensagem se necessário

---

**Última atualização:** 17/11/2025  
**Status:** ✅ Pronto para implementação

