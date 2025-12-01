#!/usr/bin/env node

/**
 * Script para importar dados do Supabase
 * 
 * Este script:
 * 1. Conecta ao banco PostgreSQL
 * 2. Executa o script SQL de dados
 * 3. Verifica se os dados foram importados
 * 
 * Uso:
 *   node scripts/import-data.js
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

// Configuração do banco
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
    const result = await pool.query('SELECT NOW() as current_time');
    log('✅ Conectado ao PostgreSQL!', 'green');
    return true;
  } catch (error) {
    log(`❌ Erro ao conectar: ${error.message}`, 'red');
    return false;
  }
}

async function createUsers() {
  const usersPath = path.join(__dirname, '../data/usuarios-para-criar.sql');
  
  if (!fs.existsSync(usersPath)) {
    log('   ⚠️  Arquivo de usuários não encontrado, pulando criação', 'yellow');
    return true;
  }

  log('\n👤 Criando usuários necessários...', 'blue');
  const usersSQL = fs.readFileSync(usersPath, 'utf8');

  try {
    await pool.query(usersSQL);
    log('   ✅ Usuários criados (senhas precisam ser resetadas)', 'green');
    return true;
  } catch (error) {
    const errorMsg = error.message.split('\n')[0];
    
    if (error.message.includes('already exists') || 
        error.message.includes('duplicate') ||
        error.message.includes('violates unique constraint')) {
      log('   ⚠️  Alguns usuários já existem', 'yellow');
      return true;
    }
    
    log(`   ⚠️  Erro ao criar usuários: ${errorMsg}`, 'yellow');
    return false;
  }
}

async function importData() {
  const dataPath = path.join(__dirname, '../data/dados-importados.sql');
  
  if (!fs.existsSync(dataPath)) {
    log(`❌ Arquivo de dados não encontrado: ${dataPath}`, 'red');
    return false;
  }

  log('\n📄 Lendo arquivo de dados...', 'blue');
  const dataSQL = fs.readFileSync(dataPath, 'utf8');

  log('\n🚀 Importando dados...', 'blue');
  
  // Dividir por blocos de INSERT (cada INSERT é um comando separado)
  // Usar regex para encontrar todos os comandos INSERT
  const insertRegex = /INSERT INTO[\s\S]*?(?=INSERT INTO|$)/gi;
  const insertBlocks = dataSQL.match(insertRegex) || [];
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < insertBlocks.length; i++) {
    let block = insertBlocks[i].trim();
    if (!block || block.startsWith('--')) continue;

    // Remover comentários do final
    block = block.replace(/--.*$/gm, '').trim();
    
    // Remover ponto e vírgula final se houver
    block = block.replace(/;\s*$/, '');
    
    if (!block || block.length < 10) continue;

    const fullCommand = block;
    
    // Extrair nome da tabela para log
    const tableMatch = fullCommand.match(/INSERT INTO\s+(\w+)/i);
    const tableName = tableMatch ? tableMatch[1] : 'unknown';

    try {
      await pool.query(fullCommand);
      successCount++;
      log(`   ✅ ${tableName}: dados inseridos`, 'green');
    } catch (error) {
      errorCount++;
      const errorMsg = error.message.split('\n')[0];
      
      // Ignorar erros de duplicação (esperado)
      if (error.message.includes('already exists') || 
          error.message.includes('duplicate') ||
          error.message.includes('violates unique constraint') ||
          error.message.includes('viola restrição de unicidade')) {
        // Silenciar - é esperado com ON CONFLICT
        continue;
      }
      
      // Ignorar erros de foreign key se a tabela ainda não foi criada
      if (error.message.includes('viola restrição de chave estrangeira') ||
          error.message.includes('violates foreign key constraint')) {
        log(`   ⚠️  ${tableName}: aguardando dependências (será inserido depois)`, 'yellow');
        errors.push({ table: tableName, error: errorMsg });
        continue;
      }
      
      errors.push({ table: tableName, error: errorMsg });
      log(`   ⚠️  ${tableName}: ${errorMsg}`, 'yellow');
    }
  }

  // Tentar novamente os que falharam por dependências
  if (errors.length > 0) {
    log('\n🔄 Tentando novamente registros com dependências...', 'blue');
    
    for (const err of errors) {
      const block = insertBlocks.find(b => b.includes(`INSERT INTO ${err.table}`));
      if (block) {
        try {
          await pool.query('INSERT INTO' + block.trim());
          log(`   ✅ ${err.table}: inserido na segunda tentativa`, 'green');
        } catch (retryError) {
          if (!retryError.message.includes('duplicate') && 
              !retryError.message.includes('violates unique constraint')) {
            log(`   ⚠️  ${err.table}: ainda com erro`, 'yellow');
          }
        }
      }
    }
  }

  log(`\n📊 Resumo:`, 'blue');
  log(`   ✅ Comandos executados: ${successCount}`, 'green');
  if (errorCount > 0) {
    log(`   ⚠️  Comandos com erro (ignorados): ${errorCount}`, 'yellow');
  }

  return true;
}

async function verifyData() {
  log('\n🔍 Verificando dados importados...', 'blue');
  
  const tables = [
    { name: 'courses', expected: 3 },
    { name: 'lessons', expected: 1 },
    { name: 'profiles', expected: 2 },
    { name: 'user_roles', expected: 1 },
    { name: 'course_enrollments', expected: 4 },
    { name: 'lesson_progress', expected: 1 },
    { name: 'course_purchases', expected: 10 },
    { name: 'certificates', expected: 1 },
  ];

  for (const table of tables) {
    try {
      const result = await pool.query(`SELECT COUNT(*) as count FROM ${table.name}`);
      const count = parseInt(result.rows[0].count);
      
      if (count > 0) {
        log(`   ✅ ${table.name}: ${count} registro(s)`, 'green');
      } else {
        log(`   ⚠️  ${table.name}: 0 registros`, 'yellow');
      }
    } catch (error) {
      log(`   ❌ Erro ao verificar ${table.name}: ${error.message}`, 'red');
    }
  }
}

async function checkUsers() {
  log('\n🔍 Verificando usuários necessários...', 'blue');
  
  // IDs de usuários que aparecem nos dados
  const userIds = [
    'e7b2726a-ed65-4773-83c3-e3d128a00484',
    '9af42be6-0f2b-49ee-965e-decc4079bfbe',
    'be05d28e-a996-4e75-b38c-ec25db1f8922',
    '5ed39a37-51a8-43f4-b22c-2d6965efe6f7',
  ];

  log('   ⚠️  ATENÇÃO: Os seguintes usuários precisam existir em auth.users:', 'yellow');
  log('      (Criar via API de registro ou inserir manualmente)', 'yellow');
  
  for (const userId of userIds) {
    try {
      const result = await pool.query('SELECT id, email FROM auth.users WHERE id = $1', [userId]);
      if (result.rows.length > 0) {
        log(`   ✅ Usuário ${userId}: ${result.rows[0].email || 'sem email'}`, 'green');
      } else {
        log(`   ⚠️  Usuário ${userId}: NÃO ENCONTRADO`, 'yellow');
      }
    } catch (error) {
      log(`   ❌ Erro ao verificar usuário ${userId}: ${error.message}`, 'red');
    }
  }
}

async function main() {
  log('\n========================================', 'cyan');
  log('  IMPORTAR DADOS - INSTITUTO BEX', 'cyan');
  log('========================================', 'cyan');

  try {
    // 1. Testar conexão
    const connected = await testConnection();
    if (!connected) {
      process.exit(1);
    }

    // 2. Criar usuários primeiro
    await createUsers();
    
    // 3. Importar dados
    const importSuccess = await importData();
    
    // 4. Verificar dados
    await verifyData();
    
    // 5. Verificar usuários
    await checkUsers();

    if (importSuccess) {
      log('\n✅ Dados importados com sucesso!', 'green');
      log('\n📋 Próximos passos:', 'blue');
      log('   1. Crie os usuários em auth.users (se necessário)', 'yellow');
      log('   2. Verifique se todas as referências estão corretas', 'yellow');
      log('   3. Teste o backend: npm start', 'yellow');
    } else {
      log('\n⚠️  Importação concluída com alguns erros', 'yellow');
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

