/**
 * Interceptor para redirecionar chamadas do Supabase para o novo backend
 * Este arquivo será injetado no index.html antes do código compilado
 */

(function() {
  'use strict';
  
  // Detectar se está em HTTPS e configurar URL do backend
  const isHTTPS = window.location.protocol === 'https:';
  
  // Se estiver em HTTPS, usar proxy relativo ou HTTPS
  // Opção 1: Usar proxy relativo (recomendado - funciona se o backend estiver no mesmo domínio)
  // Opção 2: Usar HTTPS direto (se o backend tiver SSL configurado)
  // Opção 3: Usar subdomínio com SSL (ex: api.institutobex.com)
  
  // CONFIGURAÇÃO: Escolha uma das opções abaixo:
  
  // OPÇÃO 1: Proxy relativo (backend no mesmo servidor via /api)
  // const BACKEND_URL = isHTTPS ? '' : 'http://46.224.47.128:3001';
  
  // OPÇÃO 2: HTTPS direto (se o backend tiver SSL)
  // const BACKEND_URL = isHTTPS ? 'https://46.224.47.128:3001' : 'http://46.224.47.128:3001';
  
  // OPÇÃO 3: Subdomínio com SSL (recomendado para produção)
  // const BACKEND_URL = isHTTPS ? 'https://api.institutobex.com' : 'http://46.224.47.128:3001';
  
  // OPÇÃO 4: Usar proxy PHP na Hostinger (criar arquivo proxy.php)
  // Tente api-proxy-simple.php primeiro (usa file_get_contents, mais compatível)
  const BACKEND_URL = isHTTPS ? '/api-proxy-simple.php' : 'http://46.224.47.128:3001';
  
  // URL base do backend (para quando usar proxy)
  const BACKEND_BASE = 'http://46.224.47.128:3001';
  
  // Mapeamento de funções do Supabase para endpoints do novo backend
  const FUNCTION_MAP = {
    'create-purchase': { method: 'POST', path: '/api/purchases' },
    'create-payment-pix': { method: 'POST', path: '/api/purchases/payment/pix' },
    'create-payment-card': { method: 'POST', path: '/api/purchases/payment/card' },
    'abacatepay-check-status': { method: 'GET', path: '/api/purchases/payment/status' },
    'confirm-purchase': { method: 'POST', path: '/api/purchases/confirm' },
    'validate-coupon': { method: 'POST', path: '/api/coupons/validate' },
    'reconcile-pending-payments': { method: 'POST', path: '/api/purchases/reconcile' },
    'auto-create-admin': { method: 'POST', path: '/api/auth/auto-create-admin' }
  };

  // Interceptar quando o Supabase for carregado
  const originalFetch = window.fetch;
  const originalWebSocket = window.WebSocket;
  let supabaseClient = null;
  let authToken = null;
  
  // Interceptar WebSocket para bloquear conexões com localhost/Supabase antigo
  window.WebSocket = function(...args) {
    const url = args[0];
    
    if (typeof url === 'string') {
      // Bloquear WebSocket para localhost
      if (url.includes('localhost:3000') || url.includes('127.0.0.1:3000')) {
        console.warn('🚫 Bloqueando WebSocket para localhost:', url);
        // Retornar um WebSocket falso que não faz nada
        return {
          readyState: 3, // CLOSED
          close: function() {},
          send: function() {},
          addEventListener: function() {},
          removeEventListener: function() {}
        };
      }
      
      // Bloquear WebSocket para Supabase antigo
      if (url.includes('.supabase.co') && url.includes('/realtime/')) {
        console.warn('🚫 Bloqueando WebSocket para Supabase antigo:', url);
        return {
          readyState: 3, // CLOSED
          close: function() {},
          send: function() {},
          addEventListener: function() {},
          removeEventListener: function() {}
        };
      }
    }
    
    // Para outras conexões, usar WebSocket original
    return new originalWebSocket(...args);
  };

  // Função para obter token de autenticação
  function getAuthToken() {
    if (authToken) return authToken;
    
    // Tentar obter do localStorage (onde o Supabase geralmente armazena)
    try {
      // Tentar diferentes formatos de chave do Supabase
      const keys = Object.keys(localStorage).filter(key => key.includes('auth-token') || key.includes('supabase'));
      
      for (const key of keys) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            if (parsed && (parsed.access_token || parsed.token)) {
              authToken = parsed.access_token || parsed.token;
              return authToken;
            }
          }
        } catch (e) {
          // Continuar tentando outras chaves
        }
      }
      
      // Tentar obter do cliente Supabase se estiver disponível
      if (supabaseClient && supabaseClient.auth) {
        supabaseClient.auth.getSession().then(({ data: { session } }) => {
          if (session && session.access_token) {
            authToken = session.access_token;
          }
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Erro ao obter token do localStorage:', e);
    }
    
    return authToken || null;
  }

  // Interceptar fetch para redirecionar chamadas do Supabase
  window.fetch = function(...args) {
    const url = args[0];
    const options = args[1] || {};
    
    // Verificar se é uma chamada para o Supabase
    if (typeof url === 'string') {
      // BLOQUEAR qualquer tentativa de conexão com Supabase antigo
      if (url.includes('elusfwlvtqafvzplnooh.supabase.co') || 
          url.includes('qxgzazewwutbikmmpkms.supabase.co') ||
          (url.includes('.supabase.co') && !url.includes('api-proxy.php'))) {
        console.warn('🚫 Bloqueando chamada para Supabase antigo:', url);
        // Retornar erro imediatamente sem tentar conectar
        return Promise.resolve(new Response(JSON.stringify({
          error: 'Supabase não está mais em uso',
          error_description: 'Esta aplicação foi migrada para um novo backend'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      // Interceptar chamadas de autenticação do Supabase (DEVE ser antes da interceptação de localhost)
      if (url.includes('/auth/v1/token') || (url.includes('localhost:3000') && url.includes('/auth/v1/token'))) {
        console.log('🔄 Interceptando chamada de autenticação do Supabase:', url);
        
        // Preparar body
        let body = options.body;
        if (body && typeof body === 'string') {
          try {
            body = JSON.parse(body);
          } catch (e) {
            // Tentar parse como URL encoded
            try {
              const params = new URLSearchParams(body);
              body = {
                email: params.get('email'),
                password: params.get('password'),
                grant_type: params.get('grant_type')
              };
            } catch (e2) {
              // Se falhar, tentar extrair da query string da URL
              try {
                const urlObj = new URL(url);
                body = {
                  email: urlObj.searchParams.get('email'),
                  password: urlObj.searchParams.get('password'),
                  grant_type: urlObj.searchParams.get('grant_type') || 'password'
                };
              } catch (e3) {
                console.warn('Erro ao parsear body de autenticação:', e3);
              }
            }
          }
        }
        
        // Determinar se é login ou signup baseado no grant_type
        const grantType = body?.grant_type || (typeof body === 'string' ? new URLSearchParams(body).get('grant_type') : null) || 'password';
        const email = body?.email || (typeof body === 'string' ? new URLSearchParams(body).get('email') : null);
        const password = body?.password || (typeof body === 'string' ? new URLSearchParams(body).get('password') : null);
        
        if (grantType === 'password' && email && password) {
          // É um login
          const loginUrl = BACKEND_URL + (BACKEND_URL.startsWith('/') ? '' : '') + '/api/auth/signin';
          console.log(`🔄 Redirecionando login para: ${loginUrl}`);
          
          // Se usar proxy, adicionar header especial
          const headers = {
            'Content-Type': 'application/json'
          };
          
          // Se usar proxy PHP, adicionar header com URL real
          if (BACKEND_URL.includes('api-proxy')) {
            headers['X-Backend-URL'] = BACKEND_BASE + '/api/auth/signin';
            headers['X-Backend-Method'] = 'POST';
          }
          
          const requestBody = JSON.stringify({ email, password });
          console.log('🔄 Enviando login - URL:', loginUrl, 'Body:', requestBody);
          
          return originalFetch(loginUrl, {
            method: 'POST',
            headers: headers,
            body: requestBody
          })
          .then(async (response) => {
            let data;
            try {
              const text = await response.text();
              data = text ? JSON.parse(text) : {};
            } catch (e) {
              console.error('Erro ao parsear resposta do login:', e);
              data = { error: 'Erro ao processar resposta do servidor' };
            }
            
            if (response.ok && data.token) {
              // Formatar resposta no formato do Supabase
              const supabaseResponse = {
                access_token: data.token,
                token_type: 'bearer',
                expires_in: 604800, // 7 dias
                refresh_token: data.token, // Usar o mesmo token como refresh
                user: {
                  id: data.user?.id || '',
                  email: data.user?.email || email,
                  app_metadata: {},
                  user_metadata: {
                    first_name: data.user?.firstName || '',
                    last_name: data.user?.lastName || ''
                  },
                  aud: 'authenticated',
                  created_at: new Date().toISOString()
                }
              };
              
              // Salvar token no localStorage (formato Supabase)
              try {
                const supabaseKey = Object.keys(localStorage).find(key => key.includes('supabase') && key.includes('auth-token'));
                if (supabaseKey) {
                  localStorage.setItem(supabaseKey, JSON.stringify(supabaseResponse));
                }
                authToken = data.token;
              } catch (e) {
                console.warn('Erro ao salvar token:', e);
              }
              
              return new Response(JSON.stringify(supabaseResponse), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              });
            } else {
              // Erro no login
              console.error('Erro no login - Status:', response.status, 'Data:', data);
              return new Response(JSON.stringify({
                error: data.error || 'Erro ao fazer login',
                error_description: data.message || data.error_description || 'Credenciais inválidas',
                details: data
              }), {
                status: response.status || 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }
          })
          .catch((error) => {
            console.error('Erro ao fazer login:', error);
            return new Response(JSON.stringify({
              error: 'Erro de conexão',
              error_description: error.message || 'Não foi possível conectar com o servidor'
            }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        }
      }
      
      // Verificar se é uma chamada para funções do Supabase
      if (url.includes('/functions/v1/')) {
        const functionName = url.split('/functions/v1/')[1]?.split('?')[0]?.split('/')[0];
        
        if (functionName && FUNCTION_MAP[functionName]) {
          const mapping = FUNCTION_MAP[functionName];
          let newUrl = BACKEND_URL + mapping.path;
          
          // Preparar body
          let body = options.body;
          if (body && typeof body === 'string') {
            try {
              body = JSON.parse(body);
            } catch (e) {
              // Manter como string se não for JSON
            }
          }
          
          // Para GET com parâmetros na URL
          if (mapping.method === 'GET' && functionName === 'abacatepay-check-status' && body && body.billingId) {
            newUrl = newUrl + '/' + body.billingId;
          }
          
          console.log(`🔄 Interceptando chamada do Supabase: ${functionName} → ${newUrl}`);
          
          // Preparar headers
          const headers = {
            ...options.headers,
            'Authorization': `Bearer ${getAuthToken() || ''}`,
            'Content-Type': 'application/json'
          };
          
          // Se usar proxy PHP, adicionar header com URL real
          if (BACKEND_URL.includes('api-proxy')) {
            const realUrl = BACKEND_BASE + mapping.path + (mapping.method === 'GET' && functionName === 'abacatepay-check-status' && body && body.billingId ? '/' + body.billingId : '');
            headers['X-Backend-URL'] = realUrl;
            headers['X-Backend-Method'] = mapping.method;
          }
          
          return originalFetch(newUrl, {
            ...options,
            method: mapping.method,
            headers: headers,
            body: typeof body === 'object' ? JSON.stringify(body) : body
          });
        }
      }
      
      // Interceptar outras chamadas do Supabase (REST API)
      if (url.includes('.supabase.co/rest/v1/')) {
        console.log('🔄 Interceptando chamada REST do Supabase:', url);
        // Extrair o path após /rest/v1/
        const restPath = url.split('/rest/v1/')[1];
        if (restPath) {
          const newUrl = BACKEND_URL + '/api/' + restPath;
          console.log(`🔄 Redirecionando para: ${newUrl}`);
          
          const headers = {
            ...options.headers,
            'Authorization': `Bearer ${getAuthToken() || ''}`,
            'Content-Type': 'application/json'
          };
          
          // Se usar proxy PHP, adicionar header com URL real
          if (BACKEND_URL.includes('api-proxy')) {
            headers['X-Backend-URL'] = BACKEND_BASE + '/api/' + restPath;
            headers['X-Backend-Method'] = options.method || 'GET';
          }
          
          return originalFetch(newUrl, {
            ...options,
            headers: headers
          });
        }
      }
      
      // Interceptar chamadas para localhost:3000 (código compilado modificado)
      // IMPORTANTE: Não interceptar se já foi interceptado como autenticação
      if ((url.includes('localhost:3000') || url.includes('127.0.0.1:3000')) && !url.includes('/auth/v1/token')) {
        console.log('🔄 Interceptando chamada para localhost:3000:', url);
        
        // Extrair o path após localhost:3000
        let restPath = url.replace(/^https?:\/\/localhost:3000\//, '').replace(/^https?:\/\/127\.0\.0\.1:3000\//, '');
        
        // Se for /api/rest/v1/..., remover /api/rest/v1/
        if (restPath.startsWith('api/rest/v1/')) {
          restPath = restPath.replace('api/rest/v1/', '');
        } else if (restPath.startsWith('api/')) {
          restPath = restPath.replace('api/', '');
        }
        
        // Mapear nomes de tabelas do Supabase para rotas do backend
        const routeMapping = {
          'course_materials': 'materials',
          'course_enrollments': 'enrollments',
          'course_purchases': 'purchases'
        };
        
        // Aplicar mapeamento se necessário
        const pathParts = restPath.split('?');
        let pathWithoutQuery = pathParts[0];
        const queryString = pathParts[1] || '';
        
        // Verificar se precisa mapear
        for (const [supabaseName, backendName] of Object.entries(routeMapping)) {
          if (pathWithoutQuery === supabaseName || pathWithoutQuery.startsWith(supabaseName + '/')) {
            pathWithoutQuery = pathWithoutQuery.replace(supabaseName, backendName);
            restPath = pathWithoutQuery + (queryString ? '?' + queryString : '');
            console.log(`🔄 Mapeando ${supabaseName} → ${backendName}`);
            console.log(`🔄 Path após mapeamento: ${restPath}`);
            break;
          }
        }
        
        const newUrl = BACKEND_URL + '/api/' + restPath;
        console.log(`🔄 Redirecionando localhost:3000 para: ${newUrl}`);
        
        const headers = {
          ...options.headers,
          'Authorization': `Bearer ${getAuthToken() || ''}`,
          'Content-Type': 'application/json'
        };
        
        // Se usar proxy PHP, adicionar header com URL real
        if (BACKEND_URL.includes('api-proxy')) {
          headers['X-Backend-URL'] = BACKEND_BASE + '/api/' + restPath;
          headers['X-Backend-Method'] = options.method || 'GET';
        }
        
        return originalFetch(newUrl, {
          ...options,
          headers: headers
        });
      }
    }
    
    // Para outras requisições, usar fetch original
    return originalFetch.apply(this, args);
  };

  // Interceptar o cliente Supabase quando for criado
  const originalCreateClient = window.createClient;
  if (window.createClient) {
    window.createClient = function(...args) {
      const client = originalCreateClient.apply(this, args);
      supabaseClient = client;
      
      // Interceptar functions.invoke
      if (client.functions) {
        const originalInvoke = client.functions.invoke;
        client.functions.invoke = function(functionName, options = {}) {
          const mapping = FUNCTION_MAP[functionName];
          
          if (mapping) {
            console.log(`🔄 Interceptando invoke: ${functionName} → ${BACKEND_URL}${mapping.path}`);
            
            // Obter token de autenticação
            const token = getAuthToken();
            
            // Preparar URL
            let url = BACKEND_URL + mapping.path;
            if (mapping.method === 'GET' && functionName === 'abacatepay-check-status' && options.body?.billingId) {
              url = url + '/' + options.body.billingId;
            }
            
            // Preparar body
            let body = options.body;
            if (mapping.method === 'GET') {
              body = undefined;
            }
            
            // Preparar headers
            const headers = {
              'Authorization': `Bearer ${token || ''}`,
              'Content-Type': 'application/json'
            };
            
            // Se usar proxy PHP, adicionar header com URL real
            if (BACKEND_URL.includes('api-proxy')) {
              const realUrl = BACKEND_BASE + mapping.path + (mapping.method === 'GET' && functionName === 'abacatepay-check-status' && options.body?.billingId ? '/' + options.body.billingId : '');
              headers['X-Backend-URL'] = realUrl;
              headers['X-Backend-Method'] = mapping.method;
            }
            
            // Fazer requisição
            return fetch(url, {
              method: mapping.method,
              headers: headers,
              body: body ? JSON.stringify(body) : undefined
            })
            .then(response => {
              if (!response.ok) {
                return response.json().then(err => {
                  return {
                    data: null,
                    error: {
                      message: err.error || 'Erro na requisição',
                      status: response.status
                    }
                  };
                });
              }
              return response.json().then(data => ({
                data: data,
                error: null
              }));
            })
            .catch(error => {
              console.error('Erro ao chamar backend:', error);
              return {
                data: null,
                error: {
                  message: error.message || 'Erro de conexão',
                  status: 0
                }
              };
            });
          }
          
          // Se não mapeado, tentar chamar original (pode falhar se Supabase estiver offline)
          return originalInvoke.apply(this, arguments);
        };
      }
      
      return client;
    };
  }

  console.log('✅ Interceptor do Supabase carregado!');
  console.log('🔍 [DEBUG] Protocolo atual:', window.location.protocol);
  console.log('🔍 [DEBUG] BACKEND_URL configurado:', BACKEND_URL);
  console.log('🔍 [DEBUG] isHTTPS:', isHTTPS);
})();
