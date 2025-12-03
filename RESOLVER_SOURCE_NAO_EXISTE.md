# 🔧 Resolver: /source Não Existe (Volume Bind Não Montado)

## 🐛 Erro

```
cp: can't stat '/source/*': No such file or directory
```

## 🎯 Causa

O volume Bind não está montado, então `/source` não existe no container.

---

## ✅ Soluções

---

## ✅ Solução 1: Verificar Se Volume Bind Está Montado

### **No Console do Container Backend:**

1. **Mudar comando temporariamente**: `tail -f /dev/null`
2. **Deploy**
3. **Acessar console**

4. **Verificar**:
   ```bash
   # Verificar se /source existe
   ls -la /source/
   
   # Verificar montagens
   mount | grep /source
   
   # Verificar se volume está montado
   mount | grep "/opt/institutobex/backend"
   ```

**Se não aparecer nada:**
- Volume Bind não está montado
- Precisa configurar corretamente

---

## ✅ Solução 2: Criar Arquivos Diretamente no Container (Sem Volume)

Se o volume Bind não funciona, crie os arquivos diretamente:

### **Command:**

```bash
sh -c "mkdir -p /app && cat > /app/package.json << 'PKGEOF'
{
  \"name\": \"institutobex-backend\",
  \"version\": \"1.0.0\",
  \"main\": \"server.js\",
  \"type\": \"module\",
  \"scripts\": {
    \"start\": \"node server.js\"
  },
  \"dependencies\": {
    \"express\": \"^4.18.2\",
    \"pg\": \"^8.11.3\",
    \"bcryptjs\": \"^2.4.3\",
    \"jsonwebtoken\": \"^9.0.2\",
    \"cors\": \"^2.8.5\",
    \"dotenv\": \"^16.3.1\"
  }
}
PKGEOF
cd /app && npm install && npm start"
```

**Mas**: Isso só cria o `package.json`. Você precisaria criar todos os arquivos manualmente (não é prático).

---

## ✅ Solução 3: Usar Git Clone (Mais Prático)

Mesmo que os arquivos já estejam no servidor, você pode clonar do Git:

### **Command:**

```bash
sh -c "cd /tmp && git clone https://SEU_TOKEN@github.com/usuario/repositorio.git temp && mkdir -p /app && cp -r temp/backend/* /app/ && rm -rf temp && cd /app && npm install && npm start"
```

**Vantagem**: Não precisa de volume Bind!

---

## ✅ Solução 4: Verificar e Corrigir Volume Bind

### **Passo 1: Verificar Configuração**

1. **Containers** → `institutobex-backend` → **Volumes**
2. **Verifique**:
   - Existe volume Bind montando `/source`?
   - Host path está correto: `/opt/institutobex/backend`?

### **Passo 2: Recriar Container**

1. **Kill** container
2. **Duplicate/Edit**
3. **Volumes**:
   - Remover volume atual
   - Adicionar: **Bind** → Container `/source` → Host `/opt/institutobex/backend`
4. **Deploy**

### **Passo 3: Verificar Se Funcionou**

```bash
# No console
mount | grep /source
# Deve mostrar: /opt/institutobex/backend on /source type bind

ls -la /source/
# Deve mostrar os arquivos
```

---

## ✅ Solução 5: Usar Caminho Diferente

Tentar usar outro caminho no container:

### **Configuração:**

1. **Volumes**:
   - **Bind** → Container `/data` → Host `/opt/institutobex/backend`

2. **Command**:
   ```bash
   sh -c "mkdir -p /app && cp -r /data/* /app/ && cd /app && npm install && npm start"
   ```

---

## 🔍 Diagnóstico: Por Que /source Não Existe?

### **Verificar no Console:**

```bash
# Verificar se diretório existe
ls -la /source

# Verificar montagens
mount

# Verificar se volume está configurado
# (precisa verificar no Portainer)
```

---

## ✅ Solução Recomendada: Copiar Via Container Temporário

Como o volume Bind não está funcionando, vamos copiar os arquivos usando um container temporário:

### **Passo 1: Criar Container Temporário para Copiar**

1. **Containers** → **Add container**
2. **Name**: `copy-backend-files`
3. **Image**: `alpine:latest`
4. **Volumes**:
   - **Bind** → Container `/source` → Host `/opt/institutobex/backend`
   - **Named volume** → `backend_app_data` em `/app` (criar se não existir)
5. **Command**: `sh -c "cp -r /source/* /app/ && ls -la /app/ && tail -f /dev/null"`
6. **Deploy**

### **Passo 2: Verificar Se Arquivos Foram Copiados**

1. **Console** do container `copy-backend-files`:
   ```bash
   ls -la /app/package.json
   # Deve mostrar o arquivo!
   ```

2. Se aparecer, **remover** o container temporário

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

**Isso usa volume nomeado com arquivos já copiados!**

---

## ✅ Solução Alternativa: Git Clone (Se Tiver Acesso)

Se você tiver acesso ao Git, pode clonar diretamente:

### **Configuração:**

1. **Containers** → `institutobex-backend` → **Kill**

2. **Duplicate/Edit**:

3. **Volumes**: **Remover todos**

4. **Command & Logging** → **Command**:
   ```bash
   sh -c "cd /tmp && git clone https://SEU_TOKEN@github.com/usuario/repositorio.git temp && mkdir -p /app && cp -r temp/backend/* /app/ && rm -rf temp && cd /app && npm install && npm start"
   ```

5. **Working directory**: `/app`

6. **Deploy**

**Isso clona do Git e não precisa de volume Bind!**

---

## 📋 Checklist

- [ ] Verificar se volume Bind está configurado no Portainer
- [ ] Verificar se `/source` existe no container (`ls -la /source`)
- [ ] Verificar montagens (`mount | grep /source`)
- [ ] Se não funcionar, usar Git Clone
- [ ] Ou criar arquivos diretamente (não recomendado)

---

## 🔗 Referências

- `USAR_ARQUIVOS_SEM_VOLUMES.md` - Usar arquivos sem volumes
- `SOLUCAO_ERRO_GIT_PORTAINER.md` - Erros de Git
- `FORCAR_VOLUME_BIND_APLICAR.md` - Forçar volume Bind

---

## ✅ Resumo

**Erro**: `/source` não existe porque volume Bind não está montado.

**Soluções**:
1. ✅ **Verificar** se volume Bind está configurado
2. ✅ **Recriar** container com volume Bind
3. ✅ **Usar Git Clone** (não precisa de volume Bind)
4. ✅ **Criar arquivos** diretamente (não prático)

**Recomendação**: Use Git Clone se o volume Bind não funcionar!

**Pronto!** Tente Git Clone ou verifique o volume Bind! 🚀

