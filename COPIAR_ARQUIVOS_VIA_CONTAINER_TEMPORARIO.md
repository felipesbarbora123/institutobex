# 📋 Copiar Arquivos Via Container Temporário (Sem Volume Bind Funcionando)

## 🎯 Situação

- ✅ Arquivos estão em `/opt/institutobex/backend` no servidor
- ❌ Volume Bind não funciona (`/source` não existe)
- ❌ Não quer usar Git
- ✅ Quer usar os arquivos no backend

---

## ✅ Solução: Container Temporário + Volume Nomeado

### **Como Funciona:**

1. Criar container temporário que **consegue** acessar `/opt/institutobex/backend` (mesmo que o backend não consiga)
2. Copiar arquivos para um **volume nomeado**
3. Backend usa o **volume nomeado** (que funciona)

---

## 📋 Passo a Passo

---

## ✅ Passo 1: Criar Volume Nomeado

1. **Volumes** → **Add volume**
2. **Name**: `backend_app_data`
3. **Driver**: `local`
4. **Create**

---

## ✅ Passo 2: Criar Container Temporário para Copiar

1. **Containers** → **Add container**

2. **Name**: `copy-backend-files`

3. **Image**: `alpine:latest`

4. **Volumes**:
   - **Bind** → Container `/source` → Host `/opt/institutobex/backend`
   - **Named volume** → `backend_app_data` em `/app`

5. **Command & Logging** → **Command**:
   ```bash
   sh -c "echo 'Copiando arquivos...' && cp -r /source/* /app/ && echo 'Arquivos copiados!' && ls -la /app/ && tail -f /dev/null"
   ```

6. **Deploy**

---

## ✅ Passo 3: Verificar Se Arquivos Foram Copiados

1. **Console** do container `copy-backend-files`

2. **Verificar**:
   ```bash
   ls -la /app/package.json
   # Deve mostrar o arquivo!
   
   ls -la /app/
   # Deve mostrar todos os arquivos do backend
   ```

3. **Se aparecer os arquivos:**
   - ✅ Arquivos foram copiados com sucesso!
   - ✅ Pode remover o container temporário

4. **Se NÃO aparecer:**
   - ⚠️ Verificar se `/source` existe:
     ```bash
     ls -la /source/
     ```
   - ⚠️ Se `/source` não existir, o Bind também não funcionou neste container
   - ✅ Tentar outra solução

---

## ✅ Passo 4: Remover Container Temporário

1. **Containers** → `copy-backend-files` → **Stop**
2. **Remove**

---

## ✅ Passo 5: Configurar Backend para Usar Volume Nomeado

1. **Containers** → `institutobex-backend` → **Kill**

2. **Duplicate/Edit**:

3. **Volumes**:
   - **Remover** todos os volumes Bind (incluindo `/source`)
   - **Adicionar**: **Named volume** → `backend_app_data` em `/app`

4. **Command & Logging**:
   - **Command**: `sh -c "cd /app && npm install && npm start"`
   - **Working directory**: `/app`

5. **Deploy**

---

## ✅ Passo 6: Verificar Se Backend Funcionou

1. **Logs** do container `institutobex-backend`
2. **Deve mostrar**:
   - ✅ `npm install` executando
   - ✅ Dependências instaladas
   - ✅ Servidor iniciando

---

## 🔍 Se Container Temporário Também Não Consegue Acessar `/source`

Se o container temporário também não conseguir acessar `/source`, significa que o volume Bind não está funcionando de forma alguma no Portainer.

### **Alternativas:**

1. **Verificar se caminho está correto**:
   - Tentar outros caminhos: `/opt/institutobex`, `/home`, etc.

2. **Usar Git Clone** (mesmo que você não queira, pode ser a única opção):
   ```bash
   sh -c "cd /tmp && git clone https://SEU_TOKEN@github.com/usuario/repositorio.git temp && mkdir -p /app && cp -r temp/backend/* /app/ && rm -rf temp && cd /app && npm install && npm start"
   ```

3. **Criar arquivos manualmente** (não recomendado, muito trabalhoso)

---

## 📋 Checklist

- [ ] Criar volume nomeado `backend_app_data`
- [ ] Criar container temporário com Bind `/source` e volume nomeado `/app`
- [ ] Verificar se arquivos foram copiados (`ls -la /app/`)
- [ ] Remover container temporário
- [ ] Configurar backend para usar volume nomeado
- [ ] Verificar logs do backend

---

## 🔗 Referências

- `RESOLVER_SOURCE_NAO_EXISTE.md` - Resolver erro `/source` não existe
- `USAR_ARQUIVOS_SEM_VOLUMES.md` - Usar arquivos sem volumes

---

## ✅ Resumo

**Solução**: Usar container temporário para copiar arquivos do servidor para volume nomeado, depois usar volume nomeado no backend.

**Vantagens**:
- ✅ Não depende de volume Bind funcionar no backend
- ✅ Arquivos ficam no volume nomeado (persistem)
- ✅ Backend funciona normalmente

**Pronto!** Siga os passos para copiar arquivos via container temporário! 🚀

