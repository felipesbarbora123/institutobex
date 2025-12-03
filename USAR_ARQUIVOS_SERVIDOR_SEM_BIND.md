# 📋 Usar Arquivos do Servidor Sem Volume Bind

## 🎯 Situação

- ✅ Arquivos já estão em `/opt/institutobex/backend` no servidor (cópia do Git)
- ❌ Volume Bind não funciona
- ✅ Quer usar esses arquivos sem volume Bind

---

## ✅ Soluções

---

## ✅ Solução 1: Copiar Arquivos na Inicialização (Recomendado)

### **Como Funciona:**

O container copia os arquivos do servidor para dentro do container na inicialização.

### **Passo a Passo:**

1. **Containers** → `institutobex-backend` → **Kill**

2. **Duplicate/Edit**:

3. **Volumes**:
   - **Adicionar volume Bind** (mesmo que não funcione perfeitamente, pode ser usado para copiar):
     - **Bind** → Container `/source` → Host `/opt/institutobex/backend`
   - **Ou usar volume nomeado** para armazenar os arquivos:
     - Criar volume nomeado `backend_app_data`
     - Adicionar em `/app`

4. **Command & Logging** → **Command**:
   ```bash
   sh -c "if [ ! -f /app/package.json ]; then cp -r /source/* /app/ 2>/dev/null || (mkdir -p /app && cp -r /opt/institutobex/backend/* /app/ 2>/dev/null || true); fi && cd /app && npm install && npm start"
   ```

   **Ou mais simples:**
   ```bash
   sh -c "mkdir -p /app && cp -r /source/* /app/ 2>/dev/null || cp -r /opt/institutobex/backend/* /app/ 2>/dev/null || true && cd /app && npm install && npm start"
   ```

5. **Working directory**: `/app`

6. **Deploy**

**Isso copia os arquivos do servidor para `/app` na inicialização!**

---

## ✅ Solução 2: Usar Volume Nomeado + Copiar Uma Vez

### **Passo 1: Criar Volume Nomeado**

1. **Volumes** → **Add volume**
2. **Name**: `backend_app_files`
3. **Driver**: `local`
4. **Create**

### **Passo 2: Copiar Arquivos para o Volume (Uma Vez)**

1. **Criar container temporário**:
   - **Name**: `setup-backend`
   - **Image**: `alpine:latest`
   - **Volumes**:
     - Volume nomeado `backend_app_files` em `/data`
     - Bind: Container `/source`, Host `/opt/institutobex/backend`
   - **Command**: `sh -c "cp -r /source/* /data/ && tail -f /dev/null"`
   - **Deploy**

2. **Aguardar** arquivos serem copiados

3. **Remover** container temporário

### **Passo 3: Usar Volume no Backend**

1. **Containers** → `institutobex-backend` → **Duplicate/Edit**

2. **Volumes**:
   - Remover volumes Bind
   - Adicionar: Volume nomeado `backend_app_files` em `/app`

3. **Command & Logging**:
   - **Command**: `sh -c "cd /app && npm install && npm start"`
   - **Working directory**: `/app`

4. **Deploy**

**Agora os arquivos estão no volume nomeado e persistem!**

---

## ✅ Solução 3: Script de Inicialização com Verificação

### **Command Completo:**

```bash
sh -c "mkdir -p /app && if [ -d /source ]; then cp -r /source/* /app/; elif [ -d /opt/institutobex/backend ]; then cp -r /opt/institutobex/backend/* /app/; else echo 'Erro: Não encontrou arquivos!'; exit 1; fi && cd /app && ls -la && npm install && npm start"
```

**Este comando:**
1. Cria `/app`
2. Tenta copiar de `/source` (se volume Bind funcionar)
3. Se não, tenta copiar de `/opt/institutobex/backend` (se acessível)
4. Verifica se copiou
5. Instala e inicia

---

## ✅ Solução 4: Usar Init Script com Volume Bind Temporário

### **Configuração:**

1. **Volumes**:
   - **Bind** → Container `/source` → Host `/opt/institutobex/backend` (para copiar)
   - **Volume nomeado** `backend_data` em `/app` (para armazenar)

2. **Command**:
   ```bash
   sh -c "cp -r /source/* /app/ && cd /app && npm install && npm start"
   ```

**Isso copia do Bind para o volume nomeado na inicialização!**

---

## 🔍 Verificar Se Arquivos Foram Copiados

### **No Console do Backend:**

```bash
# Verificar se arquivos estão em /app
ls -la /app/

# Verificar package.json
ls -la /app/package.json

# Ver estrutura
ls -la /app/ | head -20
```

---

## 📋 Configuração Recomendada

### **Opção A: Com Volume Bind Temporário (Para Copiar)**

1. **Volumes**:
   - **Bind** → Container `/source` → Host `/opt/institutobex/backend`
   - **Volume nomeado** `backend_app_data` em `/app`

2. **Command**:
   ```bash
   sh -c "cp -r /source/* /app/ && cd /app && npm install && npm start"
   ```

### **Opção B: Sem Volume Bind (Copiar Direto)**

1. **Volumes**: Apenas volume nomeado `backend_app_data` em `/app`

2. **Command**:
   ```bash
   sh -c "mkdir -p /app && apk add rsync && rsync -av /opt/institutobex/backend/ /app/ 2>/dev/null || cp -r /opt/institutobex/backend/* /app/ 2>/dev/null || (echo 'Erro ao copiar arquivos' && exit 1) && cd /app && npm install && npm start"
   ```

**Mas**: Isso só funciona se o container tiver acesso ao diretório do servidor (o que requer volume Bind).

---

## ✅ Solução Mais Prática: Volume Nomeado

### **Passo a Passo Completo:**

1. **Criar volume nomeado**:
   - **Volumes** → **Add volume** → **Name**: `backend_app_data`

2. **Copiar arquivos uma vez**:
   - Container temporário com Bind `/source` → `/opt/institutobex/backend`
   - E volume nomeado `backend_app_data` em `/data`
   - Command: `cp -r /source/* /data/`

3. **Usar no backend**:
   - Volume nomeado `backend_app_data` em `/app`
   - Command: `sh -c "cd /app && npm install && npm start"`

**Agora os arquivos estão no volume nomeado e persistem!**

---

## 🔗 Referências

- `SOLUCOES_SEM_VOLUME_BIND.md` - Soluções sem volume Bind
- `RESOLVER_VOLUME_BIND_MONTA_DISCO.md` - Problema do volume Bind

---

## ✅ Resumo

**Para usar arquivos do servidor sem volume Bind:**

1. ✅ **Criar volume nomeado** para armazenar arquivos
2. ✅ **Copiar arquivos** do servidor para o volume (uma vez)
3. ✅ **Usar volume nomeado** no backend
4. ✅ **Ou copiar na inicialização** se volume Bind funcionar parcialmente

**Solução recomendada**: Volume nomeado + copiar uma vez!

**Pronto!** Use volume nomeado para armazenar os arquivos! 🚀

