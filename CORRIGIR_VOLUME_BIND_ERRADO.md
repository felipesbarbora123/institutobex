# 🔧 Corrigir: Volume Bind Não Está Funcionando

## 🐛 Problema Identificado

- ❌ `mount | grep /app` mostra: `/dev/sda1 on /app` (disco, não volume Bind)
- ❌ Não tem `package.json` em `/app`, só `package-lock.json`
- ❌ Volume Bind não está montado corretamente

## 🎯 Causa

O volume Bind configurado no Portainer **não está sendo aplicado**. O que está montado em `/app` é um disco do sistema, não o diretório do servidor.

---

## ✅ Solução: Recriar Container com Volume Bind Correto

---

## 🔍 Passo 1: Verificar Configuração Atual do Volume

### **No Portainer:**

1. **Containers** → `institutobex-backend`
2. Role até **Volumes**
3. **Verifique o que está configurado**:
   - Deve ter: **Bind mount**
   - **Container**: `/app`
   - **Host**: `/opt/institutobex/backend`

**Se não aparecer ou estiver diferente:**
- Volume não está configurado corretamente

---

## 🔍 Passo 2: Verificar Se Arquivos Estão no Servidor

### **Criar Container Temporário:**

1. **Containers** → **Add container**
2. **Name**: `verify-files`
3. **Image**: `alpine:latest`
4. **Volumes** → **Bind**:
   - **Container**: `/check`
   - **Host**: `/opt/institutobex/backend`
5. **Command**: `tail -f /dev/null`
6. **Deploy**

### **No Console:**

```bash
# Verificar se arquivos estão no servidor
ls -la /check/package.json

# Ver estrutura
ls -la /check/
```

**Se aparecer `package.json`:**
- ✅ Arquivos estão no servidor
- ✅ Pode continuar

**Se NÃO aparecer:**
- ❌ Arquivos não estão no servidor
- ✅ Precisa fazer upload primeiro

---

## ✅ Passo 3: Remover Container Atual

1. **Containers** → `institutobex-backend` → **Stop**
2. **Containers** → `institutobex-backend` → **Remove**

**⚠️ Anote todas as configurações antes de remover:**
- Portas
- Variáveis de ambiente
- Network
- Command
- Working directory

---

## ✅ Passo 4: Criar Novo Container com Volume Bind Correto

### **1. Criar Container:**

1. **Containers** → **Add container**
2. **Name**: `institutobex-backend`
3. **Image**: `node:20-alpine`

### **2. Configurar Volume Bind (CRÍTICO!):**

1. **Volumes** → **map additional volume**
2. **IMPORTANTE**: Selecione **Bind** (não Named volume!)
3. Configure:
   - **Volume**: Selecione **Bind** ← **CRÍTICO!**
   - **Container**: `/app`
   - **Host**: `/opt/institutobex/backend`

**⚠️ Certifique-se de selecionar "Bind" e não um volume nomeado!**

### **3. Configurar Resto:**

- **Network ports**: Container `3001` → Host `3001`
- **Command & Logging**:
  - **Command**: `sh -c 'npm install && npm start'`
  - **Override**: ✅ Ativado
  - **Working directory**: `/app`
- **Environment variables**: Todas as variáveis
- **Network**: `institutobex-network`
- **Restart policy**: `Unless stopped`

### **4. Deploy**

---

## ✅ Passo 5: Verificar Se Funcionou

### **Após criar o container:**

1. **Aguardar** container iniciar

2. **Acessar console**:
   - **Console** → **Connect**

3. **Verificar montagem**:
   ```bash
   # Deve mostrar volume Bind, não /dev/sda1
   mount | grep /app
   # Deve mostrar: /opt/institutobex/backend on /app type bind
   
   # Verificar arquivos
   ls -la /app/package.json
   # Deve mostrar o arquivo!
   
   # Ver estrutura
   ls -la /app/
   # Deve mostrar todos os arquivos do backend
   ```

4. **Verificar logs**:
   - **Logs** → Não deve mais mostrar erro de `package.json`
   - Deve mostrar `npm install` executando

---

## 🐛 Problemas Comuns

### **Problema 1: Ainda mostra /dev/sda1**

**Causa**: Volume Bind não foi configurado ou foi configurado errado

**Solução**: 
- Verificar se selecionou **Bind** (não Named volume)
- Verificar se caminho do Host está correto
- Recriar container

### **Problema 2: Volume Bind configurado mas não monta**

**Causa**: Caminho do Host não existe ou está errado

**Solução**: 
- Verificar se `/opt/institutobex/backend` existe no servidor
- Verificar se tem arquivos lá
- Usar caminho absoluto (começa com `/`)

### **Problema 3: package-lock.json mas não package.json**

**Causa**: Arquivos incompletos ou em lugar errado

**Solução**: 
- Verificar se `package.json` está em `/opt/institutobex/backend` no servidor
- Fazer upload completo dos arquivos

---

## 🔍 Verificação Detalhada

### **1. Verificar Arquivos no Servidor:**

```bash
# Container temporário
ls -la /opt/institutobex/backend/package.json
ls -la /opt/institutobex/backend/
```

### **2. Verificar Volume no Container:**

```bash
# No console do backend
mount | grep /app
# Deve mostrar: /opt/institutobex/backend on /app type bind
# NÃO deve mostrar: /dev/sda1
```

### **3. Comparar:**

- Se arquivos aparecem no container temporário mas não no backend
- → Volume Bind do backend não está funcionando
- → Precisa recriar container

---

## 📋 Checklist

- [ ] Verificar se arquivos estão em `/opt/institutobex/backend` no servidor
- [ ] Remover container atual
- [ ] Criar novo container
- [ ] Configurar volume Bind: **Bind** (não Named!) → Container `/app` → Host `/opt/institutobex/backend`
- [ ] Configurar todas as outras opções
- [ ] Deploy
- [ ] Verificar `mount | grep /app` - deve mostrar volume Bind
- [ ] Verificar `ls -la /app/package.json` - deve mostrar arquivo
- [ ] Verificar logs - erro deve desaparecer

---

## 💡 Dica: Diferença Entre Bind e Named Volume

### **Bind (Correto para seu caso):**
- Conecta diretório do servidor ao container
- **Host**: `/opt/institutobex/backend` (caminho no servidor)
- **Container**: `/app` (caminho no container)

### **Named Volume (Errado para seu caso):**
- Cria volume gerenciado pelo Docker
- Não conecta ao diretório do servidor
- Por isso aparece `/dev/sda1` (disco do Docker)

**Certifique-se de selecionar "Bind"!**

---

## 🔗 Referências

- `DIAGNOSTICO_CONSOLE_VOLUME.md` - Diagnóstico no console
- `ENTENDER_VOLUME_BIND.md` - Entender volume Bind
- `COMO_FAZER_UPLOAD_ARQUIVOS_PORTAINER.md` - Fazer upload de arquivos

---

## ✅ Resumo

**O problema é**: Volume Bind não está funcionando, está montando disco ao invés do diretório.

**Para resolver:**
1. ✅ Verificar se arquivos estão no servidor
2. ✅ Remover container atual
3. ✅ Criar novo container
4. ✅ Configurar volume Bind: **Selecione "Bind"** → Container `/app` → Host `/opt/institutobex/backend`
5. ✅ Verificar `mount | grep /app` - deve mostrar volume Bind
6. ✅ Verificar `ls -la /app/package.json` - deve mostrar arquivo

**Pronto!** Recrie o container selecionando "Bind" corretamente! 🚀

