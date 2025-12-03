# 🗄️ Como Acessar o Banco de Dados PostgreSQL no Portainer

## 🎯 Formas de Acessar o Banco de Dados

Existem várias formas de acessar o PostgreSQL que está rodando no Portainer. Aqui estão as principais:

---

## 🚀 Método 1: Via Console do Container (Mais Simples)

Este é o método mais direto usando o Portainer:

### **Passo 1: Acessar Console do Container PostgreSQL**

1. **Portainer** → **Containers**
2. Encontre o container do PostgreSQL (ex: `institutobex-db`)
3. Clique no container
4. Clique em **Console**
5. Selecione **sh** ou **/bin/sh**
6. Clique em **Connect**

### **Passo 2: Conectar ao PostgreSQL**

No console, execute:

```bash
# Conectar ao PostgreSQL
psql -U postgres -d institutobex

# Ou se precisar especificar host
psql -h localhost -U postgres -d institutobex
```

**Quando pedir senha**, digite a senha que você configurou na variável `POSTGRES_PASSWORD`.

### **Passo 3: Usar Comandos SQL**

Agora você está conectado! Pode executar comandos SQL:

```sql
-- Ver todas as tabelas
\dt

-- Ver estrutura de uma tabela
\d nome_da_tabela

-- Listar todos os bancos de dados
\l

-- Selecionar dados
SELECT * FROM usuarios LIMIT 10;

-- Ver usuários do banco
\du

-- Sair
\q
```

---

## 🚀 Método 2: Via Container Backend (Se Tiver psql Instalado)

Se o container do backend tem `psql` instalado:

1. **Portainer** → **Containers** → `institutobex-backend`
2. **Console** → **Connect**
3. Execute:

```bash
# Instalar psql (se não tiver)
apk add postgresql-client  # Alpine
# ou
apt-get update && apt-get install -y postgresql-client  # Ubuntu/Debian

# Conectar ao banco (use o nome do container do PostgreSQL)
psql -h institutobex-db -U postgres -d institutobex
```

**Nota**: Use o **nome do container** do PostgreSQL (ex: `institutobex-db`) como host, não `localhost`!

---

## 🚀 Método 3: Via Ferramenta Gráfica (pgAdmin, DBeaver, etc.)

Para usar ferramentas gráficas como pgAdmin, DBeaver, TablePlus, etc.:

### **Passo 1: Verificar Porta Mapeada**

1. **Portainer** → **Containers** → `institutobex-db`
2. Role até **Network ports configuration**
3. Veja a porta mapeada:
   - **Container**: `5432`
   - **Host**: `5433` (ou outra porta) ← **ESTA É A PORTA QUE VOCÊ USA!**

### **Passo 2: Obter IP do Servidor**

Você precisa do **IP do servidor** onde o Portainer está rodando. Pode ser:
- IP público do servidor
- Domínio do servidor
- `localhost` (se estiver acessando do próprio servidor)

**📖 Como descobrir o IP**: Veja `COMO_DESCOBRIR_IP_SERVIDOR_PORTAINER.md` - Guia completo

**Resumo rápido**: No console do container, execute:
```bash
ip route | grep default | awk '{print $3}'
```
Este comando mostra o IP do servidor (gateway).

### **Passo 3: Configurar na Ferramenta**

#### **pgAdmin:**
1. Abra o pgAdmin
2. Clique com botão direito em **Servers** → **Create** → **Server**
3. Na aba **General**:
   - **Name**: `Instituto Bex`
4. Na aba **Connection**:
   - **Host**: IP do servidor (ou `localhost` se local)
   - **Port**: `5433` (ou a porta que você mapeou)
   - **Database**: `institutobex`
   - **Username**: `postgres`
   - **Password**: senha do PostgreSQL
5. Clique em **Save**

#### **DBeaver:**
1. Abra o DBeaver
2. Clique em **New Database Connection**
3. Selecione **PostgreSQL**
4. Preencha:
   - **Host**: IP do servidor
   - **Port**: `5433` (ou a porta mapeada)
   - **Database**: `institutobex`
   - **Username**: `postgres`
   - **Password**: senha do PostgreSQL
5. Clique em **Test Connection**
6. Clique em **Finish**

#### **TablePlus:**
1. Abra o TablePlus
2. Clique em **Create a new connection**
3. Selecione **PostgreSQL**
4. Preencha:
   - **Name**: `Instituto Bex`
   - **Host**: IP do servidor
   - **Port**: `5433`
   - **User**: `postgres`
   - **Password**: senha do PostgreSQL
   - **Database**: `institutobex`
5. Clique em **Connect**

---

## 🚀 Método 4: Via Linha de Comando (Do Seu Computador)

Se você tem acesso SSH ao servidor:

### **Passo 1: Conectar ao Servidor**

```bash
ssh root@IP_DO_SERVIDOR
```

### **Passo 2: Instalar PostgreSQL Client (Se Não Tiver)**

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y postgresql-client

# CentOS/RHEL
sudo yum install -y postgresql

# Alpine
apk add postgresql-client
```

### **Passo 3: Conectar ao Banco**

```bash
# Usar a porta mapeada no Host (ex: 5433)
psql -h localhost -p 5433 -U postgres -d institutobex

