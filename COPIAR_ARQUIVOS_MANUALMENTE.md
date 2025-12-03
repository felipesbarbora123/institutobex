# 📋 Copiar Arquivos Manualmente de /opt/institutobex/backend

## 🎯 Objetivo

Copiar arquivos de `/opt/institutobex/backend` (servidor) para o volume nomeado `/app` (container).

---

## ✅ Método 1: Via Container Temporário (Recomendado)

### **Passo 1: Criar Container Temporário**

1. **Containers** → **Add container**
2. **Name**: `copy-files-manual`
3. **Image**: `alpine:latest`
4. **Volumes**:
   - **Bind** → Container `/source` → Host `/opt/institutobex/backend`
   - **Named volume** → `backend_app_data` em `/app` (criar se não existir)
5. **Command**: `tail -f /dev/null`
6. **Deploy**

### **Passo 2: Copiar Arquivos Manualmente**

No console do container `copy-files-manual`:

```bash
# Verificar se /source tem arquivos
ls -la /source/

# Verificar se /app existe
ls -la /app/

# Copiar todos os arquivos
cp -rv /source/* /app/

# Verificar se copiou
ls -la /app/package.json

# Verificar estrutura
ls -la /app/
```

**Se funcionar:**
- ✅ Arquivos foram copiados para o volume nomeado
- ✅ Pode remover o container temporário
- ✅ Backend pode usar o volume nomeado

---

## ✅ Método 2: Copiar Arquivo por Arquivo

Se a cópia em massa não funcionar, copie arquivo por arquivo:

```bash
# No console do container copy-files-manual

# Criar estrutura de diretórios se necessário
mkdir -p /app

# Copiar package.json
cp /source/package.json /app/

# Copiar server.js
cp /source/server.js /app/

# Copiar outros arquivos importantes
cp -r /source/*.js /app/ 2>/dev/null
cp -r /source/*.json /app/ 2>/dev/null

# Copiar diretórios
cp -r /source/config /app/ 2>/dev/null
cp -r /source/routes /app/ 2>/dev/null
cp -r /source/middleware /app/ 2>/dev/null
cp -r /source/utils /app/ 2>/dev/null

# Verificar
ls -la /app/
```

---

## ✅ Método 3: Usar tar para Copiar (Mais Confiável)

```bash
# No console do container copy-files-manual

# Criar arquivo tar
cd /source
tar -czf /tmp/backend.tar.gz .

# Extrair no destino
cd /app
tar -xzf /tmp/backend.tar.gz

# Limpar
rm /tmp/backend.tar.gz

# Verificar
ls -la /app/package.json
```

---

## ✅ Método 4: Verificar e Copiar Seletivamente

```bash
# No console do container copy-files-manual

# Ver o que tem em /source
echo "=== Arquivos em /source ==="
ls -la /source/

# Ver o que tem em /app
echo "=== Arquivos em /app ==="
ls -la /app/

# Copiar apenas o que falta
if [ ! -f /app/package.json ]; then
    echo "Copiando package.json..."
    cp /source/package.json /app/
fi

if [ ! -f /app/server.js ]; then
    echo "Copiando server.js..."
    cp /source/server.js /app/
fi

# Copiar tudo de uma vez
cp -rv /source/* /app/ 2>&1

# Verificar resultado
echo "=== Resultado ==="
ls -la /app/
```

---

## 🔍 Verificar Se Cópia Funcionou

Após copiar, verifique:

```bash
# Verificar arquivos principais
ls -la /app/package.json
ls -la /app/server.js

# Verificar estrutura completa
find /app -type f | head -20

# Verificar tamanho
du -sh /app/
```

---

## ✅ Depois de Copiar: Configurar Backend

1. **Remover** container temporário `copy-files-manual`

2. **Containers** → `institutobex-backend` → **Kill**

3. **Duplicate/Edit**:

4. **Volumes**:
   - **Remover** todos os volumes Bind
   - **Adicionar**: **Named volume** → `backend_app_data` em `/app`

5. **Command & Logging**:
   - **Command**: `sh -c "cd /app && npm install && npm start"`
   - **Working directory**: `/app`

6. **Deploy**

---

## 🐛 Problemas Comuns

### **Problema 1: `/source` não existe**

**Solução**: Verificar se volume Bind está configurado corretamente:
- Container `/source` → Host `/opt/institutobex/backend`

### **Problema 2: `/app` não existe**

**Solução**: Verificar se volume nomeado está montado:
- Named volume `backend_app_data` em `/app`

### **Problema 3: Erro de permissão**

**Solução**: Ajustar permissões:
```bash
chmod -R 755 /app
chown -R 1000:1000 /app
```

### **Problema 4: Arquivos não aparecem após copiar**

**Solução**: Verificar se volume nomeado está correto:
```bash
mount | grep /app
# Deve mostrar: backend_app_data
```

---

## 📋 Checklist

- [ ] Criar container temporário com Bind `/source` e volume nomeado `/app`
- [ ] Verificar se `/source` tem arquivos
- [ ] Verificar se `/app` existe
- [ ] Copiar arquivos manualmente
- [ ] Verificar se arquivos foram copiados
- [ ] Remover container temporário
- [ ] Configurar backend para usar volume nomeado

---

## 🔗 Referências

- `COPIAR_ARQUIVOS_VIA_CONTAINER_TEMPORARIO.md` - Cópia automática
- `DIAGNOSTICO_COPIA_ARQUIVOS.md` - Diagnóstico de problemas

---

## ✅ Resumo

**Para copiar manualmente:**

1. ✅ Criar container temporário com Bind `/source` e volume nomeado `/app`
2. ✅ No console: `cp -rv /source/* /app/`
3. ✅ Verificar: `ls -la /app/package.json`
4. ✅ Remover container temporário
5. ✅ Configurar backend para usar volume nomeado

**Pronto!** Siga os passos para copiar manualmente! 🚀

