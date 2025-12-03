# 🔧 Solução: Diretório /app Não Existe no Container

## 🐛 Erro Encontrado

```
ls -la /app/
no such file or directory
```

## 🎯 O Que Isso Significa?

O diretório `/app` não existe no container, o que significa que:
- ❌ **Volume Bind não está montado** no container
- ❌ **Volume não foi configurado** ao criar o container
- ❌ **Container foi criado sem o volume**

---

## ✅ Soluções

---

## 🔍 Passo 1: Verificar Configuração do Volume no Portainer

### **No Portainer:**

1. **Containers** → `institutobex-backend`
2. Role até a seção **Volumes**
3. **Verifique se existe algum volume mapeado**

**Se NÃO aparecer nenhum volume:**
- ❌ Volume não foi configurado
- ✅ Precisa adicionar o volume

**Se aparecer um volume:**
- Verifique se está correto:
  - **Container**: `/app`
  - **Host**: `/opt/institutobex/backend`

---

## ✅ Solução 1: Adicionar Volume ao Container Existente

### **Método A: Editar Container (Recomendado)**

1. **Portainer** → **Containers** → `institutobex-backend`

2. Clique em **Duplicate/Edit** (ou **Edit**)

3. **Pare o container primeiro** (se estiver rodando):
   - Clique em **Stop**

4. Role até a aba **Volumes**

5. **Adicionar volume**:
   - Clique em **map additional volume**
   - **Volume**: Selecione **Bind**
   - **Container**: `/app`
   - **Host**: `/opt/institutobex/backend`

6. **Salvar e Deploy**:
   - Clique em **Deploy the container**
   - O container será recriado com o volume

7. **Verificar**:
   - Aguarde o container iniciar
   - **Console** → `ls -la /app/`
   - Deve mostrar os arquivos!

---

### **Método B: Recriar Container (Se Editar Não Funcionar)**

1. **Anotar configurações atuais**:
   - Portas mapeadas
   - Variáveis de ambiente
   - Network
   - Command

2. **Parar e remover container**:
   - **Containers** → `institutobex-backend` → **Stop**
   - **Containers** → `institutobex-backend` → **Remove**

3. **Criar novo container**:
   - **Containers** → **Add container**
   - **Name**: `institutobex-backend`
   - **Image**: `node:20-alpine`

4. **Configurar Volume** (IMPORTANTE!):
   - **Volumes** → **map additional volume**
   - **Volume**: Selecione **Bind**
   - **Container**: `/app` ← **CRÍTICO!**
   - **Host**: `/opt/institutobex/backend` ← **CAMINHO NO SERVIDOR!**

5. **Configurar resto**:
   - **Network ports**: Container `3001` → Host `3001`
   - **Working directory**: `/app`
   - **Command**: `sh -c "npm install && npm start"`
   - **Environment variables**: (todas as variáveis)
   - **Network**: `institutobex-network`
   - **Restart policy**: `Unless stopped`

6. **Deploy**

7. **Verificar**:
   - **Console** → `ls -la /app/`
   - Deve mostrar os arquivos!

---

## 🔍 Passo 2: Verificar Se o Caminho do Host Existe

Antes de configurar o volume, certifique-se de que os arquivos estão no servidor:

### **Via Container Temporário:**

1. **Criar container temporário**:
   - **Containers** → **Add container**
   - **Name**: `check-files`
   - **Image**: `alpine:latest`
   - **Volumes** → **Bind**:
     - **Container**: `/check`
     - **Host**: `/opt/institutobex/backend`
   - **Command**: `tail -f /dev/null`
   - **Deploy**

2. **Acessar console**:
   - **Console** → **Connect**

3. **Verificar arquivos**:
   ```bash
   ls -la /check/
   ls -la /check/package.json
   ```

4. **Se os arquivos aparecerem**:
   - ✅ Arquivos estão no servidor
   - ✅ Pode configurar o volume

5. **Se os arquivos NÃO aparecerem**:
   - ❌ Arquivos não estão no servidor
   - ✅ Precisa fazer upload primeiro (veja `COMO_FAZER_UPLOAD_ARQUIVOS_PORTAINER.md`)

---

## 🔍 Passo 3: Verificar Após Configurar Volume

### **Após adicionar o volume e recriar o container:**

1. **Aguardar** container iniciar completamente

