# 🔍 Problema: Compra não está sendo criada corretamente

## 📋 Problema Identificado

Quando o usuário faz um pagamento, o registro em `course_purchases` não está sendo criado, ou está sendo criado com `user_id` incorreto/temporário. Isso impede que a matrícula seja criada automaticamente quando o pagamento é confirmado.

## 🔄 Fluxo Esperado

1. **Usuário clica em "Comprar Curso"** → Frontend chama `create-purchase`
2. **Backend cria registro em `course_purchases`** → Com `user_id` correto do usuário logado
3. **Frontend chama `create-payment-pix` ou `create-payment-card`** → Gera QR Code ou link de pagamento
4. **Usuário paga** → AbacatePay processa
5. **Webhook confirma pagamento** → Backend atualiza `course_purchases` e cria `course_enrollments`

## ❌ Problema Atual

O endpoint `/api/purchases` (POST) não está recebendo o `user_id` correto porque:

1. **Token não está sendo enviado** pelo frontend quando chama `create-purchase`
2. **Ou o token está sendo enviado mas não está sendo extraído corretamente**
3. **Ou está sendo criado com `user_id` temporário** (UUID gerado), que não corresponde ao usuário logado

## ✅ Solução Aplicada

### 1. Correção na Extração do userId do Token

O código foi corrigido para extrair corretamente o `userId` do token JWT:

```javascript
// ANTES (ERRADO):
finalUserId = decoded.id;  // ❌ Token usa 'userId', não 'id'

// DEPOIS (CORRETO):
finalUserId = decoded.userId || decoded.id;  // ✅ Usa 'userId' primeiro
```

### 2. Logs Adicionados

Foram adicionados logs detalhados para debug:

```javascript
console.log('✅ userId extraído do token:', finalUserId);
console.log('✅ Token decodificado:', { userId: decoded.userId, id: decoded.id });
console.warn('⚠️ ATENÇÃO: Compra sendo criada com userId temporário!');
```

## 🔧 Verificações Necessárias

### 1. Verificar se o Frontend está Enviando o Token

O frontend deve enviar o token no header `Authorization` quando chama `create-purchase`:

```javascript
// No frontend, ao chamar create-purchase:
const token = localStorage.getItem('auth_token') || localStorage.getItem('sb-auth-token');
const authData = token ? JSON.parse(token) : null;
const accessToken = authData?.access_token || authData?.token;

// Ao fazer a requisição:
fetch('/api/purchases', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`  // ✅ IMPORTANTE!
  },
  body: JSON.stringify({
    courseId: '...',
    amount: 199.90,
    // ...
  })
});
```

### 2. Verificar Logs do Backend

Quando o usuário tentar comprar um curso, verifique os logs do backend:

```
📦 Recebida requisição para criar compra: {...}
📦 Headers Authorization: Presente  // ✅ Deve aparecer "Presente"
✅ userId extraído do token: 5e55c480-a333-4dfc-a000-9c277946f0c7  // ✅ Deve mostrar o userId correto
✅ Compra criada com sucesso: <id-da-compra>
```

Se aparecer:
```
⚠️ Token não fornecido ou inválido
🔑 Gerado UUID temporário para usuário: <uuid-temporario>
⚠️ ATENÇÃO: Compra sendo criada com userId temporário!
```

**Isso significa que o token não está sendo enviado ou está inválido!**

### 3. Verificar Interceptação no Frontend

A interceptação de `create-purchase` deve garantir que o token seja enviado:

```javascript
// Em supabase-replacement.js, na interceptação de functions.invoke('create-purchase')
const token = getAuthToken();
if (token) {
  headers.set('Authorization', `Bearer ${token}`);
}
```

## 🐛 Debug Passo a Passo

### Passo 1: Verificar se a Compra está Sendo Criada

No console do navegador, ao tentar comprar um curso, procure por:

```
🔄 Redirecionando função create-purchase via proxy local → produção
📡 Fazendo requisição para: http://localhost:3000/api/purchases (POST)
```

### Passo 2: Verificar Logs do Backend

No terminal do backend, procure por:

```
📦 Recebida requisição para criar compra: {...}
📦 Headers Authorization: Presente/Ausente
✅ userId extraído do token: <userId>
✅ Compra criada com sucesso: <id>
```

### Passo 3: Verificar no Banco de Dados

Execute no PostgreSQL:

```sql
-- Verificar últimas compras criadas
SELECT 
  id,
  user_id,
  course_id,
  amount,
  payment_status,
  external_id,
  created_at
FROM course_purchases
ORDER BY created_at DESC
LIMIT 10;

-- Verificar se o user_id corresponde ao usuário logado
SELECT * FROM course_purchases 
WHERE user_id = '5e55c480-a333-4dfc-a000-9c277946f0c7'
ORDER BY created_at DESC;
```

## 🔧 Correções Adicionais Necessárias

### 1. Garantir que o Token seja Enviado na Interceptação

Verifique se a interceptação de `functions.invoke('create-purchase')` está adicionando o token:

```javascript
// Em supabase-replacement.js, linha ~3266
const token = getAuthToken();
if (token) {
  headers.set('Authorization', `Bearer ${token}`);
  console.log('🔐 [INVOKE] Token adicionado para create-purchase');
} else {
  console.warn('⚠️ [INVOKE] Token NÃO encontrado para create-purchase!');
}
```

### 2. Verificar se o Frontend está Logado

Antes de criar a compra, verifique se o usuário está logado:

```javascript
// No frontend, antes de chamar create-purchase
const { user } = useAuth(); // ou window._useAuth()
if (!user || !user.id) {
  console.error('❌ Usuário não está logado!');
  // Redirecionar para login
  return;
}
```

## 📝 Checklist de Verificação

- [ ] Frontend está enviando token no header `Authorization` ao chamar `create-purchase`
- [ ] Backend está recebendo o token e extraindo `userId` corretamente
- [ ] Compra está sendo criada com `user_id` correto (não temporário)
- [ ] Logs do backend mostram "userId extraído do token" com o ID correto
- [ ] Não aparece "Gerado UUID temporário" nos logs
- [ ] Registro em `course_purchases` tem `user_id` correto no banco de dados

## 🎯 Próximos Passos

1. **Testar criação de compra** com usuário logado
2. **Verificar logs do backend** para confirmar que o token está sendo recebido
3. **Verificar no banco de dados** se a compra foi criada com `user_id` correto
4. **Se ainda não funcionar**, verificar a interceptação no frontend para garantir que o token está sendo enviado

## 🔗 Arquivos Relacionados

- `backend/routes/purchases.js` - Endpoint de criação de compra (linha ~887)
- `supabase-replacement.js` - Interceptação de `functions.invoke('create-purchase')` (linha ~3185)
- `backend/middleware/auth.js` - Middleware de autenticação (verifica token)

