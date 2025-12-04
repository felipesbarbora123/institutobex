# 🔐 Uso da Senha Fornecida no Checkout

## ✅ Correção Aplicada

O sistema agora usa a **senha fornecida pelo usuário no campo "Criar Senha" do checkout** em vez de gerar uma senha aleatória.

## 📋 Como Funciona

### 1. Frontend Envia Senha no `customerData`

Quando o usuário preenche o checkout e cria uma conta, o frontend deve enviar a senha no `customerData`:

```javascript
// Exemplo de como o frontend deve enviar
{
  courseId: "...",
  amount: 199.90,
  customerData: {
    name: "João Silva",
    email: "joao@exemplo.com",
    phone: "11999999999",
    taxId: "12345678900",
    password: "senha123"  // ✅ Campo de senha fornecido pelo usuário
  }
}
```

### 2. Campos Aceitos para Senha

O sistema aceita a senha em qualquer um dos seguintes campos (em ordem de prioridade):

1. `customerData.password`
2. `customerData.createPassword`
3. `customerData.create_password`

**Exemplo:**
```javascript
// Qualquer um desses campos será aceito:
customerData: {
  password: "senha123"  // ✅ Prioridade 1
}

// OU
customerData: {
  createPassword: "senha123"  // ✅ Prioridade 2
}

// OU
customerData: {
  create_password: "senha123"  // ✅ Prioridade 3
}
```

### 3. Fallback para Senha Temporária

Se nenhuma senha for fornecida, o sistema gera uma senha temporária usando:
- Últimos 6 dígitos do CPF + iniciais do nome
- OU últimos 6 dígitos do telefone + iniciais do nome
- OU senha aleatória de 6 dígitos + iniciais do nome

## 🔧 Onde a Mudança Foi Aplicada

### 1. Endpoint de Status (`/api/purchases/payment/status/:billingId`)

Quando o pagamento é confirmado e o sistema verifica o status, ele:
- ✅ Verifica se há senha em `customerData.password`, `customerData.createPassword` ou `customerData.create_password`
- ✅ Usa a senha fornecida se disponível
- ✅ Gera senha temporária apenas se nenhuma senha for fornecida

### 2. Webhook (`/api/webhooks/abacatepay`)

Quando o webhook confirma o pagamento, ele:
- ✅ Verifica se há senha em `customerData.password`, `customerData.createPassword` ou `customerData.create_password`
- ✅ Usa a senha fornecida se disponível
- ✅ Gera senha temporária apenas se nenhuma senha for fornecida

## 📱 Mensagem WhatsApp

A mensagem enviada por WhatsApp agora diferencia entre senha fornecida e senha temporária:

### Se Senha Foi Fornecida:
```
🔐 *Credenciais de Acesso - Instituto Bex*

Olá João Silva! 👋

✅ *Sua conta foi criada com sucesso!*

📧 *Email:* joao@exemplo.com
🔑 *Senha:* senha123

🔗 Acesse: http://localhost:3000

Bons estudos! 📖✨
```

### Se Senha NÃO Foi Fornecida (Temporária):
```
🔐 *Credenciais de Acesso - Instituto Bex*

Olá João Silva! 👋

✅ *Sua conta foi criada com sucesso!*

📧 *Email:* joao@exemplo.com
🔑 *Senha temporária:* JO123456

⚠️ *Importante:* Altere sua senha após o primeiro acesso.

🔗 Acesse: http://localhost:3000

Bons estudos! 📖✨
```

## 🔍 Logs do Backend

Os logs do backend indicam qual senha está sendo usada:

### Senha Fornecida:
```
✅ [STATUS] Usando senha fornecida pelo usuário no checkout
✅ [STATUS] Usuário criado com sucesso! ID: <id>
```

### Senha Temporária:
```
⚠️ [STATUS] Senha não fornecida, gerando senha temporária
✅ [STATUS] Usuário criado com sucesso! ID: <id>
```

## ⚠️ Importante para o Frontend

### 1. Enviar Senha no `customerData`

O frontend **DEVE** enviar a senha no `customerData` quando o usuário preenche o campo "Criar Senha" no checkout:

```javascript
// No checkout, ao criar a compra:
const customerData = {
  name: formData.name,
  email: formData.email,
  phone: formData.phone,
  taxId: formData.cpf,
  password: formData.password  // ✅ IMPORTANTE: Enviar a senha aqui
};

// Ao chamar create-purchase:
await supabase.functions.invoke('create-purchase', {
  body: {
    courseId: courseId,
    amount: amount,
    customerData: customerData  // ✅ Inclui a senha
  }
});
```

### 2. Não Enviar Senha em Texto Plano em Logs

⚠️ **ATENÇÃO:** Não logar a senha em texto plano por questões de segurança. O backend já faz hash da senha antes de armazenar.

### 3. Validação no Frontend

O frontend deve validar a senha antes de enviar:
- Mínimo de caracteres (recomendado: 6-8 caracteres)
- Confirmação de senha (senha e confirmação devem ser iguais)

## ✅ Checklist

- [ ] Frontend envia `password` no `customerData` ao criar compra
- [ ] Campo de senha no checkout está funcionando
- [ ] Senha é validada no frontend antes de enviar
- [ ] Backend está recebendo a senha corretamente (verificar logs)
- [ ] Usuário consegue fazer login com a senha fornecida
- [ ] Mensagem WhatsApp mostra a senha correta

## 🔗 Arquivos Modificados

- `backend/routes/purchases.js` - Endpoint de status (linha ~687)
- `backend/routes/webhooks.js` - Webhook (linha ~104)

## 📝 Notas

- A senha é armazenada com hash usando `bcrypt` (10 rounds)
- A senha nunca é armazenada em texto plano
- Se a senha não for fornecida, o sistema gera uma temporária automaticamente
- O sistema aceita múltiplos nomes de campo para compatibilidade (`password`, `createPassword`, `create_password`)

