# 🔍 Diagnóstico: Verificar Volume no Console

## 🎯 Situação

- ✅ Container está rodando (comando `tail -f /dev/null`)
- ✅ Logs mostram "No log line matching" (normal, não há saída)
- ✅ Agora precisa acessar o console para verificar volume

---

## ✅ Passo 1: Acessar Console do Container

### **No Portainer:**

1. **Containers** → `institutobex-backend`
2. Clique em **Console**
3. Selecione **sh** ou **/bin/sh**
4. Clique em **Connect**

**Agora você está dentro do container!**

---

## ✅ Passo 2: Verificar Se Volume Está Montado

### **No Console, execute:**

```bash
# Ver se /app existe
ls -la /app/

# Ver montagens do volume
mount | grep /app

# Verificar package.json
ls -la /app/package.json
```

---

## 🔍 Interpretação dos Resultados

### **Cenário 1: Volume Está Montado ✅**

Se `mount | grep /app` mostrar algo como:
```
/opt/institutobex/backend on /app type bind (rw,relatime,...)
```

E `ls -la /app/` mostrar os arquivos:
```
total 123
drwxr-xr-x    1 root     root          4096 Dec  2 02:00 .
drwxr-xr-x    1 root     root          4096 Dec  2 02:00 ..
-rw-r--r--    1 1000     1000           456 Dec  2 01:00 package.json
-rw-r--r--    1 1000     1000          1234 Dec  2 01:00 server.js
...
```

**✅ Volume está funcionando!**
- O problema pode ser outro (permissões, comando, etc.)

---

### **Cenário 2: Volume NÃO Está Montado ❌**

Se `mount | grep /app` **não mostrar nada**:

**E `ls -la /app/` mostrar vazio ou erro:**
```
total 0
drwxr-xr-x    2 root     root          4096 Dec  2 02:00 .
drwxr-xr-x    1 root     root          4096 Dec  2 02:00 ..
```

**❌ Volume não está montado!**
- Container não foi recriado após configurar volume
- Volume não está configurado corretamente

**Solução**: Recriar container com volume Bind

---

### **Cenário 3: Volume Montado Mas Arquivos Não Aparecem ⚠️**

Se `mount | grep /app` mostrar montagem:

Mas `ls -la /app/` estiver vazio:

**⚠️ Caminho do Host pode estar errado ou vazio**

**Solução**: Verificar se arquivos estão no caminho do Host

---

## ✅ Passo 3: Verificar Caminho do Host

### **No Console do Container:**

```bash
# Ver montagem completa
mount | grep /app

# Ver caminho do Host
# Vai mostrar algo como: /opt/institutobex/backend on /app
```

**Anote o caminho do Host** que aparecer (ex: `/opt/institutobex/backend`)

### **Verificar Se Arquivos Estão Nesse Caminho:**

1. **Criar container temporário**:
   - **Name**: `check-host-path`
   - **Image**: `alpine:latest`
   - **Volumes** → **Bind**: Container `/check`, Host `/opt/institutobex/backend`
   - **Command**: `tail -f /dev/null`
   - **Deploy**

2. **Console do container temporário**:
   ```bash
   ls -la /check/package.json
   ```

**Se aparecer o arquivo:**
- ✅ Arquivos estão no servidor
- ⚠️ Problema é no mapeamento do volume do backend

**Se NÃO aparecer:**
- ❌ Arquivos não estão nesse caminho
- ✅ Precisa descobrir onde estão ou fazer upload

---

## ✅ Passo 4: Testar Comandos Manualmente

### **No Console do Backend:**

```bash
# Verificar diretório atual
pwd

# Ir para /app
cd /app

# Ver arquivos
ls -la

# Tentar ler package.json
cat package.json

# Tentar instalar manualmente
npm install

# Ver se funciona
npm start
```

**Isso vai mostrar exatamente onde está o problema!**

---

## 🐛 Problemas Comuns e Soluções

### **Problema 1: `/app` está vazio**

**Causa**: Volume não está montado

**Solução**: 
1. Verificar configuração do volume no Portainer
2. Recriar container

### **Problema 2: `mount | grep /app` não mostra nada**

**Causa**: Volume não foi montado

**Solução**: 
1. Parar container
2. Verificar se volume Bind está configurado
3. Recriar container

### **Problema 3: Arquivos aparecem mas `npm install` falha**

**Causa**: Permissões ou outro problema

**Solução**: 
```bash
# No servidor (via container temporário)
chown -R 1000:1000 /opt/institutobex/backend
chmod -R 755 /opt/institutobex/backend
```

---

## 📋 Checklist de Diagnóstico no Console

Execute estes comandos no console e anote os resultados:

- [ ] `ls -la /app/` - Mostra arquivos?
- [ ] `mount | grep /app` - Mostra montagem?
- [ ] `ls -la /app/package.json` - Arquivo existe?
- [ ] `cat /app/package.json` - Consegue ler?
- [ ] `cd /app && npm install` - Instala pacotes?
- [ ] `pwd` - Está em `/app`?

---

## 🔗 Próximos Passos

**Dependendo do resultado:**

1. **Se volume não está montado**:
   - Recriar container com volume Bind
   - Ver: `SOLUCAO_DIRETORIO_APP_NAO_EXISTE.md`

2. **Se volume está montado mas arquivos não aparecem**:
   - Verificar caminho do Host
   - Verificar se arquivos estão no servidor
   - Ver: `DIAGNOSTICO_VOLUME_BIND_NAO_FUNCIONA.md`

3. **Se arquivos aparecem mas npm falha**:
   - Verificar permissões
   - Verificar se Node.js está instalado
   - Testar comandos manualmente

---

## ✅ Resumo

**Agora que o container está rodando:**

1. ✅ **Acessar console** do container
2. ✅ **Executar**: `mount | grep /app`
3. ✅ **Executar**: `ls -la /app/`
4. ✅ **Anotar resultados**
5. ✅ **Seguir solução** baseada no resultado

**Pronto!** Acesse o console e execute os comandos acima para diagnosticar! 🚀

