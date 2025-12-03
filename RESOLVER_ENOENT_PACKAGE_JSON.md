# 🔧 Resolver: ENOENT package.json - Volume Bind Não Montado

## 🐛 Erro Encontrado

```
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory, open '/app/package.json'
```

## 🎯 Causa do Problema

O container não encontra o `package.json` porque:
- ❌ **Volume Bind não está configurado** ou
- ❌ **Volume não está montado** corretamente

O diretório `/app` existe no container, mas está **vazio** porque o volume do servidor não está conectado.

---

## ✅ Solução Passo a Passo

---

## 🔍 Passo 1: Verificar Se Volume Está Configurado

### **No Portainer:**

1. **Containers** → `institutobex-backend`
2. Role até a seção **Volumes**
3. **Verifique se existe volume Bind**:

**Deve aparecer:**
```
Bind mount
├── Container: /app
└── Host: /opt/institutobex/backend
```

**Se NÃO aparecer NENHUM volume:**
- ❌ **Este é o problema!**
- ✅ Volume não está configurado
- ✅ Precisa adicionar

**Se aparecer mas caminho está diferente:**
- ⚠️ Verifique se o caminho do Host está correto

---

## ✅ Passo 2: Parar Container

1. **Containers** → `institutobex-backend` → **Stop**
2. Aguarde até o status mudar para **Stopped**

---

## ✅ Passo 3: Adicionar Volume Bind

1. **Containers** → `institutobex-backend` → **Duplicate/Edit**

2. **Volumes** → **map additional volume**:
   - **Volume**: Selecione **Bind**
   - **Container**: `/app` ← **Caminho dentro do container**
   - **Host**: `/opt/institutobex/backend` ← **Caminho no servidor**

3. **Verificar outras configurações** (não mudar, só verificar):
   - **Command & Logging** → **Command**: `sh -c 'npm install && npm start'` ✅
   - **Command & Logging** → **Working directory**: `/app` ✅

4. **Deploy** o container

---

## 🔍 Passo 4: Verificar Se Arquivos Estão no Servidor

Antes de testar, certifique-se de que os arquivos estão no servidor:

### **Método: Container Temporário**

1. **Containers** → **Add container**
2. **Name**: `verify-files`
3. **Image**: `alpine:latest`
4. **Volumes** → **Bind**:
   - **Container**: `/check`
   - **Host**: `/opt/institutobex/backend`
5. **Command**: `tail -f /dev/null`
6. **Deploy**

7. **Acessar console**:
   ```bash
   # Verificar se arquivos estão no servidor
   ls -la /check/
   ls -la /check/package.json
   ```

**Se aparecer o arquivo:**
- ✅ Arquivos estão no servidor
- ✅ Volume Bind deve funcionar

**Se NÃO aparecer:**
- ❌ Arquivos não estão no servidor
- ✅ Precisa fazer upload primeiro (veja `COMO_FAZER_UPLOAD_ARQUIVOS_PORTAINER.md`)

---

## ✅ Passo 5: Verificar Se Funcionou

Após recriar o container com o volume:

1. **Aguardar** container iniciar

2. **Verificar logs**:
   - **Containers** → `institutobex-backend` → **Logs**
   - **Não deve mais aparecer** erro de `package.json`
   - **Deve mostrar**: `npm install` executando e instalando pacotes

3. **Acessar console** (opcional, para confirmar):
   ```bash
   # Verificar se /app tem arquivos agora
   ls -la /app/
   
   # Verificar package.json
   ls -la /app/package.json
   
   # Ver montagem do volume
   mount | grep /app
   # Deve mostrar: /opt/institutobex/backend on /app type bind
   ```

---

## 🐛 Se Ainda Não Funcionar

### **Problema 1: Volume configurado mas arquivos não aparecem**

**Verificar:**
```bash
# No console do backend
mount | grep /app
```

**Se não aparecer nada:**
- Volume não está montado
- Verifique se o container foi recriado após adicionar volume

**Se aparecer mas arquivos não estão lá:**
- Verifique se arquivos estão em `/opt/institutobex/backend` no servidor
- Verifique permissões: `chown -R 1000:1000 /opt/institutobex/backend`

### **Problema 2: Arquivos não estão no servidor**

**Solução**: Fazer upload dos arquivos:

1. **Criar container temporário**:
   - **Name**: `upload-backend`
   - **Image**: `alpine:latest`
   - **Volumes** → **Bind**: Container `/upload`, Host `/opt/institutobex/backend`

2. **Console**:
   ```bash
   apk add git
   cd /upload
   git clone https://SEU_TOKEN@github.com/usuario/repositorio.git temp
   cp -r temp/backend/* /upload/
   chown -R 1000:1000 /upload
   chmod -R 755 /upload
   rm -rf temp
   ```

3. **Remover container temporário**

4. **Recriar container backend** com volume Bind

---

## 📋 Checklist Completo

- [ ] Verificar se volume Bind está configurado no Portainer
- [ ] Parar container backend
- [ ] Adicionar volume Bind: Container `/app` → Host `/opt/institutobex/backend`
- [ ] Verificar se arquivos estão em `/opt/institutobex/backend` no servidor
- [ ] Deploy container (recriar)
- [ ] Verificar logs - erro de `package.json` deve desaparecer
- [ ] Verificar se `npm install` está executando
- [ ] Verificar se container está rodando sem erros

---

## 🔍 Verificação Detalhada

### **1. Verificar Configuração do Volume:**

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

### **3. Verificar Volume Montado no Container:**

```bash
# No console do backend
mount | grep /app
# Deve mostrar: /opt/institutobex/backend on /app type bind

ls -la /app/package.json
# Deve mostrar o arquivo
```

---

## 💡 Dica: Comando de Debug

Se quiser ver exatamente o que está acontecendo, use este comando temporariamente:

1. **Command & Logging** → **Command**:
   ```bash
   sh -c "ls -la /app/ && echo '=== FILES ===' && cat /app/package.json && npm install && npm start"
   ```

Isso vai mostrar os arquivos antes de tentar instalar.

---

## 🔗 Referências

- `VERIFICAR_COMANDO_E_VOLUME.md` - Verificar comando e volume
- `ENTENDER_VOLUME_BIND.md` - Entender volume Bind
- `COMO_FAZER_UPLOAD_ARQUIVOS_PORTAINER.md` - Fazer upload de arquivos
- `SOLUCAO_DIRETORIO_APP_NAO_EXISTE.md` - Solução completa

---

## ✅ Resumo Rápido

**O erro confirma**: Volume Bind não está montado!

**Para resolver:**
1. ✅ **Parar** container
2. ✅ **Adicionar volume Bind**: Container `/app` → Host `/opt/institutobex/backend`
3. ✅ **Verificar** se arquivos estão no servidor
4. ✅ **Deploy** container (recriar)
5. ✅ **Verificar logs** - erro deve desaparecer

**Pronto!** Siga os passos acima e o problema será resolvido! 🚀

