# 🔧 Resolver: Arquivos Deletados Após Reiniciar Container

## 🐛 Problema

Arquivos copiados para `/app` são deletados quando o container reinicia.

## 🎯 Causa

`/app` não é um volume persistente. É apenas um diretório dentro do container que é perdido quando o container é recriado.

---

## ✅ Solução: Usar Volume Nomeado para /app

### **Passo 1: Criar Volume Nomeado**

1. **Volumes** → **Add volume**
2. **Name**: `backend_app_data`
3. **Driver**: `local`
4. **Create**

---

### **Passo 2: Copiar Arquivos para o Volume Nomeado**

#### **Opção A: Via Container Temporário**

1. **Containers** → **Add container**
2. **Name**: `setup-backend-volume`
3. **Image**: `alpine:latest`
4. **Volumes**:
   - **Named volume** → `backend_app_data` em `/app`
5. **Command**: `tail -f /dev/null`
6. **Deploy**

7. **Console** do container `setup-backend-volume`:
   ```bash
   # Instalar git
   apk add git
   
   # Clonar repositório
   cd /tmp
   git clone https://SEU_TOKEN@github.com/usuario/repositorio.git temp
   
   # Copiar para /app (que é o volume nomeado)
   cp -r temp/backend/* /app/
   
   # Verificar
   ls -la /app/package.json
   ```

8. **Remover** container temporário após copiar

---

#### **Opção B: Via Container Backend (Se Já Estiver Rodando)**

1. **Containers** → `institutobex-backend` → **Kill**

2. **Duplicate/Edit**:

3. **Volumes**:
   - **Adicionar**: **Named volume** → `backend_app_data` em `/app`

4. **Command & Logging** → **Command**:
   
   **Para Alpine Linux (node:20-alpine):**
   ```bash
   sh -c "apk add --no-cache git; cd /tmp; git clone https://SEU_TOKEN@github.com/usuario/repositorio.git temp; cp -r temp/backend/* /app/; rm -rf temp; cd /app; npm install && npm start"
   ```
   
   **Para Debian/Ubuntu (node:20):**
   ```bash
   sh -c "apt-get update; apt-get install -y git; cd /tmp; git clone https://SEU_TOKEN@github.com/usuario/repositorio.git temp; cp -r temp/backend/* /app/; rm -rf temp; cd /app; npm install && npm start"
   ```

5. **Working directory**: `/app`

6. **Deploy**

**Na primeira execução, os arquivos serão copiados. Nas próximas, já estarão no volume!**

---

### **Passo 3: Configurar Backend para Usar Volume Nomeado**

1. **Containers** → `institutobex-backend` → **Kill**

2. **Duplicate/Edit**:

3. **Volumes**:
   - **Remover** todos os volumes Bind
   - **Adicionar**: **Named volume** → `backend_app_data` em `/app`

4. **Command & Logging** → **Command**:
   ```bash
   sh -c "cd /app && npm install && npm start"
   ```

5. **Working directory**: `/app`

6. **Deploy**

**Agora os arquivos vão persistir!**

---

## ✅ Verificar Se Funcionou

1. **Console** do container `institutobex-backend`:
   ```bash
   ls -la /app/package.json
   # Deve mostrar o arquivo!
   ```

2. **Reiniciar** o container:
   - **Stop** → **Start**

3. **Verificar novamente**:
   ```bash
   ls -la /app/package.json
   # Deve continuar mostrando o arquivo!
   ```

---

## 🔍 Por Que Isso Funciona?

- **Volume nomeado** persiste os dados mesmo quando o container é removido
- **Bind mount** monta diretório do servidor (não funcionou no seu caso)
- **Diretório normal** (`/app` sem volume) é perdido ao recriar container

---

## 📋 Checklist

- [ ] Criar volume nomeado `backend_app_data`
- [ ] Copiar arquivos para o volume (via Git Clone ou container temporário)
- [ ] Configurar backend para usar volume nomeado em `/app`
- [ ] Verificar se arquivos persistem após reiniciar

---

## 🔗 Referências

- `USAR_ARQUIVOS_SEM_VOLUMES.md` - Soluções sem volumes
- `COPIAR_ARQUIVOS_VIA_CONTAINER_TEMPORARIO.md` - Cópia via container

---

## ✅ Resumo

**Problema**: Arquivos em `/app` são deletados ao reiniciar.

**Solução**: Usar volume nomeado para `/app`:
1. ✅ Criar volume nomeado `backend_app_data`
2. ✅ Copiar arquivos para o volume (uma vez)
3. ✅ Configurar backend para usar volume nomeado em `/app`
4. ✅ Arquivos vão persistir!

**Pronto!** Use volume nomeado para persistir os arquivos! 🚀

