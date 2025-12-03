# 🔧 Solução: package.json Não Encontrado no Container Backend

## 🐛 Erro Encontrado

```
could not read package.json: error enoent no such file or directory open /app/package.json
```

## 🎯 O Que Isso Significa?

O container do backend não está encontrando o arquivo `package.json` no diretório `/app`. Isso geralmente acontece porque:

- ⚠️ **Volume Bind não está configurado** corretamente
- ⚠️ **Arquivos não estão no servidor** no caminho correto
- ⚠️ **Caminho do volume está errado** no Portainer
- ⚠️ **Permissões incorretas** nos arquivos

---

## ✅ Soluções

---

## 🔍 Passo 1: Verificar Configuração do Volume no Portainer

### **No Portainer:**

1. **Containers** → `institutobex-backend`
2. Role até a seção **Volumes**
3. Verifique:
   - **Volume**: Deve ser **Bind**
   - **Container**: `/app` (caminho dentro do container)
   - **Host**: `/opt/institutobex/backend` (ou outro caminho) ← **VERIFIQUE ESTE CAMINHO!**

### **O Que Verificar:**

- ✅ O caminho **Host** está correto?
- ✅ Os arquivos estão realmente nesse caminho no servidor?
- ✅ O volume está mapeado corretamente?

---

## 🔍 Passo 2: Verificar Se os Arquivos Estão no Servidor

### **Método 1: Via Console do Container Backend**

1. **Portainer** → **Containers** → `institutobex-backend` → **Console** → **Connect**

2. **Verificar se os arquivos estão lá**:

   ```bash
   # Ver conteúdo do diretório /app
   ls -la /app
   
   # Verificar se package.json existe
   ls -la /app/package.json
   
   # Ver estrutura
   ls -la /app/
   ```

3. **Se não aparecer nada ou der erro**:
   - ❌ Os arquivos não estão no servidor
   - ❌ O volume não está mapeado corretamente
   - ❌ O caminho está errado

---

### **Método 2: Via Container Temporário**

1. **Criar container temporário** com acesso ao mesmo volume:

   - **Portainer** → **Containers** → **Add container**
   - **Name**: `check-files`
   - **Image**: `alpine:latest`
   - **Volumes** → **Bind**:
     - **Container**: `/check`
     - **Host**: `/opt/institutobex/backend` (mesmo caminho do backend)
   - **Command**: `tail -f /dev/null`
   - **Deploy**

2. **Acessar console**:

   ```bash
   # Verificar arquivos
   ls -la /check/
   
   # Verificar package.json
   ls -la /check/package.json
   
   # Ver estrutura
   find /check -name "package.json"
   ```

3. **Se os arquivos estiverem em `/check`**:
   - ✅ Arquivos estão no servidor
   - ⚠️ Problema é no mapeamento do volume do backend

4. **Se os arquivos NÃO estiverem em `/check`**:
   - ❌ Arquivos não estão no servidor
   - ✅ Precisa fazer upload dos arquivos

---

## 🔍 Passo 3: Verificar Caminho Correto no Servidor

### **Descobrir Onde os Arquivos Estão:**

1. **Portainer** → **Containers** → `institutobex-backend` → **Console**

2. **Verificar montagens**:

   ```bash
   # Ver volumes montados
   mount | grep /app
   
   # Ver onde está montado
   df -h | grep /app
   ```

3. **Verificar caminho do Host**:

   - **Portainer** → **Containers** → `institutobex-backend` → **Volumes**
   - Veja o campo **Host** - esse é o caminho no servidor

---

## ✅ Solução 1: Corrigir Caminho do Volume

Se o caminho está errado:

1. **Portainer** → **Containers** → `institutobex-backend` → **Duplicate/Edit**

2. **Volumes** → Edite o volume Bind:
   - **Container**: `/app` (manter)
   - **Host**: `/opt/institutobex/backend` ← **AJUSTE PARA O CAMINHO CORRETO!**

3. **Deploy** o container

4. **Verificar** se funcionou:
   - **Console** → `ls -la /app/package.json`

---

## ✅ Solução 2: Fazer Upload dos Arquivos

Se os arquivos não estão no servidor:

### **Método A: Via Git (Recomendado)**

1. **Criar container temporário**:

   - **Portainer** → **Containers** → **Add container**
   - **Name**: `upload-backend`
   - **Image**: `alpine:latest`
   - **Volumes** → **Bind**:
     - **Container**: `/upload`
     - **Host**: `/opt/institutobex/backend`
   - **Command**: `tail -f /dev/null`
   - **Deploy**

2. **Acessar console**:

   ```bash
   # Instalar Git
   apk add git
   
   # Clonar repositório
   cd /upload
   git clone https://SEU_TOKEN@github.com/usuario/repositorio.git temp
   
   # Copiar apenas a pasta backend
   cp -r temp/backend/* /upload/
   
   # Verificar
   ls -la /upload/package.json
   
   # Ajustar permissões
   chown -R 1000:1000 /upload
   chmod -R 755 /upload
   
   # Limpar
   rm -rf temp
   ```

