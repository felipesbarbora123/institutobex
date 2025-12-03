# 🚀 Deploy dos Endpoints de Usuários - Portainer

## 📋 Arquivos que Precisam ser Atualizados no Backend de Produção

**Arquivos novos/modificados:**
- `backend/routes/users.js` ⚠️ **NOVO** - Precisa ser criado no servidor
- `backend/server.js` - Precisa ser atualizado (já tem a importação e rota)

## ✅ Passo a Passo para Deploy

### **PASSO 1: Fazer Commit e Push no Git**

No seu computador local:

```bash
# Verificar os arquivos modificados
git status

# Adicionar os arquivos novos/modificados
git add backend/routes/users.js backend/server.js supabase-replacement.js backend/routes/enrollments.js

# Fazer commit
git commit -m "feat: Adicionar endpoints de usuários (profile e roles) e redirecionamento de course_enrollments"

# Fazer push para o repositório
git push
```

---

### **PASSO 2: Atualizar no Servidor (via Git)**

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

4. **Verificar se os arquivos foram atualizados:**
   ```bash
   # Verificar se o arquivo users.js existe
   ls -la routes/users.js
   
   # Verificar se server.js foi atualizado
   grep "usersRoutes" server.js
   ```

---

**Opção B: Se você faz upload manual dos arquivos**

1. **Fazer upload do arquivo novo via SCP:**
   ```bash
   # Do seu computador local
   scp backend/routes/users.js root@46.224.47.128:/opt/institutobex/backend/routes/
   ```

2. **Atualizar server.js:**
   ```bash
   scp backend/server.js root@46.224.47.128:/opt/institutobex/backend/
   ```

---

### **PASSO 3: Verificar Dependências**

O arquivo `users.js` usa `jsonwebtoken`. Verifique se está instalado:

**No servidor (via SSH):**
```bash
cd /opt/institutobex/backend
npm list jsonwebtoken
```

**Se não estiver instalado:**
```bash
npm install jsonwebtoken
```

---

### **PASSO 4: Reiniciar o Container no Portainer**

Após atualizar os arquivos:

1. **Acesse o Portainer** (via navegador)
2. Vá em **Containers** → Selecione o container `institutobex-backend`
3. Clique em **Restart** (ou **Recreate** se necessário)

---

### **PASSO 5: Verificar se os Endpoints Estão Funcionando**

Após reiniciar, teste os endpoints:

**No servidor (via SSH) ou via curl:**
```bash
# Testar endpoint de roles (precisa de token)
curl -X GET "http://localhost:3001/api/users/roles?user_id=eq.TESTE" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Testar endpoint de profile (precisa de token)
curl -X GET "http://localhost:3001/api/users/profile?id=eq.TESTE" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Ou verifique os logs do container:**
- Portainer → Containers → `institutobex-backend` → **Logs**
- Procure por erros relacionados a `users.js` ou `jsonwebtoken`

---

## 🔍 Verificação Final

### **Teste no Navegador:**

1. Faça login no sistema
2. Acesse "Meu Perfil" ou "Meus Cursos"
3. Abra o Console do Navegador (F12 → Console)
4. Verifique se:
   - ✅ Não há mais erros 404 para `/api/users/roles`
   - ✅ Não há mais erros 404 para `/api/users/profile`
   - ✅ Os dados do perfil são carregados corretamente
   - ✅ Os cursos matriculados aparecem na aba "Meus Cursos"

### **Logs Esperados:**

Quando funcionar corretamente, você deve ver nos logs:

```
📡 Requisição via proxy local: http://localhost:3000/api/users/roles?user_id=eq.xxx
✅ Chamando via proxy local (→ produção): http://localhost:3000/api/users/roles?user_id=eq.xxx
```

E **NÃO** deve aparecer:
```
❌ Failed to load resource: the server responded with a status of 404
```

---

## ⚠️ Problemas Comuns

### **Erro: "Cannot find module 'jsonwebtoken'"**

**Solução:**
```bash
cd /opt/institutobex/backend
npm install jsonwebtoken
```

### **Erro: "Cannot find module './routes/users.js'"**

**Solução:**
- Verifique se o arquivo `backend/routes/users.js` existe no servidor
- Verifique se o caminho está correto no `server.js`

### **Erro: "404 Not Found" nos endpoints**

**Solução:**
- Verifique se o container foi reiniciado após atualizar os arquivos
- Verifique se a rota está registrada no `server.js`: `app.use('/api/users', usersRoutes);`
- Verifique os logs do container para erros de sintaxe

### **Erro: "401 Unauthorized"**

**Solução:**
- Verifique se o token de autenticação está sendo enviado corretamente
- Os endpoints `/api/users/roles` e `/api/users/profile` podem funcionar sem token (tentam autenticar, mas não falham se não tiver)

---

## 📝 Resumo das Mudanças

### **Arquivos Criados:**
- `backend/routes/users.js` - Novos endpoints para profile e roles

### **Arquivos Modificados:**
- `backend/server.js` - Adicionado import e rota para usersRoutes
- `supabase-replacement.js` - Adicionado redirecionamento para user_roles, profiles e course_enrollments
- `backend/routes/enrollments.js` - Ajustado formato de resposta

### **Endpoints Criados:**
- `GET /api/users/profile?id=eq.{userId}` - Obter perfil do usuário
- `PUT /api/users/profile` - Atualizar perfil do usuário
- `GET /api/users/roles?user_id=eq.{userId}` - Obter roles do usuário

---

## ✅ Checklist

- [ ] Fazer commit e push dos arquivos modificados
- [ ] Atualizar código no servidor (via `git pull` ou upload manual)
- [ ] Verificar se `jsonwebtoken` está instalado
- [ ] Reiniciar container do backend no Portainer
- [ ] Verificar logs do container
- [ ] Testar no navegador (login → Meu Perfil → Meus Cursos)
- [ ] Verificar se não há mais erros 404 no console

---

**Pronto!** Após seguir esses passos, os endpoints de usuários devem estar funcionando e o menu "Meus Cursos" não deve mais redirecionar para o login! 🚀

