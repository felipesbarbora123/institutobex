# 🔧 Solução: Connection Timeout no pgAdmin

## 🐛 Erro Encontrado

```
Unable to connect to server:
connection timeout expired
```

## 🎯 O Que Isso Significa?

O pgAdmin não consegue estabelecer conexão com o servidor PostgreSQL. Isso geralmente indica que:
- ⚠️ Firewall está bloqueando a conexão
- ⚠️ Porta não está acessível
- ⚠️ IP incorreto
- ⚠️ Container não está rodando
- ⚠️ PostgreSQL não está aceitando conexões externas

---

## ✅ Checklist de Troubleshooting

Vamos verificar cada item passo a passo:

---

## 🔍 Passo 1: Verificar Se o Container Está Rodando

### **No Portainer:**

1. **Portainer** → **Containers**
2. Verifique se `institutobex-db` está com status **Running** (verde)
3. Se estiver **Stopped** ou **Exited**:
   - Clique no container
   - Clique em **Start**

### **Verificar Logs:**

1. **Containers** → `institutobex-db` → **Logs**
2. Procure por erros em vermelho
3. Deve mostrar: `database system is ready to accept connections`

**Se houver erros**, anote e verifique a configuração.

---

## 🔍 Passo 2: Verificar Mapeamento de Porta

### **No Portainer:**

1. **Containers** → `institutobex-db`
2. Role até **Network ports configuration**
3. Verifique:
   - **Container**: `5432` (sempre 5432)
   - **Host**: `5433` (ou outra porta) ← **ESTA É A PORTA QUE VOCÊ USA!**

**Anote a porta do Host** (ex: `5433`)

### **Verificar Se a Porta Está Correta no pgAdmin:**

No pgAdmin, certifique-se de usar a **porta do Host**, não a do container:
- ✅ Correto: Port `5433` (porta do Host)
- ❌ Errado: Port `5432` (porta do container)

---

## 🔍 Passo 3: Verificar IP do Servidor

### **Descobrir IP Correto:**

1. **Portainer** → **Containers** → Qualquer container → **Console**
2. Execute:
   ```bash
   ip route | grep default | awk '{print $3}'
   ```
3. **Anote o IP** que aparecer (ex: `192.168.1.100`)

### **Verificar IP no pgAdmin:**

No pgAdmin, certifique-se de usar o IP correto:
- ✅ Host: `192.168.1.100` (IP que você descobriu)
- ❌ Host: `localhost` (só funciona se estiver no próprio servidor)
- ❌ Host: `127.0.0.1` (só funciona se estiver no próprio servidor)

---

## 🔍 Passo 4: Verificar Credenciais

### **No Portainer:**

1. **Containers** → `institutobex-db` → **Environment variables**
2. Verifique:
   - `POSTGRES_USER` = `postgres` (ou outro usuário)
   - `POSTGRES_PASSWORD` = `sua_senha_aqui`
   - `POSTGRES_DB` = `institutobex`

### **No pgAdmin:**

Certifique-se de usar as mesmas credenciais:
- ✅ Username: `postgres` (mesmo de `POSTGRES_USER`)
- ✅ Password: `sua_senha_aqui` (mesma de `POSTGRES_PASSWORD`)
- ✅ Database: `institutobex` (mesma de `POSTGRES_DB`)

---

## 🔍 Passo 5: Testar Conexão do Container

### **Via Console do Container PostgreSQL:**

1. **Portainer** → **Containers** → `institutobex-db` → **Console**
2. Execute:
   ```bash
   psql -U postgres -d institutobex
   ```
3. Se conectar: PostgreSQL está funcionando! ✅
4. Se não conectar: Problema na configuração do PostgreSQL

---

## 🔍 Passo 6: Verificar Firewall

### **Teste 1: Tentar Conectar de Outro Container**

1. **Portainer** → **Containers** → `institutobex-backend` → **Console**
2. Execute:
   ```bash
   # Instalar cliente PostgreSQL
   apk add postgresql-client
   
   # Tentar conectar usando nome do container
   psql -h institutobex-db -U postgres -d institutobex
   ```
3. Se conectar: PostgreSQL está funcionando internamente! ✅
4. Se não conectar: Problema na configuração do PostgreSQL

### **Teste 2: Verificar Se Firewall Está Bloqueando**

Se você está tentando acessar **de fora da rede local**:

1. **Precisa configurar firewall** no servidor (via SSH)
2. Ou pedir ao administrador para configurar
3. Veja: `SOLUCAO_UFW_NAO_ENCONTRADO.md`

---

## 🔍 Passo 7: Verificar Se PostgreSQL Aceita Conexões Externas

Por padrão, PostgreSQL no Docker aceita conexões externas, mas vamos verificar:

### **Via Console do Container:**

1. **Portainer** → **Containers** → `institutobex-db` → **Console**
2. Execute:
   ```bash
   # Ver configuração do PostgreSQL
   cat /var/lib/postgresql/data/pg_hba.conf | grep -v "^#" | grep -v "^$"
   ```
3. Deve mostrar linhas permitindo conexões

**Se não mostrar nada ou estiver restritivo**, pode ser necessário ajustar.

---

## ✅ Soluções por Cenário

---

## 🚀 Solução 1: Acesso Local (Mesma Rede)

Se você está na **mesma rede local** do servidor:

### **Configuração no pgAdmin:**

- **Host**: IP do servidor (ex: `192.168.1.100`)
- **Port**: Porta do Host (ex: `5433`)
- **Database**: `institutobex`
- **Username**: `postgres`
- **Password**: (senha do PostgreSQL)

