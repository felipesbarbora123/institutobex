# 🔍 Diagnóstico: Arquivos Não Aparecem Após Cópia

## 🐛 Problema

```bash
ls -la /app/package.json
# Não mostra o arquivo
```

---

## 🔍 Diagnóstico Passo a Passo

---

## ✅ Passo 1: Verificar Se `/source` Existe e Tem Arquivos

No console do container `copy-backend-files`:

```bash
# Verificar se /source existe
ls -la /source/

# Verificar se package.json está em /source
ls -la /source/package.json

# Verificar montagem
mount | grep /source
```

**Se `/source` não existir ou estiver vazio:**
- ❌ Volume Bind não está funcionando
- ✅ Precisa verificar se arquivos estão no servidor

**Se `/source` existir e tiver arquivos:**
- ✅ Volume Bind funcionou
- ⚠️ Problema é na cópia ou no volume nomeado

---

## ✅ Passo 2: Verificar Se Volume Nomeado Está Montado

```bash
# Verificar se /app existe
ls -la /app/

# Verificar montagem do volume nomeado
mount | grep /app

# Verificar se é volume nomeado
mount | grep backend_app_data
```

**Se `/app` não existir:**
- ❌ Volume nomeado não foi montado
- ✅ Precisa verificar configuração do volume

**Se `/app` existir mas estiver vazio:**
- ⚠️ Cópia não funcionou ou volume está vazio

---

## ✅ Passo 3: Verificar Se Cópia Foi Executada

```bash
# Verificar logs do container
# (no Portainer, vá em Logs do container copy-backend-files)

# Ou no console, verificar se há mensagens de erro
echo "Verificando cópia..."
ls -la /app/
```

**Se não houver arquivos:**
- ⚠️ Cópia não foi executada ou falhou silenciosamente

---

## ✅ Passo 4: Verificar Se Arquivos Estão no Servidor

### **Criar Container para Verificar Servidor:**

1. **Containers** → **Add container**
2. **Name**: `check-server-files`
3. **Image**: `alpine:latest`
4. **Volumes**:
   - **Bind** → Container `/check` → Host `/opt/institutobex/backend`
5. **Command**: `tail -f /dev/null`
6. **Deploy**

### **No Console:**

```bash
# Verificar se arquivos estão no servidor
ls -la /check/package.json

# Listar todos os arquivos
ls -la /check/
```

**Se não aparecer:**
- ❌ Arquivos não estão em `/opt/institutobex/backend` no servidor
- ✅ Precisa descobrir onde estão os arquivos

**Se aparecer:**
- ✅ Arquivos estão no servidor
- ⚠️ Problema é no volume Bind ou na cópia

---

## ✅ Soluções

---

## ✅ Solução 1: Verificar Caminho Correto no Servidor

Se os arquivos não estão em `/opt/institutobex/backend`, precisamos descobrir onde estão:

### **No Container `check-server-files`:**

```bash
# Procurar package.json no servidor
find /check -name "package.json" -type f 2>/dev/null

# Ou procurar em toda a raiz (se montou /)
find / -name "package.json" -type f 2>/dev/null | head -20
```

**Anotar o caminho completo** que aparecer e usar esse caminho no Bind.

---

## ✅ Solução 2: Executar Cópia Manualmente

Se a cópia não funcionou automaticamente, execute manualmente:

### **No Console do Container `copy-backend-files`:**

```bash
# Verificar se /source tem arquivos
ls -la /source/

# Se tiver, copiar manualmente
cp -rv /source/* /app/

# Verificar se copiou
ls -la /app/package.json
```

---

## ✅ Solução 3: Verificar Permissões

```bash
# Verificar permissões de /source
ls -la /source/

# Verificar permissões de /app
ls -la /app/

# Tentar copiar com verbose
cp -rv /source/* /app/ 2>&1
```

**Se houver erro de permissão:**
- ⚠️ Ajustar permissões ou usar `chmod`

---

## ✅ Solução 4: Usar Caminho Diferente no Bind

Se `/opt/institutobex/backend` não funciona, tentar:

1. **Remover** container `copy-backend-files`
2. **Criar novo** com caminho diferente:
   - **Bind** → Container `/source` → Host `/opt/institutobex`
   - Ou tentar: `/home`, `/var/www`, etc.

3. **Ajustar comando de cópia**:
   ```bash
   sh -c "cp -r /source/backend/* /app/ && ls -la /app/ && tail -f /dev/null"
   ```

---

## ✅ Solução 5: Copiar Arquivo por Arquivo (Teste)

Para testar se a cópia funciona:

```bash
# No console do container copy-backend-files
cd /source
ls -la

# Tentar copiar um arquivo específico
cp package.json /app/

# Verificar
ls -la /app/package.json
```

**Se funcionar:**
- ✅ Cópia funciona, problema pode ser no padrão `/*`

**Se não funcionar:**
- ⚠️ Problema é no volume nomeado ou permissões

---

## ✅ Solução 6: Verificar Se Volume Nomeado Foi Criado

1. **Volumes** → Verificar se `backend_app_data` existe
2. **Se não existir:**
   - ✅ Criar volume nomeado primeiro
   - ✅ Depois criar container temporário

3. **Se existir:**
   - ⚠️ Verificar se está montado corretamente no container

---

## 🔍 Comandos de Diagnóstico Completo

Execute estes comandos no console do container `copy-backend-files`:

```bash
# 1. Verificar /source
echo "=== Verificando /source ==="
ls -la /source/ 2>&1
mount | grep /source

# 2. Verificar /app
echo "=== Verificando /app ==="
ls -la /app/ 2>&1
mount | grep /app

# 3. Verificar volume nomeado
echo "=== Verificando volume nomeado ==="
mount | grep backend_app_data

# 4. Tentar copiar manualmente
echo "=== Tentando copiar ==="
cp -rv /source/* /app/ 2>&1

# 5. Verificar resultado
echo "=== Resultado ==="
ls -la /app/package.json 2>&1
```

**Envie a saída completa** desses comandos para diagnóstico preciso.

---

## 📋 Checklist de Diagnóstico

- [ ] Verificar se `/source` existe e tem arquivos
- [ ] Verificar se `/app` existe
- [ ] Verificar se volume nomeado está montado
- [ ] Verificar se arquivos estão no servidor (`/opt/institutobex/backend`)
- [ ] Tentar copiar manualmente
- [ ] Verificar permissões
- [ ] Verificar logs do container

---

## 🔗 Referências

- `COPIAR_ARQUIVOS_VIA_CONTAINER_TEMPORARIO.md` - Guia de cópia
- `RESOLVER_SOURCE_NAO_EXISTE.md` - Resolver erro `/source`
- `DIAGNOSTICO_VOLUME_BIND_NAO_FUNCIONA.md` - Diagnóstico de volume Bind

---

## ✅ Próximos Passos

1. ✅ Execute os comandos de diagnóstico acima
2. ✅ Verifique se `/source` tem arquivos
3. ✅ Verifique se `/app` existe e está montado
4. ✅ Tente copiar manualmente
5. ✅ Envie os resultados para diagnóstico preciso

**Pronto!** Execute o diagnóstico completo para identificar o problema! 🚀

