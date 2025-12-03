/**
 * REMOÇÃO COMPLETA DO SUPABASE
 * Este arquivo BLOQUEIA todas as chamadas ao Supabase e redireciona para o backend de produção
 * SUPABASE FOI COMPLETAMENTE REMOVIDO DO SISTEMA
 */

// EXECUTAR IMEDIATAMENTE - ANTES DE QUALQUER CÓDIGO
// IIFE síncrono para garantir execução imediata
(function() {
  'use strict';
  
  console.log('🚀 Inicializando sistema - SUPABASE REMOVIDO');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('🔄 VERSÃO: 2025-12-03-13:00 - SUPABASE COMPLETAMENTE REMOVIDO');
  console.log('🌐 Todas as requisições vão DIRETO para o backend de produção');
  
  // REQUISIÇÕES PARA BACKEND DE PRODUÇÃO VIA PROXY LOCAL (para resolver CORS)
  // O proxy local (server.js) redireciona /api/* para http://46.224.47.128:3001
  // Isso resolve CORS porque a requisição do navegador vem do mesmo origin
  const BACKEND_PRODUCTION = 'http://46.224.47.128:3001'; // Backend de produção
  const PROXY_LOCAL = window.location.origin; // http://localhost:3000 (usa proxy local)
  const BACKEND_URL = PROXY_LOCAL; // Usar proxy local que redireciona para produção
  console.log('🌐 Backend de produção:', BACKEND_PRODUCTION);
  console.log('🌐 Proxy local:', PROXY_LOCAL);
  console.log('⚠️ SUPABASE FOI REMOVIDO - Usando proxy local para resolver CORS');
  
  // Interceptar ANTES de criar qualquer função
  // Isso garante que o replacement esteja ativo antes do código compilado
  
  // Armazenar token de autenticação
  let authToken = null;
  let currentUser = null;
  
  // Função para obter token
  function getAuthToken() {
    if (authToken) return authToken;
    
    // Tentar obter do localStorage
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.includes('auth') || key.includes('supabase')) {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              const parsed = JSON.parse(value);
              if (parsed && (parsed.access_token || parsed.token)) {
                authToken = parsed.access_token || parsed.token;
                return authToken;
              }
            }
          } catch (e) {}
        }
      }
    } catch (e) {}
    
    return null;
  }
  
  // Função para fazer requisição autenticada
  async function apiRequest(method, path, body = null) {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
      method,
      headers
    };
    
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }
    
    try {
      // Usar proxy local que redireciona para backend de produção (resolve CORS)
      const fullUrl = `${BACKEND_URL}${path}`;
      console.log('🔍 [apiRequest] Requisição via proxy local:', fullUrl);
      console.log('🔍 [apiRequest] Proxy redireciona para:', `${BACKEND_PRODUCTION}${path}`);
      const response = await fetch(fullUrl, options);
      const data = await response.json();
      
      if (!response.ok) {
        return { data: null, error: data };
      }
      
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          message: error.message || 'Erro de conexão',
          status: 0
        }
      };
    }
  }
  
  // Mapeamento de tabelas para endpoints
  const TABLE_MAP = {
    'profiles': '/api/users/profile',
    'courses': '/api/courses',
    'course_enrollments': '/api/enrollments',
    'course_purchases': '/api/purchases',
    'user_roles': '/api/users/roles',
    'contact_messages': '/api/contact',
    'lessons': '/api/lessons',
    'lesson_progress': '/api/progress'
  };
  
  // Mapeamento de funções
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
  
  // Criar cliente Supabase falso
  function createFakeSupabaseClient() {
    return {
      // Auth
      auth: {
        getUser: async () => {
          const token = getAuthToken();
          if (!token) {
            return { data: { user: null }, error: null };
          }
          
          const result = await apiRequest('GET', '/api/auth/user');
          if (result.error) {
            return { data: { user: null }, error: result.error };
          }
          
          currentUser = result.data.user;
          return { data: { user: currentUser }, error: null };
        },
        
        getSession: async () => {
          const token = getAuthToken();
          if (!token) {
            return { data: { session: null }, error: null };
          }
          
          const userResult = await apiRequest('GET', '/api/auth/user');
          if (userResult.error || !userResult.data.user) {
            return { data: { session: null }, error: null };
          }
          
          return {
            data: {
              session: {
                access_token: token,
                user: userResult.data.user
              }
            },
            error: null
          };
        },
        
        signInWithPassword: async ({ email, password }) => {
          const result = await apiRequest('POST', '/api/auth/signin', { email, password });
          
          if (result.error) {
            return { data: null, error: result.error };
          }
          
          // Salvar token
          if (result.data.token) {
            authToken = result.data.token;
            localStorage.setItem('auth_token', JSON.stringify({ access_token: authToken }));
            currentUser = result.data.user;
          }
          
          return {
            data: {
              user: result.data.user,
              session: {
                access_token: authToken,
                user: result.data.user
              }
            },
            error: null
          };
        },
        
        signUp: async ({ email, password, options }) => {
          const result = await apiRequest('POST', '/api/auth/signup', {
            email,
            password,
            firstName: options?.data?.firstName || options?.data?.first_name || '',
            lastName: options?.data?.lastName || options?.data?.last_name || ''
          });
          
          if (result.error) {
            return { data: null, error: result.error };
          }
          
          if (result.data.token) {
            authToken = result.data.token;
            localStorage.setItem('auth_token', JSON.stringify({ access_token: authToken }));
            currentUser = result.data.user;
          }
          
          return {
            data: {
              user: result.data.user,
              session: {
                access_token: authToken,
                user: result.data.user
              }
            },
            error: null
          };
        },
        
        signOut: async () => {
          authToken = null;
          currentUser = null;
          localStorage.removeItem('auth_token');
          await apiRequest('POST', '/api/auth/signout');
          return { error: null };
        },
        
        updateUser: async ({ password }) => {
          const result = await apiRequest('PUT', '/api/auth/user', { password });
          return result;
        }
      },
      
      // Database (from)
      from: (table) => {
        const endpoint = TABLE_MAP[table] || `/api/${table}`;
        
        console.log(`🔄 Query interceptada: from("${table}") → ${endpoint}`);
        
        return {
          select: (columns = '*') => {
            console.log(`📋 Select interceptado: ${columns}`);
            
            // Retornar objeto com métodos encadeáveis
            const queryBuilder = {
            eq: (column, value) => ({
              maybeSingle: async () => {
                const path = `${endpoint}?${column}=${value}`;
                const result = await apiRequest('GET', path);
                
                // Se for course_enrollments e encontrar matrícula, pagamento foi confirmado
                if (table === 'course_enrollments' && result.data && !result.error) {
                  const data = Array.isArray(result.data) ? result.data[0] : result.data;
                  if (data && data.id) {
                    console.log('✅ Matrícula encontrada - Pagamento confirmado!');
                    // Disparar evento para mostrar overlay
                    setTimeout(() => {
                      if (window.showPaymentSuccessOverlay) {
                        window.showPaymentSuccessOverlay();
                      }
                      window.dispatchEvent(new CustomEvent('paymentConfirmed', { detail: data }));
                    }, 100);
                  }
                }
                
                return result;
              },
              single: async () => {
                const path = `${endpoint}?${column}=${value}`;
                const result = await apiRequest('GET', path);
                if (result.error || !result.data) {
                  return { data: null, error: { message: 'Not found' } };
                }
                
                const data = Array.isArray(result.data) ? result.data[0] : result.data;
                
                // Se for course_enrollments e encontrar matrícula, pagamento foi confirmado
                if (table === 'course_enrollments' && data && data.id) {
                  console.log('✅ Matrícula encontrada - Pagamento confirmado!');
                  // Disparar evento para mostrar overlay
                  setTimeout(() => {
                    if (window.showPaymentSuccessOverlay) {
                      window.showPaymentSuccessOverlay();
                    }
                    window.dispatchEvent(new CustomEvent('paymentConfirmed', { detail: data }));
                  }, 100);
                }
                
                return { data, error: null };
              },
              order: (column, options) => ({
                then: async (callback) => {
                  const path = `${endpoint}?${column}=${value}&order=${column}&asc=${options?.ascending !== false}`;
                  const result = await apiRequest('GET', path);
                  if (callback) callback(result);
                  return result;
                }
              })
            }),
            maybeSingle: async () => {
              const result = await apiRequest('GET', endpoint);
              // Se o backend retornar { courses: [...] }, extrair o array
              if (result.data && result.data.courses) {
                return { data: result.data.courses.length > 0 ? result.data.courses[0] : null, error: null };
              }
              // Se retornar { course: {...} }, extrair o objeto
              if (result.data && result.data.course) {
                return { data: result.data.course, error: null };
              }
              return result;
            },
            single: async () => {
              const result = await apiRequest('GET', endpoint);
              // Se o backend retornar { courses: [...] }, extrair o primeiro item
              if (result.data && result.data.courses) {
                return { data: result.data.courses[0] || null, error: null };
              }
              // Se retornar { course: {...} }, extrair o objeto
              if (result.data && result.data.course) {
                return { data: result.data.course, error: null };
              }
              // Se for array direto, retornar primeiro item
              if (Array.isArray(result.data)) {
                return { data: result.data[0] || null, error: null };
              }
              return { data: result.data || null, error: null };
            },
            // Para queries sem filtros (listar todos)
            then: async (callback) => {
              const result = await apiRequest('GET', endpoint);
              // Se o backend retornar { courses: [...] }, extrair o array
              let data = result.data;
              if (result.data && result.data.courses) {
                data = result.data.courses;
              } else if (result.data && Array.isArray(result.data)) {
                data = result.data;
              }
              
              const response = { data, error: result.error };
              if (callback) callback(response);
              return response;
            },
            eq: (column, value) => ({
              maybeSingle: async () => {
                const path = `${endpoint}?${column}=${value}`;
                return await apiRequest('GET', path);
              },
              single: async () => {
                const path = `${endpoint}?${column}=${value}`;
                const result = await apiRequest('GET', path);
                return { data: Array.isArray(result.data) ? result.data[0] : result.data, error: null };
              },
              order: (column, options) => ({
                then: async (callback) => {
                  const path = `${endpoint}?${column}=${value}&order=${column}&asc=${options?.ascending !== false}`;
                  const result = await apiRequest('GET', path);
                  if (callback) callback(result);
                  return result;
                }
              })
            }),
            neq: (column, value) => ({
              limit: (num) => ({
                then: async (callback) => {
                  const path = `${endpoint}?${column}!=${value}&limit=${num}`;
                  const result = await apiRequest('GET', path);
                  if (callback) callback(result);
                  return result;
                }
              })
            }),
            not: (column, operator, value) => ({
              then: async (callback) => {
                const path = `${endpoint}?${column}!=${value}`;
                const result = await apiRequest('GET', path);
                if (callback) callback(result);
                return result;
              }
            }),
            in: (column, values) => ({
              then: async (callback) => {
                const path = `${endpoint}?${column}=${values.join(',')}`;
                const result = await apiRequest('GET', path);
                if (callback) callback(result);
                return result;
              }
            }),
            limit: (num) => {
              const limitPath = `${endpoint}?limit=${num}`;
              return {
                then: async (callback) => {
                  const result = await apiRequest('GET', limitPath);
                  // Ajustar formato da resposta
                  let data = result.data;
                  if (result.data && result.data.courses) {
                    data = result.data.courses;
                  } else if (Array.isArray(result.data)) {
                    data = result.data;
                  }
                  const response = { data, error: result.error };
                  if (callback) callback(response);
                  return response;
                }
              };
            },
            // Para queries diretas sem filtros (ex: from("courses").select().then())
            then: async (callback) => {
              console.log(`📡 Fazendo query direta para: ${endpoint}`);
              const result = await apiRequest('GET', endpoint);
              // Se o backend retornar { courses: [...] }, extrair o array
              let data = result.data;
              if (result.data && result.data.courses) {
                data = result.data.courses;
              } else if (Array.isArray(result.data)) {
                data = result.data;
              }
              
              const response = { data, error: result.error };
              console.log(`✅ Resposta da query:`, response);
              if (callback) callback(response);
              return response;
            }
          };
          
          return queryBuilder;
        },
        insert: (data) => ({
          select: async (columns) => {
            return await apiRequest('POST', endpoint, Array.isArray(data) ? data : [data]);
          }
        }),
        update: (data) => ({
          eq: (column, value) => ({
            select: async (columns) => {
              const path = `${endpoint}/${value}`;
              return await apiRequest('PUT', path, data);
            }
          })
        }),
        delete: () => ({
          eq: (column, value) => ({
            then: async (callback) => {
              const path = `${endpoint}/${value}`;
              const result = await apiRequest('DELETE', path);
              if (callback) callback(result);
              return result;
            }
          })
        })
      };
    },
    
    // Functions
    functions: {
      invoke: async (functionName, options = {}) => {
        const mapping = FUNCTION_MAP[functionName];
        
        if (mapping) {
          console.log(`🔄 Chamando via proxy local (→ produção): ${functionName} → ${BACKEND_URL}${mapping.path}`);
          console.log(`📡 Proxy redireciona para: ${BACKEND_PRODUCTION}${mapping.path}`);
          
          let url = BACKEND_URL + mapping.path;
          if (mapping.method === 'GET' && functionName === 'abacatepay-check-status' && options.body?.billingId) {
            url = url + '/' + options.body.billingId;
          }
          
          let body = options.body;
          if (mapping.method === 'GET') {
            body = undefined;
          }
          
          const token = getAuthToken();
          const response = await fetch(url, {
            method: mapping.method,
            headers: {
              'Authorization': `Bearer ${token || ''}`,
              'Content-Type': 'application/json'
            },
            body: body ? JSON.stringify(body) : undefined
          });
          
          if (!response.ok) {
            const err = await response.json();
            return {
              data: null,
              error: {
                message: err.error || 'Erro na requisição',
                status: response.status
              }
            };
          }
          
          const responseData = await response.json();
          
          console.log(`📦 [INVOKE] Resposta recebida para ${functionName}:`, JSON.stringify(responseData, null, 2));
          
          // IMPORTANTE: O Supabase functions.invoke() retorna { data, error }
          // onde data contém a resposta da função Edge Function
          // Se a resposta já estiver no formato { data, error }, extrair o data
          if (responseData && typeof responseData === 'object' && 'data' in responseData && 'error' in responseData) {
            // Se tem error, retornar como está
            if (responseData.error) {
              console.log(`❌ [INVOKE] Erro na resposta:`, responseData.error);
              return { data: null, error: responseData.error };
            }
            
            // Se não tem error, retornar os dados diretamente
            // O frontend espera que result.data contenha os dados (qr_code, copia_cola, etc.)
            // E o Supabase invoke() retorna { data: {...}, error: null }
            const innerData = responseData.data;
            
            console.log(`✅ [INVOKE] Retornando dados no formato Supabase:`, {
              hasData: !!innerData,
              dataKeys: innerData && typeof innerData === 'object' ? Object.keys(innerData) : [],
              hasQrCode: innerData && innerData.qr_code ? 'Sim' : 'Não',
              hasCopiaCola: innerData && innerData.copia_cola ? 'Sim' : 'Não'
            });
            
            // Retornar no formato Supabase: { data: {...}, error: null }
            // O frontend deve acessar result.data.qr_code
            // Mas alguns códigos podem tentar acessar result.qr_code diretamente
            // Então vamos adicionar os campos no nível superior também para compatibilidade
            const result = { data: innerData, error: null };
            
            // Se innerData tem qr_code ou copia_cola, adicionar no nível superior também
            // Isso permite que o frontend acesse tanto result.data.qr_code quanto result.qr_code
            if (innerData && typeof innerData === 'object') {
              if (innerData.qr_code) {
                result.qr_code = innerData.qr_code;
              }
              if (innerData.copia_cola) {
                result.copia_cola = innerData.copia_cola;
              }
              if (innerData.billingId) {
                result.billingId = innerData.billingId;
              }
              
              // Detectar pagamento confirmado no método invoke também
              if (functionName === 'abacatepay-check-status' && innerData.status === 'paid' && innerData.purchase) {
                const billingId = innerData.purchase.billing_id || innerData.purchase.id;
                const eventKey = `payment_confirmed_${billingId}`;
                
                if (!window[eventKey]) {
                  window[eventKey] = true;
                  window.paymentConfirmed = true;
                  window.paymentConfirmedBillingId = billingId;
                  
                  setTimeout(() => {
                    console.log('🎉 [INVOKE] Pagamento confirmado detectado! Disparando evento...');
                    if (window.showPaymentSuccessOverlay) {
                      window.showPaymentSuccessOverlay();
                    }
                    window.dispatchEvent(new CustomEvent('paymentConfirmed', { 
                      detail: { 
                        status: 'paid',
                        purchase: innerData.purchase,
                        stopPolling: true
                      } 
                    }));
                  }, 100);
                }
              }
            }
            
            console.log(`✅ [INVOKE] Retornando com compatibilidade:`, {
              hasData: !!result.data,
              hasQrCodeInData: !!(result.data && result.data.qr_code),
              hasQrCodeInRoot: !!result.qr_code,
              hasCopiaColaInData: !!(result.data && result.data.copia_cola),
              hasCopiaColaInRoot: !!result.copia_cola
            });
            
            return result;
          }
          
          // Se não está no formato { data, error }, formatar como Supabase
          console.log(`📦 [INVOKE] Formatando resposta como Supabase:`, responseData);
          return { data: responseData, error: null };
        }
        
        // Se não mapeado, retornar erro
        return {
          data: null,
          error: {
            message: `Função ${functionName} não encontrada`,
            status: 404
          }
        };
      }
    },
    
    // Storage (simplificado - pode precisar de ajustes)
    storage: {
        from: (bucket) => {
          return {
            upload: async (path, file, options) => {
              // Por enquanto, retornar erro - storage precisa ser implementado
              return {
                data: null,
                error: { message: 'Storage não implementado ainda' }
              };
            },
            remove: async (paths) => {
              return {
                data: null,
                error: { message: 'Storage não implementado ainda' }
              };
            },
            getPublicUrl: (path) => {
              return {
                data: {
                  publicUrl: `${BACKEND_URL}/storage/${bucket}/${path}`
                }
              };
            }
          };
        }
    },
    
    // Realtime (simplificado)
    channel: (name) => {
        return {
          on: (event, filter, callback) => {
            // Por enquanto, não fazer nada - realtime precisa ser implementado
            console.warn('Realtime não implementado ainda');
            return {
              subscribe: () => ({})
            };
          },
          subscribe: () => ({})
        };
    }
  };
}
  
  // Interceptar createClient do Supabase ANTES de qualquer coisa
  // IMPORTANTE: Sobrescrever ANTES de qualquer código ser executado
  console.log('🔧 Configurando interceptação do createClient...');
  
  // Salvar referência original se existir
  const originalCreateClient = window.createClient;
  
  // Sobrescrever createClient
  window.createClient = function(url, key, options) {
    console.log('🔄 createClient CHAMADO - redirecionando para backend local');
    console.log('   URL original:', url);
    console.log('   Backend local:', BACKEND_URL);
    console.trace('Stack trace da chamada:');
    
    // Retornar cliente falso que redireciona para o backend
    return createFakeSupabaseClient();
  };
  
  console.log('✅ createClient interceptado');
  
  // Interceptar fetch para bloquear e redirecionar chamadas ao Supabase
  // IMPORTANTE: Isso deve ser feito ANTES de qualquer código ser executado
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const url = args[0];
    
    // Bloquear e redirecionar TODAS as chamadas ao Supabase
    if (typeof url === 'string') {
      // Detectar qualquer URL do Supabase (várias formas)
      const isSupabaseUrl = url.includes('supabase.co') || 
                           url.includes('qxgzazewwutbikmmpkms') || 
                           url.includes('/rest/v1/');
      
      if (isSupabaseUrl) {
        console.warn('⚠️ Chamada ao Supabase detectada:', url);
        
          // Redirecionar chamadas de autenticação para o backend local
          if (url.includes('/auth/v1/token')) {
            console.log('🔄 Redirecionando autenticação para backend local');
            
            // Extrair grant_type e dados do body
            const originalOptions = args[1] || {};
            let bodyData = {};
            
            // Tentar extrair da URL primeiro
            try {
              const urlObj = new URL(url);
              urlObj.searchParams.forEach((value, key) => {
                bodyData[key] = value;
              });
            } catch (e) {
              // URL pode não ser válida, continuar
            }
            
            if (originalOptions.body) {
              try {
                if (typeof originalOptions.body === 'string') {
                  // Tentar JSON primeiro
                  try {
                    bodyData = { ...bodyData, ...JSON.parse(originalOptions.body) };
                  } catch (e) {
                    // Se não for JSON, tentar URLSearchParams
                    try {
                      const params = new URLSearchParams(originalOptions.body);
                      params.forEach((value, key) => {
                        bodyData[key] = value;
                      });
                    } catch (e2) {
                      // Se não for nenhum dos dois, usar como está
                      bodyData.body = originalOptions.body;
                    }
                  }
                } else if (originalOptions.body instanceof FormData) {
                  // FormData - tentar extrair dados
                  const formData = originalOptions.body;
                  for (const [key, value] of formData.entries()) {
                    bodyData[key] = value;
                  }
                } else if (originalOptions.body instanceof URLSearchParams) {
                  // URLSearchParams
                  originalOptions.body.forEach((value, key) => {
                    bodyData[key] = value;
                  });
                } else {
                  bodyData = { ...bodyData, ...originalOptions.body };
                }
              } catch (e) {
                console.warn('Erro ao parsear body de autenticação:', e);
              }
            }
            
            console.log('📦 Dados de autenticação extraídos:', bodyData);
            
            // Verificar grant_type
            const grantType = bodyData.grant_type || 'password';
            
            if (grantType === 'password') {
              // Login com email e senha
              const newUrl = `${BACKEND_URL}/api/auth/signin`;
              const newArgs = [...args];
              newArgs[0] = newUrl;
              newArgs[1] = {
                ...originalOptions,
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(originalOptions.headers || {})
                },
                body: JSON.stringify({
                  email: bodyData.email || '',
                  password: bodyData.password || ''
                })
              };
              
              console.log('📡 Fazendo requisição de login para:', newUrl);
              
              try {
                const response = await originalFetch.apply(this, newArgs);
                const responseData = await response.json();
                
                // Formatar resposta no formato Supabase
                if (response.ok && responseData.token) {
                  // Salvar token
                  authToken = responseData.token;
                  localStorage.setItem('auth_token', JSON.stringify({ access_token: authToken }));
                  
                  // Retornar resposta no formato Supabase
                  return new Response(JSON.stringify({
                    access_token: responseData.token,
                    token_type: 'bearer',
                    expires_in: 3600,
                    refresh_token: responseData.token, // Usar o mesmo token como refresh
                    user: {
                      id: responseData.user?.id,
                      email: responseData.user?.email,
                      user_metadata: {
                        first_name: responseData.user?.firstName,
                        last_name: responseData.user?.lastName
                      }
                    }
                  }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                  });
                } else {
                  // Retornar erro no formato Supabase
                  return new Response(JSON.stringify({
                    error: responseData.error || 'Erro ao fazer login',
                    error_description: responseData.error || 'Erro ao fazer login'
                  }), {
                    status: response.status || 401,
                    headers: { 'Content-Type': 'application/json' }
                  });
                }
              } catch (error) {
                console.error('Erro ao fazer login:', error);
                return Promise.reject(error);
              }
            } else if (grantType === 'refresh_token') {
              // Refresh token - por enquanto, retornar erro
              return new Response(JSON.stringify({
                error: 'refresh_token_not_implemented',
                error_description: 'Refresh token não implementado ainda'
              }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }
          }
        
          // Redirecionar chamadas a Edge Functions para o backend local
          if (url.includes('/functions/v1/')) {
            const functionMatch = url.match(/\/functions\/v1\/([^\/\?]+)/);
            if (functionMatch && functionMatch[1]) {
              const functionName = functionMatch[1];
              const mapping = FUNCTION_MAP[functionName];
              
              if (mapping) {
                console.log(`🔄 Redirecionando função ${functionName} via proxy local → produção`);
                let newUrl = BACKEND_URL + mapping.path;
                console.log(`📡 Proxy redireciona para: ${BACKEND_PRODUCTION}${mapping.path}`);
                
                const newArgs = [...args];
                newArgs[0] = newUrl;
                
                // Ajustar método HTTP e preservar body
                const originalOptions = newArgs[1] || {};
                let originalBody = originalOptions.body;
                let billingId = null;
                
                // Para abacatepay-check-status, extrair billingId de várias fontes possíveis
                if (functionName === 'abacatepay-check-status') {
                  // 1. Tentar extrair da URL como query parameter
                  const billingIdMatch = url.match(/[?&]billingId=([^&]+)/);
                  if (billingIdMatch && billingIdMatch[1]) {
                    billingId = decodeURIComponent(billingIdMatch[1]);
                  }
                  
                  // 2. Se não encontrou na URL, tentar extrair do body
                  if (!billingId && originalBody) {
                    try {
                      let bodyData;
                      if (typeof originalBody === 'string') {
                        bodyData = JSON.parse(originalBody);
                      } else if (originalBody instanceof FormData) {
                        // FormData não pode ser parseado diretamente, pular
                        bodyData = null;
                      } else {
                        bodyData = originalBody;
                      }
                      
                      if (bodyData && bodyData.billingId) {
                        billingId = bodyData.billingId;
                      }
                    } catch (e) {
                      console.warn('⚠️ Erro ao processar body para abacatepay-check-status:', e);
                    }
                  }
                  
                  // 3. Verificar se o pagamento já foi confirmado para este billingId
                  if (billingId) {
                    const eventKey = `payment_confirmed_${billingId}`;
                    if (window[eventKey] || (window.paymentConfirmed && window.paymentConfirmedBillingId === billingId)) {
                      // Pagamento já foi confirmado, retornar resposta imediata sem fazer requisição
                      console.log(`✅ [FETCH] Pagamento já confirmado para ${billingId}, retornando resposta imediata`);
                      return Promise.resolve(new Response(JSON.stringify({
                        data: {
                          status: 'paid',
                          success: true,
                          stopPolling: true,
                          alreadyConfirmed: true
                        },
                        error: null
                      }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                      }));
                    }
                    
                    newUrl = newUrl + '/' + encodeURIComponent(billingId);
                    // Atualizar newArgs[0] com a URL completa incluindo o billingId
                    newArgs[0] = newUrl;
                    console.log(`✅ billingId extraído para abacatepay-check-status: ${billingId}`);
                  } else {
                    console.warn('⚠️ billingId não encontrado para abacatepay-check-status');
                  }
                }
                
                // Criar novos headers
                const headers = new Headers(originalOptions.headers);
                headers.delete('apikey');
                headers.set('Content-Type', 'application/json');
                const token = getAuthToken();
                if (token) {
                  headers.set('Authorization', `Bearer ${token}`);
                }
                
                // Criar novo objeto de opções
                newArgs[1] = {
                  ...originalOptions,
                  method: mapping.method,
                  headers: headers
                };
                
                // Preservar body se existir (pode ser string, FormData, Blob, etc.)
                // IMPORTANTE: GET/HEAD não podem ter body
                if (mapping.method !== 'GET' && mapping.method !== 'HEAD' && originalBody !== undefined && originalBody !== null) {
                  // Se já for string, manter como está
                  // Se for objeto, será stringified pelo fetch
                  newArgs[1].body = originalBody;
                } else if (mapping.method === 'GET' || mapping.method === 'HEAD') {
                  // Remover body explicitamente para requisições GET/HEAD
                  delete newArgs[1].body;
                }
                
                console.log(`📡 Fazendo requisição para: ${newUrl} (${mapping.method})`);
                
                // Fazer a requisição e formatar a resposta como Supabase Edge Function
                try {
                  const response = await originalFetch.apply(this, newArgs);
                  
                  console.log(`📥 [FETCH] Resposta recebida: status=${response.status}, ok=${response.ok}, url=${newUrl}`);
                  
                  // Clonar a resposta para poder ler o body múltiplas vezes
                  const clonedResponse = response.clone();
                  
                  if (!response.ok) {
                    // Se houver erro, formatar como erro do Supabase
                    let errorData;
                    try {
                      errorData = await clonedResponse.json();
                    } catch (e) {
                      errorData = { error: 'Erro desconhecido', message: response.statusText };
                    }
                    
                    return Promise.resolve(new Response(JSON.stringify({
                      data: null,
                      error: {
                        message: errorData.error || errorData.message || 'Erro na requisição',
                        status: response.status,
                        ...errorData
                      }
                    }), {
                      status: response.status,
                      headers: { 'Content-Type': 'application/json' }
                    }));
                  }
                  
                  // Se sucesso, formatar como resposta do Supabase
                  let responseData;
                  try {
                    responseData = await response.json();
                    console.log(`📦 [FETCH] Resposta recebida do backend para ${functionName}:`, JSON.stringify(responseData, null, 2));
                  } catch (parseError) {
                    console.error(`❌ [FETCH] Erro ao fazer parse da resposta JSON para ${functionName}:`, parseError);
                    const text = await response.text();
                    console.error(`❌ [FETCH] Conteúdo da resposta (texto):`, text);
                    throw parseError;
                  }
                  
                  // Se a resposta já estiver no formato { data, error }, usar diretamente
                  // Caso contrário, formatar como Supabase Edge Function
                  let finalData;
                  if (responseData && typeof responseData === 'object' && 'data' in responseData && 'error' in responseData) {
                    // Já está no formato correto
                    finalData = responseData;
                    
                    // Adicionar campos no nível superior para compatibilidade
                    // O frontend pode tentar acessar result.qr_code diretamente
                    if (finalData.data && typeof finalData.data === 'object') {
                      if (finalData.data.qr_code) {
                        finalData.qr_code = finalData.data.qr_code;
                      }
                      if (finalData.data.copia_cola) {
                        finalData.copia_cola = finalData.data.copia_cola;
                      }
                      if (finalData.data.billingId) {
                        finalData.billingId = finalData.data.billingId;
                      }
                      if (finalData.data.id) {
                        finalData.id = finalData.data.id;
                      }
                    }
                    
                    console.log(`✅ [FETCH] Retornando resposta formatada para ${functionName}:`, {
                      hasData: !!finalData.data,
                      hasQrCodeInData: !!(finalData.data && finalData.data.qr_code),
                      hasQrCodeInRoot: !!finalData.qr_code,
                      hasCopiaColaInData: !!(finalData.data && finalData.data.copia_cola),
                      hasCopiaColaInRoot: !!finalData.copia_cola
                    });
                  } else {
                    // Formatar resposta como Supabase Edge Function
                    // Para abacatepay-check-status, a resposta pode vir como { success, status, ... } ou { status, purchase }
                    if (functionName === 'abacatepay-check-status') {
                      if (responseData.status === 'paid' && responseData.purchase) {
                        // Status paid com purchase - disparar evento de confirmação APENAS UMA VEZ
                        // Usar billingId como chave única para evitar múltiplos eventos
                        const billingId = responseData.purchase.billing_id || responseData.purchase.id;
                        const eventKey = `payment_confirmed_${billingId}`;
                        
                        // Verificar se já foi disparado para este billingId
                        if (!window[eventKey]) {
                          window[eventKey] = true;
                          
                          finalData = {
                            data: {
                              status: responseData.status,
                              purchase: responseData.purchase,
                              success: true,
                              stopPolling: true // Flag para indicar que o polling deve parar
                            },
                            error: null
                          };
                          
                          // Disparar evento para mostrar overlay de sucesso
                          setTimeout(() => {
                            console.log('🎉 [FETCH] Pagamento confirmado detectado! Disparando evento...');
                            if (window.showPaymentSuccessOverlay) {
                              window.showPaymentSuccessOverlay();
                            }
                            window.dispatchEvent(new CustomEvent('paymentConfirmed', { 
                              detail: { 
                                status: 'paid',
                                purchase: responseData.purchase,
                                stopPolling: true
                              } 
                            }));
                          }, 100);
                        } else {
                          // Já foi disparado, apenas retornar os dados sem disparar evento novamente
                          // Retornar resposta que indica que o polling deve parar
                          finalData = {
                            data: {
                              status: responseData.status,
                              purchase: responseData.purchase,
                              success: true,
                              stopPolling: true,
                              alreadyConfirmed: true
                            },
                            error: null
                          };
                          console.log('✅ [FETCH] Pagamento já confirmado anteriormente, retornando resposta sem disparar evento');
                        }
                      } else if (responseData.status) {
                        // Status pending ou outro
                        finalData = {
                          data: {
                            status: responseData.status,
                            success: responseData.success,
                            details: responseData.details,
                            originalStatus: responseData.originalStatus
                          },
                          error: null
                        };
                      } else {
                        finalData = {
                          data: responseData,
                          error: null
                        };
                      }
                      console.log(`✅ [FETCH] Formatando resposta de abacatepay-check-status:`, finalData);
                    } else {
                      finalData = {
                        data: responseData,
                        error: null
                      };
                    }
                  }
                  
                  return Promise.resolve(new Response(JSON.stringify(finalData), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                  }));
                } catch (error) {
                  // Erro de rede ou parsing
                  console.error(`❌ [FETCH] Erro ao fazer requisição para ${functionName}:`, error);
                  console.error(`❌ [FETCH] URL: ${newUrl}`);
                  console.error(`❌ [FETCH] Método: ${mapping.method}`);
                  console.error(`❌ [FETCH] Stack:`, error.stack);
                  return Promise.resolve(new Response(JSON.stringify({
                    data: null,
                    error: {
                      message: error.message || 'Erro de conexão',
                      status: 0
                    }
                  }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                  }));
                }
              } else {
                console.warn(`⚠️ Função ${functionName} não mapeada - bloqueando`);
              }
            }
          }
        
          // BLOQUEAR Supabase e redirecionar via proxy local (que vai para produção)
          if (url.includes('/rest/v1/courses') || (url.includes('courses') && url.includes('supabase'))) {
            console.log('🔄 Bloqueando Supabase e redirecionando via proxy local → backend de produção');
            // Usar proxy local que redireciona para backend de produção (resolve CORS)
            try {
              const urlObj = new URL(url);
              const queryString = urlObj.search; // inclui o "?"
              // Construir nova URL usando proxy local (que faz proxy para produção)
              let newUrl = BACKEND_URL + '/api/courses' + queryString;
              console.log('📡 Requisição via proxy local:', newUrl);
              console.log('📡 Proxy redireciona para:', BACKEND_PRODUCTION + '/api/courses' + queryString);
              
              const newArgs = [...args];
              newArgs[0] = newUrl;
              
              // Ajustar headers se necessário
              if (newArgs[1] && newArgs[1].headers) {
                const headers = new Headers(newArgs[1].headers);
                headers.delete('apikey');
                headers.delete('Accept');
                const authHeader = headers.get('Authorization');
                if (authHeader && !authHeader.includes('Bearer')) {
                  headers.delete('Authorization');
                }
                newArgs[1] = { ...newArgs[1], headers };
              } else if (newArgs[1]) {
                newArgs[1] = { ...newArgs[1], headers: {} };
              }
              
              console.log('✅ Chamando via proxy local (→ produção):', newUrl);
              return originalFetch.apply(this, newArgs);
            } catch (e) {
              console.error('❌ Erro ao processar URL:', e);
              // Fallback: construir URL simples
              const queryString = url.includes('?') ? '?' + url.split('?')[1] : '';
              let newUrl = BACKEND_URL + '/api/courses' + queryString;
              const newArgs = [...args];
              newArgs[0] = newUrl;
              return originalFetch.apply(this, newArgs);
            }
          }
          
          // BLOQUEAR Supabase e redirecionar course_materials via proxy local
          if (url.includes('/rest/v1/course_materials') || (url.includes('course_materials') && url.includes('supabase'))) {
            console.log('🔄 Bloqueando Supabase e redirecionando course_materials via proxy local → produção');
            try {
              const urlObj = new URL(url);
              const queryString = urlObj.search;
              let newUrl = BACKEND_URL + '/api/materials' + queryString;
              console.log('📡 Requisição via proxy local:', newUrl);
              console.log('📡 Proxy redireciona para:', BACKEND_PRODUCTION + '/api/materials' + queryString);
              
              const newArgs = [...args];
              newArgs[0] = newUrl;
              
              // Ajustar headers se necessário
              if (newArgs[1] && newArgs[1].headers) {
                const headers = new Headers(newArgs[1].headers);
                headers.delete('apikey');
                headers.delete('Accept');
                const authHeader = headers.get('Authorization');
                if (authHeader && !authHeader.includes('Bearer')) {
                  headers.delete('Authorization');
                }
                newArgs[1] = { ...newArgs[1], headers };
              } else if (newArgs[1]) {
                newArgs[1] = { ...newArgs[1], headers: {} };
              }
              
              console.log('✅ Chamando via proxy local (→ produção):', newUrl);
              return originalFetch.apply(this, newArgs);
            } catch (e) {
              console.error('❌ Erro ao processar URL:', e);
              const queryString = url.includes('?') ? '?' + url.split('?')[1] : '';
              let newUrl = BACKEND_URL + '/api/materials' + queryString;
              const newArgs = [...args];
              newArgs[0] = newUrl;
              return originalFetch.apply(this, newArgs);
            }
          }
        
        // Bloquear TODAS as outras chamadas ao Supabase
        if (url.includes('supabase.co') || url.includes('qxgzazewwutbikmmpkms')) {
          console.warn('⚠️ BLOQUEANDO chamada ao Supabase:', url);
          console.warn('⚠️ Supabase foi REMOVIDO do sistema. Use o backend de produção:', BACKEND_URL);
          return Promise.reject(new Error('Supabase foi removido. Use o backend de produção: ' + BACKEND_URL));
        }
      }
    }
    
    return originalFetch.apply(this, args);
  };
  
  // Tornar fetch não configurável para evitar sobrescrita
  try {
    Object.defineProperty(window, 'fetch', {
      value: window.fetch,
      writable: false,
      configurable: false
    });
  } catch (e) {
    // Se não conseguir, continuar normalmente
    console.warn('Não foi possível tornar fetch não configurável:', e);
  }
  
  console.log('✅ Fetch interceptado - todas as chamadas ao Supabase serão bloqueadas/redirecionadas');
  
  // Interceptar quando matrícula é encontrada (pagamento confirmado)
  const originalFrom = window.createClient ? null : null;
  
  // Adicionar listener global para detectar confirmação de pagamento
  window.addEventListener('paymentConfirmed', (event) => {
    console.log('🎉 Pagamento confirmado detectado!');
    showPaymentSuccessOverlay();
  });
  
  // Função para exibir overlay de sucesso
  function showPaymentSuccessOverlay() {
    // Remover overlay existente
    const existing = document.getElementById('payment-success-overlay');
    if (existing) {
      existing.remove();
    }
    
    // Criar overlay
    const overlay = document.createElement('div');
    overlay.id = 'payment-success-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      animation: fadeIn 0.3s ease-in;
    `;
    
    // Criar card
    const card = document.createElement('div');
    card.style.cssText = `
      background: white;
      border-radius: 20px;
      padding: 48px 32px;
      max-width: 520px;
      width: 90%;
      text-align: center;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
      animation: slideUp 0.4s ease-out;
    `;
    
    // Ícone de sucesso
    const icon = document.createElement('div');
    icon.style.cssText = `
      width: 100px;
      height: 100px;
      margin: 0 auto 24px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: scaleIn 0.5s ease-out 0.2s both;
      box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
    `;
    icon.innerHTML = `
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
    
    // Título
    const title = document.createElement('h2');
    title.textContent = '🎉 Pagamento Recebido com Sucesso!';
    title.style.cssText = `
      font-size: 28px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 16px;
      line-height: 1.2;
    `;
    
    // Mensagem
    const message = document.createElement('p');
    message.textContent = 'Seu pagamento foi confirmado e o acesso ao curso foi liberado. Você será redirecionado em instantes...';
    message.style.cssText = `
      font-size: 16px;
      color: #6b7280;
      margin-bottom: 32px;
      line-height: 1.6;
    `;
    
    // Indicador de carregamento
    const loader = document.createElement('div');
    loader.style.cssText = `
      width: 48px;
      height: 48px;
      margin: 0 auto;
      border: 4px solid #e5e7eb;
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    `;
    
    // Adicionar elementos
    card.appendChild(icon);
    card.appendChild(title);
    card.appendChild(message);
    card.appendChild(loader);
    overlay.appendChild(card);
    
    // Adicionar estilos de animação
    if (!document.getElementById('payment-success-styles')) {
      const style = document.createElement('style');
      style.id = 'payment-success-styles';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            transform: translateY(40px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Adicionar ao body
    document.body.appendChild(overlay);
    
    // Remover após 4 segundos
    setTimeout(() => {
      if (overlay && overlay.parentNode) {
        overlay.style.animation = 'fadeOut 0.3s ease-in';
        setTimeout(() => {
          overlay.remove();
        }, 300);
      }
    }, 4000);
  }
  
  // Expor função globalmente
  window.showPaymentSuccessOverlay = showPaymentSuccessOverlay;
  
  console.log('✅ Sistema carregado - SUPABASE REMOVIDO');
  console.log('📡 Backend de produção:', BACKEND_PRODUCTION);
  console.log('📡 Proxy local:', BACKEND_URL);
  console.log('⚠️ IMPORTANTE: Requisições via proxy local (resolve CORS) →', BACKEND_PRODUCTION);
  console.log('🚫 SUPABASE COMPLETAMENTE BLOQUEADO E REMOVIDO');
  console.log('✅ Payment Success Overlay disponível!');
  console.log('🔒 Fetch e createClient interceptados - Supabase bloqueado!');
  
  // Garantir que o replacement está ativo antes do código principal
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('📄 DOM carregado - Replacement ativo!');
    });
  } else {
    console.log('📄 DOM já carregado - Replacement ativo!');
  }
})();

