#!/usr/bin/env node

/**
 * Script para adaptar o schema do Supabase para o backend interno
 * 
 * Este script:
 * 1. Lê o script SQL do backup do Supabase
 * 2. Adapta para funcionar com o backend
 * 3. Gera um novo script SQL adaptado
 * 
 * Uso:
 *   node scripts/adapt-schema.js <arquivo-backup.sql> <arquivo-saida.sql>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function adaptSchema(inputFile, outputFile) {
  console.log('🔄 Adaptando schema do Supabase...\n');

  // Ler arquivo de entrada
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Arquivo não encontrado: ${inputFile}`);
    process.exit(1);
  }

  let sql = fs.readFileSync(inputFile, 'utf8');

  console.log('📝 Aplicando adaptações...\n');

  // 1. Garantir que existe schema auth
  if (!sql.includes('CREATE SCHEMA IF NOT EXISTS auth')) {
    sql = `-- Criar schema auth se não existir\nCREATE SCHEMA IF NOT EXISTS auth;\n\n${sql}`;
  }

  // 2. Adaptar referências de tabelas
  // Se o backup não tiver auth.users, criar estrutura compatível
  if (!sql.includes('CREATE TABLE') && sql.includes('auth.users')) {
    // Adicionar criação da tabela se não existir
    const createAuthUsers = `
-- Criar tabela auth.users se não existir
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  encrypted_password VARCHAR(255) NOT NULL,
  email_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_users_email ON auth.users(email);
`;
    sql = `${createAuthUsers}\n\n${sql}`;
  }

  // 3. Garantir extensões necessárias
  if (!sql.includes('CREATE EXTENSION IF NOT EXISTS')) {
    const extensions = `
-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
`;
    sql = `${extensions}\n\n${sql}`;
  }

  // 4. Garantir tabelas essenciais existem
  const essentialTables = [
    {
      name: 'profiles',
      sql: `
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`
    },
    {
      name: 'courses',
      sql: `
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`
    },
    {
      name: 'course_enrollments',
      sql: `
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);
`
    },
    {
      name: 'course_purchases',
      sql: `
CREATE TABLE IF NOT EXISTS course_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  external_id VARCHAR(255) UNIQUE,
  billing_id VARCHAR(255),
  payment_method VARCHAR(50),
  customer_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`
    },
    {
      name: 'user_roles',
      sql: `
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
`
    },
    {
      name: 'webhook_logs',
      sql: `
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(255),
  payload JSONB,
  status VARCHAR(50),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`
    },
    {
      name: 'whatsapp_logs',
      sql: `
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(50),
  message TEXT,
  status VARCHAR(50),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`
    }
  ];

  // Verificar e adicionar tabelas que não existem
  essentialTables.forEach(table => {
    if (!sql.includes(`CREATE TABLE`) || !sql.includes(table.name)) {
      console.log(`  ✅ Adicionando tabela: ${table.name}`);
      sql = `${sql}\n\n-- Tabela ${table.name}\n${table.sql}`;
    }
  });

  // 5. Adicionar índices úteis
  const indexes = `
-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_purchases_user_id ON course_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_course_purchases_external_id ON course_purchases(external_id);
CREATE INDEX IF NOT EXISTS idx_course_purchases_billing_id ON course_purchases(billing_id);
CREATE INDEX IF NOT EXISTS idx_course_purchases_status ON course_purchases(payment_status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_phone ON whatsapp_logs(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created_at ON whatsapp_logs(created_at);
`;

  if (!sql.includes('idx_course_enrollments_user_id')) {
    sql = `${sql}\n\n${indexes}`;
  }

  // 6. Remover políticas RLS do Supabase (opcional - comentar ao invés de remover)
  // Manter comentado caso queira usar depois
  sql = sql.replace(
    /CREATE POLICY/g,
    '-- CREATE POLICY (RLS desabilitado - usar autenticação JWT no backend)'
  );

  // 7. Adicionar comentários úteis
  const header = `-- ============================================
-- SCHEMA ADAPTADO DO SUPABASE PARA BACKEND INTERNO
-- Data: ${new Date().toISOString()}
-- ============================================
-- 
-- Este schema foi adaptado para funcionar com o backend Node.js/Express
-- que substitui o Supabase.
--
-- Principais mudanças:
-- - Mantida estrutura auth.users para compatibilidade
-- - Tabelas essenciais garantidas
-- - RLS desabilitado (autenticação via JWT no backend)
-- - Índices adicionados para performance
--
-- ============================================

`;

  sql = `${header}${sql}`;

  // Salvar arquivo de saída
  fs.writeFileSync(outputFile, sql, 'utf8');

  console.log(`\n✅ Schema adaptado com sucesso!`);
  console.log(`📄 Arquivo salvo em: ${outputFile}\n`);
  console.log('📋 Próximos passos:');
  console.log('  1. Revise o arquivo adaptado');
  console.log('  2. Execute no PostgreSQL: psql -U postgres -d institutobex < arquivo-adaptado.sql');
  console.log('  3. Verifique se todas as tabelas foram criadas\n');
}

// Executar
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Uso: node scripts/adapt-schema.js <arquivo-backup.sql> <arquivo-saida.sql>');
  process.exit(1);
}

const [inputFile, outputFile] = args;

// Resolver caminhos relativos
const inputPath = path.isAbsolute(inputFile) ? inputFile : path.join(process.cwd(), inputFile);
const outputPath = path.isAbsolute(outputFile) ? outputFile : path.join(process.cwd(), outputFile);

adaptSchema(inputPath, outputPath);

