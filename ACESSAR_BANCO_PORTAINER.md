# 🐘 Como Acessar o PostgreSQL no Portainer

## 📋 Métodos para Acessar o Banco de Dados

### Método 1: Via Console do Portainer (Recomendado)

#### Passo 1: Identificar o Container do PostgreSQL

1. **Acesse o Portainer** no navegador
2. **Vá em "Containers"** (ou "Containers" no menu lateral)
3. **Procure pelo container do PostgreSQL** (geralmente tem nome como `postgres`, `postgresql`, `db`, `database`, ou similar)
4. **Anote o nome do container**

#### Passo 2: Abrir o Console do Container

1. **Clique no container do PostgreSQL**
2. **Vá na aba "Console"** (ou "Exec" / "Terminal")
3. **Clique em "Connect"** ou "Connect to container"
4. **Selecione o shell**: `/bin/bash` ou `/bin/sh`

#### Passo 3: Conectar ao PostgreSQL

No console que abriu, execute:

```bash
# Conectar ao PostgreSQL como usuário postgres
psql -U postgres

# OU, se precisar especificar o banco diretamente:
psql -U postgres -d institutobex
```

**Se pedir senha**, use a senha configurada (geralmente `admin` ou a senha definida nas variáveis de ambiente).

#### Passo 4: Executar os Comandos SQL

Depois de conectar, você estará no prompt do PostgreSQL (`postgres=#` ou `institutobex=#`). Execute os comandos:

```sql
-- 1. Verificar se há pagamentos aprovados
SELECT 
  cp.id,
  cp.user_id,
  cp.course_id,
  cp.payment_status,
  cp.created_at,
  c.title as course_title
FROM course_purchases cp
JOIN courses c ON c.id = cp.course_id
WHERE cp.user_id = '5e55c480-a333-4dfc-a000-9c277946f0c7'
  AND cp.payment_status = 'paid'
ORDER BY cp.created_at DESC;

-- 2. Verificar se há matrículas
SELECT 
  ce.*,
  c.title as course_title
FROM course_enrollments ce
JOIN courses c ON c.id = ce.course_id
WHERE ce.user_id = '5e55c480-a333-4dfc-a000-9c277946f0c7';

-- 3. Criar matrículas para pagamentos aprovados que não têm matrícula
INSERT INTO course_enrollments (user_id, course_id, enrolled_at)
SELECT 
  cp.user_id,
  cp.course_id,
  NOW()
FROM course_purchases cp
WHERE cp.payment_status = 'paid'
  AND cp.user_id = '5e55c480-a333-4dfc-a000-9c277946f0c7'
  AND NOT EXISTS (
    SELECT 1 FROM course_enrollments ce
    WHERE ce.user_id = cp.user_id
      AND ce.course_id = cp.course_id
  )
ON CONFLICT (user_id, course_id) DO NOTHING;

-- 4. Verificar se as matrículas foram criadas
SELECT 
  ce.*,
  c.title as course_title
FROM course_enrollments ce
JOIN courses c ON c.id = ce.course_id
WHERE ce.user_id = '5e55c480-a333-4dfc-a000-9c277946f0c7';
```

**Para sair do psql**, digite: `\q` ou `exit`

---

### Método 2: Via Exec Command do Portainer

1. **No Portainer, clique no container do PostgreSQL**
2. **Vá em "Exec"** ou "Execute command"
3. **Digite o comando**:
   ```bash
   psql -U postgres -d institutobex -c "SELECT * FROM course_enrollments WHERE user_id = '5e55c480-a333-4dfc-a000-9c277946f0c7';"
   ```

**Nota:** Este método é útil para comandos rápidos, mas para múltiplos comandos SQL, use o Método 1.

---

### Método 3: Via Arquivo SQL (Recomendado para Múltiplos Comandos)

#### Passo 1: Criar Arquivo SQL Localmente

Crie um arquivo `fix-enrollments.sql` com o conteúdo:

```sql
-- Verificar pagamentos aprovados
SELECT 
  cp.id,
  cp.user_id,
  cp.course_id,
  cp.payment_status,
  cp.created_at,
  c.title as course_title
FROM course_purchases cp
JOIN courses c ON c.id = cp.course_id
WHERE cp.user_id = '5e55c480-a333-4dfc-a000-9c277946f0c7'
  AND cp.payment_status = 'paid'
ORDER BY cp.created_at DESC;

-- Criar matrículas
INSERT INTO course_enrollments (user_id, course_id, enrolled_at)
SELECT 
  cp.user_id,
  cp.course_id,
  NOW()
FROM course_purchases cp
WHERE cp.payment_status = 'paid'
  AND cp.user_id = '5e55c480-a333-4dfc-a000-9c277946f0c7'
  AND NOT EXISTS (
    SELECT 1 FROM course_enrollments ce
    WHERE ce.user_id = cp.user_id
      AND ce.course_id = cp.course_id
  )
ON CONFLICT (user_id, course_id) DO NOTHING;

-- Verificar resultado
SELECT 
  ce.*,
  c.title as course_title
FROM course_enrollments ce
JOIN courses c ON c.id = ce.course_id
WHERE ce.user_id = '5e55c480-a333-4dfc-a000-9c277946f0c7';
```