3. **Remover container temporário**

4. **Reiniciar container backend**:
   - **Containers** → `institutobex-backend` → **Restart**

---

### **Método B: Via Container Backend (Se Tiver Acesso)**

1. **Portainer** → **Containers** → `institutobex-backend` → **Console**

2. **Verificar onde está montado**:

   ```bash
   # Ver montagens
   mount | grep /app
   ```

3. **Se o volume estiver montado**, os arquivos devem estar no caminho do Host

---

## ✅ Solução 3: Verificar Estrutura de Diretórios

Certifique-se de que a estrutura está correta:

```
/opt/institutobex/backend/
├── package.json          ← DEVE ESTAR AQUI!
├── server.js
├── config/
├── routes/
├── middleware/
└── ...
```

**Verificar:**

```bash
# No servidor (via container temporário)
ls -la /opt/institutobex/backend/package.json
```

Se não existir, os arquivos estão no lugar errado ou não foram enviados.

---

## ✅ Solução 4: Ajustar Permissões

Se os arquivos existem mas não são acessíveis:

```bash
# No servidor (via container temporário ou SSH)
chown -R 1000:1000 /opt/institutobex/backend
chmod -R 755 /opt/institutobex/backend

# Verificar
ls -la /opt/institutobex/backend/package.json
```

---

## 🔍 Diagnóstico Completo

Execute este diagnóstico:

### **1. Verificar Volume no Portainer:**

```
Containers → institutobex-backend → Volumes
- Container: /app
- Host: /opt/institutobex/backend  ← VERIFIQUE!
```

### **2. Verificar Arquivos no Container:**

```bash
# No console do backend
ls -la /app/
ls -la /app/package.json
```

### **3. Verificar Arquivos no Servidor:**

```bash
# Via container temporário com mesmo volume
ls -la /opt/institutobex/backend/package.json
```

### **4. Verificar Montagem:**

```bash
# No console do backend
mount | grep /app
```

---

## 🐛 Problemas Comuns

### **Problema 1: "ls: cannot access /app: No such file or directory"**

**Solução:**
- Volume não está montado
- Verifique configuração do volume no Portainer
- Reinicie o container

### **Problema 2: "ls: cannot access /app/package.json: No such file or directory"**

**Solução:**
- Arquivos não estão no servidor
- Faça upload dos arquivos (veja Solução 2)
- Verifique se o caminho está correto

### **Problema 3: "Permission denied"**

**Solução:**
```bash
chown -R 1000:1000 /opt/institutobex/backend
chmod -R 755 /opt/institutobex/backend
```

### **Problema 4: Arquivos Estão em Subdiretório**

Se os arquivos estão em `/opt/institutobex/backend/institutobex/backend/`:

**Solução:**
```bash
# Mover arquivos para o lugar correto
mv /opt/institutobex/backend/institutobex/backend/* /opt/institutobex/backend/
rm -rf /opt/institutobex/backend/institutobex
```

Veja: `CORRIGIR_ESTRUTURA_DIRETORIOS.md`

---

## 📋 Checklist

- [ ] Verificar configuração do volume no Portainer
- [ ] Verificar se arquivos estão no servidor (`ls -la /opt/institutobex/backend/package.json`)
- [ ] Verificar se volume está montado (`ls -la /app/` no container)
- [ ] Verificar permissões dos arquivos
- [ ] Fazer upload dos arquivos (se necessário)
- [ ] Ajustar caminho do volume (se necessário)
- [ ] Reiniciar container backend
- [ ] Verificar logs novamente

---

## 🔗 Referências

- `COMO_FAZER_UPLOAD_ARQUIVOS_PORTAINER.md` - Como fazer upload de arquivos
- `CORRIGIR_ESTRUTURA_DIRETORIOS.md` - Corrigir estrutura de diretórios
- `COMO_VER_CAMINHOS_ARQUIVOS_PORTAINER.md` - Ver caminhos no Portainer
- `CONFIGURACAO_PORTAINER_PASSO_A_PASSO.md` - Configuração completa

---

## ✅ Resumo Rápido

**Para resolver o erro:**

1. ✅ **Verificar** configuração do volume no Portainer (Host: `/opt/institutobex/backend`)
2. ✅ **Verificar** se arquivos estão no servidor (`ls -la /opt/institutobex/backend/package.json`)
3. ✅ **Verificar** se volume está montado (`ls -la /app/` no container)
4. ✅ **Fazer upload** dos arquivos se não estiverem (via Git)
5. ✅ **Ajustar** caminho do volume se necessário
6. ✅ **Reiniciar** container backend

**Pronto!** Siga o checklist para identificar e resolver o problema! 🚀

