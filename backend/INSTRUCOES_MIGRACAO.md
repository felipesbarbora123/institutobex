# 📋 Instruções de Migração - Schema Completo

## ✅ Schema Adaptado Criado

O schema completo foi adaptado e está em: `backend/schema/schema-completo-adaptado.sql`

---

## 🚀 Passo a Passo

### 1. Criar Banco de Dados

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco
CREATE DATABASE institutobex;

# Sair
\q
```

### 2. Executar Schema

```bash
# Executar o schema adaptado
psql -U postgres -d institutobex < backend/schema/schema-completo-adaptado.sql
```

### 3. Restaurar Dados (se tiver backup)

Se você tem um backup com dados:

```bash
# Se for SQL
psql -U postgres -d institutobex < backup_dados.sql

# Se for dump custom
pg_restore -U postgres -d institutobex backup_dados.dump
```

### 4. Verificar Tabelas

```bash
psql -U postgres -d institutobex

# Listar tabelas
\dt

# Verificar estrutura de uma tabela
\d courses

# Sair
\q
```

### 5. Configurar Backend

```bash
cd backend
npm install

# Copiar e editar .env
cp .env.example .env
# Edite o .env com suas configurações
```

### 6. Testar Conexão

```bash
npm start

# Em outro terminal, testar
curl http://localhost:3001/health
```

---

## 📊 Tabelas Criadas

O schema inclui todas as tabelas:

- ✅ `auth.users` - Usuários
- ✅ `profiles` - Perfis
- ✅ `user_roles` - Roles
- ✅ `courses` - Cursos
- ✅ `lessons` - Lições
- ✅ `course_enrollments` - Matrículas
- ✅ `lesson_progress` - Progresso
- ✅ `course_purchases` - Compras
- ✅ `course_materials` - Materiais
- ✅ `certificates` - Certificados
- ✅ `coupons` - Cupons
- ✅ `contact_messages` - Mensagens
- ✅ `webhook_configs` - Configurações de webhook
- ✅ `webhook_logs` - Logs de webhook
- ✅ `email_logs` - Logs de email
- ✅ `notification_dispatch_logs` - Logs de notificações
- ✅ `notification_test_logs` - Logs de testes
- ✅ `pending_admins` - Admins pendentes
- ✅ `whatsapp_logs` - Logs de WhatsApp

---

## 🔧 Funções Criadas

- ✅ `is_fixed_admin()` - Verifica se é admin fixo
- ✅ `has_role()` - Verifica role do usuário
- ✅ `generate_certificate_code()` - Gera código de certificado
- ✅ `get_user_id_by_email()` - Busca ID por email
- ✅ `get_users_for_notifications()` - Lista usuários para notificações
- ✅ `update_updated_at_column()` - Atualiza updated_at
- ✅ `handle_new_user()` - Cria perfil ao criar usuário

---

## ⚙️ Triggers Criados

- ✅ `on_auth_user_created` - Cria perfil ao criar usuário
- ✅ `update_courses_updated_at` - Atualiza updated_at em courses
- ✅ `update_webhook_configs_updated_at` - Atualiza updated_at em webhook_configs
- ✅ `update_course_purchases_updated_at` - Atualiza updated_at em course_purchases

---

## 🔐 RLS (Row Level Security)

**RLS foi DESABILITADO** porque:
- O backend usa autenticação JWT
- O controle de acesso é feito no código
- Mais simples de gerenciar

Se quiser habilitar RLS como camada adicional, você precisará:
1. Habilitar RLS nas tabelas
2. Criar políticas adaptadas
3. Usar funções auxiliares que recebem user_id como parâmetro

---

## 📡 Rotas Adicionais Criadas

Além das rotas básicas, foram criadas:

### Lições
- `GET /api/lessons/course/:courseId` - Listar lições de um curso
- `GET /api/lessons/:id` - Obter lição
- `POST /api/lessons` - Criar lição (admin/teacher)
- `PUT /api/lessons/:id` - Atualizar lição (admin/teacher)
- `DELETE /api/lessons/:id` - Deletar lição (admin/teacher)

### Matrículas
- `GET /api/enrollments/my-enrollments` - Minhas matrículas
- `GET /api/enrollments/check/:courseId` - Verificar matrícula
- `POST /api/enrollments` - Criar matrícula (admin)
- `PATCH /api/enrollments/:courseId/access` - Atualizar último acesso
- `GET /api/enrollments` - Listar todas (admin)

### Progresso
- `GET /api/progress/lesson/:lessonId` - Progresso de uma lição
- `GET /api/progress/course/:courseId` - Progresso de um curso
- `POST /api/progress/lesson/:lessonId/complete` - Marcar como concluída
- `POST /api/progress/lesson/:lessonId/uncomplete` - Desmarcar

---

## ⚠️ Importante

1. **Senhas**: Se você restaurar dados do Supabase, as senhas podem não funcionar se o hash for diferente. Implemente recuperação de senha.

2. **IDs**: Os UUIDs serão preservados se você restaurar dados.

3. **Roles**: Os admins fixos (definidos em `is_fixed_admin()`) serão criados automaticamente ao fazer login.

4. **Triggers**: O trigger `handle_new_user` cria perfil e role automaticamente ao criar usuário.

---

## 🧪 Testar

```bash
# Health check
curl http://localhost:3001/health

# Testar login (criar usuário primeiro)
curl -X POST http://localhost:3001/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"senha123"}'

# Listar cursos
curl http://localhost:3001/api/courses
```

---

**Schema pronto para uso! 🚀**

