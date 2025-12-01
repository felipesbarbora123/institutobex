#!/usr/bin/env node

/**
 * Script para executar migrations no banco de dados
 * 
 * Este script:
 * 1. Conecta ao banco PostgreSQL
 * 2. Executa o schema SQL completo
 * 3. Verifica se as tabelas foram criadas
 * 
 * Uso:
 *   node scripts/run-migrations.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do banco (usando valores padrão locais)
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'institutobex',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  ssl: false,
});

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

async function testConnection() {
  try {
    log('\n🔌 Testando conexão com o banco de dados...', 'blue');
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    log('✅ Conectado ao PostgreSQL!', 'green');
    log(`   Versão: ${result.rows[0].pg_version.split(',')[0]}`, 'cyan');
    log(`   Hora atual: ${result.rows[0].current_time}`, 'cyan');
    return true;
  } catch (error) {
    log(`❌ Erro ao conectar: ${error.message}`, 'red');
    return false;
  }
}

async function checkDatabaseExists() {
  try {
    const result = await pool.query('SELECT current_database() as db_name');
    log(`📊 Banco de dados: ${result.rows[0].db_name}`, 'cyan');
    return true;
  } catch (error) {
    log(`❌ Erro ao verificar banco: ${error.message}`, 'red');
    return false;
  }
}

async function executeSchema() {
  const schemaPath = path.join(__dirname, '../schema/schema-completo-adaptado.sql');
  
  if (!fs.existsSync(schemaPath)) {
    log(`❌ Arquivo de schema não encontrado: ${schemaPath}`, 'red');
    return false;
  }

  log('\n📄 Lendo arquivo de schema...', 'blue');
  const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

  log('\n🚀 Executando migrations...', 'blue');
  
  try {
    // Executar o SQL completo de uma vez
    // O PostgreSQL pode executar múltiplos comandos separados por ;
    await pool.query(schemaSQL);
    
    log('   ✅ Schema executado com sucesso!', 'green');
    return true;
  } catch (error) {
    const errorMsg = error.message.split('\n')[0];
    
    // Ignorar erros de "já existe" (IF NOT EXISTS)
    if (error.message.includes('already exists') || 
        error.message.includes('duplicate') ||
        error.message.includes('já existe')) {
      log('   ⚠️  Alguns objetos já existem (esperado com IF NOT EXISTS)', 'yellow');
      return true; // Não é um erro crítico
    }
    
    log(`   ❌ Erro ao executar schema: ${errorMsg}`, 'red');
    log(`   Detalhes: ${error.message}`, 'yellow');
    return false;
  }
}

async function verifyTables() {
  log('\n🔍 Verificando tabelas criadas...', 'blue');
  
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema IN ('public', 'auth')
      ORDER BY table_schema, table_name
    `);

    if (result.rows.length === 0) {
      log('   ⚠️  Nenhuma tabela encontrada', 'yellow');
      return false;
    }

    log(`   ✅ Encontradas ${result.rows.length} tabelas:`, 'green');
    result.rows.forEach(row => {
      log(`      - ${row.table_name}`, 'cyan');
    });

    return true;
  } catch (error) {
    log(`   ❌ Erro ao verificar tabelas: ${error.message}`, 'red');
    return false;
  }
}

async function verifyFunctions() {
  log('\n🔍 Verificando funções criadas...', 'blue');
  
  try {
    const result = await pool.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
      AND routine_type = 'FUNCTION'
      ORDER BY routine_name
    `);

    if (result.rows.length > 0) {
      log(`   ✅ Encontradas ${result.rows.length} funções:`, 'green');
      result.rows.forEach(row => {
        log(`      - ${row.routine_name}`, 'cyan');
      });
    }

    return true;
  } catch (error) {
    log(`   ⚠️  Erro ao verificar funções: ${error.message}`, 'yellow');
    return false;
  }
}

async function main() {
  log('\n========================================', 'cyan');
  log('  EXECUTAR MIGRATIONS - INSTITUTO BEX', 'cyan');
  log('========================================', 'cyan');

  try {
    // 1. Testar conexão
    const connected = await testConnection();
    if (!connected) {
      process.exit(1);
    }

    // 2. Verificar banco
    await checkDatabaseExists();

    // 3. Executar schema
    const schemaSuccess = await executeSchema();
    
    // 4. Verificar tabelas
    await verifyTables();
    
    // 5. Verificar funções
    await verifyFunctions();

    if (schemaSuccess) {
      log('\n✅ Migrations executadas com sucesso!', 'green');
      log('\n📋 Próximos passos:', 'blue');
      log('   1. Verifique se todas as tabelas foram criadas', 'yellow');
      log('   2. Configure as variáveis de ambiente no .env', 'yellow');
      log('   3. Inicie o servidor: npm start', 'yellow');
    } else {
      log('\n⚠️  Migrations executadas com alguns erros', 'yellow');
      log('   Revise os erros acima e corrija se necessário', 'yellow');
    }

  } catch (error) {
    log(`\n❌ Erro fatal: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar
main();

