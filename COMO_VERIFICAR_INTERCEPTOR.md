# 🔍 Como Verificar se o Interceptor Está Funcionando

## 📋 Status Atual

**O frontend ainda usa o Supabase**, mas o interceptor **redireciona as chamadas** para o novo backend.

## ✅ Como Funciona

1. **Frontend compilado** → Ainda tem código do Supabase
2. **Interceptor JavaScript** → Intercepta as chamadas antes de saírem
3. **Redirecionamento** → Envia para `http://localhost:3001` (novo backend)

## 🧪 Como Verificar

### 1. Abra o Console do Navegador (F12)

### 2. Procure por estas mensagens:

Quando o interceptor carregar, você deve ver:
```
✅ Interceptor do Supabase carregado!
```

Quando uma função for chamada, você deve ver:
```
🔄 Interceptando chamada do Supabase: create-payment-pix → http://localhost:3001/api/purchases/payment/pix
```

### 3. Verifique a aba Network (Rede)

1. Abra o DevTools (F12)
2. Vá na aba **Network**
3. Tente gerar um QR Code no checkout
4. Procure por requisições para:
   - ✅ `http://localhost:3001/api/purchases/...` (interceptado - correto!)
   - ❌ `https://qxgzazewwutbikmmpkms.supabase.co/...` (não interceptado - problema!)

### 4. Teste Manual

Abra o console e execute:

```javascript
// Verificar se o interceptor está carregado
console.log('Interceptor carregado:', typeof window.fetch !== 'undefined');

// Verificar se o Supabase está sendo interceptado
fetch('https://qxgzazewwutbikmmpkms.supabase.co/functions/v1/create-purchase', {
  method: 'POST',
  body: JSON.stringify({ test: true })
}).then(r => {
  console.log('URL final chamada:', r.url);
  console.log('Deve ser:', 'http://localhost:3001/api/purchases');
});
```

## ⚠️ Problemas Comuns

### 1. Interceptor não está carregando

**Sintoma:** Não vê a mensagem "✅ Interceptor do Supabase carregado!"

**Solução:**
- Verifique se o arquivo `supabase-interceptor.js` existe na raiz do projeto
- Verifique o console do servidor Node.js para erros
- Verifique se o `server.js` está servindo o HTML corretamente

### 2. Chamadas ainda vão para o Supabase

**Sintoma:** Na aba Network, vê requisições para `supabase.co`

**Solução:**
- O interceptor pode não estar interceptando corretamente
- Verifique se o código do Supabase está usando `functions.invoke()` ou `fetch()` diretamente
- Pode ser necessário ajustar o interceptor

### 3. Erro de CORS

**Sintoma:** Erro "CORS policy" no console

**Solução:**
- Verifique se o backend está configurado para aceitar requisições do frontend
- Verifique `CORS_ORIGIN` no `backend/.env`
- O backend deve ter `cors` configurado (já está configurado)

## 📝 Nota Importante

O interceptor funciona **interceptando as chamadas**, mas o código do frontend ainda referencia o Supabase. Isso é normal e funciona perfeitamente!

Para uma solução permanente, seria necessário:
1. Recompilar o frontend apontando para o novo backend
2. Ou manter o interceptor (solução atual)

## ✅ Checklist

- [ ] Interceptor está sendo injetado no HTML
- [ ] Mensagem "✅ Interceptor do Supabase carregado!" aparece no console
- [ ] Chamadas são redirecionadas para `localhost:3001`
- [ ] Backend está rodando na porta 3001
- [ ] Não há erros de CORS

