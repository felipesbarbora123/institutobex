# 🔧 Resolver: Container em Loop - package.json Não Encontrado

## 🐛 Problema

- ❌ Container está em loop de restart
- ❌ Não consegue acessar console
- ❌ Erro: `ENOENT: no such file or directory, open '/opt/institutobex/backend/package.json'`
- ❌ Comando está tentando acessar `/opt/institutobex/backend/package.json` mas não encontra

---

## ✅ Solução: Parar Container e Criar package.json

---

## 🔍 Passo 1: Parar Container (Forçar)

### **No Portainer:**

1. **Containers** → `institutobex-backend`
2. Clique em **Kill** (força a parada, mais eficaz que Stop)
3. Aguarde alguns segundos

**Se não conseguir parar:**
- Aguarde alguns segundos e tente novamente
- Ou remova o container diretamente

---

## 🔍 Passo 2: Verificar Se package.json Está no Servidor

### **Criar Container Temporário:**

1. **Containers** → **Add container**
2. **Name**: `check-package-json`
3. **Image**: `alpine:latest`
4. **Volumes** → **Bind**:
   - **Container**: `/check`
   - **Host**: `/opt/institutobex/backend`
5. **Command**: `tail -f /dev/null`
6. **Deploy**

### **No Console:**

```bash
# Verificar se package.json está no servidor
ls -la /check/package.json

# Ver todos os arquivos
ls -la /check/
```

**Se aparecer:**
- ✅ Arquivo está no servidor
- ⚠️ Problema é que container não consegue acessar

**Se NÃO aparecer:**
- ❌ Arquivo não está no servidor
- ✅ Precisa criar

---

## ✅ Passo 3: Criar package.json no Servidor

### **No Console do Container Temporário:**

```bash
# Criar package.json no servidor
cat > /check/package.json << 'EOF'
{
  "name": "institutobex-backend",
  "version": "1.0.0",
  "description": "Backend API para Instituto Bex - Substituição do Supabase",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js",
    "migrate": "node scripts/run-migrations.js",
    "import-data": "node scripts/import-data.js"
  },
  "keywords": ["api", "backend", "postgresql", "express"],
  "author": "",
  "license": "ISC",
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "axios": "^1.6.2",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "express-validator": "^7.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
EOF

# Verificar
ls -la /check/package.json
cat /check/package.json

# Ajustar permissões
chown 1000:1000 /check/package.json
chmod 644 /check/package.json
```

---

## ✅ Passo 4: Configurar Container Backend Corretamente

### **Opção A: Usar Volume Bind (Se Funcionar)**

1. **Containers** → `institutobex-backend` → **Duplicate/Edit** (ou criar novo)

2. **Volumes**:
   - Remover volume atual
   - Adicionar: **Bind** → Container `/opt/institutobex/backend` → Host `/opt/institutobex/backend`

3. **Command & Logging**:
   - **Command**: `sh -c "cd /opt/institutobex/backend && npm install && npm start"`
   - **Working directory**: Deixe vazio

4. **Deploy**

---

### **Opção B: Usar Comando com Verificação (Mais Seguro)**

1. **Command & Logging** → **Command**:
   ```bash
   sh -c "if [ ! -f /opt/institutobex/backend/package.json ]; then echo 'package.json não encontrado!'; exit 1; fi && cd /opt/institutobex/backend && npm install && npm start"
   ```

Isso vai mostrar erro claro se arquivo não existir.

---

### **Opção C: Criar package.json no Início do Comando**

1. **Command & Logging** → **Command**:
   ```bash
   sh -c "cd /opt/institutobex/backend && if [ ! -f package.json ]; then cat > package.json << 'PKGEOF'
   {
     \"name\": \"institutobex-backend\",
     \"version\": \"1.0.0\",
     \"main\": \"server.js\",
     \"type\": \"module\",
     \"scripts\": {\"start\": \"node server.js\"},
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
   fi && npm install && npm start"
   ```

**⚠️ Complexo, mas cria o arquivo se não existir.**

---

## ✅ Passo 5: Verificar Se Funcionou

### **Após Configurar:**

1. **Aguardar** container iniciar

2. **Verificar logs**:
   - **Logs** → Não deve mais mostrar erro de `package.json`
   - Deve mostrar `npm install` executando

3. **Se ainda der erro**:
   - Verificar se `package.json` está no servidor
   - Verificar se volume Bind está montado
   - Verificar permissões

---

## 🔍 Verificação: Por Que Container Não Acessa o Arquivo?

### **Possíveis Causas:**

1. **Volume Bind não está montado**:
   - Container não tem acesso ao diretório do servidor
   - Verificar `mount | grep /opt/institutobex/backend` (quando conseguir acessar console)

2. **Caminho está errado**:
   - Arquivo pode estar em outro lugar
   - Verificar caminho exato

3. **Permissões**:
   - Container não tem permissão para ler
   - Ajustar: `chown -R 1000:1000 /opt/institutobex/backend`

---

## 📋 Checklist

- [ ] Parar container (Kill)
- [ ] Verificar se `package.json` está no servidor (container temporário)
- [ ] Criar `package.json` no servidor se não estiver
- [ ] Configurar container backend com volume Bind correto
- [ ] Usar comando que acessa `/opt/institutobex/backend`
- [ ] Deploy
- [ ] Verificar logs - erro deve desaparecer

---

## 🔗 Referências

- `SOLUCAO_CONTAINER_RESTARTING.md` - Resolver loop de restart
- `CRIAR_PACKAGE_JSON_SERVIDOR.md` - Criar package.json
- `DIAGNOSTICO_VOLUME_BIND_NAO_FUNCIONA_DEFINITIVO.md` - Diagnóstico volume Bind

---

## ✅ Resumo Rápido

**Para resolver o loop de restart:**

1. ✅ **Kill** o container (força parada)
2. ✅ **Criar container temporário** para verificar/criar `package.json` no servidor
3. ✅ **Criar `package.json`** no servidor se não estiver
4. ✅ **Configurar container backend**:
   - Volume Bind: Container `/opt/institutobex/backend` → Host `/opt/institutobex/backend`
   - Command: `sh -c "cd /opt/institutobex/backend && npm install && npm start"`
5. ✅ **Deploy**
6. ✅ **Verificar logs** - deve funcionar agora

**Pronto!** Siga os passos acima para resolver! 🚀

