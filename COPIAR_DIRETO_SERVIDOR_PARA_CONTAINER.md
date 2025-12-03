# ✅ Copiar Direto: /opt/institutobex/backend → /app (Container)

## 🎯 Objetivo

Copiar arquivos de `/opt/institutobex/backend` (servidor) para `/app` (dentro do container) e iniciar.

---

## ✅ Solução: SSH + docker cp

### **No Servidor (via SSH):**

```bash
# Parar o container primeiro
docker stop institutobex-backend

# Copiar arquivos do servidor para dentro do container
docker cp /opt/institutobex/backend/. institutobex-backend:/app/

# Iniciar o container
docker start institutobex-backend
```

---

## ✅ Configurar Container para Usar /app

### **No Portainer:**

1. **Containers** → `institutobex-backend` → **Duplicate/Edit**

2. **Volumes**: **Remover todos** (não precisa de volume Bind)

3. **Command & Logging** → **Command**:
   ```bash
   sh -c "cd /app && npm install && npm start"
   ```

4. **Working directory**: `/app`

5. **Deploy**

---

## ✅ Se Não Tiver SSH: Usar Portainer Console

### **Opção 1: Criar Container com Acesso ao Servidor**

1. **Containers** → **Add container**
2. **Name**: `copy-to-backend`
3. **Image**: `alpine:latest`
4. **Volumes**:
   - **Bind** → Container `/host` → Host `/`
   - **Bind** → Container `/target` → Host (caminho do volume do backend)
5. **Command**: `sh -c "cp -r /host/opt/institutobex/backend/* /target/ && tail -f /dev/null"`

**Mas isso também requer volume Bind funcionando...**

---

## ✅ Solução Definitiva: Criar Imagem Docker

### **No Servidor (via SSH ou Portainer Console):**

1. **Criar Dockerfile**:
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY /opt/institutobex/backend/ /app/
   RUN npm install
   CMD ["npm", "start"]
   ```

2. **Build**:
   ```bash
   docker build -t institutobex-backend:latest -f Dockerfile .
   ```

3. **No Portainer**:
   - **Image**: `institutobex-backend:latest`
   - **Volumes**: Nenhum
   - **Command**: Deixe vazio

---

## ✅ Comando Completo (SSH)

```bash
# 1. Parar container
docker stop institutobex-backend

# 2. Copiar arquivos
docker cp /opt/institutobex/backend/. institutobex-backend:/app/

# 3. Verificar se copiou
docker exec institutobex-backend ls -la /app/package.json

# 4. Configurar comando no Portainer para: cd /app && npm install && npm start

# 5. Iniciar container
docker start institutobex-backend
```

---

## 📋 Resumo

**Para copiar de `/opt/institutobex/backend` para `/app`:**

1. ✅ **Via SSH**: `docker cp /opt/institutobex/backend/. institutobex-backend:/app/`
2. ✅ **Configurar comando**: `cd /app && npm install && npm start`
3. ✅ **Iniciar**: Container vai instalar dependências e iniciar

**Pronto!** Use `docker cp` via SSH! 🚀

