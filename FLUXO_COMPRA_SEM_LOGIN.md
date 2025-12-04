# 🛒 Fluxo de Compra sem Login - Como Funciona

## 📋 Visão Geral

O sistema suporta compras de usuários que **não estão logados**. Quando o pagamento é confirmado, o sistema:
1. Cria automaticamente uma conta para o usuário (baseado no email)
2. Atualiza a compra com o `user_id` correto
3. Cria a matrícula no curso
4. Envia credenciais por WhatsApp (se disponível)

## 🔄 Fluxo Completo

### 1. Usuário Compra sem Estar Logado

```
Usuário → Seleciona Curso → Preenche Dados (Nome, CPF, Email, Telefone)
  ↓
Frontend chama create-purchase (SEM token de autenticação)
  ↓
Backend cria compra com UUID temporário
  ↓
course_purchases: {
  user_id: "uuid-temporario-gerado",
  course_id: "...",
  payment_status: "pending",
  customer_data: { name, email, phone, taxId }
}
```

### 2. Pagamento é Processado

```
Usuário paga via PIX/Cartão → AbacatePay processa
  ↓
AbacatePay confirma pagamento → Envia webhook
  ↓
Backend recebe webhook ou verifica status
```

### 3. Confirmação de Pagamento (Webhook ou Status Check)

**O sistema agora faz:**

1. **Verifica se `user_id` existe no banco**
   - Se não existir (é UUID temporário), procura usuário por email
   - Se encontrar, usa o ID existente
   - Se não encontrar, cria novo usuário

2. **Cria usuário (se necessário)**
   - Cria em `auth.users`
   - Cria perfil em `profiles`
   - Cria role `student` em `user_roles`
   - Gera senha temporária (últimos 6 dígitos do CPF/telefone + iniciais do nome)

3. **Atualiza a compra**
   - Atualiza `user_id` na compra (de UUID temporário para ID real)
   - Atualiza `payment_status` para `paid`

4. **Cria matrícula**
   - Cria registro em `course_enrollments` com `user_id` correto

5. **Envia credenciais (se WhatsApp disponível)**
   - Envia email e senha temporária por WhatsApp

### 4. Usuário Faz Login Depois

```
Usuário recebe credenciais → Faz login com email/senha temporária
  ↓
Sistema autentica → Retorna token
  ↓
Usuário acessa "Meus Cursos"
  ↓
Sistema busca matrículas por user_id
  ↓
Mostra cursos matriculados ✅
```

## ✅ Correções Aplicadas

### 1. Webhook Agora Cria/Atualiza Usuário

O webhook (`/api/webhooks/abacatepay`) agora:
- ✅ Verifica se `user_id` da compra existe
- ✅ Busca usuário por email se `user_id` for temporário
- ✅ Cria novo usuário se não existir
- ✅ Atualiza `user_id` na compra antes de criar matrícula
- ✅ Cria matrícula com `user_id` correto

### 2. Endpoint de Status Também Faz Isso

O endpoint `/api/purchases/payment/status/:billingId` já tinha essa lógica implementada.

### 3. Endpoint de Confirmação Manual

O endpoint `/api/purchases/confirm` requer autenticação, então é usado apenas quando o usuário já está logado.

## 🔍 Verificações Necessárias

### 1. Verificar se o Email está Sendo Enviado

O frontend deve enviar o email do cliente em `customerData.email`:

```javascript
// No frontend, ao criar compra:
{
  courseId: "...",
  amount: 199.90,
  customerData: {
    name: "João Silva",
    email: "joao@exemplo.com",  // ✅ IMPORTANTE!
    phone: "11999999999",
    taxId: "12345678900"
  }
}
```

### 2. Verificar Logs do Backend

Quando o pagamento é confirmado, você deve ver nos logs:

```
✅ [WEBHOOK] Usuário já existe por email, usando ID: <id>
OU
👤 [WEBHOOK] Criando novo usuário para o cliente...
✅ [WEBHOOK] Usuário criado com sucesso! ID: <id>
✅ [WEBHOOK] Matrícula criada para o curso com user_id: <id>
```

### 3. Verificar no Banco de Dados

```sql
-- Verificar compras com user_id temporário
SELECT 
  id,
  user_id,
  course_id,
  payment_status,
  customer_data->>'email' as email,
  created_at
FROM course_purchases
WHERE payment_status = 'paid'
  AND user_id NOT IN (SELECT id FROM profiles)
ORDER BY created_at DESC;

-- Verificar se matrículas foram criadas
SELECT 
  ce.*,
  c.title as course_title,
  p.email
FROM course_enrollments ce
JOIN courses c ON c.id = ce.course_id
LEFT JOIN auth.users p ON p.id = ce.user_id
WHERE ce.user_id IN (
  SELECT user_id FROM course_purchases 
  WHERE payment_status = 'paid'
)
ORDER BY ce.enrolled_at DESC;
```

## ⚠️ Problemas Potenciais

### 1. Email Não Enviado no customerData

**Sintoma:** Compra criada com UUID temporário, mas usuário não é criado quando pagamento é confirmado.

**Solução:** Garantir que o frontend sempre envie `customerData.email`.

### 2. Usuário Já Existe mas com Email Diferente

**Sintoma:** Sistema cria novo usuário mesmo que já exista um com email similar.

**Solução:** O código já normaliza o email (`.toLowerCase().trim()`), mas verificar se há emails duplicados.

### 3. Matrícula Criada com UUID Temporário

**Sintoma:** Matrícula criada antes de atualizar `user_id` na compra.

**Solução:** ✅ Já corrigido - agora atualiza `user_id` antes de criar matrícula.

## 📝 Checklist de Teste

Para testar o fluxo completo:

- [ ] Usuário **não logado** acessa checkout
- [ ] Preenche dados (nome, email, CPF, telefone)
- [ ] Seleciona método de pagamento (PIX ou Cartão)
- [ ] Compra é criada com UUID temporário
- [ ] Pagamento é processado e confirmado
- [ ] Webhook/Status check cria usuário automaticamente
- [ ] Compra é atualizada com `user_id` correto
- [ ] Matrícula é criada com `user_id` correto
- [ ] Credenciais são enviadas por WhatsApp (se configurado)
- [ ] Usuário faz login com credenciais recebidas
- [ ] Usuário acessa "Meus Cursos" e vê o curso matriculado ✅

## 🔗 Arquivos Relacionados

- `backend/routes/purchases.js` - Criação de compra e verificação de status
- `backend/routes/webhooks.js` - Processamento de webhooks (CORRIGIDO)
- `backend/routes/enrollments.js` - Listagem de matrículas

## ✅ Status

- ✅ Compra sem login: Funcional
- ✅ Criação automática de usuário: Implementada
- ✅ Atualização de `user_id` na compra: Implementada
- ✅ Criação de matrícula: Funcional
- ✅ Envio de credenciais: Implementado (se WhatsApp configurado)

