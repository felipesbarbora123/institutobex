# 🌐 Como Descobrir o IP do Servidor para Acessar o PostgreSQL

## 🎯 Objetivo

Descobrir o IP ou endereço do servidor onde o Portainer está rodando para configurar no pgAdmin ou outras ferramentas.

---

## 🔍 Métodos para Descobrir o IP

---

## 🚀 Método 1: Via Console do Container no Portainer (Mais Simples)

### **Passo 1: Acessar Console de Qualquer Container**

1. **Portainer** → **Containers** → Selecione qualquer container (ex: `institutobex-db`)
2. Clique em **Console**
3. Selecione **sh** ou **/bin/sh**
4. Clique em **Connect**

### **Passo 2: Executar Comandos para Descobrir IP**

No console, execute:

```bash
# ✅ MÉTODO MAIS SIMPLES - Não precisa instalar nada!
# Ver IP do host (servidor) - GATEWAY
ip route | grep default | awk '{print $3}'

# Este é o IP que você precisa para pgAdmin (acesso local)!
```

**O IP que você precisa** é o IP do **servidor** (host), não do container!

**🐛 Se curl não funcionar**: Veja `SOLUCAO_CURL_NAO_ENCONTRADO.md` - O método acima não precisa de curl!

**Outros métodos (opcionais):**
```bash
# Ver IP do container (IP interno Docker)
hostname -i

# Ver todas as interfaces de rede
ip addr show
# ou
ifconfig
```

---

## 🚀 Método 2: Via Portainer - Settings/About

1. **Portainer** → Clique no seu **usuário** (canto superior direito)
2. Vá em **Settings** ou **About**
3. Procure por informações do ambiente
4. Pode mostrar informações do servidor

**Nota**: Nem sempre mostra o IP, mas pode ter informações úteis.

---

## 🚀 Método 3: Via Console do Container - Ver Gateway

No console do container:

```bash
# Ver gateway (geralmente é o IP do host)
ip route show default | awk '/default/ {print $3}'

# Ou
route -n | grep '^0.0.0.0' | awk '{print $2}'

# Ver informações de rede do container
cat /proc/net/route
```

O **gateway** geralmente é o IP do servidor host.

---

## 🚀 Método 4: Via Acesso SSH ao Servidor (Se Tiver Acesso)

Se você tem acesso SSH ao servidor:

```bash
# Conectar ao servidor
ssh root@servidor

# Ver IP do servidor
hostname -I

# Ou
ip addr show

# Ver IP público (se tiver)
curl ifconfig.me
# ou
curl ipinfo.io/ip
```

---

## 🚀 Método 5: Via URL do Portainer

Se você acessa o Portainer via URL (ex: `http://192.168.1.100:9000` ou `https://portainer.seudominio.com`):

- **Se for IP**: Use o mesmo IP (ex: `192.168.1.100`)
- **Se for domínio**: Use o mesmo domínio ou descubra o IP:
  ```bash
  # No seu computador
  ping portainer.seudominio.com
  # Vai mostrar o IP
  ```

---

## 🚀 Método 6: Via Comando no Container - Ver Host

No console do container:

```bash
# Ver hostname do servidor
hostname

# Ver IP do host através do gateway
getent hosts host.docker.internal | awk '{ print $1 }'

# Ou tentar pingar o gateway
ping -c 1 $(ip route | grep default | awk '{print $3}') | grep PING | awk '{print $3}' | tr -d '()'
```

---

## 📋 Passo a Passo Completo (Recomendado)

### **No Console do Container:**

```bash
# 1. Ver gateway (IP do host)
GATEWAY=$(ip route | grep default | awk '{print $3}')
echo "IP do Host (Gateway): $GATEWAY"

# 2. Ver IP público (se aplicável)
echo "IP Público:"
curl -s ifconfig.me
echo ""

# 3. Ver todas as interfaces
echo "Interfaces de rede:"
ip addr show | grep "inet " | awk '{print $2}'
```

**O IP do gateway** geralmente é o IP do servidor que você precisa usar no pgAdmin.

---

## 🔍 Diferença: IP Interno vs IP Público

### **IP Interno (Rede Local)**
- Exemplo: `192.168.1.100`, `10.0.0.5`
- Use se você está na mesma rede local
- Mais rápido, não passa pela internet

### **IP Público**
- Exemplo: `200.150.100.50`
- Use se você está acessando de fora da rede
- Precisa de firewall configurado

---

## 🌐 Para Acessar Remotamente (De Fora da Rede)

Se você quer acessar de outro computador (fora da rede local):

### **Passo 1: Descobrir IP Público**

No console do container ou servidor:

```bash
# Ver IP público (precisa instalar curl primeiro)
# Instalar curl:
apk add curl  # Alpine
# ou
apt-get update && apt-get install -y curl  # Ubuntu/Debian

# Depois:
curl ifconfig.me
# ou
curl ipinfo.io/ip
# ou
curl icanhazip.com
```

