# 📤 Executar Arquivos SQL via Git no Portainer

## 🎯 Objetivo

Enviar arquivos SQL (criação de tabelas e inserts) para o servidor via Git e executá-los pelo console do container PostgreSQL no Portainer.

**✅ Sim, é totalmente possível!**

---

## 📋 Passo a Passo Completo

---

## 🚀 PASSO 1: Preparar Arquivos SQL

Certifique-se de que você tem os arquivos SQL no seu repositório Git:

```
backend/
├── schema/
│   └── schema-completo-adaptado.sql  (criação de tabelas)
└── data/
    ├── dados-importados.sql          (inserts)
    └── usuarios-para-criar.sql       (inserts)
```

---

## 🚀 PASSO 2: Fazer Upload dos Arquivos para o Servidor

### **Método A: Via Git (Recomendado)**

1. **Criar container temporário** para fazer download:

   - **Portainer** → **Containers** → **Add container**
   - **Name**: `sql-upload`
   - **Image**: `alpine:latest`
   - **Volumes** → **Bind**:
     - **Container**: `/sql`
     - **Host**: `/opt/institutobex/sql` (ou outro caminho)
   - **Command**: `tail -f /dev/null`
   - **Deploy**

2. **Acessar console** do container:

   - **Containers** → `sql-upload` → **Console** → **Connect**

3. **Clonar repositório Git**:

   ```bash
   # Instalar Git
   apk add git
   
   # Clonar repositório (use token se for privado)
   cd /sql
   git clone https://SEU_TOKEN@github.com/usuario/repositorio.git temp
   
   # Copiar arquivos SQL
   cp -r temp/backend/schema /sql/
   cp -r temp/backend/data /sql/
   
   # Limpar
   rm -rf temp
   ```

4. **Verificar arquivos**:

   ```bash
   ls -la /sql/schema/
   ls -la /sql/data/
   ```

5. **Remover container temporário** (opcional):
   - **Containers** → `sql-upload` → **Stop** → **Remove**

---

### **Método B: Via Container do Backend (Se Já Existe)**

Se você já tem o container do backend com os arquivos:

1. **Portainer** → **Containers** → `institutobex-backend` → **Console**
2. **Verificar se os arquivos estão lá**:

   ```bash
   ls -la /app/schema/
   ls -la /app/data/
   ```

3. **Copiar para local acessível** (se necessário):

   ```bash
   # Criar diretório compartilhado
   mkdir -p /opt/institutobex/sql
   cp -r /app/schema /opt/institutobex/sql/
   cp -r /app/data /opt/institutobex/sql/
   ```

---

## 🚀 PASSO 3: Executar Arquivos SQL no PostgreSQL

### **Método 1: Via Console do Container PostgreSQL (Recomendado)**

1. **Portainer** → **Containers** → `institutobex-db` → **Console** → **Connect**

2. **Executar arquivo SQL**:

   ```bash
   # Conectar ao PostgreSQL
   psql -U postgres -d institutobex
   
   # Digite a senha quando solicitado
   ```

3. **Dentro do psql, executar arquivo**:

   ```sql
   -- Executar arquivo de schema (criação de tabelas)
   \i /opt/institutobex/sql/schema/schema-completo-adaptado.sql
   
   -- Ou se os arquivos estão em outro lugar
   \i /sql/schema/schema-completo-adaptado.sql
   ```

4. **Verificar se executou**:

   ```sql
   -- Ver tabelas criadas
   \dt
   
   -- Sair
   \q
   ```

---

### **Método 2: Executar Diretamente via Linha de Comando**

1. **Portainer** → **Containers** → `institutobex-db` → **Console** → **Connect**

2. **Executar arquivo SQL diretamente**:

   ```bash
   # Executar arquivo de schema
   psql -U postgres -d institutobex -f /opt/institutobex/sql/schema/schema-completo-adaptado.sql
   
   # Executar arquivo de inserts
   psql -U postgres -d institutobex -f /opt/institutobex/sql/data/dados-importados.sql
   psql -U postgres -d institutobex -f /opt/institutobex/sql/data/usuarios-para-criar.sql
   ```

**Vantagem**: Não precisa entrar no psql, executa direto!

---

### **Método 3: Executar Múltiplos Arquivos em Sequência**

Criar um script para executar todos:

1. **Criar script** (no container temporário ou backend):

   ```bash
   # Criar script
   cat > /opt/institutobex/sql/executar-tudo.sh << 'EOF'
   #!/bin/sh
   export PGPASSWORD='sua_senha_aqui'
   
   echo "Executando schema..."
   psql -U postgres -d institutobex -f /opt/institutobex/sql/schema/schema-completo-adaptado.sql
   
   echo "Executando inserts..."
   psql -U postgres -d institutobex -f /opt/institutobex/sql/data/dados-importados.sql
   psql -U postgres -d institutobex -f /opt/institutobex/sql/data/usuarios-para-criar.sql
   
   echo "Concluído!"
   EOF
   
   chmod +x /opt/institutobex/sql/executar-tudo.sh
   ```

2. **Executar script**:

   ```bash
   # No console do container PostgreSQL
   sh /opt/institutobex/sql/executar-tudo.sh
   ```

---

## 🚀 PASSO 4: Usar Volume Compartilhado (Melhor Prática)

Para facilitar, configure um volume compartilhado:

### **Criar Volume:**

1. **Portainer** → **Volumes** → **Add volume**
2. **Name**: `sql_files`
3. **Driver**: `local`
4. **Create**

