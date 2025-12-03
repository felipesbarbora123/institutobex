# 🔍 NPM Não Consegue Encontrar package.json (Arquivo Existe)

## 🎯 Situação

- ✅ `package.json` existe em `/opt/institutobex/backend` no servidor (confirmado)
- ❌ Container backend não consegue acessá-lo
- ❌ npm não encontra o arquivo

## 🔍 Diagnóstico

---

## 🔍 Passo 1: Verificar Se Container Backend Consegue Acessar o Diretório

### **Parar Container e Mudar Comando Temporariamente:**

1. **Containers** → `institutobex-backend` → **Kill**

2. **Duplicate/Edit** → **Command & Logging** → **Command**:
   ```bash
   tail -f /dev/null
   ```
3. **Deploy**

4. **Acessar console**:
   - **Console** → **Connect**

5. **Verificar acesso ao diretório**:
   ```bash
   # Verificar se consegue acessar o diretório
   ls -la /opt/institutobex/backend/
   
   # Verificar package.json especificamente
   ls -la /opt/institutobex/backend/package.json
   
   # Verificar montagens
   mount | grep "/opt/institutobex/backend"
   
   # Tentar ler o arquivo
   cat /opt/institutobex/backend/package.json
   ```

**Se não conseguir acessar:**
- ❌ Volume Bind não está montado
- ✅ Precisa configurar volume Bind

**Se conseguir acessar:**
- ✅ Diretório está acessível
- ⚠️ Problema pode ser no comando ou working directory

---

## 🔍 Passo 2: Verificar Configuração do Volume

### **No Portainer:**

1. **Containers** → `institutobex-backend` → **Volumes**
2. **Verifique**:
   - Deve ter volume Bind montando `/opt/institutobex/backend`
   - Container path: `/opt/institutobex/backend` ou `/app`?
   - Host path: `/opt/institutobex/backend`

**Se não tiver volume Bind:**
- ❌ Container não tem acesso ao diretório
- ✅ Precisa adicionar volume Bind

---

## ✅ Soluções

---

## ✅ Solução 1: Adicionar Volume Bind Corretamente

### **Se Container Não Tem Acesso:**

1. **Containers** → `institutobex-backend` → **Duplicate/Edit**

2. **Volumes** → **map additional volume**:
   - **Volume**: **Bind**
   - **Container**: `/opt/institutobex/backend`
   - **Host**: `/opt/institutobex/backend`

3. **Command & Logging**:
   - **Command**: `sh -c "cd /opt/institutobex/backend && npm install && npm start"`
   - **Working directory**: Deixe vazio ou `/opt/institutobex/backend`

4. **Deploy**

---

## ✅ Solução 2: Verificar Caminho no Comando

### **O Comando Pode Estar Usando Caminho Errado:**

Verifique o comando atual:
- Se está usando: `cd /opt/institutobex/backend` ✅
- Se está usando: `cd /app` ❌ (pode não estar montado)

### **Ajustar Comando:**

1. **Command & Logging** → **Command**:
   ```bash
   sh -c "cd /opt/institutobex/backend && pwd && ls -la package.json && npm install && npm start"
   ```

Isso vai mostrar:
- Onde está executando (`pwd`)
- Se encontra o arquivo (`ls -la package.json`)
- Depois executa npm

---

## ✅ Solução 3: Usar Caminho Absoluto no npm

### **Se o cd não funciona, use caminho absoluto:**

1. **Command & Logging** → **Command**:
   ```bash
   sh -c "npm install --prefix /opt/institutobex/backend && npm start --prefix /opt/institutobex/backend"
   ```

Ou:
```bash
sh -c "cd /opt/institutobex/backend && npm install && cd /opt/institutobex/backend && npm start"
```

---

## ✅ Solução 4: Verificar Permissões

### **No Container Temporário (com acesso ao servidor):**

```bash
# Verificar permissões
ls -la /opt/institutobex/backend/package.json

# Ajustar se necessário
chown 1000:1000 /opt/institutobex/backend/package.json
chmod 644 /opt/institutobex/backend/package.json

# Verificar diretório também
chown -R 1000:1000 /opt/institutobex/backend
chmod -R 755 /opt/institutobex/backend
```

---

## 🔍 Passo 3: Teste Completo de Diagnóstico

### **No Console do Backend (com tail -f /dev/null):**

```bash
# 1. Verificar se diretório existe
ls -la /opt/institutobex/backend/

# 2. Verificar package.json
ls -la /opt/institutobex/backend/package.json

# 3. Tentar ler
cat /opt/institutobex/backend/package.json

# 4. Tentar cd e npm
cd /opt/institutobex/backend
pwd
ls -la package.json
npm install
```

**Isso vai mostrar exatamente onde está o problema!**

---

## 🐛 Problemas Comuns

### **Problema 1: "No such file or directory" ao fazer cd**

**Causa**: Volume Bind não está montado ou caminho está errado

**Solução**: Adicionar volume Bind: Container `/opt/institutobex/backend` → Host `/opt/institutobex/backend`

### **Problema 2: "Permission denied"**

**Causa**: Permissões incorretas

**Solução**: `chown -R 1000:1000 /opt/institutobex/backend`

### **Problema 3: npm não encontra package.json mesmo estando no diretório**

**Causa**: Working directory pode estar errado

**Solução**: Usar `cd` no comando ou `--prefix` no npm

---

## 📋 Checklist de Diagnóstico

- [ ] Container backend consegue acessar `/opt/institutobex/backend`? (`ls -la`)
- [ ] Container backend consegue ver `package.json`? (`ls -la package.json`)
- [ ] Volume Bind está configurado? (Container `/opt/institutobex/backend` → Host `/opt/institutobex/backend`)
- [ ] Comando usa caminho correto? (`cd /opt/institutobex/backend`)
- [ ] Permissões estão corretas? (`chown 1000:1000`)
- [ ] Testar manualmente no console (`cd /opt/institutobex/backend && npm install`)

---

## ✅ Solução Recomendada (Passo a Passo)

### **1. Parar Container:**
- **Kill** o container

### **2. Mudar Comando para Debug:**
- **Command**: `tail -f /dev/null`
- **Deploy**

### **3. Acessar Console e Testar:**
```bash
cd /opt/institutobex/backend
ls -la package.json
npm install
```

### **4. Se Funcionar Manualmente:**
- Configurar comando: `sh -c "cd /opt/institutobex/backend && npm install && npm start"`
- Adicionar volume Bind se não tiver
- Deploy

### **5. Se Não Funcionar:**
- Verificar se volume Bind está montado
- Verificar permissões
- Verificar caminho

---

## 🔗 Referências

- `RESOLVER_LOOP_RESTART_PACKAGE_JSON.md` - Resolver loop de restart
- `DIAGNOSTICO_VOLUME_BIND_NAO_FUNCIONA_DEFINITIVO.md` - Diagnóstico volume Bind
- `FORCAR_VOLUME_BIND_APLICAR.md` - Forçar volume Bind

---

## ✅ Resumo

**Situação**: `package.json` existe no servidor mas npm não encontra.

**Diagnóstico**:
1. ✅ Verificar se container consegue acessar `/opt/institutobex/backend`
2. ✅ Verificar se volume Bind está montado
3. ✅ Verificar se comando usa caminho correto
4. ✅ Testar manualmente no console

**Solução**:
- Adicionar volume Bind se não tiver
- Usar comando com `cd /opt/institutobex/backend`
- Verificar permissões

**Pronto!** Siga o diagnóstico para identificar o problema! 🚀

