# 📋 Usar Arquivos do Servidor Sem Volumes

## 🎯 Situação

- ✅ Arquivos já estão em `/opt/institutobex/backend` no servidor
- ❌ Não quer usar volume Bind (não funciona)
- ❌ Não quer usar volumes nomeados
- ❌ Não quer usar Git
- ✅ Quer usar os arquivos diretamente

---

## ⚠️ Limitação Importante

**Sem volumes, o container não tem acesso aos arquivos do servidor!**

Para usar os arquivos que estão no servidor, você precisa de **alguma forma de acesso**:
- Volume Bind (não funciona no seu caso)
- Volume nomeado (você não quer)
- Copiar para dentro do container (mas precisa de acesso para copiar)

---

## ✅ Soluções Possíveis

---

## ✅ Solução 1: Copiar Arquivos na Inicialização (Usando Bind Temporário)

### **Como Funciona:**

Usa volume Bind apenas para copiar os arquivos na inicialização, depois os arquivos ficam dentro do container.

### **Configuração:**

1. **Containers** → `institutobex-backend` → **Kill**

2. **Duplicate/Edit**:

3. **Volumes**:
   - **Bind** → Container `/source` → Host `/opt/institutobex/backend`
   - (Usado apenas para copiar, não precisa persistir)

4. **Command & Logging** → **Command**:
   ```bash
   sh -c "mkdir -p /app && cp -r /source/* /app/ && cd /app && npm install && npm start"
   ```

5. **Working directory**: `/app`

6. **Deploy**

**Os arquivos são copiados do servidor para `/app` na inicialização!**

---

## ✅ Solução 2: Criar Imagem Docker com os Arquivos

### **Como Funciona:**

Cria uma imagem Docker que já contém os arquivos.

### **Passo 1: Criar Dockerfile no Servidor**

No servidor (via SSH ou container temporário):

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copiar arquivos do backend
COPY /opt/institutobex/backend/ /app/

# Instalar dependências
RUN npm install

# Comando padrão
CMD ["npm", "start"]
```

### **Passo 2: Build da Imagem**

```bash
# No servidor (via SSH)
cd /opt/institutobex
docker build -t institutobex-backend:latest .
```

### **Passo 3: Usar no Portainer**

1. **Containers** → **Add container**
2. **Image**: `institutobex-backend:latest` (imagem local)
3. **Volumes**: **Nenhum**
4. **Command**: Deixe vazio (usa CMD do Dockerfile)
5. **Deploy**

**Arquivos estão dentro da imagem!**

---

## ✅ Solução 3: Copiar Arquivos Manualmente Uma Vez

### **Passo 1: Criar Container Temporário**

1. **Containers** → **Add container**
2. **Name**: `setup-backend`
3. **Image**: `node:20-alpine`
4. **Volumes**: **Nenhum**
5. **Command**: `tail -f /dev/null`
6. **Deploy**

### **Passo 2: Copiar Arquivos para Dentro do Container**

No console:

```bash
# Instalar ferramentas
apk add git

# Clonar ou copiar arquivos
# Opção A: Se tiver acesso ao servidor via outro método
# Opção B: Criar arquivos manualmente
# Opção C: Usar wget/curl se arquivos estão em servidor web
```

**Mas**: Sem acesso ao servidor, não consegue copiar.

---

## ✅ Solução 4: Usar Bind Apenas para Copiar (Recomendado)

### **Configuração:**

1. **Volumes**:
   - **Bind** → Container `/source` → Host `/opt/institutobex/backend`
   - (Apenas para copiar)

2. **Command**:
   ```bash
   sh -c "mkdir -p /app && cp -r /source/* /app/ && cd /app && npm install && npm start"
   ```

**Vantagem**: Usa Bind apenas para copiar, depois os arquivos ficam no container.

**Desvantagem**: Arquivos são copiados toda vez que container é recriado.

---

## 🔍 Comparação

| Método | Volumes Necessários | Persistência | Atualização |
|--------|---------------------|--------------|-------------|
| Bind para copiar | Bind (temporário) | ❌ Perde ao recriar | Manual |
| Imagem Docker | Nenhum | ✅ Na imagem | Rebuild |
| Volume nomeado | Nomeado | ✅ Persiste | Manual |
| Git Clone | Nenhum | ❌ Perde ao recriar | Automático |

---

## ✅ Solução Recomendada: Bind Temporário para Copiar

### **Configuração Completa:**

1. **Containers** → `institutobex-backend` → **Kill**

2. **Duplicate/Edit**:

3. **Volumes**:
   - **Bind** → Container `/source` → Host `/opt/institutobex/backend`
   - (Usado apenas para copiar)

4. **Command & Logging**:
   - **Command**:
     ```bash
     sh -c "mkdir -p /app && cp -r /source/* /app/ && cd /app && npm install && npm start"
     ```
   - **Working directory**: `/app`

5. **Deploy**

**Isso copia os arquivos do servidor para `/app` na inicialização!**

---

## 🔍 Verificar Se Funcionou

### **Após Deploy:**

1. **Mudar comando temporariamente**: `tail -f /dev/null`
2. **Deploy**
3. **Acessar console**:
   ```bash
   ls -la /app/package.json
   # Deve mostrar o arquivo!
   ```

---

## 📋 Checklist

- [ ] Parar container
- [ ] Adicionar Bind temporário: Container `/source` → Host `/opt/institutobex/backend`
- [ ] Configurar comando para copiar: `cp -r /source/* /app/`
- [ ] Deploy
- [ ] Verificar se arquivos foram copiados
- [ ] Verificar logs - deve funcionar

---

## 🔗 Referências

- `USAR_ARQUIVOS_SERVIDOR_SEM_BIND.md` - Usar arquivos sem Bind
- `SOLUCOES_SEM_VOLUME_BIND.md` - Soluções sem volume Bind

---

## ✅ Resumo

**Para usar arquivos sem volumes nomeados:**

1. ✅ **Usar Bind temporário** apenas para copiar
2. ✅ **Comando copia** arquivos do `/source` para `/app`
3. ✅ **Arquivos ficam** dentro do container
4. ✅ **Não precisa** de volume nomeado

**Comando:**
```bash
sh -c "mkdir -p /app && cp -r /source/* /app/ && cd /app && npm install && npm start"
```

**Pronto!** Use Bind temporário apenas para copiar! 🚀

