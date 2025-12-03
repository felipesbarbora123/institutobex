# 🚀 Deploy da Correção WhatsApp - Portainer

## 📋 Arquivo Modificado

**Arquivo que precisa ser atualizado:**
- `backend/routes/purchases.js`

## ✅ Passo a Passo para Deploy

### **PASSO 1: Fazer Commit e Push no Git**

No seu computador local:

```bash
# Verificar o arquivo modificado
git status

# Adicionar o arquivo modificado
git add backend/routes/purchases.js

# Fazer commit
git commit -m "fix: Corrigir envio de WhatsApp quando pagamento é confirmado"

# Fazer push para o repositório
git push
```

---

### **PASSO 2: Atualizar no Servidor (via Git)**

**Opção A: Se o backend está em um repositório Git no servidor**

1. **Conectar ao servidor via SSH:**
   ```bash
   ssh root@46.224.47.128
   # ou o IP/domínio do seu servidor
   ```

2. **Navegar até a pasta do backend:**
   ```bash
   cd /opt/institutobex/backend
   # ou o caminho onde está o backend no servidor
   ```

3. **Atualizar via Git:**
   ```bash
   git pull
   ```

4. **Verificar se o arquivo foi atualizado:**
   ```bash
   git log -1
   # Deve mostrar o último commit
   ```

---

**Opção B: Se você faz upload manual dos arquivos**

1. **Fazer upload do arquivo via SCP:**
   ```bash
   # Do seu computador local
   scp backend/routes/purchases.js root@46.224.47.128:/opt/institutobex/backend/routes/
   ```

2. **Ou via SFTP (FileZilla, WinSCP):**
   - Conecte ao servidor
   - Navegue até `/opt/institutobex/backend/routes/`
   - Faça upload do arquivo `purchases.js`

---

### **PASSO 3: Configurar Variável de Ambiente no Portainer**

⚠️ **IMPORTANTE**: O backend precisa da variável `API_URL` configurada para chamar a si mesmo!

1. **Acesse o Portainer** (via navegador)

2. **Vá em Containers** → Selecione o container do backend (`institutobex-backend`)

3. **Clique em "Duplicate/Edit"** (ou "Edit" se disponível)

4. **Vá na aba "Environment"** (ou "Env" / "Variáveis de Ambiente")

5. **Adicione ou edite a variável:**
   - **Name**: `API_URL`
   - **Value**: `http://46.224.47.128:3001`
   
   ⚠️ **IMPORTANTE**: Use o IP ou domínio do seu servidor onde o backend está rodando!

6. **Verifique se as outras variáveis do WhatsApp estão configuradas:**
   - `EVOLUTION_API_URL` ✅ (já configurado segundo você)
   - `EVOLUTION_API_KEY` ✅ (já configurado segundo você)
   - `EVOLUTION_INSTANCE_NAME` ✅ (já configurado segundo você)
   - `API_URL` ⚠️ **NOVO - precisa adicionar!**

7. **Clique em "Deploy the container"** (ou "Update the container")

---

### **PASSO 4: Reiniciar o Container**

Após atualizar o código e as variáveis de ambiente:

1. **No Portainer**, vá em **Containers**
2. Selecione o container `institutobex-backend`
3. Clique em **Restart** (ou **Recreate** se necessário)

---

### **PASSO 5: Verificar os Logs**

Após reiniciar, verifique se está funcionando:

1. **No Portainer**, vá em **Containers** → `institutobex-backend`
2. Clique em **Logs**
3. Procure por mensagens como:
   - `🔍 [STATUS] API_URL configurado: http://46.224.47.128:3001`
   - `📱 [STATUS] ENVIANDO WHATSAPP - PAGAMENTO CONFIRMADO`
   - `✅ [STATUS] Notificação WhatsApp enviada com sucesso!`

---

## 🔍 Verificação Final

### **Teste Manual:**

1. Faça um pagamento de teste
2. Confirme o pagamento manualmente (ou aguarde confirmação automática)
3. Verifique os logs do container para ver se o WhatsApp foi enviado
4. Verifique se a mensagem chegou no WhatsApp do cliente

### **Logs Esperados:**

Quando o pagamento for confirmado, você deve ver nos logs:

```
💰 [STATUS] PAGAMENTO CONFIRMADO! Atualizando banco...
📱 [STATUS] ENVIANDO WHATSAPP - PAGAMENTO CONFIRMADO
🔍 [STATUS] API_URL configurado: http://46.224.47.128:3001
📱 [STATUS] URL: http://46.224.47.128:3001/api/whatsapp/send
✅ [STATUS] Notificação WhatsApp enviada com sucesso!
```

---

## ⚠️ Problemas Comuns

### **Erro: "API_URL não configurado"**

**Solução:** Adicione a variável `API_URL` no Portainer com o valor `http://46.224.47.128:3001`

### **Erro: "Connection refused" ao chamar WhatsApp**

**Solução:** Verifique se:
- O container do backend está rodando
- A porta 3001 está mapeada corretamente
- O `API_URL` está correto (deve ser acessível do próprio servidor)

### **WhatsApp não está sendo enviado**

**Solução:** Verifique os logs do container:
- Procure por erros relacionados ao WhatsApp
- Verifique se as credenciais da Evolution API estão corretas
- Verifique se o número de telefone está no formato correto

---

## 📝 Resumo das Mudanças

### **O que foi corrigido:**

1. ✅ WhatsApp agora é enviado **SEMPRE** quando o status é `paid`, mesmo se já estava `paid` antes
2. ✅ Logs detalhados adicionados para facilitar debug
3. ✅ Tratamento de erros melhorado
4. ✅ Uso de `API_URL` para chamar o próprio backend

### **Arquivo modificado:**

- `backend/routes/purchases.js` (linhas ~504-602)

### **Variável de ambiente necessária:**

- `API_URL=http://46.224.47.128:3001` (ou `https://api.institutobex.com.br` se tiver domínio)
  - ⚠️ **OBRIGATÓRIA** - Deve estar configurada no Portainer
  - ⚠️ **NÃO usar `localhost`** - Use o IP ou domínio real do servidor
  - O backend usa esta URL para fazer self-call e enviar WhatsApp

---

## ✅ Checklist

- [ ] Fazer commit e push do arquivo `backend/routes/purchases.js`
- [ ] Atualizar código no servidor (via `git pull` ou upload manual)
- [ ] Adicionar variável `API_URL` no Portainer
- [ ] Reiniciar container do backend
- [ ] Verificar logs do container
- [ ] Testar pagamento e verificar se WhatsApp é enviado

---

**Pronto!** Após seguir esses passos, o WhatsApp deve ser enviado automaticamente quando o pagamento for confirmado! 🚀

