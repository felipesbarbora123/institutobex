// Servidor HTTP simples para servir os arquivos estáticos do projeto
// Compatível com Node.js

// Carregar variáveis de ambiente (opcional - requer npm install dotenv)
try {
  require('dotenv').config();
} catch (e) {
  // dotenv não instalado, continuar sem ele
  console.log('💡 Dica: Instale dotenv (npm install dotenv) para usar arquivo .env');
}

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const whatsappAPI = require('./whatsapp-api');

const PORT = 3000;
const PUBLIC_DIR = __dirname;

// Mapeamento de tipos MIME
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain',
  '.xml': 'application/xml'
};

// Configurar servidor com limite maior de headers (para evitar erro 431)
const server = http.createServer({
  maxHeaderSize: 16384 // 16KB (padrão é 8KB)
}, async (req, res) => {
  // Configurar CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Tratar requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  // Parse da URL
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // ============================================
  // API ENDPOINTS
  // ============================================
  
  // Endpoint: /api/whatsapp/send
  if (pathname === '/api/whatsapp/send' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const result = await whatsappAPI.sendContactNotification(data);
        
        res.writeHead(200, {
          ...corsHeaders,
          'Content-Type': 'application/json'
        });
        res.end(JSON.stringify({ success: true, data: result }));
      } catch (error) {
        console.error('Erro ao enviar WhatsApp:', error);
        res.writeHead(500, {
          ...corsHeaders,
          'Content-Type': 'application/json'
        });
        res.end(JSON.stringify({ 
          success: false, 
          error: error.message 
        }));
      }
    });
    return;
  }

  // Endpoint: /api/whatsapp/status
  if (pathname === '/api/whatsapp/status' && req.method === 'GET') {
    try {
      const status = await whatsappAPI.checkInstanceStatus();
      res.writeHead(200, {
        ...corsHeaders,
        'Content-Type': 'application/json'
      });
      res.end(JSON.stringify({ success: true, data: status }));
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      res.writeHead(500, {
        ...corsHeaders,
        'Content-Type': 'application/json'
      });
      res.end(JSON.stringify({ 
        success: false, 
        error: error.message 
      }));
    }
    return;
  }

  // Endpoint: /api/whatsapp/payment-confirmed
  if (pathname === '/api/whatsapp/payment-confirmed' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        
        // Validar dados obrigatórios
        if (!data.name || !data.phone) {
          res.writeHead(400, {
            ...corsHeaders,
            'Content-Type': 'application/json'
          });
          res.end(JSON.stringify({ 
            success: false, 
            error: 'Nome e telefone são obrigatórios' 
          }));
          return;
        }

        console.log(`📱 [PAYMENT] Enviando notificação de pagamento confirmado para ${data.phone}`);
        const result = await whatsappAPI.sendPaymentConfirmation({
          name: data.name,
          phone: data.phone,
          courseTitle: data.courseTitle || null,
          amount: data.amount || null
        });
        
        res.writeHead(200, {
          ...corsHeaders,
          'Content-Type': 'application/json'
        });
        res.end(JSON.stringify({ 
          success: true, 
          message: 'Notificação de pagamento enviada com sucesso',
          data: result 
        }));
      } catch (error) {
        console.error('❌ [PAYMENT] Erro ao enviar notificação de pagamento:', error);
        res.writeHead(500, {
          ...corsHeaders,
          'Content-Type': 'application/json'
        });
        res.end(JSON.stringify({ 
          success: false, 
          error: error.message 
        }));
      }
    });
    return;
  }

  // ============================================
  // SERVIDOR DE ARQUIVOS ESTÁTICOS
  // ============================================

  // Se for rota raiz ou não tiver extensão, servir index.html (SPA)
  if (pathname === '/' || !path.extname(pathname)) {
    pathname = '/index.html';
  }

  // Caminho completo do arquivo
  const filePath = path.join(PUBLIC_DIR, pathname);

  // Verificar se o arquivo existe
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // Se não existir, servir index.html (para rotas do SPA)
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(indexPath, 'utf8', (err, data) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 - Arquivo não encontrado');
          return;
        }
        
        // Injetar substituição completa do Supabase, overlay e ajuste de espaçamento
        const replacementPath = path.join(__dirname, 'supabase-replacement.js');
        const overlayPath = path.join(__dirname, 'payment-success-overlay.js');
        const spacingPath = path.join(__dirname, 'checkout-form-spacing.js');
        try {
          const replacementCode = fs.readFileSync(replacementPath, 'utf8');
          let overlayCode = '';
          let spacingCode = '';
          try {
            overlayCode = fs.readFileSync(overlayPath, 'utf8');
          } catch (e) {}
          try {
            spacingCode = fs.readFileSync(spacingPath, 'utf8');
          } catch (e) {}
          
          // Injetar o replacement ANTES de qualquer coisa (logo após <head>)
          // Isso garante que ele seja executado antes do código compilado
          let modifiedHtml = data.toString();
          
          // Criar scripts com escape adequado de </script>
          // Não usar escape HTML, apenas escapar </script> dentro do código JS
          const escapeScriptTag = (code) => {
            if (!code) return '';
            // Escapar </script> para evitar que o navegador interprete como fim do script
            return code.replace(/<\/script>/gi, '<\\/script>');
          };
          
          // Garantir que os códigos não estão vazios
          const safeReplacementCode = replacementCode || '';
          const safeOverlayCode = overlayCode || '';
          const safeSpacingCode = spacingCode || '';
          
          const replacementScript = safeReplacementCode ? `<script>${escapeScriptTag(safeReplacementCode)}</script>` : '';
          const overlayScript = safeOverlayCode ? `<script>${escapeScriptTag(safeOverlayCode)}</script>` : '';
          const spacingScript = safeSpacingCode ? `<script>${escapeScriptTag(safeSpacingCode)}</script>` : '';
          
          const allScripts = [replacementScript, overlayScript, spacingScript].filter(Boolean).join('\n    ');
          
          // Injetar logo após <head> para garantir execução antes de tudo
          if (modifiedHtml.includes('<head>')) {
            modifiedHtml = modifiedHtml.replace(
              '<head>',
              `<head>\n    ${allScripts}`
            );
          } else if (modifiedHtml.includes('<head ')) {
            // Se head tem atributos, inserir após a tag completa
            modifiedHtml = modifiedHtml.replace(
              /(<head[^>]*>)/,
              `$1\n    ${allScripts}`
            );
          } else {
            // Fallback: inserir antes do script principal
            modifiedHtml = modifiedHtml.replace(
              '<script type="module" crossorigin src="/assets/index-',
              `${allScripts}\n    <script type="module" crossorigin src="/assets/index-`
            );
          }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(modifiedHtml);
        } catch (interceptorErr) {
          // Se não conseguir ler o interceptor, servir HTML original
          console.warn('⚠️ Não foi possível carregar interceptor:', interceptorErr.message);
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        }
      });
      return;
    }

    // Ler e servir o arquivo
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 - Erro interno do servidor');
        return;
      }

      // Determinar tipo MIME
      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      // Se for index.html, injetar substituição completa do Supabase
      if (pathname === '/index.html' && contentType === 'text/html') {
        const replacementPath = path.join(__dirname, 'supabase-replacement.js');
        try {
          const replacementCode = fs.readFileSync(replacementPath, 'utf8');
          const htmlContent = data.toString('utf8');
          // Inserir o replacement, overlay de sucesso e ajuste de espaçamento antes do script principal
          const overlayPath = path.join(__dirname, 'payment-success-overlay.js');
          const spacingPath = path.join(__dirname, 'checkout-form-spacing.js');
          let overlayCode = '';
          let spacingCode = '';
          try {
            overlayCode = fs.readFileSync(overlayPath, 'utf8');
          } catch (e) {
            console.warn('⚠️ Não foi possível carregar payment-success-overlay.js');
          }
          try {
            spacingCode = fs.readFileSync(spacingPath, 'utf8');
          } catch (e) {
            console.warn('⚠️ Não foi possível carregar checkout-form-spacing.js');
          }
          
          // Escapar </script> para evitar que o navegador interprete como fim do script
          const escapeScriptTag = (code) => {
            if (!code) return '';
            return code.replace(/<\/script>/gi, '<\\/script>');
          };
          
          const scripts = [
            `<script>${escapeScriptTag(replacementCode)}</script>`,
            overlayCode ? `<script>${escapeScriptTag(overlayCode)}</script>` : '',
            spacingCode ? `<script>${escapeScriptTag(spacingCode)}</script>` : ''
          ].filter(Boolean).join('\n    ');
          
          const modifiedHtml = htmlContent.replace(
            '<script type="module" crossorigin src="/assets/index-',
            `${scripts}\n    <script type="module" crossorigin src="/assets/index-`
          );
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(modifiedHtml);
          return;
        } catch (interceptorErr) {
          // Se não conseguir ler o interceptor, servir HTML original
          console.warn('⚠️ Não foi possível carregar interceptor:', interceptorErr.message);
        }
      }

      // Headers CORS (caso precise)
      const headers = {
        'Content-Type': contentType
      };

      // Cache para assets estáticos
      if (ext === '.js' || ext === '.css' || ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
        headers['Cache-Control'] = 'public, max-age=31536000';
      }

      res.writeHead(200, headers);
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log('\n========================================');
  console.log('🚀 Servidor iniciado com sucesso!');
  console.log('========================================');
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📁 Diretório: ${PUBLIC_DIR}`);
  console.log('========================================');
  console.log('\n⚠️  IMPORTANTE:');
  console.log('Este projeto requer configuração do Supabase para funcionar completamente.');
  console.log('Verifique o arquivo README.md para mais informações.\n');
  console.log('Pressione Ctrl+C para parar o servidor.\n');
});

