/**
 * Interceptor para redirecionar chamadas do Supabase para o novo backend
 * Este arquivo será injetado no index.html antes do código compilado
 */

(function() {
  'use strict';
  
  const BACKEND_URL = 'http://localhost:3001';
  
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
  let supabaseClient = null;
  let authToken = null;

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
    
    // Verificar se é uma chamada para funções do Supabase
    if (typeof url === 'string' && url.includes('/functions/v1/')) {
      const functionName = url.split('/functions/v1/')[1]?.split('?')[0]?.split('/')[0];
      
      if (functionName && FUNCTION_MAP[functionName]) {
        const mapping = FUNCTION_MAP[functionName];
        const newUrl = BACKEND_URL + mapping.path;
        
        console.log(`🔄 Interceptando chamada do Supabase: ${functionName} → ${newUrl}`);
        
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
          const getUrl = newUrl + '/' + body.billingId;
          return originalFetch(getUrl, {
            ...options,
            method: 'GET',
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${getAuthToken() || ''}`,
              'Content-Type': 'application/json'
            }
          });
        }
        
        // Para outras requisições
        return originalFetch(newUrl, {
          ...options,
          method: mapping.method,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${getAuthToken() || ''}`,
            'Content-Type': 'application/json'
          },
          body: typeof body === 'object' ? JSON.stringify(body) : body
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
            
            // Fazer requisição
            return fetch(url, {
              method: mapping.method,
              headers: {
                'Authorization': `Bearer ${token || ''}`,
                'Content-Type': 'application/json'
              },
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
})();

