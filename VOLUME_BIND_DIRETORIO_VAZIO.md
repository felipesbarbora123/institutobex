# 🔧 Resolver: Diretório Correto Mas Vazio (Volume Bind Não Montado)

## 🐛 Problema Identificado

- ✅ Comando está em `/opt/institutobex/backend` (caminho correto)
- ❌ `ls -la package.json` mostra "No such file or directory"
- ❌ Diretório está vazio porque volume Bind não está montado

## 🎯 Causa

O container está acessando `/opt/institutobex/backend`, mas esse diretório **dentro do container** não está conectado ao diretório do servidor. O volume Bind não está montado.

---

## ✅ Solução: Adicionar Volume Bind

---

## 🔍 Passo 1: Verificar Configuração do Volume

### **No Portainer:**

1. **Containers** → `institutobex-backend`
2. Role até **Volumes**
3. **Verifique se existe volume Bind** montando `/opt/institutobex/backend`

**Se NÃO aparecer:**
- ❌ Volume Bind não está configurado
- ✅ Precisa adicionar

**Se aparecer mas está montando em outro lugar (ex: `/app`):**
- ⚠️ Volume está montado no lugar errado
- ✅ Precisa ajustar

---

## ✅ Passo 2: Adicionar Volume Bind

### **No Portainer:**

1. **Containers** → `institutobex-backend` → **Duplicate/Edit**

2. **Parar container primeiro** (se estiver rodando):
   - **Kill** ou **Stop**

3. **Volumes** → **map additional volume**:
   - **Volume**: Selecione **Bind**
   - **Container**: `/opt/institutobex/backend` ← **MESMO CAMINHO DO COMANDO!**
   - **Host**: `/opt/institutobex/backend`

4. **Verificar Command**:
   - **Command**: `sh -c "cd /opt/institutobex/backend && npm install && npm start"`
   - **Working directory**: Deixe vazio ou `/opt/institutobex/backend`

5. **Deploy** (recria o container)

---

## ✅ Passo 3: Verificar Se Funcionou

### **Após Recriar:**

1. **Mudar comando temporariamente** (se necessário):
   - **Command**: `tail -f /dev/null`
   - **Deploy**

2. **Acessar console**:
   ```bash
   # Verificar montagem
   mount | grep "/opt/institutobex/backend"
   # Deve mostrar: /opt/institutobex/backend on /opt/institutobex/backend type bind
   
   # Verificar arquivos
   ls -la /opt/institutobex/backend/
   ls -la /opt/institutobex/backend/package.json
   # Deve mostrar os arquivos agora!
   ```

3. **Se aparecer os arquivos:**
   - ✅ Volume Bind está funcionando!
   - ✅ Restaurar comando original

---

## 🔍 Verificação: Por Que Diretório Está Vazio?

### **No Console do Backend:**

```bash
# Verificar montagens
mount | grep "/opt/institutobex/backend"

# Verificar se diretório existe
ls -la /opt/institutobex/backend/

# Verificar se é um diretório vazio ou não montado
df -h | grep "/opt/institutobex/backend"
```

**Se `mount | grep` não mostrar nada:**
- Volume Bind não está montado
- Precisa adicionar

**Se mostrar mas diretório está vazio:**
- Pode ser problema de permissões
- Ou arquivos não estão no servidor nesse caminho

---

## 🐛 Problemas Comuns

### **Problema 1: Volume Bind configurado mas diretório ainda vazio**

**Possíveis causas:**
- Container não foi recriado após adicionar volume
- Caminho do Host está errado
- Arquivos não estão no servidor

**Solução:**
1. Verificar se arquivos estão no servidor (container temporário)
2. Verificar caminho do Host no volume Bind
3. Recriar container

### **Problema 2: Volume montado em outro lugar (ex: /app)**

**Solução:**
- Ajustar comando para usar o caminho onde volume está montado
- Ou ajustar volume para montar em `/opt/institutobex/backend`

---

## ✅ Solução Alternativa: Usar Caminho Onde Volume Está Montado

Se o volume está montado em outro lugar (ex: `/app`):

### **Opção 1: Ajustar Comando**

1. **Command & Logging** → **Command**:
   ```bash
   sh -c "cd /app && npm install && npm start"
   ```

### **Opção 2: Ajustar Volume**

1. **Volumes** → Remover volume de `/app`
2. Adicionar volume Bind: Container `/opt/institutobex/backend` → Host `/opt/institutobex/backend`

---

## 📋 Checklist

- [ ] Verificar se volume Bind está configurado
- [ ] Verificar se volume está montando `/opt/institutobex/backend`
- [ ] Parar container
- [ ] Adicionar volume Bind: Container `/opt/institutobex/backend` → Host `/opt/institutobex/backend`
- [ ] Deploy (recriar container)
- [ ] Verificar `mount | grep "/opt/institutobex/backend"` - deve mostrar montagem
- [ ] Verificar `ls -la /opt/institutobex/backend/package.json` - deve mostrar arquivo
- [ ] Restaurar comando original

---

## 🔗 Referências

- `NPM_NAO_ENCONTRA_PACKAGE_JSON.md` - NPM não encontra package.json
- `FORCAR_VOLUME_BIND_APLICAR.md` - Forçar volume Bind
- `DIAGNOSTICO_VOLUME_BIND_NAO_FUNCIONA_DEFINITIVO.md` - Diagnóstico completo

---

## ✅ Resumo

**Problema**: Diretório está vazio porque volume Bind não está montado.

**Solução**:
1. ✅ **Parar** container
2. ✅ **Adicionar volume Bind**: Container `/opt/institutobex/backend` → Host `/opt/institutobex/backend`
3. ✅ **Deploy** (recriar)
4. ✅ **Verificar** `mount | grep` - deve mostrar montagem
5. ✅ **Verificar** `ls -la` - deve mostrar arquivos

**Pronto!** Adicione o volume Bind e o diretório não estará mais vazio! 🚀

