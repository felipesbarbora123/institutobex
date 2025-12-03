# 📝 Criar package.json no Servidor

## 🎯 Solução Rápida

O `package.json` não está no servidor. Vamos criá-lo agora.

---

## ✅ Passo 1: Criar Container Temporário

1. **Portainer** → **Containers** → **Add container**
2. **Name**: `create-package-json`
3. **Image**: `alpine:latest`
4. **Volumes** → **Bind**:
   - **Container**: `/upload`
   - **Host**: `/opt/institutobex/backend`
5. **Command**: `tail -f /dev/null`
6. **Deploy**

---

## ✅ Passo 2: Criar package.json

### **No Console do Container:**

```bash
# Criar package.json
cat > /upload/package.json << 'EOF'
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
  "keywords": [
    "api",
    "backend",
    "postgresql",
    "express"
  ],
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

# Verificar se foi criado
cat /upload/package.json

# Ajustar permissões
chown 1000:1000 /upload/package.json
chmod 644 /upload/package.json

# Verificar
ls -la /upload/package.json
```

---

## ✅ Passo 3: Verificar Se Funcionou

### **No Console do Container Backend:**

1. **Parar** container backend (se estiver rodando)
2. **Recriar** container (para garantir que volume está montado)
3. **Acessar console**:
   ```bash
   ls -la /app/package.json
   cat /app/package.json
   ```

**Se aparecer o arquivo:**
- ✅ `package.json` está no lugar certo!
- ✅ Agora o `npm install` deve funcionar

---

## ✅ Passo 4: Testar npm install

### **No Console do Backend:**

```bash
cd /app
npm install
```

**Deve instalar todas as dependências agora!**

---

## 🔗 Referências

- `PACKAGE_JSON_FALTANDO.md` - Guia completo sobre package.json faltando
- `COMO_FAZER_UPLOAD_ARQUIVOS_PORTAINER.md` - Fazer upload de arquivos

---

## ✅ Resumo

**Execute os comandos acima no container temporário para criar o `package.json` no servidor!**

**Pronto!** Agora o `package.json` estará no servidor e o `npm install` deve funcionar! 🚀

