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
  // PROXY PARA BACKEND REMOTO (para evitar CORS)
  // ============================================
  const BACKEND_URL = 'http://46.224.47.128:3001';
  
  // Mapeamento de funções Supabase Edge Functions para endpoints do backend
  const FUNCTION_MAP = {
    'create-purchase': '/api/purchases',
    'create-payment-pix': '/api/purchases/payment/pix',
    'create-payment-card': '/api/purchases/payment/card',
    'abacatepay-check-status': '/api/purchases/payment/status',
    'confirm-purchase': '/api/purchases/confirm',
    'validate-coupon': '/api/coupons/validate',
    'reconcile-pending-payments': '/api/purchases/reconcile',
    'auto-create-admin': '/api/auth/auto-create-admin'
  };
  
  // Interceptar chamadas a Edge Functions (/api/functions/v1/*)
  if (pathname.startsWith('/api/functions/v1/')) {
    const functionMatch = pathname.match(/\/api\/functions\/v1\/([^\/\?]+)/);
    if (functionMatch && functionMatch[1]) {
      const functionName = functionMatch[1];
      const mappedPath = FUNCTION_MAP[functionName];
      
      if (mappedPath) {
        console.log(`🔄 [PROXY FUNCTIONS] Interceptando função: ${functionName} → ${mappedPath}`);
        
        // Para abacatepay-check-status, precisa extrair billingId do body (POST) ou query (GET)
        if (functionName === 'abacatepay-check-status' && req.method === 'POST') {
          // Ler body para extrair billingId
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          
          req.on('end', async () => {
            try {
              const bodyData = JSON.parse(body || '{}');
              const billingId = bodyData.body?.billingId || bodyData.billingId;
              
              if (billingId) {
                // Modificar para GET com billingId no path
                const finalPath = mappedPath + '/' + encodeURIComponent(billingId);
                const proxyUrl = BACKEND_URL + finalPath;
                
                console.log(`🔄 [PROXY FUNCTIONS] POST → GET ${finalPath} (billingId: ${billingId})`);
                
                // Fazer requisição GET ao backend
                const proxyReq = http.request(proxyUrl, {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                  }
                }, (proxyRes) => {
                  res.writeHead(proxyRes.statusCode, {
                    ...proxyRes.headers,
                    ...corsHeaders
                  });
                  proxyRes.pipe(res);
                });
                
                proxyReq.on('error', (err) => {
                  console.error('❌ Erro no proxy:', err);
                  res.writeHead(500, corsHeaders);
                  res.end(JSON.stringify({ error: 'Erro ao conectar ao backend', details: err.message }));
                });
                
                proxyReq.end();
              } else {
                console.error('❌ billingId não encontrado no body:', bodyData);
                res.writeHead(400, corsHeaders);
                res.end(JSON.stringify({ error: 'billingId não fornecido no body' }));
              }
            } catch (parseError) {
              console.error('❌ Erro ao parsear body:', parseError);
              res.writeHead(400, corsHeaders);
              res.end(JSON.stringify({ error: 'Body inválido', details: parseError.message }));
            }
          });
          
          return; // Retornar aqui porque vamos processar no 'end'
        }
        
        // Para outros casos ou GET, usar mapeamento normal
        pathname = mappedPath;
        
        // Se for GET e tiver billingId na query, adicionar ao path
        if (functionName === 'abacatepay-check-status' && req.method === 'GET' && parsedUrl.query.billingId) {
          pathname = mappedPath + '/' + encodeURIComponent(parsedUrl.query.billingId);
          delete parsedUrl.query.billingId;
          const newSearch = Object.keys(parsedUrl.query)
            .map(key => `${key}=${encodeURIComponent(parsedUrl.query[key])}`)
            .join('&');
          parsedUrl.search = newSearch ? '?' + newSearch : '';
        }
        
        console.log(`✅ [PROXY FUNCTIONS] Pathname modificado para: ${pathname}`);
      } else {
        console.warn(`⚠️ [PROXY FUNCTIONS] Função não mapeada: ${functionName}`);
        res.writeHead(404, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          error: `Função ${functionName} não encontrada`,
          code: 'FUNCTION_NOT_FOUND'
        }));
        return;
      }
    }
  }
  
  // Proxy para todas as requisições /api/* exceto /api/whatsapp/*
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/whatsapp/')) {
    const proxyUrl = BACKEND_URL + pathname + (parsedUrl.search || '');
    
    console.log(`🔄 [PROXY] ${req.method} ${pathname} → ${proxyUrl}`);
    
    // Criar um Agent compartilhado para reutilizar conexões
    const sharedAgent = new http.Agent({ 
      keepAlive: true,
      keepAliveMsecs: 1000,
      maxSockets: 50,
      maxFreeSockets: 10,
      timeout: 30000
    });
    
    // Capturar body da requisição se for POST/PUT/PATCH
    let requestBody = '';
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      req.on('data', (chunk) => {
        requestBody += chunk.toString();
      });
      
      req.on('error', (error) => {
        console.error('❌ [PROXY] Erro ao ler body da requisição:', error.message);
        if (!res.headersSent) {
          res.writeHead(500, {
            ...corsHeaders,
            'Content-Type': 'application/json'
          });
          res.end(JSON.stringify({ 
            success: false, 
            error: 'Erro ao processar requisição',
            details: error.message
          }));
        }
      });
      
      req.on('end', () => {
        try {
          console.log(`📦 [PROXY] Body recebido (${requestBody.length} bytes):`, requestBody.substring(0, 200));
          
          // Preparar opções da requisição
          const proxyOptions = {
            method: req.method,
            headers: {
              'Content-Type': req.headers['content-type'] || 'application/json'
            },
            timeout: 30000, // 30 segundos de timeout
            agent: sharedAgent
          };
          
          // Adicionar Content-Length apenas se houver body
          if (requestBody.length > 0) {
            proxyOptions.headers['Content-Length'] = Buffer.byteLength(requestBody);
          }
          
          // Copiar headers de autenticação se existirem
          if (req.headers['authorization']) {
            proxyOptions.headers['Authorization'] = req.headers['authorization'];
          }
          
          console.log(`📤 [PROXY] Enviando requisição para: ${proxyUrl}`);
          console.log(`📤 [PROXY] Headers:`, JSON.stringify(proxyOptions.headers, null, 2));
          
          // Fazer proxy da requisição
          const proxyReq = http.request(proxyUrl, proxyOptions, (proxyRes) => {
            // Copiar headers da resposta
            const responseHeaders = {
              ...corsHeaders,
              'Content-Type': proxyRes.headers['content-type'] || 'application/json'
            };
            
            console.log(`✅ [PROXY] Resposta do backend: ${proxyRes.statusCode} para ${pathname}`);
            
            if (!res.headersSent) {
              res.writeHead(proxyRes.statusCode, responseHeaders);
            }
            
            // Capturar o body da resposta para log
            let responseBody = '';
            proxyRes.on('data', (chunk) => {
              const chunkStr = chunk.toString();
              responseBody += chunkStr;
              res.write(chunk);
            });
            
            proxyRes.on('end', () => {
              res.end();
              if (proxyRes.statusCode >= 400) {
                console.error(`❌ [PROXY] Erro ${proxyRes.statusCode} do backend para ${pathname}:`, responseBody.substring(0, 500));
              } else {
                console.log(`✅ [PROXY] Resposta completa para ${pathname} (${responseBody.length} bytes)`);
              }
            });
            
            proxyRes.on('error', (error) => {
              console.error('❌ [PROXY] Erro ao ler resposta do backend:', error.message);
            });
          });
          
          // Configurar timeout para requisições POST/PUT/PATCH
          proxyReq.setTimeout(30000, () => {
            console.error('❌ [PROXY] Timeout ao conectar com o backend remoto (POST/PUT/PATCH)');
            console.error('❌ [PROXY] URL:', proxyUrl);
            proxyReq.destroy();
            if (!res.headersSent) {
              res.writeHead(504, {
                ...corsHeaders,
                'Content-Type': 'application/json'
              });
              res.end(JSON.stringify({ 
                success: false, 
                error: 'Timeout ao conectar com o backend remoto',
                details: 'A requisição demorou mais de 30 segundos'
              }));
            }
          });
          
          proxyReq.on('error', (error) => {
            console.error('❌ [PROXY] Erro ao fazer proxy (POST/PUT/PATCH):', error.message);
            console.error('❌ [PROXY] URL:', proxyUrl);
            console.error('❌ [PROXY] Código:', error.code);
            console.error('❌ [PROXY] Stack:', error.stack);
            
            // Tratamento específico para diferentes tipos de erro
            let errorMessage = 'Erro ao conectar com o backend remoto';
            let errorDetails = error.message;
            
            if (error.code === 'ECONNRESET' || error.message.includes('socket hang up')) {
              errorMessage = 'Conexão com o backend foi interrompida';
              errorDetails = 'O servidor remoto fechou a conexão inesperadamente. Tente novamente.';
            } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
              errorMessage = 'Não foi possível conectar ao backend remoto';
              errorDetails = 'O servidor remoto não está respondendo. Verifique se está online.';
            }
            
            if (!res.headersSent) {
              res.writeHead(500, {
                ...corsHeaders,
                'Content-Type': 'application/json'
              });
              res.end(JSON.stringify({ 
                success: false, 
                error: errorMessage,
                details: errorDetails,
                code: error.code
              }));
            }
          });
          
          // Enviar body
          if (requestBody.length > 0) {
            proxyReq.write(requestBody);
          }
          proxyReq.end();
        } catch (error) {
          console.error('❌ [PROXY] Erro ao processar requisição:', error.message);
          console.error('❌ [PROXY] Stack:', error.stack);
          if (!res.headersSent) {
            res.writeHead(500, {
              ...corsHeaders,
              'Content-Type': 'application/json'
            });
            res.end(JSON.stringify({ 
              success: false, 
              error: 'Erro ao processar requisição',
              details: error.message
            }));
          }
        }
      });
    } else {
      // Para GET/HEAD, fazer proxy diretamente
      const proxyOptions = {
        method: req.method,
        headers: {},
        timeout: 30000, // 30 segundos de timeout
        agent: sharedAgent
      };
      
      // Copiar headers de autenticação se existirem
      if (req.headers['authorization']) {
        proxyOptions.headers['Authorization'] = req.headers['authorization'];
      }
      
      const proxyReq = http.request(proxyUrl, proxyOptions, (proxyRes) => {
        const responseHeaders = {
          ...corsHeaders,
          'Content-Type': proxyRes.headers['content-type'] || 'application/json'
        };
        
        console.log(`✅ [PROXY] Resposta do backend: ${proxyRes.statusCode} para ${pathname}`);
        
        if (!res.headersSent) {
          res.writeHead(proxyRes.statusCode, responseHeaders);
        }
        
        let responseBody = '';
        proxyRes.on('data', (chunk) => {
          const chunkStr = chunk.toString();
          responseBody += chunkStr;
          if (!res.headersSent) {
            res.writeHead(proxyRes.statusCode, responseHeaders);
          }
          res.write(chunk);
        });
        
        proxyRes.on('end', () => {
          if (!res.headersSent) {
            res.writeHead(proxyRes.statusCode, responseHeaders);
          }
          res.end();
          if (proxyRes.statusCode >= 400) {
            console.error(`❌ [PROXY] Erro ${proxyRes.statusCode} do backend para ${pathname}:`, responseBody.substring(0, 500));
          } else {
            console.log(`✅ [PROXY] Resposta completa do backend para ${pathname} (${Buffer.byteLength(responseBody)} bytes)`);
          }
        });
        
        proxyRes.on('error', (error) => {
          console.error('❌ [PROXY] Erro ao receber resposta do backend:', error.message);
          console.error('❌ [PROXY] Stack:', error.stack);
          if (!res.headersSent) {
            res.writeHead(500, {
              ...corsHeaders,
              'Content-Type': 'application/json'
            });
            res.end(JSON.stringify({ 
              success: false, 
              error: 'Erro ao receber resposta do backend remoto',
              details: error.message
            }));
          }
        });
      });
      
      // Configurar timeout e tratamento de erros
      proxyReq.setTimeout(30000, () => {
        console.error('❌ [PROXY] Timeout ao conectar com o backend remoto');
        console.error('❌ [PROXY] URL:', proxyUrl);
        proxyReq.destroy();
        if (!res.headersSent) {
          res.writeHead(504, {
            ...corsHeaders,
            'Content-Type': 'application/json'
          });
          res.end(JSON.stringify({ 
            success: false, 
            error: 'Timeout ao conectar com o backend remoto',
            details: 'A requisição demorou mais de 30 segundos'
          }));
        }
      });
      
      proxyReq.on('error', (error) => {
        console.error('❌ [PROXY] Erro ao fazer proxy:', error.message);
        console.error('❌ [PROXY] URL:', proxyUrl);
        console.error('❌ [PROXY] Código:', error.code);
        console.error('❌ [PROXY] Stack:', error.stack);
        
        // Tratamento específico para "socket hang up"
        let errorMessage = error.message;
        let errorDetails = error.message;
        
        if (error.code === 'ECONNRESET' || error.message.includes('socket hang up')) {
          errorMessage = 'Conexão com o backend foi interrompida';
          errorDetails = 'O servidor remoto fechou a conexão inesperadamente. Tente novamente.';
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
          errorMessage = 'Não foi possível conectar ao backend remoto';
          errorDetails = 'O servidor remoto não está respondendo. Verifique se está online.';
        }
        
        if (!res.headersSent) {
          res.writeHead(500, {
            ...corsHeaders,
            'Content-Type': 'application/json'
          });
          res.end(JSON.stringify({ 
            success: false, 
            error: errorMessage,
            details: errorDetails,
            code: error.code
          }));
        }
      });
      
      proxyReq.end();
    }
    
    return;
  }

  // ============================================
  // API ENDPOINTS LOCAIS
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
          // Adicionar timestamp único para evitar cache
          const timestamp = Date.now();
          const replacementCode = fs.readFileSync(replacementPath, 'utf8')
            .replace(/VERSÃO:.*/g, `VERSÃO: ${timestamp} - FORÇANDO PROXY LOCAL`);
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

