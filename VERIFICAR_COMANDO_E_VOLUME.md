# ✅ Verificar Comando e Volume Bind

## 🎯 Situação Atual

Você informou que:
- ✅ **Command**: `sh -c 'npm install && npm start'` (está correto!)
- ✅ **Override**: Ativado (está correto!)
- ❌ **Problema**: Container não encontra `package.json`

## 🔍 Análise

O comando está **correto**, mas o container não encontra os arquivos porque:
- ⚠️ **Volume Bind não está configurado** ou
- ⚠️ **Volume não está montado corretamente**

---

## ✅ Verificação Completa

---

## 🔍 Passo 1: Verificar Comando (Já Está Correto!)

### **No Portainer:**

1. **Containers** → `institutobex-backend` → **Command & Logging**
2. **Command**: `sh -c 'npm install && npm start'` ✅
3. **Override**: Ativado ✅

**Está correto! Não precisa mudar.**

---

## 🔍 Passo 2: Verificar Volume Bind (CRÍTICO!)

### **No Portainer:**

1. **Containers** → `institutobex-backend`
2. Role até a seção **Volumes**
3. **Verifique se existe volume Bind**:

**Deve ter:**
```
Bind mount
├── Container: /app
└── Host: /opt/institutobex/backend
```

**Se NÃO aparecer nenhum volume:**
- ❌ **Este é o problema!**
- ✅ Precisa adicionar o volume

**Se aparecer mas caminho está errado:**
- ❌ Caminho do Host está incorreto
- ✅ Precisa corrigir

---

## ✅ Solução: Adicionar Volume Bind

### **Passo 1: Parar Container**

1. **Containers** → `institutobex-backend` → **Stop**

### **Passo 2: Adicionar Volume**

1. **Containers** → `institutobex-backend` → **Duplicate/Edit**

2. **Volumes** → **map additional volume**:
   - **Volume**: Selecione **Bind**
   - **Container**: `/app`
   - **Host**: `/opt/institutobex/backend`

3. **Verificar outras configurações**:
   - **Command & Logging** → **Command**: `sh -c 'npm install && npm start'` (já está correto)
   - **Command & Logging** → **Working directory**: `/app` (deve estar assim)

4. **Deploy** o container

### **Passo 3: Verificar Se Funcionou**

Após recriar o container:

1. **Aguardar** container iniciar

2. **Verificar logs**:
   - **Containers** → `institutobex-backend` → **Logs**
   - Não deve mais aparecer erro de `package.json`
   - Deve mostrar: `npm install` executando

3. **Acessar console** (se necessário):
   ```bash
   ls -la /app/
   ls -la /app/package.json
   ```

---

## 🔍 Passo 3: Verificar Se Arquivos Estão no Servidor

Antes de configurar o volume, certifique-se de que os arquivos estão no servidor:

### **Método: Container Temporário**

1. **Containers** → **Add container**
2. **Name**: `check-files`
3. **Image**: `alpine:latest`
4. **Volumes** → **Bind**:
   - **Container**: `/check`
   - **Host**: `/opt/institutobex/backend`
5. **Command**: `tail -f /dev/null`
6. **Deploy**

7. **Console**:
   ```bash
   ls -la /check/package.json
   ```

**Se aparecer o arquivo:**
- ✅ Arquivos estão no servidor
- ✅ Pode configurar o volume do backend

**Se NÃO aparecer:**
- ❌ Arquivos não estão no servidor
- ✅ Precisa fazer upload primeiro

---

## 📋 Configuração Completa Correta

### **Container Backend deve ter:**

1. ✅ **Image**: `node:20-alpine`

2. ✅ **Volumes** → **Bind**:
   - **Container**: `/app`
   - **Host**: `/opt/institutobex/backend`

3. ✅ **Command & Logging**:
   - **Command**: `sh -c 'npm install && npm start'`
   - **Override**: ✅ Ativado
   - **Working directory**: `/app`

4. ✅ **Network ports**:
   - **Container**: `3001`
   - **Host**: `3001`

5. ✅ **Environment variables**: Todas configuradas

6. ✅ **Network**: `institutobex-network`

7. ✅ **Restart policy**: `Unless stopped`

---

## 🐛 Problemas Comuns

### **Problema 1: Comando está correto mas ainda dá erro**

**Causa**: Volume Bind não está configurado

**Solução**: Adicionar volume Bind (veja acima)

### **Problema 2: Volume configurado mas arquivos não aparecem**

**Causa**: Arquivos não estão no servidor ou caminho errado

**Solução**: 
- Verificar se arquivos estão em `/opt/institutobex/backend` no servidor
- Verificar se caminho do Host está correto

### **Problema 3: Container reinicia continuamente**

**Causa**: Erro no comando ou arquivos faltando

**Solução**:
- Ver logs do container
- Verificar se volume está montado
- Verificar se arquivos estão no servidor

---

## ✅ Checklist Final

- [ ] Comando está correto: `sh -c 'npm install && npm start'` ✅
- [ ] Override está ativado ✅
- [ ] Volume Bind configurado: Container `/app` → Host `/opt/institutobex/backend`
- [ ] Arquivos estão em `/opt/institutobex/backend` no servidor
- [ ] Working directory: `/app`
- [ ] Container foi recriado após configurar volume
- [ ] Logs não mostram mais erro de `package.json`

---

## 🔗 Referências

- `ENTENDER_VOLUME_BIND.md` - Entender como funciona volume Bind
- `SOLUCAO_DIRETORIO_APP_NAO_EXISTE.md` - Solução completa
- `COMO_FAZER_UPLOAD_ARQUIVOS_PORTAINER.md` - Fazer upload de arquivos

---

## ✅ Resumo

**Seu comando está correto!** ✅

O problema é que o **Volume Bind não está configurado**.

**Para resolver:**
1. ✅ Verificar se arquivos estão em `/opt/institutobex/backend` no servidor
2. ✅ Adicionar volume Bind: Container `/app` → Host `/opt/institutobex/backend`
3. ✅ Recriar container
4. ✅ Verificar logs - erro deve desaparecer

**Pronto!** O comando está correto, só falta configurar o volume! 🚀

