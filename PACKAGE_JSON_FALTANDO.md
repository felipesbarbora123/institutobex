# 🔧 Resolver: package.json Não Está no Servidor

## 🐛 Problema

- ❌ `package.json` não está em `/app` (e não está no servidor)
- ✅ `package-lock.json` está presente (gerado pelo npm install)
- ❌ Sem `package.json`, o `npm install` não funciona corretamente

## 🎯 Causa

O arquivo `package.json` não está no servidor em `/opt/institutobex/backend`. Ele precisa estar lá para o `npm install` funcionar.

---

## ✅ Solução: Verificar e Fazer Upload do package.json

---

## 🔍 Passo 1: Verificar Se package.json Está no Servidor

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

**Se aparecer `package.json`:**
- ✅ Arquivo está no servidor
- ⚠️ Problema é no volume Bind do backend

**Se NÃO aparecer:**
- ❌ Arquivo não está no servidor
- ✅ Precisa fazer upload

---

## ✅ Passo 2: Fazer Upload do package.json

### **Método 1: Via Git (Recomendado)**

1. **Criar container temporário**:
   - **Name**: `upload-package-json`
   - **Image**: `alpine:latest`
   - **Volumes** → **Bind**: Container `/upload`, Host `/opt/institutobex/backend`
   - **Command**: `tail -f /dev/null`
   - **Deploy**

2. **Console**:
   ```bash
   # Instalar Git
   apk add git
   
   # Clonar repositório
   cd /upload
   git clone https://SEU_TOKEN@github.com/usuario/repositorio.git temp
   
   # Copiar package.json
   cp temp/backend/package.json /upload/
   
   # Verificar
   ls -la /upload/package.json
   
   # Ajustar permissões
   chown 1000:1000 /upload/package.json
   chmod 644 /upload/package.json
   
   # Limpar
   rm -rf temp
   ```

---

### **Método 2: Criar package.json Manualmente (Temporário)**

Se você não tem acesso ao Git ou precisa de uma solução rápida:

1. **Container temporário** (mesmo do método 1)

2. **Console**:
   ```bash
   # Criar package.json básico
   cat > /upload/package.json << 'EOF'
   {
     "name": "institutobex-backend",
     "version": "1.0.0",
     "description": "Backend do Instituto Bex",
     "main": "server.js",
     "scripts": {
       "start": "node server.js",
       "dev": "node server.js"
     },
     "dependencies": {
       "express": "^4.18.2",
       "pg": "^8.11.3",
       "dotenv": "^16.3.1",
       "jsonwebtoken": "^9.0.2",
       "bcryptjs": "^2.4.3",
       "cors": "^2.8.5"
     }
   }
   EOF
   
   # Verificar
   cat /upload/package.json
   
   # Ajustar permissões
   chown 1000:1000 /upload/package.json
   chmod 644 /upload/package.json
   ```

**⚠️ Nota**: Este é um exemplo básico. Use o `package.json` real do seu projeto!

---

### **Método 3: Copiar do Seu Computador**

Se você tem o `package.json` no seu computador:

1. **Criar container temporário** (mesmo do método 1)

2. **No seu computador**, copie o conteúdo do `package.json`

3. **No console do container**:
   ```bash
   # Criar arquivo
   cat > /upload/package.json << 'EOF'
   [cole o conteúdo do package.json aqui]
   EOF
   
   # Verificar
   cat /upload/package.json
   
   # Ajustar permissões
   chown 1000:1000 /upload/package.json
   chmod 644 /upload/package.json
   ```

---

## ✅ Passo 3: Verificar Se package.json Está Acessível

### **Após Fazer Upload:**

1. **Verificar no servidor** (container temporário):
   ```bash
   ls -la /check/package.json
   cat /check/package.json
   ```

2. **Verificar no container backend**:
   - **Console** do backend
   ```bash
   ls -la /app/package.json
   cat /app/package.json
   ```

**Se aparecer em ambos:**
- ✅ Arquivo está no lugar certo
- ✅ Volume Bind está funcionando

---

## ✅ Passo 4: Recriar Container Backend

Após fazer upload do `package.json`:

1. **Parar** container backend
2. **Recriar** container (para garantir que volume está montado)
3. **Verificar logs** - deve funcionar agora

---

## 🔍 Verificar package.json Completo

Se você tem o `package.json` no seu projeto local, verifique se tem todas as dependências necessárias. Um `package.json` típico do backend deve ter:

```json
{
  "name": "institutobex-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "dotenv": "^16.3.1",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5"
  }
}
```

**Use o `package.json` real do seu projeto!**

---

## 🐛 Problemas Comuns

### **Problema 1: package.json criado mas npm install ainda falha**

**Solução**: 
- Verificar se `package.json` tem sintaxe JSON válida
- Verificar se tem todas as dependências necessárias
- Verificar permissões: `chown 1000:1000 /opt/institutobex/backend/package.json`

### **Problema 2: package.json aparece no servidor mas não no container**

**Solução**: 
- Verificar se volume Bind está montado
- Recriar container
- Verificar `mount | grep /app`

### **Problema 3: Não tenho o package.json original**

**Solução**: 
- Verificar no repositório Git
- Ou criar um básico e adicionar dependências conforme necessário

---

## 📋 Checklist

- [ ] Verificar se `package.json` está no servidor (`/opt/institutobex/backend`)
- [ ] Se não estiver, fazer upload via Git ou criar manualmente
- [ ] Verificar permissões do arquivo
- [ ] Verificar se aparece no container backend (`/app/package.json`)
- [ ] Recriar container backend
- [ ] Verificar logs - `npm install` deve funcionar agora

---

## 🔗 Referências

- `COMO_FAZER_UPLOAD_ARQUIVOS_PORTAINER.md` - Fazer upload de arquivos
- `FORCAR_VOLUME_BIND_APLICAR.md` - Forçar volume Bind
- `DIAGNOSTICO_CONSOLE_VOLUME.md` - Diagnóstico no console

---

## ✅ Resumo

**O problema é**: `package.json` não está no servidor.

**Para resolver:**
1. ✅ Verificar se `package.json` está no servidor
2. ✅ Se não estiver, fazer upload via Git ou criar manualmente
3. ✅ Verificar permissões
4. ✅ Verificar se aparece no container backend
5. ✅ Recriar container backend
6. ✅ Verificar logs - deve funcionar agora

**Pronto!** Faça upload do `package.json` e o problema será resolvido! 🚀

