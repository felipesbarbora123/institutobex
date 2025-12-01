# Scripts de Migração

## adapt-schema.js

Adapta o schema SQL do Supabase para funcionar com o backend interno.

### Uso

```bash
node scripts/adapt-schema.js <arquivo-backup.sql> <arquivo-saida.sql>
```

### Exemplo

```bash
# Se você tem o backup do Supabase
node scripts/adapt-schema.js ../supabase-export/backup/schema.sql schema-adaptado.sql

# Depois execute no PostgreSQL
psql -U postgres -d institutobex < schema-adaptado.sql
```

### O que o script faz

1. ✅ Garante que o schema `auth` existe
2. ✅ Cria tabela `auth.users` se não existir
3. ✅ Garante extensões necessárias (uuid-ossp, pgcrypto)
4. ✅ Cria tabelas essenciais se não existirem:
   - profiles
   - courses
   - course_enrollments
   - course_purchases
   - user_roles
   - webhook_logs
   - whatsapp_logs
5. ✅ Adiciona índices para performance
6. ✅ Comenta políticas RLS (não necessárias com JWT)
7. ✅ Adiciona comentários úteis

### Notas

- O script **não remove** dados existentes
- Ele apenas **adiciona** o que está faltando
- Revise o arquivo gerado antes de executar
- Faça backup do banco antes de aplicar mudanças