**🐛 Se curl não funcionar**: Veja `SOLUCAO_CURL_NAO_ENCONTRADO.md` - Como instalar curl ou usar métodos alternativos

### **Passo 2: Configurar Firewall**

O servidor precisa permitir conexões na porta do PostgreSQL:

```bash
# No servidor (via SSH) - NÃO no container!
# Ubuntu/Debian
ufw allow 5433/tcp

# CentOS/RHEL
firewall-cmd --permanent --add-port=5433/tcp
firewall-cmd --reload
```

**⚠️ Importante**: `ufw` é executado **no servidor via SSH**, não no container! Se receber erro "ufw: command not found" no container, veja `SOLUCAO_UFW_NAO_ENCONTRADO.md`

### **Passo 3: Usar no pgAdmin**

- **Host**: IP público do servidor
- **Port**: Porta mapeada (ex: `5433`)

---

## 📝 Exemplo Prático

### **Cenário 1: Acesso Local (Mesma Rede)**

1. **Descobrir IP do servidor**:
   ```bash
   # No console do container
   ip route | grep default | awk '{print $3}'
   # Resultado: 192.168.1.100
   ```

2. **Configurar pgAdmin**:
   - Host: `192.168.1.100`
   - Port: `5433`
   - Database: `institutobex`
   - Username: `postgres`
   - Password: (senha do PostgreSQL)

### **Cenário 2: Acesso Remoto (De Fora)**

1. **Descobrir IP público**:
   ```bash
   # No console do container
   curl ifconfig.me
   # Resultado: 200.150.100.50
   ```

2. **Configurar firewall** (no servidor via SSH - NÃO no container!):
   ```bash
   ufw allow 5433/tcp
   ```
   **⚠️ Se receber erro "ufw: command not found" no container, veja `SOLUCAO_UFW_NAO_ENCONTRADO.md`**

3. **Configurar pgAdmin**:
   - Host: `200.150.100.50`
   - Port: `5433`
   - Database: `institutobex`
   - Username: `postgres`
   - Password: (senha do PostgreSQL)

---

## 🔒 Segurança: Acesso Remoto

⚠️ **IMPORTANTE**: Ao expor o PostgreSQL publicamente:

1. ✅ **Use senha forte**
2. ✅ **Configure firewall** para permitir apenas IPs específicos
3. ✅ **Use SSL/TLS** se possível
4. ✅ **Considere usar VPN** ao invés de acesso direto

### **Restringir por IP no Firewall:**

```bash
# No servidor via SSH (NÃO no container!)
# Permitir apenas de um IP específico
ufw allow from SEU_IP to any port 5433

# Exemplo
ufw allow from 192.168.1.50 to any port 5433
```

---

## 🐛 Problemas Comuns

### **Erro: "could not connect to server"**

**Soluções:**
- Verifique se está usando o IP correto
- Verifique se a porta está mapeada no Portainer
- Verifique se o firewall permite a porta
- Tente usar `localhost` se estiver no próprio servidor

### **Erro: "connection timeout"**

**Soluções:**
- Verifique se o IP público está correto
- Verifique se o firewall está configurado
- Verifique se o provedor não está bloqueando a porta

### **Não Consigo Descobrir o IP**

**Soluções:**
- Use o método do gateway (mais confiável)
- Pergunte ao administrador do servidor
- Verifique no painel do provedor de hospedagem

---

## 📋 Checklist

- [ ] Descobrir IP do servidor (gateway ou IP público)
- [ ] Verificar porta mapeada no Portainer (ex: `5433`)
- [ ] Configurar firewall (se acesso remoto)
- [ ] Testar conexão no pgAdmin
- [ ] Verificar credenciais (usuário e senha)

---

## 🔗 Referências

- `SOLUCAO_UFW_NAO_ENCONTRADO.md` - 🔧 **Resolver erro "ufw: command not found"**
- `SOLUCAO_CURL_NAO_ENCONTRADO.md` - 🔧 **Resolver erro "curl: command not found"**
- `COMO_ACESSAR_BANCO_DADOS_PORTAINER.md` - Como acessar o banco
- `CONFIGURACAO_PORTAINER_PASSO_A_PASSO.md` - Configuração completa

---

## ✅ Resumo Rápido

**Para descobrir o IP do servidor:**

1. ✅ **Portainer** → **Containers** → Qualquer container → **Console**
2. ✅ Execute: `ip route | grep default | awk '{print $3}'`
3. ✅ O resultado é o IP do servidor (gateway)
4. ✅ Use esse IP no pgAdmin como **Host**

**Para acesso remoto:**

1. ✅ Execute: `curl ifconfig.me` (para ver IP público)
2. ✅ Configure firewall no servidor (via SSH): `ufw allow 5433/tcp` (veja `SOLUCAO_UFW_NAO_ENCONTRADO.md`)
3. ✅ Use o IP público no pgAdmin

**Pronto!** Agora você sabe como descobrir o IP do servidor! 🚀

