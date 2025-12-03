# 🔍 Verificar: package.json Existe no Servidor Mas Não Aparece no Container

## 🎯 Situação

- ✅ `package.json` está em `/opt/institutobex/backend` no servidor
- ❌ Não aparece em `/app` no container
- ❌ Volume Bind não está funcionando corretamente

---

## 🔍 Diagnóstico

---

## 🔍 Passo 1: Confirmar Que Arquivo Está no Servidor

### **Criar Container Temporário para Verificar:**

1. **Containers** → **Add container**
2. **Name**: `verify-package-json`
3. **Image**: `alpine:latest`
4. **Volumes** → **Bind**:
   - **Container**: `/check`
   - **Host**: `/opt/institutobex/backend`
5. **Command**: `tail -f /dev/null`
6. **Deploy**

### **No Console:**

```bash
# Verificar se package.json está no servidor
ls -la /check/package.json

# Ver todos os arquivos
ls -la /check/
```

**Se aparecer:**
- ✅ Arquivo está no servidor
- ⚠️ Problema é no volume Bind do backend

---

## 🔍 Passo 2: Verificar Volume Bind do Backend

### **No Console do Container Backend:**

```bash
# Verificar montagem
mount | grep /app

# Verificar se /app tem arquivos
ls -la /app/

# Verificar package.json especificamente
ls -la /app/package.json
```

**Se `mount | grep /app` mostrar `/dev/sda1`:**
- ❌ Volume Bind não está montado
- ✅ Precisa recriar container

**Se `mount | grep /app` mostrar volume Bind mas arquivos não aparecem:**
- ⚠️ Pode ser problema de permissões ou caminho

---

## ✅ Solução: Forçar Recriação do Container

---

## ✅ Passo 1: Parar Container Backend

1. **Containers** → `institutobex-backend` → **Stop**

---

## ✅ Passo 2: Verificar Configuração do Volume

1. **Containers** → `institutobex-backend`
2. Role até **Volumes**
3. **Verifique**:
   - Deve ter: **Bind mount**
   - **Container**: `/app`
   - **Host**: `/opt/institutobex/backend`

**Se não aparecer ou estiver diferente:**
- Adicione/corrija o volume

---

## ✅ Passo 3: Recriar Container

### **Método 1: Duplicate/Edit**

1. **Duplicate/Edit**
2. **Volumes**:
   - Remova volume atual (se existir)
   - Adicione novamente:
     - **Bind** → Container `/app` → Host `/opt/institutobex/backend`
3. **Deploy**

### **Método 2: Remover e Criar Novo**

1. **Remove** container
2. **Add container**
3. Configure tudo, incluindo volume Bind
4. **Deploy**

---

## ✅ Passo 4: Verificar Se Funcionou

### **Após Recriar:**

1. **Mudar comando temporariamente**:
   - **Command**: `tail -f /dev/null`
   - **Deploy**

2. **Acessar console**:
   ```bash
   # Verificar montagem
   mount | grep /app
   # Deve mostrar: /opt/institutobex/backend on /app type bind
   
   # Verificar arquivos
   ls -la /app/package.json
   # Deve mostrar o arquivo agora!
   
   # Ver estrutura
   ls -la /app/
   ```

3. **Se aparecer o arquivo:**
   - ✅ Volume Bind está funcionando!
   - ✅ Restaurar comando original: `sh -c 'npm install && npm start'`

---

## 🔍 Verificação Detalhada

### **Comparar Container Temporário vs Backend:**

**Container Temporário** (funciona):
```bash
ls -la /check/package.json
# Mostra o arquivo ✅
```

**Container Backend** (não funciona):
```bash
ls -la /app/package.json
# Não mostra o arquivo ❌
```

**Se isso acontecer:**
- Volume Bind do backend não está funcionando
- Precisa recriar container

---

## 🐛 Problemas Comuns

### **Problema 1: Arquivo está no servidor mas não aparece no container**

**Causa**: Volume Bind não está montado

**Solução**: Recriar container com volume Bind

### **Problema 2: mount mostra /dev/sda1 ao invés de volume Bind**

**Causa**: Volume Bind não foi aplicado

**Solução**: Remover e criar container novamente

### **Problema 3: Volume Bind configurado mas não monta**

**Causa**: Container não foi recriado após configurar

**Solução**: Forçar recriação (Duplicate/Edit + Deploy)

---

## 📋 Checklist

- [ ] Confirmar que `package.json` está em `/opt/institutobex/backend` no servidor (container temporário)
- [ ] Verificar volume Bind no Portainer (está configurado?)
- [ ] Verificar montagem no container backend (`mount | grep /app`)
- [ ] Se não estiver montado, recriar container
- [ ] Verificar se arquivo aparece em `/app/package.json`
- [ ] Restaurar comando original
- [ ] Verificar logs - deve funcionar agora

---

## 🔗 Referências

- `FORCAR_VOLUME_BIND_APLICAR.md` - Forçar volume Bind
- `CORRIGIR_VOLUME_BIND_ERRADO.md` - Corrigir volume Bind
- `DIAGNOSTICO_CONSOLE_VOLUME.md` - Diagnóstico no console

---

## ✅ Resumo

**Situação**: `package.json` está no servidor mas não aparece no container.

**Causa**: Volume Bind não está funcionando.

**Solução**:
1. ✅ Confirmar que arquivo está no servidor (container temporário)
2. ✅ Verificar configuração do volume no Portainer
3. ✅ Recriar container com volume Bind
4. ✅ Verificar se arquivo aparece em `/app/package.json`
5. ✅ Restaurar comando original

**Pronto!** Recrie o container para que o volume Bind funcione! 🚀