### **Configurar Containers:**

#### **Container PostgreSQL:**

1. **Containers** → `institutobex-db` → **Duplicate/Edit**
2. **Volumes** → **map additional volume**:
   - **Volume**: `sql_files`
   - **Container**: `/sql`
3. **Deploy**

#### **Container Backend (ou temporário):**

1. **Volumes** → **map additional volume**:
   - **Volume**: `sql_files`
   - **Container**: `/sql`
2. **Deploy**

Agora os arquivos SQL ficam acessíveis em ambos os containers!

---

## 📋 Exemplo Completo: Do Zero

### **1. Fazer Upload dos Arquivos:**

```bash
# No container temporário
apk add git
cd /sql
git clone https://SEU_TOKEN@github.com/usuario/repositorio.git temp
cp -r temp/backend/schema /sql/
cp -r temp/backend/data /sql/
rm -rf temp
```

### **2. Executar Schema (Criação de Tabelas):**

```bash
# No console do PostgreSQL
psql -U postgres -d institutobex -f /sql/schema/schema-completo-adaptado.sql
```

### **3. Verificar Tabelas:**

```bash
# Conectar ao psql
psql -U postgres -d institutobex

# Ver tabelas
\dt

# Sair
\q
```

### **4. Executar Inserts:**

```bash
# Executar inserts
psql -U postgres -d institutobex -f /sql/data/dados-importados.sql
psql -U postgres -d institutobex -f /sql/data/usuarios-para-criar.sql
```

### **5. Verificar Dados:**

```bash
# Conectar ao psql
psql -U postgres -d institutobex

# Ver dados
SELECT * FROM usuarios LIMIT 10;
SELECT COUNT(*) FROM cursos;

# Sair
\q
```

---

## 🔍 Verificar Caminho dos Arquivos

Se você não sabe onde estão os arquivos:

### **Método 1: Procurar no Container:**

```bash
# No console do container
find / -name "*.sql" 2>/dev/null
```

### **Método 2: Verificar Volume:**

```bash
# Ver volumes montados
mount | grep sql
# ou
df -h
```

---

## 🐛 Problemas Comuns

### **Erro: "could not open file"**

**Solução:**
- Verifique se o caminho está correto
- Verifique se o arquivo existe: `ls -la /caminho/arquivo.sql`
- Verifique permissões: `chmod 644 /caminho/arquivo.sql`

### **Erro: "permission denied"**

**Solução:**
```bash
# Ajustar permissões
chmod 644 /opt/institutobex/sql/schema/*.sql
chmod 644 /opt/institutobex/sql/data/*.sql
```

### **Erro: "relation already exists"**

**Solução:**
- As tabelas já existem
- Use `DROP TABLE` antes ou `CREATE TABLE IF NOT EXISTS` no SQL
- Ou execute apenas os inserts

### **Arquivos Não Aparecem no Container PostgreSQL**

**Solução:**
- Use volume compartilhado (veja Passo 4)
- Ou copie os arquivos para dentro do container PostgreSQL
- Ou use caminho absoluto correto

---

## 💡 Dicas

### **1. Executar Apenas Inserts (Se Tabelas Já Existem):**

```bash
# Executar apenas inserts
psql -U postgres -d institutobex -f /sql/data/dados-importados.sql
```

### **2. Executar com Tratamento de Erros:**

```bash
# Executar e continuar mesmo com erros
psql -U postgres -d institutobex -f /sql/schema/schema.sql --set ON_ERROR_STOP=off
```

### **3. Ver Logs de Execução:**

```bash
# Executar e salvar log
psql -U postgres -d institutobex -f /sql/schema/schema.sql > /sql/log.txt 2>&1
cat /sql/log.txt
```

### **4. Executar Apenas Parte do Arquivo:**

Se o arquivo SQL é muito grande, você pode:

```bash
# Executar apenas primeiras 100 linhas
head -n 100 /sql/schema/schema.sql | psql -U postgres -d institutobex
```

---

## ✅ Checklist

- [ ] Arquivos SQL estão no repositório Git
- [ ] Fazer upload dos arquivos para o servidor (via Git)
- [ ] Arquivos estão acessíveis no servidor
- [ ] Conectar ao console do container PostgreSQL
- [ ] Executar arquivo de schema (criação de tabelas)
- [ ] Verificar se tabelas foram criadas (`\dt`)
- [ ] Executar arquivos de inserts
- [ ] Verificar se dados foram inseridos
- [ ] Testar consultas

---

## 🔗 Referências

- `COMO_FAZER_UPLOAD_ARQUIVOS_PORTAINER.md` - Como fazer upload via Git
- `SOLUCAO_ERRO_GIT_PORTAINER.md` - Resolver erros de Git
- `COMO_ACESSAR_BANCO_DADOS_PORTAINER.md` - Acessar banco de dados
- `PSQL_CONECTANDO.md` - Como usar psql

---

## ✅ Resumo Rápido

**Para executar SQL via Git no Portainer:**

1. ✅ **Fazer upload** dos arquivos SQL via Git (container temporário)
2. ✅ **Copiar** arquivos para local acessível (ou usar volume compartilhado)
3. ✅ **Acessar console** do container PostgreSQL
4. ✅ **Executar** arquivo SQL:
   ```bash
   psql -U postgres -d institutobex -f /caminho/arquivo.sql
   ```
5. ✅ **Verificar** se executou corretamente

**Pronto!** Agora você sabe como executar arquivos SQL via Git no Portainer! 🚀