# Ou se a porta 5432 estiver mapeada diretamente
psql -h localhost -p 5432 -U postgres -d institutobex
```

---

## 🔍 Como Descobrir as Credenciais

### **Ver Variáveis de Ambiente do Container PostgreSQL:**

1. **Portainer** → **Containers** → `institutobex-db`
2. Role até a seção **Environment variables**
3. Você verá:
   - `POSTGRES_USER` = `postgres` (ou outro usuário)
   - `POSTGRES_PASSWORD` = `sua_senha_aqui`
   - `POSTGRES_DB` = `institutobex` (nome do banco)

### **Ver Porta Mapeada:**

1. **Portainer** → **Containers** → `institutobex-db`
2. Role até **Network ports configuration**
3. Veja:
   - **Container**: `5432` (sempre 5432 dentro do container)
   - **Host**: `5433` (ou outra porta) ← **USE ESTA PORTA!**

---

## 📋 Informações Necessárias para Conectar

Para conectar ao banco, você precisa de:

- ✅ **Host**: 
  - IP do servidor (para acesso externo)
  - `localhost` (se estiver no servidor)
  - Nome do container (ex: `institutobex-db`) - apenas dentro da network Docker
- ✅ **Port**: Porta mapeada no Host (ex: `5433`)
- ✅ **Database**: Nome do banco (ex: `institutobex`)
- ✅ **Username**: Usuário do PostgreSQL (ex: `postgres`)
- ✅ **Password**: Senha configurada em `POSTGRES_PASSWORD`

---

## 🔒 Segurança: Acesso Remoto

⚠️ **IMPORTANTE**: Por padrão, o PostgreSQL no Docker só aceita conexões locais. Para acessar remotamente:

### **Opção 1: Usar Porta Mapeada (Já Funciona)**

Se você mapeou a porta (ex: `5433:5432`), já pode acessar remotamente usando o IP do servidor e a porta mapeada.

### **Opção 2: Configurar pg_hba.conf (Avançado)**

Se precisar de mais controle:

1. **Portainer** → **Containers** → `institutobex-db` → **Console**
2. Edite `/var/lib/postgresql/data/pg_hba.conf`:
   ```bash
   # Adicionar linha para permitir conexões remotas
   host    all             all             0.0.0.0/0               md5
   ```
3. Reinicie o container

**⚠️ Cuidado**: Isso permite conexões de qualquer IP. Use firewall para restringir!

---

## 🐛 Problemas Comuns

### **Erro: "connection timeout expired"**

**📖 Veja**: `SOLUCAO_TIMEOUT_PGADMIN.md` - ⚠️ **Guia completo de troubleshooting para timeout**

**Resumo rápido:**
- Verifique se container está rodando
- Verifique mapeamento de porta (Host: `5433`)
- Verifique IP do servidor
- Verifique credenciais
- Configure firewall (se acesso remoto)

### **Erro: "connection refused"**

**Solução:**
- Verifique se o container está rodando
- Verifique se a porta está mapeada corretamente
- Verifique se está usando a porta do Host (ex: `5433`), não a do container (`5432`)

### **Erro: "password authentication failed"**

**Solução:**
- Verifique a senha nas variáveis de ambiente do container
- Certifique-se de usar o usuário correto (`postgres`)

### **Erro: "database does not exist"**

**Solução:**
- Verifique o nome do banco nas variáveis de ambiente (`POSTGRES_DB`)
- Liste os bancos: `psql -U postgres -c "\l"`

### **Erro: "could not connect to server" (Acesso Remoto)**

**Solução:**
- Verifique se o firewall permite a porta
- Verifique se está usando o IP correto do servidor
- Verifique se a porta está mapeada no Portainer

---

## 📝 Comandos SQL Úteis

Depois de conectar, você pode usar:

```sql
-- Listar todos os bancos
\l

-- Conectar a outro banco
\c nome_do_banco

-- Listar todas as tabelas
\dt

-- Ver estrutura de uma tabela
\d nome_da_tabela

-- Ver índices
\di

-- Ver funções
\df

-- Ver usuários
\du

-- Executar query
SELECT * FROM usuarios LIMIT 10;

-- Ver tamanho do banco
SELECT pg_size_pretty(pg_database_size('institutobex'));

-- Ver tamanho de uma tabela
SELECT pg_size_pretty(pg_total_relation_size('usuarios'));

-- Ver conexões ativas
SELECT * FROM pg_stat_activity;

-- Sair
\q
```

---

## 🔗 Referências

- `SOLUCAO_TIMEOUT_PGADMIN.md` - 🔧 **Resolver erro "connection timeout expired"**
- `COMO_DESCOBRIR_IP_SERVIDOR_PORTAINER.md` - 🌐 **Como descobrir o IP do servidor**
- `CONFIGURACAO_PORTAINER_PASSO_A_PASSO.md` - Como configurar o PostgreSQL
- `COMO_VER_CAMINHOS_ARQUIVOS_PORTAINER.md` - Ver configurações no Portainer

---

## ✅ Resumo Rápido

**Para acessar o banco via Portainer:**

1. ✅ **Portainer** → **Containers** → `institutobex-db` → **Console**
2. ✅ Execute: `psql -U postgres -d institutobex`
3. ✅ Digite a senha quando solicitado
4. ✅ Use comandos SQL ou `\dt` para ver tabelas

**Para acessar via ferramenta gráfica:**

1. ✅ Descubra a porta mapeada (ex: `5433`)
2. ✅ Use o IP do servidor + porta mapeada
3. ✅ Credenciais: `postgres` / senha do `POSTGRES_PASSWORD`

**Pronto!** Agora você sabe como acessar o banco de dados! 🚀

