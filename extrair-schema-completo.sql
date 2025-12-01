-- ============================================
-- SCRIPT PARA EXTRAIR SCHEMA COMPLETO DO SUPABASE
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================
-- 
-- INSTRUÇÕES:
-- 1. Acesse: https://supabase.com/dashboard/project/qxgzazewwutbikmmpkms/sql
-- 2. Cole este script
-- 3. Execute
-- 4. Copie os resultados e salve em arquivos SQL separados
-- ============================================

-- ============================================
-- 1. ESTRUTURA DE TODAS AS TABELAS
-- ============================================
-- Execute esta query e salve o resultado em: migrations/YYYYMMDDHHMMSS_create_tables.sql

SELECT 
  '-- Tabela: ' || table_name || E'\\n' ||
  'CREATE TABLE IF NOT EXISTS ' || table_name || ' (' || E'\\n' ||
  string_agg(
    '  ' || column_name || ' ' || 
    CASE 
      WHEN data_type = 'character varying' THEN 'VARCHAR(' || COALESCE(character_maximum_length::text, '255') || ')'
      WHEN data_type = 'character' THEN 'CHAR(' || COALESCE(character_maximum_length::text, '1') || ')'
      WHEN data_type = 'numeric' THEN 
        CASE 
          WHEN numeric_precision IS NOT NULL THEN 'NUMERIC(' || numeric_precision || ',' || COALESCE(numeric_scale, 0) || ')'
          ELSE 'NUMERIC'
        END
      WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP'
      WHEN data_type = 'timestamp with time zone' THEN 'TIMESTAMPTZ'
      WHEN data_type = 'USER-DEFINED' THEN udt_name
      WHEN data_type = 'ARRAY' THEN udt_name || '[]'
      ELSE UPPER(data_type)
    END ||
    CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
    CASE 
      WHEN column_default IS NOT NULL AND column_default NOT LIKE 'nextval%' 
      THEN ' DEFAULT ' || column_default
      WHEN column_default LIKE 'nextval%' 
      THEN ' DEFAULT ' || column_default
      ELSE ''
    END,
    ',' || E'\\n'
    ORDER BY ordinal_position
  ) || E'\\n' || ');' || E'\\n'
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name NOT LIKE 'pg_%'
  AND table_name NOT LIKE '_prisma%'
GROUP BY table_name
ORDER BY table_name;

-- ============================================
-- 2. CHAVES PRIMÁRIAS
-- ============================================
-- Execute e salve em: migrations/YYYYMMDDHHMMSS_add_primary_keys.sql

SELECT 
  'ALTER TABLE ' || tc.table_name || 
  ' ADD CONSTRAINT ' || tc.constraint_name || 
  ' PRIMARY KEY (' || 
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) || 
  ');' || E'\\n'
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'PRIMARY KEY'
GROUP BY tc.table_name, tc.constraint_name
ORDER BY tc.table_name;

-- ============================================
-- 3. CHAVES ESTRANGEIRAS (FOREIGN KEYS)
-- ============================================
-- Execute e salve em: migrations/YYYYMMDDHHMMSS_add_foreign_keys.sql

SELECT 
  'ALTER TABLE ' || tc.table_name || 
  ' ADD CONSTRAINT ' || tc.constraint_name || 
  ' FOREIGN KEY (' || 
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) || 
  ') REFERENCES ' || 
  ccu.table_schema || '.' || ccu.table_name || 
  ' (' || 
  string_agg(ccu.column_name, ', ' ORDER BY kcu.ordinal_position) || 
  ')' ||
  CASE 
    WHEN rc.update_rule != 'NO ACTION' THEN ' ON UPDATE ' || rc.update_rule
    ELSE ''
  END ||
  CASE 
    WHEN rc.delete_rule != 'NO ACTION' THEN ' ON DELETE ' || rc.delete_rule
    ELSE ''
  END || ';' || E'\\n'
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
GROUP BY tc.table_name, tc.constraint_name, ccu.table_schema, ccu.table_name, rc.update_rule, rc.delete_rule
ORDER BY tc.table_name;

-- ============================================
-- 4. ÍNDICES
-- ============================================
-- Execute e salve em: migrations/YYYYMMDDHHMMSS_add_indexes.sql

SELECT 
  'CREATE INDEX IF NOT EXISTS ' || indexname || 
  ' ON ' || schemaname || '.' || tablename || 
  ' USING ' || indexdef || ';' || E'\\n'
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname NOT LIKE 'pg_%'
ORDER BY tablename, indexname;

-- ============================================
-- 5. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================
-- Execute e salve em: migrations/YYYYMMDDHHMMSS_add_rls_policies.sql

SELECT 
  'CREATE POLICY "' || policyname || '" ON ' || schemaname || '.' || tablename ||
  ' AS ' || permissive || 
  ' FOR ' || cmd ||
  CASE 
    WHEN qual IS NOT NULL AND qual != '' THEN E'\\n  USING (' || qual || ')' 
    ELSE '' 
  END ||
  CASE 
    WHEN with_check IS NOT NULL AND with_check != '' THEN E'\\n  WITH CHECK (' || with_check || ')' 
    ELSE '' 
  END || ';' || E'\\n'
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 6. HABILITAR RLS NAS TABELAS
-- ============================================
-- Execute e salve junto com as políticas RLS

SELECT 
  'ALTER TABLE ' || tablename || ' ENABLE ROW LEVEL SECURITY;' || E'\\n'
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE '_prisma%'
ORDER BY tablename;

-- ============================================
-- 7. SEQUENCES (para IDs auto-incrementais)
-- ============================================
-- Execute e salve em: migrations/YYYYMMDDHHMMSS_add_sequences.sql

SELECT 
  'CREATE SEQUENCE IF NOT EXISTS ' || sequence_name || 
  ' START WITH ' || last_value || 
  ' INCREMENT BY ' || increment_by || ';' || E'\\n'
FROM information_schema.sequences
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

-- ============================================
-- 8. TRIGGERS (se houver)
-- ============================================
-- Execute e salve em: migrations/YYYYMMDDHHMMSS_add_triggers.sql

SELECT 
  'CREATE TRIGGER ' || trigger_name || 
  ' ' || action_timing || ' ' || event_manipulation || 
  ' ON ' || event_object_table || 
  ' FOR EACH ' || action_statement || 
  ' EXECUTE FUNCTION ' || action_statement || ';' || E'\\n'
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================
-- 9. FUNÇÕES DO BANCO (se houver)
-- ============================================
-- Execute e salve em: migrations/YYYYMMDDHHMMSS_add_functions.sql

SELECT 
  'CREATE OR REPLACE FUNCTION ' || routine_name || 
  '(' || 
  COALESCE(
    string_agg(
      parameter_name || ' ' || data_type,
      ', ' ORDER BY ordinal_position
    ),
    ''
  ) || 
  ') RETURNS ' || return_type || 
  ' LANGUAGE ' || routine_language || 
  ' AS $$' || E'\\n' ||
  routine_definition || E'\\n' ||
  '$$;' || E'\\n'
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
GROUP BY routine_name, return_type, routine_language, routine_definition
ORDER BY routine_name;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- 
-- NOTAS:
-- - Execute cada seção separadamente
-- - Copie os resultados para arquivos SQL
-- - Organize as migrations em ordem lógica
-- - Teste em um projeto de desenvolvimento primeiro
-- ============================================