#### Passo 2: Copiar Arquivo para o Container

1. **No Portainer, vá em "Containers"**
2. **Clique no container do PostgreSQL**
3. **Vá em "Files"** ou "Volumes"
4. **Faça upload do arquivo** ou copie o conteúdo

#### Passo 3: Executar o Arquivo

No console do container:

```bash
psql -U postgres -d institutobex -f /caminho/para/fix-enrollments.sql
```

---

### Método 4: Via Cliente PostgreSQL Externo (pgAdmin, DBeaver, etc)

Se você tiver acesso à rede do servidor:

1. **Identifique o IP e Porta do Container**:
   - No Portainer, vá no container do PostgreSQL
   - Veja as portas mapeadas (geralmente `5432:5432`)

2. **Use um cliente PostgreSQL**:
   - **Host:** IP do servidor (ou `localhost` se estiver na mesma máquina)
   - **Port:** Porta mapeada (geralmente `5432`)
   - **Database:** `institutobex`
   - **Username:** `postgres`
   - **Password:** Senha configurada (geralmente `admin`)

---

## 🔍 Identificando o Container do PostgreSQL

Se você não souber qual é o container do PostgreSQL:

1. **No Portainer, vá em "Containers"**
2. **Procure por containers com**:
   - Nome contendo: `postgres`, `postgresql`, `db`, `database`
   - Imagem contendo: `postgres` (ex: `postgres:14`, `postgres:15`, `postgres:latest`)
   - Porta `5432` mapeada

3. **Verifique as variáveis de ambiente** do container:
   - `POSTGRES_DB` ou `DB_NAME` (geralmente `institutobex`)
   - `POSTGRES_USER` ou `DB_USER` (geralmente `postgres`)
   - `POSTGRES_PASSWORD` ou `DB_PASSWORD` (senha do banco)

---

## 📝 Comandos Úteis do PostgreSQL

```sql
-- Listar todos os bancos de dados
\l

-- Conectar a um banco específico
\c institutobex

-- Listar todas as tabelas
\dt

-- Descrever estrutura de uma tabela
\d course_enrollments

-- Ver todas as matrículas
SELECT * FROM course_enrollments;

-- Ver todos os pagamentos
SELECT * FROM course_purchases WHERE payment_status = 'paid';

-- Contar matrículas por usuário
SELECT user_id, COUNT(*) as total_enrollments 
FROM course_enrollments 
GROUP BY user_id;

-- Sair do psql
\q
```

---

## ⚠️ Dicas Importantes

1. **Sempre faça backup antes de modificar dados:**
   ```bash
   pg_dump -U postgres -d institutobex > backup.sql
   ```

2. **Use transações para comandos importantes:**
   ```sql
   BEGIN;
   -- seus comandos aqui
   COMMIT; -- ou ROLLBACK; se algo der errado
   ```

3. **Verifique os resultados antes de confirmar:**
   - Sempre execute `SELECT` antes de `INSERT` ou `UPDATE`
   - Use `SELECT COUNT(*)` para verificar quantos registros serão afetados

---

## 🆘 Problemas Comuns

### Erro: "psql: command not found"
**Solução:** O container pode não ter o `psql` instalado. Tente:
```bash
# Instalar psql no container (se for Alpine Linux)
apk add postgresql-client

# Ou usar o caminho completo
/usr/bin/psql -U postgres
```

### Erro: "password authentication failed"
**Solução:** Verifique a senha nas variáveis de ambiente do container no Portainer.

### Erro: "database does not exist"
**Solução:** Liste os bancos com `\l` e use o nome correto, ou crie o banco:
```sql
CREATE DATABASE institutobex;
```

---

## ✅ Checklist

- [ ] Identifiquei o container do PostgreSQL no Portainer
- [ ] Abri o console do container
- [ ] Conectei ao PostgreSQL com `psql -U postgres -d institutobex`
- [ ] Executei os comandos SQL para verificar pagamentos
- [ ] Executei os comandos SQL para criar matrículas
- [ ] Verifiquei se as matrículas foram criadas corretamente

