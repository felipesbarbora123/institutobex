# 💰 Integração WhatsApp - Notificação de Pagamento Confirmado

## ✅ **IMPLEMENTADO!**

O sistema agora envia automaticamente uma mensagem WhatsApp quando um pagamento é confirmado pelo AbacatePay.

---

## 🎯 Funcionalidade

Quando um pagamento é confirmado:
1. ✅ **Verifica se o número tem WhatsApp** antes de enviar
2. ✅ **Envia mensagem personalizada** informando que o pagamento foi recebido
3. ✅ **Informa que o cliente está apto** a acessar o conteúdo da plataforma

---

## 📋 O Que Foi Implementado

### 1. **Função de Verificação de WhatsApp**
- Verifica se o número do cliente possui WhatsApp cadastrado
- Usa a API Evolution para verificar antes de enviar

### 2. **Função de Notificação de Pagamento**
- Envia mensagem formatada quando pagamento é confirmado
- Inclui nome do cliente, curso e valor (se disponível)
- Mensagem personalizada do Instituto Bex

### 3. **Endpoint de API**
- `POST /api/whatsapp/payment-confirmed`
- Recebe dados do pagamento e envia notificação

---

## 🔧 Como Integrar com Supabase

### Opção 1: Modificar Edge Function `confirm-purchase`

Na Edge Function do Supabase que confirma o pagamento, adicione uma chamada para o endpoint:

```javascript
// No final da função confirm-purchase, após criar a matrícula
async function confirmPurchase(externalId, billingId) {
  // ... código existente para confirmar pagamento ...
  
  // Buscar dados do pagamento
  const { data: purchase } = await supabase
    .from('course_purchases')
    .select(`
      *,
      courses (title),
      profiles (first_name, last_name)
    `)
    .eq('external_id', externalId)
    .single();
  
  if (purchase && purchase.customer_data?.phone) {
    // Chamar endpoint para enviar WhatsApp
    try {
      const response = await fetch('http://localhost:3000/api/whatsapp/payment-confirmed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: purchase.customer_data.name || 
                `${purchase.profiles?.first_name || ''} ${purchase.profiles?.last_name || ''}`.trim(),
          phone: purchase.customer_data.phone,
          courseTitle: purchase.courses?.title,
          amount: purchase.amount
        })
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('✅ Notificação WhatsApp enviada com sucesso');
      } else {
        console.warn('⚠️ Erro ao enviar WhatsApp:', result.error);
      }
    } catch (error) {
      console.error('❌ Erro ao chamar endpoint WhatsApp:', error);
      // Não falha o processo de confirmação se WhatsApp falhar
    }
  }
}
```

**⚠️ IMPORTANTE:** Em produção, substitua `http://localhost:3000` pela URL do seu servidor.

---

### Opção 2: Usar Database Trigger (Recomendado)

Crie um trigger no Supabase que chama o endpoint quando uma matrícula é criada:

```sql
-- Criar função para chamar webhook
CREATE OR REPLACE FUNCTION notify_payment_confirmed()
RETURNS TRIGGER AS $$
DECLARE
  purchase_data RECORD;
  customer_phone TEXT;
  customer_name TEXT;
  course_title TEXT;
BEGIN
  -- Buscar dados da compra
  SELECT 
    cp.customer_data->>'phone' as phone,
    cp.customer_data->>'name' as name,
    cp.amount,
    c.title as course_title
  INTO purchase_data
  FROM course_purchases cp
  LEFT JOIN courses c ON c.id = cp.course_id
  WHERE cp.user_id = NEW.user_id
    AND cp.course_id = NEW.course_id
    AND cp.payment_status = 'approved'
  ORDER BY cp.created_at DESC
  LIMIT 1;
  
  -- Se encontrou dados e tem telefone, chamar webhook
  IF purchase_data.phone IS NOT NULL THEN
    PERFORM net.http_post(
      url := 'http://seu-servidor.com:3000/api/whatsapp/payment-confirmed',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := json_build_object(
        'name', COALESCE(purchase_data.name, 'Cliente'),
        'phone', purchase_data.phone,
        'courseTitle', purchase_data.course_title,
        'amount', purchase_data.amount
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
CREATE TRIGGER on_enrollment_created
AFTER INSERT ON course_enrollments
FOR EACH ROW
EXECUTE FUNCTION notify_payment_confirmed();
```

**Nota:** Isso requer a extensão `pg_net` no Supabase.

---

### Opção 3: Webhook do AbacatePay

Configure o webhook do AbacatePay para chamar o endpoint diretamente quando o pagamento for confirmado.

No painel do AbacatePay, configure o webhook para:
```
URL: http://seu-servidor.com:3000/api/whatsapp/payment-confirmed
Método: POST
```

