# 🔧 Resolver Timeout ao Acessar API do Portainer

## 🐛 Problema

Tentando acessar `http://46.224.47.128:3001/health` mas recebe **timeout**.

## 🎯 Causas Possíveis

1. ❌ Porta `3001` não está mapeada no Portainer
2. ❌ Firewall bloqueando a porta
3. ❌ Container não está rodando
4. ❌ Backend não está escutando na porta correta

---

## ✅ Diagnóstico Passo a Passo

---

## ✅ Passo 1: Verificar Se Container Está Rodando

1. **Containers** → `institutobex-backend`
2. **Verificar status**:
   - ✅ Deve estar **Running** (verde)
   - ❌ Se estiver **Stopped** ou **Restarting**, há problema

**Se não estiver rodando:**
- **Start** o container
- **Verificar logs** para ver erros

---

## ✅ Passo 2: Verificar Se Porta Está Mapeada

1. **Containers** → `institutobex-backend` → **Ports**
2. **Verificar**:
   - **Container**: `3001`
   - **Host**: `3001` (ou outro número)

**Se não estiver mapeada:**

1. **Duplicate/Edit** container
2. **Ports** → **Publish a new network port**:
   - **Container**: `3001`
   - **Host**: `3001` (ou outra porta disponível)
3. **Deploy**

---

## ✅ Passo 3: Verificar Se Backend Está Escutando

1. **Containers** → `institutobex-backend` → **Console**
2. **Executar**:
   ```bash
   # Verificar se porta 3001 está em uso
   netstat -tuln | grep 3001
   # ou
   ss -tuln | grep 3001
   ```

**Deve mostrar**:
```
tcp        0      0 0.0.0.0:3001            0.0.0.0:*               LISTEN
```

**Se não mostrar**, o backend não está escutando na porta 3001.

---

## ✅ Passo 4: Verificar Logs do Container

1. **Containers** → `institutobex-backend` → **Logs**
2. **Verificar**:
   - ✅ Deve mostrar: `🚀 Servidor rodando na porta 3001`
   - ❌ Se mostrar erro, corrigir

**Erros comuns**:
- `EADDRINUSE`: Porta já está em uso
- `EACCES`: Sem permissão para usar porta
- `ENOENT`: Arquivo não encontrado

---

## ✅ Passo 5: Verificar Firewall do Servidor

### **No Servidor (via SSH ou Portainer Console):**

```bash
# Verificar se porta está aberta
sudo ufw status
# ou
sudo iptables -L -n | grep 3001

# Se estiver bloqueada, abrir:
sudo ufw allow 3001/tcp
sudo ufw reload
```

**⚠️ Importante**: Se não tiver acesso SSH, você precisa pedir ao administrador do servidor para abrir a porta.

---

## ✅ Passo 6: Testar Localmente no Servidor

### **No Console do Container Backend:**

```bash
# Testar se backend responde localmente
curl http://localhost:3001/health
# ou
wget -O- http://localhost:3001/health
```

**Se funcionar localmente** mas não de fora:
- ✅ Backend está funcionando
- ❌ Problema é firewall ou mapeamento de porta

---

## ✅ Soluções

---

## ✅ Solução 1: Mapear Porta Corretamente

1. **Containers** → `institutobex-backend` → **Kill**

2. **Duplicate/Edit**:

3. **Ports** → **Remover** porta atual (se houver)

4. **Publish a new network port**:
   - **Container**: `3001`
   - **Host**: `3001`
   - **Protocol**: `TCP`

5. **Deploy**

6. **Aguardar** alguns segundos

7. **Testar**: `http://46.224.47.128:3001/health`

---

## ✅ Solução 2: Verificar Variável de Ambiente PORT

1. **Containers** → `institutobex-backend` → **Environment**
2. **Verificar** se existe:
   - **Name**: `PORT`
   - **Value**: `3001`

**Se não existir**, adicionar:
- **Name**: `PORT`
- **Value**: `3001`

---

## ✅ Solução 3: Abrir Porta no Firewall

### **Se Você Tem Acesso SSH:**

```bash
# Ubuntu/Debian
sudo ufw allow 3001/tcp
sudo ufw reload

# Verificar
sudo ufw status | grep 3001
```

### **Se Não Tem Acesso SSH:**

1. **Acessar painel do provedor** (Hostinger, DigitalOcean, etc.)
2. **Firewall/Security** → **Adicionar regra**:
   - **Porta**: `3001`
   - **Protocolo**: `TCP`
   - **Ação**: `Allow`

---

## ✅ Solução 4: Usar Porta Diferente

Se porta `3001` está bloqueada, usar outra:

1. **Containers** → `institutobex-backend` → **Duplicate/Edit**

2. **Ports**:
   - **Container**: `3001`
   - **Host**: `8080` (ou outra porta disponível)

3. **Environment**:
   - **Name**: `PORT`
   - **Value**: `3001` (container continua usando 3001)

4. **Deploy**

5. **Testar**: `http://46.224.47.128:8080/health`

---

## ✅ Solução 5: Verificar Rede do Container

1. **Containers** → `institutobex-backend` → **Network**
2. **Verificar** se está na rede correta
3. **Se não estiver**, adicionar à rede `bridge` ou criar rede específica

---

## 🔍 Comandos de Diagnóstico Completo

Execute no console do container backend:

```bash
# 1. Verificar se processo está rodando
ps aux | grep node

# 2. Verificar se porta está em uso
netstat -tuln | grep 3001

# 3. Testar localmente
curl http://localhost:3001/health

# 4. Verificar variáveis de ambiente
env | grep PORT

# 5. Verificar logs
tail -f /proc/1/fd/1
```

---

## 📋 Checklist de Diagnóstico

- [ ] Container está rodando (status Running)
- [ ] Porta 3001 está mapeada no Portainer
- [ ] Backend está escutando na porta 3001 (netstat)
- [ ] Logs mostram "Servidor rodando na porta 3001"
- [ ] Teste local funciona (curl localhost:3001/health)
- [ ] Firewall permite porta 3001
- [ ] Variável PORT está configurada

---

## 🐛 Problemas Comuns

### **Problema 1: Porta não mapeada**

**Sintoma**: Timeout ao acessar de fora.

**Solução**: Mapear porta no Portainer (Container → Ports → Publish port).

---

### **Problema 2: Firewall bloqueando**

**Sintoma**: Funciona localmente mas não de fora.

**Solução**: Abrir porta no firewall (`ufw allow 3001/tcp`).

---

### **Problema 3: Backend não está escutando**

**Sintoma**: `netstat` não mostra porta 3001.

**Solução**: Verificar logs e variável PORT.

---

### **Problema 4: Porta já em uso**

**Sintoma**: Erro `EADDRINUSE` nos logs.

**Solução**: Usar outra porta ou parar processo que está usando a porta.

---

## 🔗 Referências

- `ACESSAR_APIS_E_CONFIGURAR_FRONTEND.md` - Configurar frontend
- `CONFIGURAR_DOMINIO_API_PORTAINER.md` - Configurar domínio
- `COMO_DESCOBRIR_IP_SERVIDOR_PORTAINER.md` - Descobrir IP

---

## ✅ Resumo

**Problema**: Timeout ao acessar `http://46.224.47.128:3001/health`

**Soluções**:
1. ✅ Verificar se porta está mapeada no Portainer
2. ✅ Verificar se firewall permite porta 3001
3. ✅ Verificar se backend está rodando e escutando
4. ✅ Testar localmente primeiro
5. ✅ Verificar logs do container

**Pronto!** Siga o diagnóstico passo a passo para identificar o problema! 🚀

