# 🔧 Solução: curl Command Not Found no Portainer

## 🐛 Erro Encontrado

```
bash: curl: command not found
```

Isso acontece porque o `curl` não está instalado no container.

---

## ✅ Soluções

---

## 🚀 Solução 1: Instalar curl (Recomendado)

### **No Console do Container:**

```bash
# Para Alpine Linux (mais comum no Portainer)
apk add curl

# Para Ubuntu/Debian
apt-get update && apt-get install -y curl

# Para CentOS/RHEL
yum install -y curl
```

**⚠️ Nota**: Não use `sudo` - containers rodam como root por padrão! Se receber erro "sudo: command not found", veja `SOLUCAO_SUDO_NAO_ENCONTRADO.md`

Depois de instalar, você pode usar:

```bash
# Ver IP público
curl ifconfig.me

# Ou outras opções
curl ipinfo.io/ip
curl icanhazip.com
```

---

## 🚀 Solução 2: Usar wget (Alternativa)

Se `wget` estiver disponível:

```bash
# Ver IP público
wget -qO- ifconfig.me

# Ou
wget -qO- ipinfo.io/ip
```

Se `wget` também não estiver instalado:

```bash
# Instalar wget
apk add wget  # Alpine
# ou
apt-get update && apt-get install -y wget  # Ubuntu/Debian
```

---

## 🚀 Solução 3: Descobrir IP sem curl/wget (Método Alternativo)

### **Método A: Usar Gateway (IP Interno)**

Este método não precisa de internet:

```bash
# Ver IP do servidor (gateway)
ip route | grep default | awk '{print $3}'

# Ou
route -n | grep '^0.0.0.0' | awk '{print $2}'
```

**Este é o IP que você precisa para acessar do pgAdmin se estiver na mesma rede!**

---

### **Método B: Ver Interfaces de Rede**

```bash
# Ver todas as interfaces e IPs
ip addr show

# Ou
ifconfig

# Filtrar apenas IPs
ip addr show | grep "inet " | awk '{print $2}' | cut -d/ -f1
```

---

### **Método C: Usar cat /proc/net/route**

```bash
# Ver informações de roteamento
cat /proc/net/route | awk '/^00000000/ {printf "%d.%d.%d.%d\n", "0x" substr($3,7,2), "0x" substr($3,5,2), "0x" substr($3,3,2), "0x" substr($3,1,2)}'
```

---

## 🚀 Solução 4: Descobrir IP Público (Sem curl)

### **Opção A: Via URL do Portainer**

Se você acessa o Portainer via URL:
- Se for IP: Use o mesmo IP (ex: `http://192.168.1.100:9000`)
- Se for domínio: Descubra o IP:
  ```bash
  # No seu computador (não no container)
  ping portainer.seudominio.com
  # Vai mostrar o IP
  ```

### **Opção B: Verificar no Painel do Provedor**

Acesse o painel do provedor de hospedagem (Hostinger, DigitalOcean, AWS, etc.) e veja o IP do servidor.

### **Opção C: Usar Serviço Web Alternativo**

Se conseguir instalar ferramentas:

```bash
# Instalar ferramentas básicas
apk add busybox-extras  # Alpine

# Usar telnet ou nc
echo -e "GET / HTTP/1.1\nHost: ifconfig.me\n\n" | nc ifconfig.me 80 | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}'
```

---

## 📋 Passo a Passo Completo (Recomendado)

### **Para Descobrir IP Interno (Gateway):**

```bash
# Método mais simples - não precisa instalar nada
ip route | grep default | awk '{print $3}'
```

**Este é o IP que você precisa se estiver na mesma rede local!**

### **Para Descobrir IP Público:**

1. **Instalar curl**:
   ```bash
   apk add curl
   ```

2. **Ver IP público**:
   ```bash
   curl ifconfig.me
   ```

**Ou** use o método do gateway se não precisar do IP público.

---

## 🎯 Qual IP Usar no pgAdmin?

### **Cenário 1: Acesso Local (Mesma Rede)**

Use o **IP do gateway** (método que não precisa de curl):

```bash
ip route | grep default | awk '{print $3}'
```

**Exemplo**: `192.168.1.100`

No pgAdmin:
- **Host**: `192.168.1.100`
- **Port**: `5433`

---

### **Cenário 2: Acesso Remoto (De Fora)**

Você precisa do **IP público**:

1. **Instalar curl**:
   ```bash
   apk add curl
   ```

2. **Ver IP público**:
   ```bash
   curl ifconfig.me
   ```

**Exemplo**: `200.150.100.50`

No pgAdmin:
- **Host**: `200.150.100.50`
- **Port**: `5433`

**⚠️ Lembre-se**: Configure o firewall para permitir a porta!

---

## 🔍 Verificar Qual Sistema Operacional

Para saber qual comando usar, descubra qual sistema:

```bash
# Ver sistema operacional
cat /etc/os-release

# Ou
uname -a
```

**Alpine Linux** (mais comum):
```bash
apk add curl
```

**Ubuntu/Debian**:
```bash
apt-get update && apt-get install -y curl
```

**CentOS/RHEL**:
```bash
yum install -y curl
```

---

## 🐛 Problemas Comuns

### **Erro: "apk: command not found"**

**Solução**: O container não é Alpine. Tente:
```bash
apt-get update && apt-get install -y curl
```

### **Erro: "apt-get: command not found"**

**Solução**: O container não é Debian/Ubuntu. Tente:
```bash
apk add curl
```

### **Não Consigo Instalar Nada**

**Solução**: Use o método do gateway (não precisa instalar):
```bash
ip route | grep default | awk '{print $3}'
```

---

## ✅ Resumo Rápido

**Para descobrir IP sem instalar nada:**

```bash
# IP do servidor (gateway) - funciona sempre!
ip route | grep default | awk '{print $3}'
```

**Para descobrir IP público:**

1. Instalar curl:
   ```bash
   apk add curl  # Alpine
   # ou
   apt-get update && apt-get install -y curl  # Ubuntu/Debian
   ```

2. Ver IP:
   ```bash
   curl ifconfig.me
   ```

**Para pgAdmin (acesso local):**
- Use o IP do gateway (método que não precisa de curl)
- Host: `192.168.1.100` (exemplo)
- Port: `5433`

---

## 🔗 Referências

- `SOLUCAO_SUDO_NAO_ENCONTRADO.md` - 🔧 **Resolver erro "sudo: command not found"**
- `COMO_DESCOBRIR_IP_SERVIDOR_PORTAINER.md` - Guia completo de descobrir IP
- `COMO_ACESSAR_BANCO_DADOS_PORTAINER.md` - Como acessar o banco

---

**Pronto!** Agora você sabe como descobrir o IP mesmo sem curl! 🚀