### **Se Ainda Não Funcionar:**

1. Verifique se o container está rodando
2. Verifique se a porta está mapeada
3. Verifique se o IP está correto
4. Tente desabilitar firewall temporariamente (se tiver acesso SSH):
   ```bash
   # No servidor (via SSH)
   ufw disable  # Temporariamente
   # Teste conexão
   # Depois reative: ufw enable
   ```

---

## 🚀 Solução 2: Acesso Remoto (De Fora)

Se você está acessando **de fora da rede local**:

### **Passo 1: Configurar Firewall**

No servidor (via SSH):
```bash
# Permitir porta
ufw allow 5433/tcp

# Verificar
ufw status
```

**Se não tem acesso SSH**: Peça ao administrador.

### **Passo 2: Verificar IP Público**

1. No console do container:
   ```bash
   # Instalar curl
   apk add curl
   
   # Ver IP público
   curl ifconfig.me
   ```

2. Use o IP público no pgAdmin:
   - **Host**: IP público (ex: `200.150.100.50`)
   - **Port**: `5433`

### **Passo 3: Verificar Firewall do Provedor**

Alguns provedores têm firewall no painel:
- **Hostinger**: Painel → Servidores → Firewall
- **DigitalOcean**: Networking → Firewalls
- **AWS**: EC2 → Security Groups

Adicione regra para porta `5433`.

---

## 🚀 Solução 3: Usar Nome do Container (Dentro da Network)

Se você está tentando conectar **de outro container na mesma network**:

### **No pgAdmin (se estiver em container):**

- **Host**: `institutobex-db` (nome do container)
- **Port**: `5432` (porta do container, não do Host)
- **Database**: `institutobex`
- **Username**: `postgres`
- **Password**: (senha)

**Nota**: Isso só funciona se o pgAdmin estiver rodando em um container na mesma network Docker.

---

## 🚀 Solução 4: Verificar Configuração do PostgreSQL

### **Verificar Se PostgreSQL Está Escutando:**

1. **Portainer** → **Containers** → `institutobex-db` → **Console**
2. Execute:
   ```bash
   # Ver processos do PostgreSQL
   ps aux | grep postgres
   
   # Ver portas abertas
   netstat -tlnp | grep 5432
   # ou
   ss -tlnp | grep 5432
   ```

3. Deve mostrar que está escutando na porta `5432`

---

## 🐛 Problemas Comuns e Soluções

### **Problema 1: "Port 5433 is already in use"**

**Solução:**
1. Verifique se outra aplicação está usando a porta
2. Mude a porta no Portainer:
   - **Network ports** → Mude Host para `5434` ou outra porta
3. Use a nova porta no pgAdmin

### **Problema 2: "Connection refused" (diferente de timeout)**

**Solução:**
- Container pode não estar rodando
- Porta pode não estar mapeada
- PostgreSQL pode não estar aceitando conexões

### **Problema 3: "Password authentication failed"**

**Solução:**
- Verifique a senha nas variáveis de ambiente
- Certifique-se de usar a senha correta no pgAdmin

### **Problema 4: "Database does not exist"**

**Solução:**
- Verifique o nome do banco em `POSTGRES_DB`
- Use o mesmo nome no pgAdmin

---

## 📋 Checklist Completo

- [ ] Container está rodando (status: Running)
- [ ] Porta está mapeada corretamente (Host: `5433`, Container: `5432`)
- [ ] IP do servidor está correto
- [ ] Credenciais estão corretas (usuário, senha, banco)
- [ ] Firewall permite a porta (se acesso remoto)
- [ ] PostgreSQL está aceitando conexões
- [ ] Testou conexão do container (funciona internamente)

---

## 🔍 Teste Rápido: Verificar Tudo

Execute este teste completo:

### **1. Verificar Container:**
```
Portainer → Containers → institutobex-db → Status: Running ✅
```

### **2. Verificar Porta:**
```
Portainer → Containers → institutobex-db → Network ports → Host: 5433 ✅
```

### **3. Verificar IP:**
```
Console → ip route | grep default | awk '{print $3}' → 192.168.1.100 ✅
```

### **4. Verificar Credenciais:**
```
Portainer → Containers → institutobex-db → Environment variables ✅
```

### **5. Testar Conexão Interna:**
```
Console → psql -U postgres -d institutobex → Conecta ✅
```

### **6. Configurar pgAdmin:**
```
Host: 192.168.1.100
Port: 5433
Database: institutobex
Username: postgres
Password: (senha)
```

---

## 🔗 Referências

- `SOLUCAO_UFW_NAO_ENCONTRADO.md` - Configurar firewall
- `COMO_DESCOBRIR_IP_SERVIDOR_PORTAINER.md` - Descobrir IP
- `COMO_ACESSAR_BANCO_DADOS_PORTAINER.md` - Acessar banco
- `CONFIGURACAO_PORTAINER_PASSO_A_PASSO.md` - Configuração completa

---

## ✅ Resumo Rápido

**Para resolver timeout no pgAdmin:**

1. ✅ **Verificar** se container está rodando
2. ✅ **Verificar** mapeamento de porta (Host: `5433`)
3. ✅ **Verificar** IP do servidor
4. ✅ **Verificar** credenciais
5. ✅ **Testar** conexão do container (funciona internamente?)
6. ✅ **Configurar** firewall (se acesso remoto)
7. ✅ **Tentar** conectar no pgAdmin novamente

**Se ainda não funcionar:**
- Verifique logs do container
- Teste conexão de outro container
- Verifique firewall do provedor

---

**Pronto!** Siga o checklist passo a passo para identificar e resolver o problema! 🚀