2. **Acessar console**:
   - **Containers** → `institutobex-backend` → **Console** → **Connect**

3. **Verificar montagem**:
   ```bash
   # Ver se /app existe agora
   ls -la /app/
   
   # Verificar package.json
   ls -la /app/package.json
   
   # Ver montagens
   mount | grep /app
   ```

4. **Se aparecer os arquivos**:
   - ✅ Volume está funcionando!
   - ✅ Container deve iniciar corretamente

5. **Se ainda não aparecer**:
   - Verifique se o caminho do Host está correto
   - Verifique se os arquivos estão no servidor
   - Verifique permissões

---

## 🐛 Problemas Comuns

### **Problema 1: "Cannot edit running container"**

**Solução:**
1. Pare o container primeiro: **Stop**
2. Depois edite: **Duplicate/Edit**

### **Problema 2: Volume adicionado mas /app ainda não existe**

**Solução:**
1. Verifique se o container foi recriado (deve ter reiniciado)
2. Verifique se o caminho do Host está correto
3. Verifique se os arquivos estão no servidor

### **Problema 3: "Host path does not exist"**

**Solução:**
- O caminho `/opt/institutobex/backend` não existe no servidor
- Crie o diretório ou ajuste o caminho
- Ou faça upload dos arquivos primeiro

### **Problema 4: Arquivos aparecem mas com permissão negada**

**Solução:**
```bash
# No servidor (via container temporário ou SSH)
chown -R 1000:1000 /opt/institutobex/backend
chmod -R 755 /opt/institutobex/backend
```

---

## 📋 Checklist Completo

- [ ] Verificar se volume está configurado no Portainer
- [ ] Verificar se arquivos estão em `/opt/institutobex/backend` no servidor
- [ ] Parar container (se estiver rodando)
- [ ] Adicionar volume Bind: Container `/app` → Host `/opt/institutobex/backend`
- [ ] Recriar/Deploy container
- [ ] Verificar se `/app` existe no console (`ls -la /app/`)
- [ ] Verificar se `package.json` está acessível (`ls -la /app/package.json`)
- [ ] Verificar logs - erro deve desaparecer

---

## 🔍 Verificação Detalhada

### **1. Verificar Configuração Atual:**

```
Portainer → Containers → institutobex-backend → Volumes
- Deve mostrar: Bind mount
  - Container: /app
  - Host: /opt/institutobex/backend
```

### **2. Verificar Arquivos no Servidor:**

```bash
# Via container temporário
ls -la /opt/institutobex/backend/package.json
# Deve mostrar o arquivo
```

### **3. Verificar Volume no Container:**

```bash
# No console do backend
mount | grep /app
# Deve mostrar: /opt/institutobex/backend on /app type bind

ls -la /app/
# Deve mostrar os arquivos
```

---

## 💡 Dica: Configuração Correta do Container

Certifique-se de que o container tem:

1. ✅ **Volume Bind**:
   - Container: `/app`
   - Host: `/opt/institutobex/backend`

2. ✅ **Working directory**: `/app`

3. ✅ **Command**: `sh -c "npm install && npm start"`

4. ✅ **Environment variables**: Todas configuradas

5. ✅ **Network**: `institutobex-network`

---

## 🔗 Referências

- `CORRIGIR_VOLUME_BIND_BACKEND.md` - Corrigir volume Bind
- `SOLUCAO_PACKAGE_JSON_NAO_ENCONTRADO.md` - Solução completa
- `COMO_FAZER_UPLOAD_ARQUIVOS_PORTAINER.md` - Fazer upload de arquivos
- `CONFIGURACAO_PORTAINER_PASSO_A_PASSO.md` - Configuração completa

---

## ✅ Resumo Rápido

**Para resolver "no such file or directory /app":**

1. ✅ **Verificar** se volume está configurado no Portainer
2. ✅ **Parar** container (se estiver rodando)
3. ✅ **Adicionar volume Bind**:
   - Container: `/app`
   - Host: `/opt/institutobex/backend`
4. ✅ **Deploy** container (será recriado)
5. ✅ **Verificar** no console: `ls -la /app/`
6. ✅ **Verificar** logs - erro deve desaparecer

**Pronto!** Agora o diretório `/app` deve existir e os arquivos devem estar acessíveis! 🚀