O webhook deve enviar no body:
```json
{
  "name": "Nome do Cliente",
  "phone": "5511999999999",
  "courseTitle": "Nome do Curso",
  "amount": 199.90
}
```

---

## 📡 Endpoint da API

### POST `/api/whatsapp/payment-confirmed`

Envia notificação de pagamento confirmado via WhatsApp.

**Request Body:**
```json
{
  "name": "João Silva",
  "phone": "5511999999999",
  "courseTitle": "Curso de Exemplo", // Opcional
  "amount": 199.90 // Opcional
}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "message": "Notificação de pagamento enviada com sucesso",
  "data": { /* resposta da API Evolution */ }
}
```

**Response (Erro):**
```json
{
  "success": false,
  "error": "Mensagem de erro"
}
```

---

## 📝 Formato da Mensagem

A mensagem enviada ao cliente será:

```
🎉 Pagamento Confirmado - Instituto Bex

Olá [Nome]! 👋

✅ Seu pagamento foi recebido com sucesso!

📚 Curso: [Nome do Curso]
💰 Valor: R$ [Valor]

🎓 A partir de agora, você está apto a acessar todo o conteúdo da plataforma do Instituto Bex!

Acesse sua conta e comece a estudar agora mesmo:
🔗 Acesse: https://institutobex.com.br

Bons estudos! 📖✨

---
Instituto Bex - Transformando vidas através da educação
```

---

## 🧪 Como Testar

### 1. Teste Manual

Execute o script de teste:
```bash
node test-payment-notification.js
```

**⚠️ IMPORTANTE:** Edite o script e substitua o número de teste por um número real que você tenha acesso.

### 2. Teste via Endpoint

Envie uma requisição POST:
```bash
curl -X POST http://localhost:3000/api/whatsapp/payment-confirmed \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "phone": "5511999999999",
    "courseTitle": "Curso de Teste",
    "amount": 199.90
  }'
```

### 3. Teste Real

1. Faça uma compra real no site
2. Complete o pagamento
3. Verifique se a mensagem WhatsApp foi enviada

---

## ⚙️ Configuração

### Variável de Ambiente (Opcional)

Se quiser personalizar a URL do site na mensagem, adicione no `.env`:

```env
APP_URL=https://institutobex.com.br
```

Se não configurar, usará `https://institutobex.com.br` como padrão.

---

## 🔍 Verificação de WhatsApp

O sistema verifica automaticamente se o número tem WhatsApp antes de enviar:

1. **Se o número TEM WhatsApp:**
   - ✅ Envia a mensagem normalmente
   - ✅ Registra sucesso nos logs

2. **Se o número NÃO TEM WhatsApp:**
   - ⚠️ Retorna erro informando que o número não possui WhatsApp
   - ⚠️ Não tenta enviar a mensagem
   - ⚠️ Registra aviso nos logs

**Nota:** Se a verificação falhar (erro na API), o sistema tentará enviar mesmo assim para não perder a notificação.

---

## 🐛 Solução de Problemas

### Erro: "Este número não possui WhatsApp cadastrado"
- **Causa:** O número informado não tem WhatsApp
- **Solução:** Verifique se o número está correto e se tem WhatsApp

### Erro: "Número de telefone inválido"
- **Causa:** Número com menos de 10 dígitos
- **Solução:** Verifique se o número está completo (com DDD e código do país)

### Erro: "API Error: 404"
- **Causa:** Endpoint da API Evolution não encontrado
- **Solução:** Verifique se a URL e instância estão corretas

### Erro: "Request Error: connect ECONNREFUSED"
- **Causa:** Servidor Node.js não está rodando
- **Solução:** Inicie o servidor com `npm start` ou `node server.js`

---

## 📚 Arquivos Modificados

1. **`whatsapp-api.js`**
   - ✅ Adicionada função `checkWhatsAppNumber()`
   - ✅ Adicionada função `sendPaymentConfirmation()`

2. **`server.js`**
   - ✅ Adicionado endpoint `/api/whatsapp/payment-confirmed`

3. **`test-payment-notification.js`** (novo)
   - ✅ Script de teste para notificação de pagamento

---

## 🔄 Próximos Passos

1. ✅ **Implementação concluída** - Funções criadas
2. ⬜ **Integrar com Edge Function** - Adicionar chamada no `confirm-purchase`
3. ⬜ **Testar com pagamento real** - Verificar funcionamento completo
4. ⬜ **Configurar URL de produção** - Atualizar `APP_URL` se necessário

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do servidor Node.js
2. Execute o script de teste: `node test-payment-notification.js`
3. Verifique se a API Evolution está funcionando
4. Confirme se o número tem WhatsApp cadastrado

---

**Data da implementação:** 17/11/2025
**Status:** ✅ Implementado e pronto para integração

