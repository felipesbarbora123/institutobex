// Script para remover todas as referências ao Supabase do código compilado
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');
const indexFile = path.join(assetsDir, 'index-DZwxJa6p.js');

console.log('🔍 Procurando arquivo compilado...');

// Verificar se o arquivo existe
if (!fs.existsSync(indexFile)) {
  console.error('❌ Arquivo não encontrado:', indexFile);
  console.log('📁 Procurando arquivos index-*.js em assets/...');
  
  const files = fs.readdirSync(assetsDir).filter(f => f.startsWith('index-') && f.endsWith('.js'));
  if (files.length === 0) {
    console.error('❌ Nenhum arquivo index-*.js encontrado em assets/');
    process.exit(1);
  }
  
  console.log('✅ Arquivos encontrados:', files);
  console.log('⚠️ Por favor, atualize o nome do arquivo no script ou use o primeiro arquivo encontrado');
  
  // Usar o primeiro arquivo encontrado
  const firstFile = files[0];
  console.log(`📝 Usando arquivo: ${firstFile}`);
  
  const filePath = path.join(assetsDir, firstFile);
  processFile(filePath);
} else {
  processFile(indexFile);
}

function processFile(filePath) {
  console.log(`\n📖 Lendo arquivo: ${filePath}`);
  
  // Ler o arquivo
  let content = fs.readFileSync(filePath, 'utf8');
  const originalSize = content.length;
  console.log(`📊 Tamanho original: ${(originalSize / 1024).toFixed(2)} KB`);
  
  // Fazer backup
  const backupPath = filePath + '.backup';
  fs.writeFileSync(backupPath, content, 'utf8');
  console.log(`💾 Backup criado: ${backupPath}`);
  
  // Processar também arquivos Profile-*.js se estivermos processando index-*.js
  if (filePath.includes('index-')) {
    const assetsDir = path.dirname(filePath);
    const profileFiles = fs.readdirSync(assetsDir).filter(f => f.startsWith('Profile-') && f.endsWith('.js'));
    if (profileFiles.length > 0) {
      console.log(`\n📁 Arquivos Profile encontrados: ${profileFiles.join(', ')}`);
      profileFiles.forEach(profileFile => {
        const profilePath = path.join(assetsDir, profileFile);
        console.log(`\n📖 Processando também: ${profilePath}`);
        processFile(profilePath);
      });
    }
  }
  
  // Substituições para remover referências ao Supabase
  const replacements = [
    // IMPORTANTE: Substituir useUser() do Supabase por window._useAuth() ou window.useAuth()
    // O componente Profile usa ie() que provavelmente é useUser() do Supabase
    // Padrão: {user:r,loading:y}=ie() ou const {user,loading}=useUser()
    {
      pattern: /\{user:([a-zA-Z_$][a-zA-Z0-9_$]*),loading:([a-zA-Z_$][a-zA-Z0-9_$]*)\}=ie\(\)/g,
      replacement: (match, userVar, loadingVar) => {
        return `{user:${userVar},loading:${loadingVar}}=window._useAuth?window._useAuth():window.useAuth?window.useAuth():{user:null,loading:true}`;
      },
      description: 'useUser() do Supabase (ie()) no Profile'
    },
    {
      pattern: /\{user:([a-zA-Z_$][a-zA-Z0-9_$]*),loading:([a-zA-Z_$][a-zA-Z0-9_$]*)\}=useUser\(\)/g,
      replacement: (match, userVar, loadingVar) => {
        return `{user:${userVar},loading:${loadingVar}}=window._useAuth?window._useAuth():window.useAuth?window.useAuth():{user:null,loading:true}`;
      },
      description: 'useUser() do Supabase explícito'
    },
    {
      pattern: /const\s*\{user:([a-zA-Z_$][a-zA-Z0-9_$]*),loading:([a-zA-Z_$][a-zA-Z0-9_$]*)\}\s*=\s*ie\(\)/g,
      replacement: (match, userVar, loadingVar) => {
        return `const {user:${userVar},loading:${loadingVar}}=window._useAuth?window._useAuth():window.useAuth?window.useAuth():{user:null,loading:true}`;
      },
      description: 'useUser() do Supabase (ie()) com const'
    },
    {
      pattern: /const\s*\{user:([a-zA-Z_$][a-zA-Z0-9_$]*),loading:([a-zA-Z_$][a-zA-Z0-9_$]*)\}\s*=\s*useUser\(\)/g,
      replacement: (match, userVar, loadingVar) => {
        return `const {user:${userVar},loading:${loadingVar}}=window._useAuth?window._useAuth():window.useAuth?window.useAuth():{user:null,loading:true}`;
      },
      description: 'useUser() do Supabase explícito com const'
    },
    // URLs do Supabase
    {
      pattern: /https?:\/\/[^"'\s]*supabase\.co[^"'\s]*/gi,
      replacement: 'http://localhost:3000/api',
      description: 'URLs do Supabase'
    },
    {
      pattern: /qxgzazewwutbikmmpkms/gi,
      replacement: 'localhost',
      description: 'ID do projeto Supabase'
    },
    // Referências ao createClient do Supabase
    {
      pattern: /createClient\([^)]*\)/g,
      replacement: 'createClient()',
      description: 'Chamadas createClient do Supabase'
    },
    // Referências a @supabase
    {
      pattern: /@supabase\/[^"'\s]+/gi,
      replacement: '',
      description: 'Imports do Supabase'
    },
    // Qualquer referência restante a "supabase" (case insensitive)
    {
      pattern: /["']([^"']*)?supabase([^"']*)?["']/gi,
      replacement: (match) => {
        // Se a string contém apenas "supabase", remover completamente
        if (match.toLowerCase().replace(/["']/g, '').trim() === 'supabase') {
          return '""';
        }
        // Caso contrário, remover apenas a palavra "supabase"
        return match.replace(/supabase/gi, '');
      },
      description: 'Strings contendo "supabase"'
    },
    // Qualquer ocorrência restante da palavra "supabase" (não em strings)
    {
      pattern: /\bsupabase\b/gi,
      replacement: 'backend',
      description: 'Palavra "supabase" restante'
    },
    // Substituir "supabaseKey" por "backendKey"
    {
      pattern: /\bsupabaseKey\b/gi,
      replacement: 'backendKey',
      description: 'Variável supabaseKey'
    },
    // Substituir qualquer referência a "supabase" em qualquer contexto
    {
      pattern: /supabase/gi,
      replacement: 'backend',
      description: 'Qualquer referência restante a "supabase"'
    },
    // Referências em propriedades de objeto
    {
      pattern: /\.supabase\b/gi,
      replacement: '',
      description: 'Propriedades .supabase'
    },
    {
      pattern: /\bsupabase\s*[:=]/gi,
      replacement: 'backend:',
      description: 'Variáveis/objetos chamados supabase'
    }
  ];
  
  let totalReplacements = 0;
  
  console.log('\n🔄 Aplicando substituições...');
  
  for (const { pattern, replacement, description } of replacements) {
    const matches = content.match(pattern);
    if (matches) {
      const count = matches.length;
      content = content.replace(pattern, replacement);
      totalReplacements += count;
      console.log(`  ✅ ${description}: ${count} ocorrência(s) substituída(s)`);
    } else {
      console.log(`  ⚠️ ${description}: nenhuma ocorrência encontrada`);
    }
  }
  
  const newSize = content.length;
  const sizeDiff = originalSize - newSize;
  
  console.log(`\n📊 Resultado:`);
  console.log(`  Tamanho original: ${(originalSize / 1024).toFixed(2)} KB`);
  console.log(`  Tamanho novo: ${(newSize / 1024).toFixed(2)} KB`);
  console.log(`  Diferença: ${(sizeDiff / 1024).toFixed(2)} KB`);
  console.log(`  Total de substituições: ${totalReplacements}`);
  
  if (totalReplacements > 0) {
    // Salvar arquivo modificado
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`\n✅ Arquivo modificado salvo: ${filePath}`);
    console.log(`💡 Backup original disponível em: ${backupPath}`);
  } else {
    console.log(`\n⚠️ Nenhuma substituição foi feita. O arquivo pode não conter referências ao Supabase ou já foi modificado.`);
    console.log(`💡 Se você quiser restaurar o backup, execute:`);
    console.log(`   copy "${backupPath}" "${filePath}"`);
  }
  
  console.log('\n✅ Processo concluído!');
}

