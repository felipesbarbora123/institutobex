# 🔧 Corrigir Volume Bind do Backend

## 🎯 Situação

- ✅ Arquivos estão em: `/opt/institutobex/backend` (no servidor)
- ✅ `package.json` está em: `/opt/institutobex/backend/package.json`
- ❌ Container procura em: `/app` (dentro do container)
- ❌ Volume Bind não está funcionando corretamente

---

## ✅ Solução: Verificar e Corrigir Volume Bind

---

## 🔍 Passo 1: Verificar Configuração Atual do Volume

### **No Portainer:**

1. **Containers** → `institutobex-backend`
2. Role até a seção **Volumes**
3. Verifique o que está configurado:
   - **Container**: `/app` (deve ser este)
   - **Host**: `/opt/institutobex/backend` (deve ser este)

**Se estiver diferente, precisa corrigir!**

---

## 🔍 Passo 2: Verificar Se o Volume Está Montado

### **No Console do Container Backend:**

1. **Portainer** → **Containers** → `institutobex-backend` → **Console** → **Connect**

2. **Verificar montagem**:

   ```bash
   # Ver se /app existe
   ls -la /app
   
   # Ver se package.json está acessível
   ls -la /app/package.json
   
   # Ver montagens
   mount | grep /app
   ```

3. **Se não aparecer nada ou der erro**:
   - ❌ Volume não está montado
   - ✅ Precisa reconfigurar o volume

---

## ✅ Solução: Reconfigurar Volume Bind

### **Método 1: Editar Container Existente**

1. **Portainer** → **Containers** → `institutobex-backend`

2. Clique em **Duplicate/Edit** (ou **Edit**)

3. Role até a aba **Volumes**

4. **Verifique/Configure**:
   - Se já existe um volume mapeado:
     - Clique nele para editar
     - **Container**: `/app`
     - **Host**: `/opt/institutobex/backend`
     - **Type**: `Bind`
   - Se não existe:
     - Clique em **map additional volume**
     - **Volume**: Selecione **Bind**
     - **Container**: `/app`
     - **Host**: `/opt/institutobex/backend`

5. **Salvar e Deploy**:
   - Clique em **Deploy the container**
   - O container será recriado com o volume correto

6. **Verificar**:
   - **Console** → `ls -la /app/package.json`
   - Deve mostrar o arquivo!

---

### **Método 2: Recriar Container (Se Editar Não Funcionar)**

1. **Parar container atual**:
   - **Containers** → `institutobex-backend` → **Stop**

2. **Remover container** (opcional, se quiser recriar do zero):
   - **Containers** → `institutobex-backend` → **Remove**

3. **Criar novo container**:
   - **Containers** → **Add container**
   - **Name**: `institutobex-backend`
   - **Image**: `node:20-alpine`

4. **Configurar Volume**:
   - **Volumes** → **map additional volume**
   - **Volume**: Selecione **Bind**
   - **Container**: `/app`
   - **Host**: `/opt/institutobex/backend` ← **CAMINHO CORRETO!**

5. **Configurar resto** (portas, variáveis de ambiente, etc.)

6. **Deploy**

---

## 🔍 Passo 3: Verificar Se Funcionou

### **Após Reconfigurar:**

1. **Aguardar** container iniciar

2. **Acessar console**:
   - **Containers** → `institutobex-backend` → **Console** → **Connect**

3. **Verificar arquivos**:

   ```bash
   # Ver conteúdo de /app
   ls -la /app/
   
   # Verificar package.json
   ls -la /app/package.json
   
   # Ver estrutura
   ls -la /app/ | head -20
   ```

4. **Se aparecer os arquivos**:
   - ✅ Volume está funcionando!
   - ✅ Container deve iniciar corretamente

5. **Verificar logs**:
   - **Containers** → `institutobex-backend` → **Logs**
   - Não deve mais aparecer erro de `package.json`

---

## 🐛 Problemas Comuns

### **Problema 1: "Volume já existe" ou "Cannot remove volume"**

**Solução:**
- Pare o container primeiro
- Depois edite ou remova

### **Problema 2: "Permission denied" após montar volume**

**Solução:**
```bash
# No servidor (via container temporário ou SSH)
chown -R 1000:1000 /opt/institutobex/backend
chmod -R 755 /opt/institutobex/backend
```

### **Problema 3: Volume monta mas arquivos não aparecem**

**Solução:**
- Verifique se os arquivos realmente estão em `/opt/institutobex/backend`
- Verifique permissões
- Reinicie o container

### **Problema 4: "Cannot start container" após editar volume**

**Solução:**
- Verifique se o caminho do Host existe no servidor
- Verifique se não há outro container usando o mesmo caminho
- Verifique logs do container

---

## 📋 Checklist de Verificação

- [ ] Arquivos estão em `/opt/institutobex/backend` no servidor
- [ ] `package.json` existe em `/opt/institutobex/backend/package.json`
- [ ] Volume Bind configurado: Container `/app` → Host `/opt/institutobex/backend`
- [ ] Container foi recriado/reiniciado após configurar volume
- [ ] Arquivos aparecem em `/app/` no console do container
- [ ] `package.json` é acessível em `/app/package.json`
- [ ] Logs não mostram mais erro de `package.json`

---

## 🔍 Verificação Detalhada

### **1. Verificar Arquivos no Servidor:**

```bash
# Via container temporário
# Portainer → Containers → Add container
# Volumes → Bind: Container: /check, Host: /opt/institutobex/backend

# No console:
ls -la /check/package.json
# Deve mostrar o arquivo!
```

### **2. Verificar Volume no Container Backend:**

```bash
# No console do backend
mount | grep /app
# Deve mostrar algo como: /opt/institutobex/backend on /app type bind

ls -la /app/package.json
# Deve mostrar o arquivo!
```

### **3. Comparar:**

Se os arquivos aparecem em `/check` (container temporário) mas não em `/app` (container backend):
- ⚠️ Volume do backend não está montado corretamente
- ✅ Precisa reconfigurar o volume do backend

---

## 💡 Dica: Verificar Configuração Completa

Certifique-se de que o container backend tem:

1. ✅ **Volume Bind**:
   - Container: `/app`
   - Host: `/opt/institutobex/backend`

2. ✅ **Working directory**: `/app`

3. ✅ **Command**: `sh -c "npm install && npm start"`

4. ✅ **Variáveis de ambiente** configuradas

---

## 🔗 Referências

- `SOLUCAO_PACKAGE_JSON_NAO_ENCONTRADO.md` - Solução completa do erro
- `COMO_VER_CAMINHOS_ARQUIVOS_PORTAINER.md` - Ver caminhos no Portainer
- `CONFIGURACAO_PORTAINER_PASSO_A_PASSO.md` - Configuração completa

---

## ✅ Resumo Rápido

**Para corrigir o volume Bind:**

1. ✅ **Portainer** → **Containers** → `institutobex-backend` → **Duplicate/Edit**
2. ✅ **Volumes** → Verificar/Configurar:
   - **Container**: `/app`
   - **Host**: `/opt/institutobex/backend`
   - **Type**: `Bind`
3. ✅ **Deploy** o container
4. ✅ **Verificar** no console: `ls -la /app/package.json`
5. ✅ **Verificar logs** - erro deve desaparecer

**Pronto!** Agora o volume deve estar funcionando corretamente! 🚀

