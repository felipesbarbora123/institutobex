# ✅ Solução Direta: Copiar de /opt/institutobex/backend para /app e Iniciar

## 🎯 Objetivo

Copiar arquivos de `/opt/institutobex/backend` (servidor) para `/app` (container) e iniciar o backend.

---

## ✅ Solução: Modificar Comando do Container Backend

### **Configuração:**

1. **Containers** → `institutobex-backend` → **Kill**

2. **Duplicate/Edit**:

3. **Volumes**:
   - **Bind** → Container `/source` → Host `/opt/institutobex/backend`
   - (Apenas para copiar, não precisa persistir)

4. **Command & Logging** → **Command**:
   ```bash
   sh -c "mkdir -p /app && cp -r /source/* /app/ 2>/dev/null || true && cd /app && npm install && npm start"
   ```

5. **Working directory**: `/app`

6. **Deploy**

---

## ✅ Se Volume Bind Não Funcionar: Usar Git Clone

Se o Bind não funcionar, clone do Git diretamente:

### **Configuração:**

1. **Containers** → `institutobex-backend` → **Kill**

2. **Duplicate/Edit**:

3. **Volumes**: **Remover todos**

4. **Command & Logging** → **Command**:
   ```bash
   sh -c "mkdir -p /app && cd /tmp && git clone https://SEU_TOKEN@github.com/usuario/repositorio.git temp && cp -r temp/backend/* /app/ && rm -rf temp && cd /app && npm install && npm start"
   ```

5. **Working directory**: `/app`

6. **Deploy**

---

## ✅ Alternativa: Criar Arquivos Diretamente no Container

Se não conseguir acessar `/opt/institutobex/backend` de forma alguma:

### **Configuração:**

1. **Containers** → `institutobex-backend` → **Kill**

2. **Duplicate/Edit**:

3. **Volumes**: **Remover todos**

4. **Command & Logging** → **Command**:
   ```bash
   sh -c "mkdir -p /app && cd /app && npm init -y && npm install express pg bcryptjs jsonwebtoken cors dotenv && echo 'const express = require(\"express\"); const app = express(); app.listen(3000, () => console.log(\"Server running\"));' > server.js && npm start"
   ```

**Mas isso só cria um servidor básico. Você precisaria criar todos os arquivos manualmente.**

---

## ✅ Solução Mais Simples: Acessar Servidor Via SSH

Se você tem acesso SSH ao servidor:

### **No Servidor (via SSH):**

```bash
# Copiar arquivos para dentro do container em execução
docker cp /opt/institutobex/backend/. institutobex-backend:/app/
```

### **Ou criar volume nomeado e copiar:**

```bash
# No servidor (via SSH)
docker run --rm -v backend_app_data:/app -v /opt/institutobex/backend:/source alpine sh -c "cp -r /source/* /app/"
```

---

## ✅ Solução Definitiva: Usar Dockerfile

Criar uma imagem Docker que já contém os arquivos:

### **No Servidor (via SSH ou Portainer Console):**

1. **Criar Dockerfile**:
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY /opt/institutobex/backend/ /app/
   RUN npm install
   CMD ["npm", "start"]
   ```

2. **Build da imagem**:
   ```bash
   docker build -t institutobex-backend:latest .
   ```

3. **No Portainer**:
   - **Image**: `institutobex-backend:latest`
   - **Volumes**: Nenhum
   - **Command**: Deixe vazio

---

## 📋 Resumo das Opções

| Método | Requer | Funciona? |
|--------|--------|-----------|
| Bind + cp | Volume Bind funcionando | ❌ Não funciona no seu caso |
| Git Clone | Acesso ao Git | ✅ Sim |
| SSH + docker cp | Acesso SSH | ✅ Sim |
| Dockerfile | Acesso ao servidor | ✅ Sim |
| Criar manualmente | Muito trabalho | ⚠️ Não prático |

---

## ✅ Recomendação

**Use Git Clone** se tiver acesso ao repositório:

```bash
sh -c "mkdir -p /app && cd /tmp && git clone https://SEU_TOKEN@github.com/usuario/repositorio.git temp && cp -r temp/backend/* /app/ && rm -rf temp && cd /app && npm install && npm start"
```

**Ou use SSH** se tiver acesso ao servidor:

```bash
docker cp /opt/institutobex/backend/. institutobex-backend:/app/
```

---

## 🔗 Referências

- `USAR_ARQUIVOS_SEM_VOLUMES.md` - Soluções sem volumes
- `COPIAR_ARQUIVOS_MANUALMENTE.md` - Cópia manual

---

## ✅ Resumo

**Para copiar de `/opt/institutobex/backend` para `/app` e iniciar:**

1. ✅ **Se Bind funcionar**: Use `cp -r /source/* /app/` no comando
2. ✅ **Se não funcionar**: Use Git Clone ou SSH + docker cp
3. ✅ **Solução definitiva**: Crie Dockerfile com os arquivos

**Pronto!** Escolha o método que funciona no seu caso! 🚀

