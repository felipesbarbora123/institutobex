#!/usr/bin/env node

/**
 * Script para extrair migrations e schema do projeto Supabase atual
 * 
 * Este script:
 * 1. Conecta ao projeto Supabase atual
 * 2. Extrai o schema completo do banco de dados
 * 3. Gera arquivos de migration SQL
 * 4. Extrai Edge Functions
 * 5. Cria um guia de migração para o novo projeto
 * 
 * Uso:
 *   node extrair-migrations-supabase.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
  try {
    return execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      ...options 
    });
  } catch (error) {
    throw new Error(`Erro ao executar comando: ${command}\n${error.message}`);
  }
}

// Verificar se Supabase CLI está instalado
function checkSupabaseCLI() {
  try {
    execCommand('supabase --version');
    log('✅ Supabase CLI encontrado', 'green');
    return true;
  } catch (error) {
    log('❌ Supabase CLI não encontrado!', 'red');
    log('Instale com: npm install -g supabase', 'yellow');
    return false;
  }
}

// Criar estrutura de pastas
function createFolderStructure() {
  const folders = [
    'supabase-export',
    'supabase-export/migrations',
    'supabase-export/functions',
    'supabase-export/backup'
  ];

  folders.forEach(folder => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
      log(`📁 Criada pasta: ${folder}`, 'cyan');
    }
  });
}

// Extrair schema do banco de dados
function extractDatabaseSchema(projectRef) {
  log('\n📊 Extraindo schema do banco de dados...', 'blue');
  
  try {
    // Gerar dump do schema
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const schemaFile = `supabase-export/migrations/${timestamp}_initial_schema.sql`;
    
    log('Gerando dump do schema...', 'yellow');
    
    // Usar pg_dump via Supabase CLI
    // Nota: Isso requer acesso ao banco de dados
    const schemaSQL = `-- ============================================
-- SCHEMA EXTRAÍDO DO PROJETO SUPABASE
-- Projeto: ${projectRef}
-- Data: ${new Date().toISOString()}
-- ============================================

-- IMPORTANTE: Este arquivo contém apenas a estrutura das tabelas
-- Para extrair o schema completo, execute no Supabase Dashboard:
-- SQL Editor > New Query > Execute:
-- 
-- SELECT 
--   'CREATE TABLE ' || schemaname || '.' || tablename || ' (' || 
--   string_agg(column_name || ' ' || data_type || 
--     CASE 
--       WHEN character_maximum_length IS NOT NULL 
--       THEN '(' || character_maximum_length || ')' 
--       ELSE '' 
--     END ||
--     CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
--     ', '
--   ) || ');'
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
-- GROUP BY schemaname, tablename;
--
-- Ou use o comando: supabase db dump --schema public > schema.sql

-- ============================================
-- TABELAS IDENTIFICADAS NO PROJETO:
-- ============================================

-- profiles - Perfis de usuários
-- courses - Cursos disponíveis
-- course_enrollments - Matrículas em cursos
-- course_purchases - Compras de cursos
-- contact_messages - Mensagens de contato
-- user_roles - Roles de usuários (admin, teacher, student)
-- webhook_logs - Logs de webhooks
-- email_logs - Logs de emails

-- ============================================
-- PRÓXIMOS PASSOS:
-- ============================================
-- 1. Acesse o Supabase Dashboard do projeto atual
-- 2. Vá em SQL Editor
-- 3. Execute o script abaixo para extrair o schema completo
-- 4. Salve o resultado neste arquivo

`;

    fs.writeFileSync(schemaFile, schemaSQL);
    log(`✅ Arquivo de schema criado: ${schemaFile}`, 'green');
    
    return schemaFile;
  } catch (error) {
    log(`⚠️ Erro ao extrair schema: ${error.message}`, 'yellow');
    log('Você precisará extrair manualmente via Dashboard', 'yellow');
    return null;
  }
}

// Gerar script SQL para extrair schema completo
function generateSchemaExtractionScript() {
  const script = `-- ============================================
-- SCRIPT PARA EXTRAIR SCHEMA COMPLETO
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================

-- 1. Extrair estrutura de todas as tabelas
SELECT 
  'CREATE TABLE IF NOT EXISTS ' || table_name || ' (' || E'\\n' ||
  string_agg(
    '  ' || column_name || ' ' || 
    CASE 
      WHEN data_type = 'character varying' THEN 'VARCHAR(' || character_maximum_length || ')'
      WHEN data_type = 'character' THEN 'CHAR(' || character_maximum_length || ')'
      WHEN data_type = 'numeric' THEN 'NUMERIC(' || numeric_precision || ',' || numeric_scale || ')'
      WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP'
      WHEN data_type = 'timestamp with time zone' THEN 'TIMESTAMPTZ'
      WHEN data_type = 'USER-DEFINED' THEN udt_name
      ELSE UPPER(data_type)
    END ||
    CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
    CASE 
      WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default
      ELSE ''
    END,
    ',' || E'\\n'
    ORDER BY ordinal_position
  ) || E'\\n' || ');'
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name NOT LIKE 'pg_%'
  AND table_name NOT LIKE '_prisma%'
GROUP BY table_name
ORDER BY table_name;

-- 2. Extrair índices
SELECT 
  'CREATE INDEX IF NOT EXISTS ' || indexname || ' ON ' || tablename || 
  ' (' || indexdef || ');'
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 3. Extrair constraints (chaves primárias, estrangeiras, etc)
SELECT 
  'ALTER TABLE ' || tc.table_name || 
  ' ADD CONSTRAINT ' || tc.constraint_name || ' ' ||
  CASE tc.constraint_type
    WHEN 'PRIMARY KEY' THEN 'PRIMARY KEY (' || kcu.column_name || ')'
    WHEN 'FOREIGN KEY' THEN 'FOREIGN KEY (' || kcu.column_name || ') REFERENCES ' || 
         ccu.table_name || '(' || ccu.column_name || ')'
    WHEN 'UNIQUE' THEN 'UNIQUE (' || kcu.column_name || ')'
    ELSE tc.constraint_type
  END || ';'
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;

-- 4. Extrair políticas RLS (Row Level Security)
SELECT 
  'CREATE POLICY "' || policyname || '" ON ' || schemaname || '.' || tablename ||
  ' AS ' || permissive || ' FOR ' || cmd ||
  CASE WHEN qual IS NOT NULL THEN ' USING (' || qual || ')' ELSE '' END ||
  CASE WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || with_check || ')' ELSE '' END || ';'
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. Habilitar RLS nas tabelas (se necessário)
SELECT 
  'ALTER TABLE ' || tablename || ' ENABLE ROW LEVEL SECURITY;'
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;

`;

  const scriptFile = 'supabase-export/extrair-schema-completo.sql';
  fs.writeFileSync(scriptFile, script);
  log(`✅ Script SQL criado: ${scriptFile}`, 'green');
  log('   Execute este script no SQL Editor do Supabase Dashboard', 'yellow');
  
  return scriptFile;
}

// Extrair Edge Functions
function extractEdgeFunctions(projectRef) {
  log('\n⚡ Extraindo Edge Functions...', 'blue');
  
  const functions = [
    'send-whatsapp-notification',
    'confirm-purchase',
    'create-purchase',
    'create-payment-pix',
    'create-payment-card',
    'abacatepay-check-status',
    'validate-coupon',
    'reconcile-pending-payments'
  ];

  const extractedFunctions = [];

  functions.forEach(funcName => {
    try {
      log(`  Tentando baixar: ${funcName}...`, 'yellow');
      
      // Tentar baixar via CLI
      try {
        execCommand(`supabase functions download ${funcName}`, {
          cwd: 'supabase-export/functions'
        });
        log(`  ✅ ${funcName} baixada`, 'green');
        extractedFunctions.push(funcName);
      } catch (error) {
        log(`  ⚠️ ${funcName} não encontrada ou erro ao baixar`, 'yellow');
        log(`     Você precisará copiar manualmente do Dashboard`, 'yellow');
      }
    } catch (error) {
      log(`  ⚠️ Erro ao processar ${funcName}: ${error.message}`, 'yellow');
    }
  });

  // Copiar função de exemplo se existir
  if (fs.existsSync('supabase-edge-function-example.ts')) {
    const dest = 'supabase-export/functions/send-whatsapp-notification-example.ts';
    fs.copyFileSync('supabase-edge-function-example.ts', dest);
    log(`  ✅ Exemplo de função copiado: ${dest}`, 'green');
  }

  if (fs.existsSync('codigo-para-confirm-purchase.ts')) {
    const dest = 'supabase-export/functions/confirm-purchase-example.ts';
    fs.copyFileSync('codigo-para-confirm-purchase.ts', dest);
    log(`  ✅ Exemplo de função copiado: ${dest}`, 'green');
  }

  return extractedFunctions;
}

// Criar guia de migração
function createMigrationGuide(projectRef) {
  log('\n📝 Criando guia de migração...', 'blue');
  
  const guide = `# 🔄 Guia de Migração do Supabase

## 📋 Informações do Projeto Atual

- **Projeto ID**: ${projectRef}
- **URL**: https://${projectRef}.supabase.co
- **Data da Extração**: ${new Date().toISOString()}

---

## 🎯 Objetivo

Migrar todas as configurações, tabelas, dados e Edge Functions do projeto atual para um novo projeto Supabase.

---

## ✅ Checklist de Migração

### 1. Preparação

- [ ] Criar novo projeto no Supabase
- [ ] Anotar o novo Project ID
- [ ] Instalar Supabase CLI (se ainda não tiver)
- [ ] Fazer login: \`supabase login\`

### 2. Extrair Schema do Banco de Dados

#### Opção A: Via Supabase CLI (Recomendado)

\`\`\`bash
# Vincular ao projeto ANTIGO
supabase link --project-ref ${projectRef}

# Gerar dump do schema
supabase db dump --schema public > supabase-export/backup/schema-completo.sql

# Desvincular
supabase unlink
\`\`\`

#### Opção B: Via Dashboard (Manual)

1. Acesse: https://supabase.com/dashboard/project/${projectRef}
2. Vá em **SQL Editor**
3. Execute o script: \`extrair-schema-completo.sql\`
4. Copie o resultado e salve em: \`supabase-export/migrations/YYYYMMDDHHMMSS_initial_schema.sql\`

### 3. Extrair Dados (Opcional)

Se você quiser migrar os dados também:

\`\`\`bash
# Vincular ao projeto ANTIGO
supabase link --project-ref ${projectRef}

# Gerar dump completo (schema + dados)
supabase db dump > supabase-export/backup/database-completo.sql

# Desvincular
supabase unlink
\`\`\`

⚠️ **ATENÇÃO**: Migrar dados pode sobrescrever dados existentes no novo projeto!

### 4. Extrair Edge Functions

\`\`\`bash
# Vincular ao projeto ANTIGO
supabase link --project-ref ${projectRef}

# Baixar cada função
supabase functions download send-whatsapp-notification
supabase functions download confirm-purchase
supabase functions download create-purchase
supabase functions download create-payment-pix
supabase functions download create-payment-card
supabase functions download abacatepay-check-status
supabase functions download validate-coupon
supabase functions download reconcile-pending-payments

# Desvincular
supabase unlink
\`\`\`

Ou copie manualmente do Dashboard:
- Acesse: https://supabase.com/dashboard/project/${projectRef}/edge-functions
- Para cada função, copie o código e salve em: \`supabase-export/functions/[nome-da-funcao]/index.ts\`

### 5. Extrair Variáveis de Ambiente (Secrets)

1. Acesse: https://supabase.com/dashboard/project/${projectRef}/settings/edge-functions
2. Vá em **Secrets** ou **Environment Variables**
3. Anote todas as variáveis:
   - \`EVOLUTION_API_URL\`
   - \`EVOLUTION_API_KEY\`
   - \`EVOLUTION_INSTANCE_NAME\`
   - \`APP_URL\`
   - \`ABACATEPAY_API_KEY\`
   - \`ABACATEPAY_API_URL\`
   - \`ABACATEPAY_WEBHOOK_SECRET\`
   - Outras variáveis que você tenha configurado

### 6. Aplicar no Novo Projeto

#### 6.1. Vincular ao Novo Projeto

\`\`\`bash
# Vincular ao NOVO projeto
supabase link --project-ref [NOVO_PROJECT_ID]

# Quando solicitado, informe:
# - Database Password: (senha do novo projeto)
# - Git Branch: main
\`\`\`

#### 6.2. Aplicar Migrations

\`\`\`bash
# Inicializar estrutura (se ainda não tiver)
supabase init

# Copiar migrations para a pasta correta
cp supabase-export/migrations/*.sql supabase/migrations/

# Aplicar migrations
supabase db push
\`\`\`

#### 6.3. Importar Dados (Se necessário)

\`\`\`bash
# Importar dados do backup
psql -h [HOST] -U postgres -d postgres -f supabase-export/backup/database-completo.sql
\`\`\`

Ou via Dashboard:
1. Acesse o SQL Editor do novo projeto
2. Abra o arquivo de backup
3. Execute o SQL

#### 6.4. Deploy das Edge Functions

\`\`\`bash
# Copiar funções para a estrutura correta
mkdir -p supabase/functions

# Para cada função:
cp -r supabase-export/functions/[nome-da-funcao] supabase/functions/

# Deploy
supabase functions deploy send-whatsapp-notification
supabase functions deploy confirm-purchase
# ... (repetir para cada função)
\`\`\`

#### 6.5. Configurar Secrets

\`\`\`bash
# Configurar cada secret
supabase secrets set EVOLUTION_API_URL=[valor]
supabase secrets set EVOLUTION_API_KEY=[valor]
supabase secrets set EVOLUTION_INSTANCE_NAME=[valor]
supabase secrets set APP_URL=[valor]
supabase secrets set ABACATEPAY_API_KEY=[valor]
supabase secrets set ABACATEPAY_API_URL=[valor]
supabase secrets set ABACATEPAY_WEBHOOK_SECRET=[valor]

# Verificar
supabase secrets list
\`\`\`

### 7. Atualizar Frontend

1. Atualize as credenciais do Supabase no código:
   - Nova URL: \`https://[NOVO_PROJECT_ID].supabase.co\`
   - Nova chave anon: (encontre em Settings > API)

2. Atualize o arquivo de configuração ou variáveis de ambiente

3. Recompile o frontend se necessário

### 8. Verificações Finais

- [ ] Testar autenticação
- [ ] Testar criação de compra
- [ ] Testar pagamento PIX
- [ ] Testar pagamento Cartão
- [ ] Testar confirmação de pagamento
- [ ] Testar envio de WhatsApp
- [ ] Verificar logs de Edge Functions
- [ ] Verificar políticas RLS
- [ ] Testar acesso aos cursos

---

## 📚 Recursos Úteis

- **Documentação Supabase CLI**: https://supabase.com/docs/reference/cli
- **Migrations Guide**: https://supabase.com/docs/guides/cli/local-development#database-migrations
- **Edge Functions**: https://supabase.com/docs/guides/functions

---

## ⚠️ Importante

1. **Sempre faça backup** antes de aplicar migrations
2. **Teste em ambiente de desenvolvimento** primeiro
3. **Verifique as políticas RLS** após migrar
4. **Atualize webhooks** do AbacatePay para apontar para o novo projeto
5. **Atualize URLs** em outros serviços que usam o Supabase

---

## 🆘 Problemas Comuns

### Erro ao aplicar migrations

- Verifique se o banco está vazio ou se há conflitos
- Use \`supabase db reset\` com cuidado (apaga tudo!)

### Edge Functions não funcionam

- Verifique se os secrets estão configurados
- Verifique os logs: \`supabase functions logs [nome]\`

### RLS bloqueando acesso

- Verifique as políticas RLS no Dashboard
- Use \`ALTER TABLE [tabela] DISABLE ROW LEVEL SECURITY;\` temporariamente para debug

---

**Boa migração! 🚀**

`;

  const guideFile = 'supabase-export/GUIA_MIGRACAO.md';
  fs.writeFileSync(guideFile, guide);
  log(`✅ Guia de migração criado: ${guideFile}`, 'green');
  
  return guideFile;
}

// Função principal
function main() {
  log('\n🚀 Iniciando extração do projeto Supabase...\n', 'cyan');
  
  // Verificar CLI
  if (!checkSupabaseCLI()) {
    process.exit(1);
  }

  // Criar estrutura
  createFolderStructure();

  // Project ID atual
  const projectRef = 'qxgzazewwutbikmmpkms';
  
  // Extrair schema
  extractDatabaseSchema(projectRef);
  generateSchemaExtractionScript();
  
  // Extrair Edge Functions
  extractEdgeFunctions(projectRef);
  
  // Criar guia
  createMigrationGuide(projectRef);
  
  log('\n✅ Extração concluída!', 'green');
  log('\n📋 Próximos passos:', 'cyan');
  log('1. Execute o script SQL no Dashboard para extrair o schema completo', 'yellow');
  log('2. Baixe as Edge Functions manualmente ou via CLI', 'yellow');
  log('3. Siga o guia: supabase-export/GUIA_MIGRACAO.md', 'yellow');
  log('\n');
}

// Executar
if (require.main === module) {
  main();
}

module.exports = { main };


