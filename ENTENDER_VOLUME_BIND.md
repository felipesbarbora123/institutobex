# 📚 Entendendo Volume Bind: /app vs /opt/institutobex/backend

## 🎯 Entendimento Importante

### **Confusão Comum:**

- ❌ `/app` **NÃO existe no servidor** - é normal!
- ✅ `/app` é o caminho **DENTRO do container**
- ✅ `/opt/institutobex/backend` é o caminho **NO SERVIDOR**

### **Como Funciona Volume Bind:**

```
Servidor (Host)                    Container
/opt/institutobex/backend   ←→    /app
     (existe no servidor)          (criado automaticamente)
```

**O Volume Bind conecta:**
- **Host**: `/opt/institutobex/backend` (servidor) - **DEVE EXISTIR**
- **Container**: `/app` (dentro do container) - **CRIADO AUTOMATICAMENTE**

---

## ✅ O Que Precisa Existir

### **No Servidor (Host):**

```
/opt/institutobex/backend/
├── package.json          ← DEVE ESTAR AQUI!
├── server.js
├── config/
├── routes/
└── ...
```

**Este caminho DEVE existir no servidor com os arquivos!**

### **No Container:**

```
/app/
├── package.json          ← Aparece automaticamente via volume
├── server.js
├── config/
├── routes/
└── ...
```

**Este caminho é criado automaticamente quando o volume é montado!**

---

## 🔍 Verificar O Que Está Acontecendo

---

## 🔍 Passo 1: Verificar Se Arquivos Estão no Servidor

### **Método: Container Temporário**

1. **Portainer** → **Containers** → **Add container**
2. **Name**: `check-server-files`
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

**Se aparecer os arquivos:**
- ✅ Arquivos estão no servidor
- ✅ Problema é no mapeamento do volume do backend

**Se NÃO aparecer os arquivos:**
- ❌ Arquivos não estão no servidor
- ✅ Precisa fazer upload dos arquivos

---

## 🔍 Passo 2: Verificar Configuração do Volume do Backend

### **No Portainer:**

1. **Containers** → `institutobex-backend`
2. Role até **Volumes**
3. **Verifique se existe volume Bind**:
   - Deve ter: **Bind mount**
   - **Container**: `/app`
   - **Host**: `/opt/institutobex/backend`

**Se NÃO existir volume:**
- ❌ Volume não está configurado
- ✅ Precisa adicionar (veja abaixo)

**Se existir mas caminho está errado:**
- ❌ Caminho do Host está incorreto
- ✅ Precisa corrigir

---

## ✅ Solução: Configurar Volume Bind Corretamente

### **Passo 1: Parar Container Backend**

1. **Containers** → `institutobex-backend` → **Stop**

### **Passo 2: Adicionar Volume Bind**

1. **Containers** → `institutobex-backend` → **Duplicate/Edit**

2. **Volumes** → **map additional volume**:
   - **Volume**: Selecione **Bind**
   - **Container**: `/app` ← **Caminho DENTRO do container**
   - **Host**: `/opt/institutobex/backend` ← **Caminho NO SERVIDOR**

3. **Deploy** o container

### **Passo 3: Verificar Se Funcionou**

Após recriar o container:

1. **Aguardar** container iniciar

2. **Acessar console**:
   ```bash
   # Verificar se /app existe (dentro do container)
   ls -la /app/
   
   # Verificar package.json
   ls -la /app/package.json
   
   # Ver montagem
   mount | grep /app
   # Deve mostrar: /opt/institutobex/backend on /app type bind
   ```

**Se aparecer os arquivos:**
- ✅ Volume está funcionando!
- ✅ `/app` foi criado automaticamente pelo volume

---

## 🔍 Passo 3: Se Arquivos Não Estão no Servidor

Se ao verificar com container temporário os arquivos não aparecerem:

### **Fazer Upload dos Arquivos:**

1. **Criar container temporário**:
   - **Name**: `upload-backend`
   - **Image**: `alpine:latest`
   - **Volumes** → **Bind**:
     - **Container**: `/upload`
     - **Host**: `/opt/institutobex/backend`

2. **Acessar console**:
   ```bash
   # Instalar Git
   apk add git
   
   # Clonar repositório
   cd /upload
   git clone https://SEU_TOKEN@github.com/usuario/repositorio.git temp
   
   # Copiar arquivos do backend
   cp -r temp/backend/* /upload/
   
   # Verificar
   ls -la /upload/package.json
   
   # Ajustar permissões
   chown -R 1000:1000 /upload
   chmod -R 755 /upload
   
   # Limpar
   rm -rf temp
   ```

3. **Agora os arquivos estão em `/opt/institutobex/backend` no servidor!**

---

## 📋 Resumo: O Que Existe Onde

### **No Servidor (Host):**
```
/opt/institutobex/backend/    ← DEVE EXISTIR COM OS ARQUIVOS
├── package.json
├── server.js
└── ...
```

### **No Container:**
```
/app/                         ← CRIADO AUTOMATICAMENTE pelo volume
├── package.json              ← Aparece via volume Bind
├── server.js
└── ...
```

### **Volume Bind:**
```
/opt/institutobex/backend (servidor)  ←→  /app (container)
```

---

## 🐛 Problemas Comuns

### **Problema 1: "Mas /app não existe no servidor!"**

**Resposta:**
- ✅ Isso é **normal**! `/app` não precisa existir no servidor
- ✅ `/app` é criado automaticamente quando o volume é montado
- ✅ O que precisa existir é `/opt/institutobex/backend` no servidor

### **Problema 2: "Como criar /app no servidor?"**

**Resposta:**
- ❌ **NÃO precisa criar** `/app` no servidor
- ✅ Precisa criar `/opt/institutobex/backend` no servidor (se não existir)
- ✅ O volume Bind cria `/app` automaticamente no container

### **Problema 3: "Arquivos estão em outro lugar no servidor"**

**Solução:**
- Ajuste o caminho do **Host** no volume Bind
- Exemplo: Se arquivos estão em `/home/usuario/backend`, use esse caminho

---

## ✅ Checklist

- [ ] Arquivos estão em `/opt/institutobex/backend` no servidor (verificar com container temporário)
- [ ] Volume Bind configurado: Container `/app` → Host `/opt/institutobex/backend`
- [ ] Container foi recriado após configurar volume
- [ ] `/app` aparece no container (verificar com `ls -la /app/`)
- [ ] `package.json` acessível em `/app/package.json` no container

---

## 🔗 Referências

- `SOLUCAO_DIRETORIO_APP_NAO_EXISTE.md` - Solução completa
- `COMO_FAZER_UPLOAD_ARQUIVOS_PORTAINER.md` - Fazer upload de arquivos
- `CONFIGURACAO_PORTAINER_PASSO_A_PASSO.md` - Configuração completa

---

## ✅ Resumo Rápido

**Entendimento:**
- `/app` **não existe no servidor** - é normal!
- `/app` é **dentro do container** - criado automaticamente
- `/opt/institutobex/backend` **deve existir no servidor** com os arquivos

**Para resolver:**
1. ✅ Verificar se arquivos estão em `/opt/institutobex/backend` no servidor
2. ✅ Configurar volume Bind: Container `/app` → Host `/opt/institutobex/backend`
3. ✅ Recriar container
4. ✅ Verificar se `/app` aparece no container (via volume)

**Pronto!** Agora você entende como funciona o volume Bind! 🚀

