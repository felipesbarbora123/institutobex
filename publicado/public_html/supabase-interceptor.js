/**
 * Interceptor para redirecionar chamadas do Supabase para o novo backend
 * Este arquivo será injetado no index.html antes do código compilado
 */

(function() {
  'use strict';
  
  // Interceptar localStorage para detectar limpezas
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;
  const originalClear = Storage.prototype.clear;
  
  Storage.prototype.setItem = function(key, value) {
    if (key === 'auth_token' || key === 'sb-auth-token') {
      console.log('💾 [LOCALSTORAGE] setItem chamado:', {
        key: key,
        valueLength: value ? value.length : 0,
        timestamp: new Date().toISOString(),
        stack: new Error().stack
      });
    }
    return originalSetItem.call(this, key, value);
  };
  
  Storage.prototype.removeItem = function(key) {
    if (key === 'auth_token' || key === 'sb-auth-token') {
      console.warn('⚠️ [LOCALSTORAGE] removeItem chamado para chave de autenticação:', {
        key: key,
        timestamp: new Date().toISOString(),
        stack: new Error().stack
      });
    }
    return originalRemoveItem.call(this, key);
  };
  
  Storage.prototype.clear = function() {
    console.warn('⚠️ [LOCALSTORAGE] clear() chamado - TODOS os dados serão removidos!', {
      timestamp: new Date().toISOString(),
      stack: new Error().stack
    });
    return originalClear.call(this);
  };
  
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
  let currentUser = null;
  
  // FUNÇÃO HELPER GLOBAL: Sempre retorna o usuário do localStorage (síncrona e confiável)
  // Esta função é usada pelo Profile e outros componentes para verificar autenticação
  function getAuthUserFromStorage() {
    console.log('🔍 [getAuthUserFromStorage] ========== INÍCIO ==========');
    console.log('🔍 [getAuthUserFromStorage] Timestamp:', new Date().toISOString());
    
    try {
      console.log('🔍 [getAuthUserFromStorage] Tentando ler localStorage...');
      const authTokenKey = localStorage.getItem('auth_token');
      const sbAuthTokenKey = localStorage.getItem('sb-auth-token');
      
      console.log('🔍 [getAuthUserFromStorage] Resultado da leitura:', {
        auth_token: authTokenKey ? `EXISTE (${authTokenKey.length} chars)` : 'NÃO EXISTE',
        sb_auth_token: sbAuthTokenKey ? `EXISTE (${sbAuthTokenKey.length} chars)` : 'NÃO EXISTE'
      });
      
      const authDataStr = authTokenKey || sbAuthTokenKey;
      
      if (authDataStr) {
        console.log('🔍 [getAuthUserFromStorage] Dados encontrados, tentando parsear...');
        try {
          const authData = JSON.parse(authDataStr);
          console.log('🔍 [getAuthUserFromStorage] Dados parseados:', {
            hasUser: !!authData.user,
            userId: authData.user?.id,
            userEmail: authData.user?.email,
            hasAccessToken: !!authData.access_token,
            hasToken: !!authData.token,
            expiresAt: authData.expires_at,
            expiresAtDate: authData.expires_at ? new Date(authData.expires_at).toISOString() : null
          });
          
          // Verificar se o token não expirou
          const expiresAt = authData.expires_at;
          const now = Date.now();
          const isExpired = expiresAt && now > expiresAt;
          
          console.log('🔍 [getAuthUserFromStorage] Verificação de expiração:', {
            expiresAt,
            now,
            isExpired,
            timeUntilExpiry: expiresAt ? (expiresAt - now) / 1000 / 60 : null // minutos
          });
          
          if (authData.user && (authData.access_token || authData.token) && !isExpired) {
            // Atualizar cache global
            currentUser = authData.user;
            authToken = authData.access_token || authData.token;
            console.log('✅ [getAuthUserFromStorage] Usuário válido encontrado:', {
              userId: currentUser.id,
              email: currentUser.email,
              tokenLength: authToken ? authToken.length : 0
            });
            console.log('🔍 [getAuthUserFromStorage] ========== FIM (SUCESSO) ==========');
            return {
              user: authData.user,
              loading: false
            };
          } else if (isExpired) {
            console.warn('⚠️ [getAuthUserFromStorage] Token expirado, limpando localStorage');
            console.warn('⚠️ [getAuthUserFromStorage] Detalhes:', {
              expiresAt,
              now,
              expiredMinutesAgo: (now - expiresAt) / 1000 / 60
            });
            localStorage.removeItem('auth_token');
            localStorage.removeItem('sb-auth-token');
            currentUser = null;
            authToken = null;
            console.log('🔍 [getAuthUserFromStorage] ========== FIM (EXPIRADO) ==========');
          } else {
            console.warn('⚠️ [getAuthUserFromStorage] Dados incompletos:', {
              hasUser: !!authData.user,
              hasAccessToken: !!authData.access_token,
              hasToken: !!authData.token
            });
            console.log('🔍 [getAuthUserFromStorage] ========== FIM (DADOS INCOMPLETOS) ==========');
          }
        } catch (e) {
          console.error('❌ [getAuthUserFromStorage] Erro ao parsear localStorage:', e);
          console.error('❌ [getAuthUserFromStorage] Stack:', e.stack);
          console.log('🔍 [getAuthUserFromStorage] ========== FIM (ERRO PARSE) ==========');
        }
      } else {
        console.log('⚠️ [getAuthUserFromStorage] Nenhum dado encontrado no localStorage');
        console.log('🔍 [getAuthUserFromStorage] ========== FIM (SEM DADOS) ==========');
      }
    } catch (e) {
      console.error('❌ [getAuthUserFromStorage] Erro ao ler localStorage:', e);
      console.error('❌ [getAuthUserFromStorage] Stack:', e.stack);
      console.log('🔍 [getAuthUserFromStorage] ========== FIM (ERRO LEITURA) ==========');
    }
    
    // Se não encontrou no localStorage, verificar cache global
    console.log('🔍 [getAuthUserFromStorage] Verificando cache global:', {
      hasCurrentUser: !!currentUser,
      userId: currentUser?.id,
      hasAuthToken: !!authToken
    });
    
    if (currentUser) {
      console.log('✅ [getAuthUserFromStorage] Usuário encontrado no cache global:', currentUser.id);
      console.log('🔍 [getAuthUserFromStorage] ========== FIM (CACHE GLOBAL) ==========');
      return {
        user: currentUser,
        loading: false
      };
    }
    
    console.log('⚠️ [getAuthUserFromStorage] Nenhum usuário encontrado, retornando loading=true');
    console.log('🔍 [getAuthUserFromStorage] ========== FIM (SEM USUÁRIO) ==========');
    return {
      user: null,
      loading: true
    };
  }
  
  // Expor função helper globalmente - CRÍTICO para o Profile funcionar
  if (typeof window !== 'undefined') {
    window.getAuthUserFromStorage = getAuthUserFromStorage;
    
    // GARANTIR que a função está disponível ANTES do Profile ser carregado
    Object.defineProperty(window, 'getAuthUserFromStorage', {
      value: getAuthUserFromStorage,
      writable: false,
      configurable: false,
      enumerable: true
    });
    
    // Interceptar localStorage.getItem para detectar quando o código compilado verifica autenticação
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function(key) {
      if (key === 'auth_token' || key === 'sb-auth-token') {
        const value = originalGetItem.call(this, key);
        console.log('🔍 [LOCALSTORAGE] getItem chamado:', {
          key: key,
          timestamp: new Date().toISOString(),
          hasValue: !!value,
          valueLength: value ? value.length : 0,
          stack: new Error().stack.split('\n').slice(0, 5).join('\n') // Primeiras 5 linhas do stack
        });
        return value;
      }
      return originalGetItem.call(this, key);
    };
    
    // Interceptar navegação para prevenir redirecionamentos indevidos
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      const [state, title, url] = args;
      console.log('🔍 [NAVIGATION] pushState chamado:', {
        url: url,
        timestamp: new Date().toISOString(),
        stack: new Error().stack.split('\n').slice(0, 5).join('\n')
      });
      
      // Se tentar navegar para /auth, verificar se há token primeiro
      if (url && typeof url === 'string' && url.includes('/auth')) {
        const token = getAuthToken();
        const user = getAuthUserFromStorage();
        console.log('⚠️ [NAVIGATION] Tentativa de navegar para /auth:', {
          hasToken: !!token,
          hasUser: !!user.user,
          userId: user.user?.id
        });
        
        if (user.user && token) {
          console.warn('🚫 [NAVIGATION] Bloqueando redirecionamento para /auth - usuário autenticado!');
          return; // Bloquear redirecionamento
        }
      }
      
      return originalPushState.apply(this, args);
    };
    
    history.replaceState = function(...args) {
      const [state, title, url] = args;
      console.log('🔍 [NAVIGATION] replaceState chamado:', {
        url: url,
        timestamp: new Date().toISOString(),
        stack: new Error().stack.split('\n').slice(0, 5).join('\n')
      });
      
      // Se tentar navegar para /auth, verificar se há token primeiro
      if (url && typeof url === 'string' && url.includes('/auth')) {
        const token = getAuthToken();
        const user = getAuthUserFromStorage();
        console.log('⚠️ [NAVIGATION] Tentativa de navegar para /auth:', {
          hasToken: !!token,
          hasUser: !!user.user,
          userId: user.user?.id
        });
        
        if (user.user && token) {
          console.warn('🚫 [NAVIGATION] Bloqueando redirecionamento para /auth - usuário autenticado!');
          return; // Bloquear redirecionamento
        }
      }
      
      return originalReplaceState.apply(this, args);
    };
    
    // Interceptar window.location.href para prevenir redirecionamentos
    // REMOVIDO: Não podemos redefinir window.location diretamente (causa erro)
    // Vamos usar apenas history.pushState/replaceState que já estão interceptados acima
    
    /* REMOVIDO - Tentativa de redefinir window.location (não funciona)
    let locationDescriptor = Object.getOwnPropertyDescriptor(window, 'location') || 
                            Object.getOwnPropertyDescriptor(Object.getPrototypeOf(window), 'location');
    
    if (locationDescriptor && locationDescriptor.set) {
      const originalLocationSetter = locationDescriptor.set;
      Object.defineProperty(window, 'location', {
        get: locationDescriptor.get,
        set: function(value) {
          console.log('🔍 [NAVIGATION] window.location sendo alterado:', {
            value: value,
            timestamp: new Date().toISOString(),
            stack: new Error().stack.split('\n').slice(0, 5).join('\n')
          });
          
          // Se tentar navegar para /auth, verificar se há token primeiro
          if (value && typeof value === 'string' && value.includes('/auth')) {
            const token = getAuthToken();
            const user = getAuthUserFromStorage();
            console.log('⚠️ [NAVIGATION] Tentativa de alterar location para /auth:', {
              hasToken: !!token,
              hasUser: !!user.user,
              userId: user.user?.id
            });
            
            if (user.user && token) {
              console.warn('🚫 [NAVIGATION] Bloqueando alteração de location para /auth - usuário autenticado!');
              return; // Bloquear redirecionamento
            }
          }
          
          return originalLocationSetter.call(window, value);
        },
        configurable: true
      });
    }
    */ // Fim do código removido
  }
  
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

  // Função para obter token de autenticação (igual ao supabase-replacement.js)
  function getAuthToken() {
    if (authToken) {
      console.log('🔑 [AUTH] Token encontrado em memória');
      return authToken;
    }
    
    console.log('🔍 [AUTH] Buscando token no localStorage...');
    
    // Tentar obter do localStorage (prioridade para auth_token e sb-auth-token)
    try {
      // Primeiro tentar as chaves mais comuns
      const commonKeys = ['auth_token', 'sb-auth-token'];
      console.log('🔍 [AUTH] Verificando chaves padrão:', commonKeys);
      
      for (const key of commonKeys) {
        try {
          const value = localStorage.getItem(key);
          console.log(`🔍 [AUTH] Chave "${key}":`, value ? 'encontrada' : 'não encontrada');
          
          if (value) {
            const parsed = JSON.parse(value);
            console.log(`🔍 [AUTH] Conteúdo parseado de "${key}":`, {
              hasAccessToken: !!parsed.access_token,
              hasToken: !!parsed.token,
              hasUser: !!parsed.user,
              userId: parsed.user?.id
            });
            
            if (parsed && (parsed.access_token || parsed.token)) {
              authToken = parsed.access_token || parsed.token;
              // Sempre atualizar o usuário se estiver no localStorage
              if (parsed.user) {
                currentUser = parsed.user;
              }
              console.log('✅ [AUTH] Token encontrado na chave:', key);
              return authToken;
            }
          }
        } catch (e) {
          console.error('❌ [getAuthToken] Erro ao parsear', key, ':', e);
        }
      }
      
      // Depois, tentar diferentes formatos de chave do Supabase
      const allKeys = Object.keys(localStorage);
      console.log('🔍 [AUTH] Todas as chaves do localStorage:', allKeys);
      
      // Verificar conteúdo de todas as chaves relacionadas a auth/supabase
      allKeys.forEach(key => {
        if (key.toLowerCase().includes('auth') || key.toLowerCase().includes('supabase') || key.toLowerCase().includes('session')) {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              const parsed = JSON.parse(value);
              console.log(`🔍 [AUTH] Chave "${key}":`, {
                hasAccessToken: !!parsed.access_token,
                hasToken: !!parsed.token,
                hasUser: !!parsed.user,
                userId: parsed.user?.id,
                email: parsed.user?.email
              });
            }
          } catch (e) {
            console.log(`🔍 [AUTH] Chave "${key}": não é JSON válido`);
          }
        }
      });
      
      const keys = allKeys.filter(key => 
        (key.includes('auth-token') || key.includes('supabase')) && 
        !defaultKeys.includes(key)
      );
      
      console.log('🔍 [AUTH] Chaves do Supabase encontradas:', keys);
      
      for (const key of keys) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            if (parsed && (parsed.access_token || parsed.token)) {
              authToken = parsed.access_token || parsed.token;
              console.log('✅ [AUTH] Token encontrado na chave Supabase:', key);
              return authToken;
            }
          }
        } catch (e) {
          console.warn(`⚠️ [AUTH] Erro ao processar chave Supabase "${key}":`, e);
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
                console.log('💾 [AUTH] Salvando token no localStorage...');
                console.log('💾 [AUTH] Resposta do backend:', {
                  hasToken: !!data.token,
                  hasUser: !!data.user,
                  userId: data.user?.id,
                  email: data.user?.email
                });
                
                // Tentar encontrar chave existente do Supabase
                const allKeys = Object.keys(localStorage);
                console.log('💾 [AUTH] Chaves existentes no localStorage:', allKeys);
                
                const supabaseKey = allKeys.find(key => 
                  key.includes('supabase') && key.includes('auth-token')
                );
                
                console.log('💾 [AUTH] Chave Supabase encontrada:', supabaseKey || 'nenhuma');
                
                // Salvar na chave encontrada ou criar novas chaves padrão
                if (supabaseKey) {
                  localStorage.setItem(supabaseKey, JSON.stringify(supabaseResponse));
                  console.log('✅ [AUTH] Token salvo na chave Supabase:', supabaseKey);
                }
                
                // Adicionar expires_at para verificação de expiração
                supabaseResponse.expires_at = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 dias
                
                // SEMPRE criar chaves padrão que o código compilado espera
                localStorage.setItem('auth_token', JSON.stringify(supabaseResponse));
                localStorage.setItem('sb-auth-token', JSON.stringify(supabaseResponse));
                console.log('✅ [AUTH] Token salvo nas chaves padrão: auth_token e sb-auth-token');
                
                // Atualizar cache global
                currentUser = supabaseResponse.user;
                authToken = data.token;
                
                // Verificar se foi salvo corretamente
                console.log('🔍 [AUTH] Verificando se foi salvo corretamente...');
                const verifyAuthToken = localStorage.getItem('auth_token');
                const verifySbToken = localStorage.getItem('sb-auth-token');
                console.log('🔍 [AUTH] Verificação após salvar:', {
                  auth_token: verifyAuthToken ? `salvo (${verifyAuthToken.length} chars)` : 'não salvo',
                  sb_auth_token: verifySbToken ? `salvo (${verifySbToken.length} chars)` : 'não salvo'
                });
                
                // Verificar conteúdo parseado
                if (verifyAuthToken) {
                  try {
                    const parsedVerify = JSON.parse(verifyAuthToken);
                    console.log('🔍 [AUTH] Conteúdo verificado (auth_token):', {
                      hasUser: !!parsedVerify.user,
                      userId: parsedVerify.user?.id,
                      hasAccessToken: !!parsedVerify.access_token,
                      expiresAt: parsedVerify.expires_at,
                      expiresAtDate: parsedVerify.expires_at ? new Date(parsedVerify.expires_at).toISOString() : null
                    });
                  } catch (e) {
                    console.error('❌ [AUTH] Erro ao parsear verificação:', e);
                  }
                }
                
                // Disparar evento para notificar mudança de autenticação
                console.log('📢 [AUTH] Disparando eventos de mudança de autenticação...');
                window.dispatchEvent(new Event('auth-state-changed'));
                
                // Criar evento customizado com detalhes
                window.dispatchEvent(new CustomEvent('auth-state-changed', {
                  detail: {
                    event: 'SIGNED_IN',
                    session: {
                      access_token: authToken,
                      user: currentUser
                    }
                  }
                }));
                
                // Criar evento storage manualmente
                try {
                  const storageEvent = new StorageEvent('storage', {
                    key: 'auth_token',
                    newValue: JSON.stringify(supabaseResponse),
                    oldValue: null,
                    storageArea: localStorage
                  });
                  window.dispatchEvent(storageEvent);
                  console.log('✅ [AUTH] Evento storage disparado');
                } catch (e) {
                  console.warn('⚠️ [AUTH] Erro ao criar evento storage:', e);
                }
                
                console.log('✅ [AUTH] Token salvo em memória:', authToken ? 'sim' : 'não');
                console.log('✅ [AUTH] Usuário atualizado:', currentUser?.id);
              } catch (e) {
                console.error('❌ [AUTH] Erro ao salvar token:', e);
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
          
          // Preparar body - tentar de várias formas
          let body = options.body;
          if (body && typeof body === 'string') {
            try {
              body = JSON.parse(body);
            } catch (e) {
              // Manter como string se não for JSON
            }
          }
          
          // Log para debug
          const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          console.log('═══════════════════════════════════════════════════════════════');
          console.log(`🔍 [EDGE-FUNCTION-${requestId}] ========== INTERCEPTAÇÃO ==========`);
          console.log(`🔍 [EDGE-FUNCTION-${requestId}] Função: ${functionName}`);
          console.log(`🔍 [EDGE-FUNCTION-${requestId}] URL original: ${url}`);
          console.log(`🔍 [EDGE-FUNCTION-${requestId}] Método mapeado: ${mapping.method}`);
          console.log(`🔍 [EDGE-FUNCTION-${requestId}] Path mapeado: ${mapping.path}`);
          console.log(`🔍 [EDGE-FUNCTION-${requestId}] Body recebido:`, {
            bodyType: typeof body,
            bodyValue: body,
            bodyString: typeof body === 'string' ? body.substring(0, 200) : null,
            hasBillingId: body && body.billingId ? true : false,
            billingId: body && body.billingId ? body.billingId : null,
            bodyKeys: body && typeof body === 'object' ? Object.keys(body) : null
          });
          console.log(`🔍 [EDGE-FUNCTION-${requestId}] Options completas:`, {
            method: options.method,
            headers: options.headers ? Object.keys(options.headers) : null,
            hasBody: !!options.body,
            bodyType: typeof options.body
          });
          
          // Para GET com parâmetros na URL (abacatepay-check-status)
          if (mapping.method === 'GET' && functionName === 'abacatepay-check-status') {
            let billingId = null;
            
            // Tentar extrair billingId do body
            if (body && body.billingId) {
              billingId = body.billingId;
            } else if (body && typeof body === 'object' && body.body && body.body.billingId) {
              // Se o body está aninhado (alguns casos do Supabase)
              billingId = body.body.billingId;
            } else if (options.body && typeof options.body === 'string') {
              // Tentar parsear novamente
              try {
                const parsed = JSON.parse(options.body);
                if (parsed.billingId) {
                  billingId = parsed.billingId;
                } else if (parsed.body && parsed.body.billingId) {
                  billingId = parsed.body.billingId;
                }
              } catch (e) {
                // Ignorar erro
              }
            }
            
            if (billingId) {
              newUrl = newUrl + '/' + encodeURIComponent(billingId);
              console.log(`✅ [EDGE-FUNCTION-${requestId}] billingId extraído: ${billingId}`);
              console.log(`✅ [EDGE-FUNCTION-${requestId}] URL final construída: ${newUrl}`);
            } else {
              console.warn(`⚠️ [EDGE-FUNCTION-${requestId}] billingId não encontrado no body para ${functionName}`);
              console.warn(`⚠️ [EDGE-FUNCTION-${requestId}] Tentativas de extração falharam`);
            }
          }
          
          console.log(`🔄 [EDGE-FUNCTION-${requestId}] Interceptando chamada do Supabase: ${functionName} → ${newUrl}`);
          
          // Preparar headers
          const token = getAuthToken();
          console.log(`🔑 [EDGE-FUNCTION-${requestId}] Token para requisição:`, token ? `${token.substring(0, 20)}...` : 'não encontrado');
          
          const headers = {
            ...options.headers,
            'Authorization': `Bearer ${token || ''}`,
            'Content-Type': 'application/json'
          };
          
          // Se usar proxy PHP, adicionar header com URL real
          if (BACKEND_URL.includes('api-proxy')) {
            // Extrair billingId novamente para o header
            let billingIdForHeader = null;
            if (body && body.billingId) {
              billingIdForHeader = body.billingId;
            } else if (body && typeof body === 'object' && body.body && body.body.billingId) {
              billingIdForHeader = body.body.billingId;
            }
            
            const realUrl = BACKEND_BASE + mapping.path + (billingIdForHeader ? '/' + encodeURIComponent(billingIdForHeader) : '');
            headers['X-Backend-URL'] = realUrl;
            headers['X-Backend-Method'] = mapping.method;
            console.log(`📤 [EDGE-FUNCTION-${requestId}] URL real para backend: ${realUrl}`);
            console.log(`📤 [EDGE-FUNCTION-${requestId}] Headers X-Backend-URL: ${realUrl}`);
            console.log(`📤 [EDGE-FUNCTION-${requestId}] Headers X-Backend-Method: ${mapping.method}`);
          }
          
          // Para GET, não enviar body
          const fetchOptions = {
            ...options,
            method: mapping.method,
            headers: headers
          };
          
          // Apenas adicionar body se não for GET
          if (mapping.method !== 'GET') {
            fetchOptions.body = typeof body === 'object' ? JSON.stringify(body) : body;
            console.log(`📤 [EDGE-FUNCTION-${requestId}] Body será enviado (método: ${mapping.method})`);
          } else {
            console.log(`📤 [EDGE-FUNCTION-${requestId}] Body NÃO será enviado (método: GET)`);
          }
          
          console.log(`📤 [EDGE-FUNCTION-${requestId}] Opções finais da requisição:`, {
            method: fetchOptions.method,
            url: newUrl,
            hasHeaders: !!fetchOptions.headers,
            headersCount: fetchOptions.headers ? Object.keys(fetchOptions.headers).length : 0,
            hasBody: !!fetchOptions.body,
            bodyLength: fetchOptions.body ? (typeof fetchOptions.body === 'string' ? fetchOptions.body.length : 'object') : 0
          });
          console.log(`🚀 [EDGE-FUNCTION-${requestId}] Enviando requisição...`);
          console.log('═══════════════════════════════════════════════════════════════');
          
          const fetchStart = Date.now();
          const response = await originalFetch(newUrl, fetchOptions);
          const fetchDuration = Date.now() - fetchStart;
          
          console.log(`✅ [EDGE-FUNCTION-${requestId}] Resposta recebida em ${fetchDuration}ms`);
          console.log(`📥 [EDGE-FUNCTION-${requestId}] Status: ${response.status} ${response.statusText}`);
          console.log(`📥 [EDGE-FUNCTION-${requestId}] Headers da resposta:`, {
            contentType: response.headers.get('content-type'),
            hasBody: response.body ? 'SIM' : 'NÃO'
          });
          
          return response;
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
          
          const token = getAuthToken();
          console.log('🔑 [AUTH] Token para requisição (REST API):', token ? `${token.substring(0, 20)}...` : 'não encontrado');
          
          const headers = {
            ...options.headers,
            'Authorization': `Bearer ${token || ''}`,
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
        
        const token = getAuthToken();
        console.log('🔑 [AUTH] Token para requisição (localhost:3000):', token ? `${token.substring(0, 20)}...` : 'não encontrado');
        
        const headers = {
          ...options.headers,
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        };
        
        // Se usar proxy PHP, adicionar header com URL real
        if (BACKEND_URL.includes('api-proxy')) {
          headers['X-Backend-URL'] = BACKEND_BASE + '/api/' + restPath;
          headers['X-Backend-Method'] = options.method || 'GET';
        }
        
        console.log('📤 [AUTH] Headers da requisição localhost:', {
          hasAuthorization: !!headers.Authorization,
          authorizationLength: headers.Authorization?.length || 0,
          url: newUrl
        });
        
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

  // Função para inicializar autenticação (igual ao supabase-replacement.js)
  async function initializeAuth() {
    console.log('🔐 [initializeAuth] ========== INÍCIO ==========');
    console.log('🔐 [initializeAuth] Timestamp:', new Date().toISOString());
    console.log('🔐 [initializeAuth] Estado atual:', {
      hasCurrentUser: !!currentUser,
      hasAuthToken: !!authToken,
      userId: currentUser?.id
    });
    
    // Carregar token e usuário do localStorage
    console.log('🔐 [initializeAuth] Chamando getAuthToken()...');
    const token = getAuthToken();
    console.log('🔐 [initializeAuth] Resultado getAuthToken():', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenPreview: token ? token.substring(0, 20) + '...' : null
    });
    
    if (token) {
      // Tentar obter usuário do localStorage primeiro
      try {
        console.log('🔐 [initializeAuth] Tentando obter usuário do localStorage...');
        const authDataStr = localStorage.getItem('auth_token') || localStorage.getItem('sb-auth-token');
        console.log('🔐 [initializeAuth] Dados do localStorage:', {
          hasAuthDataStr: !!authDataStr,
          length: authDataStr ? authDataStr.length : 0
        });
        
        if (authDataStr) {
          const authData = JSON.parse(authDataStr);
          console.log('🔐 [initializeAuth] Dados parseados:', {
            hasUser: !!authData.user,
            userId: authData.user?.id,
            userEmail: authData.user?.email,
            hasAccessToken: !!authData.access_token,
            hasToken: !!authData.token
          });
          
          if (authData.user) {
            currentUser = authData.user;
            authToken = authData.access_token || authData.token;
            console.log('✅ [initializeAuth] Usuário autenticado carregado do localStorage:', {
              userId: currentUser.id,
              email: currentUser.email,
              tokenLength: authToken ? authToken.length : 0
            });
            
            // Disparar evento para notificar hooks que podem estar esperando
            const authEventDetail = { 
              event: 'SIGNED_IN', 
              session: { 
                access_token: authToken, 
                user: currentUser 
              } 
            };
            
            console.log('🔐 [initializeAuth] Disparando evento auth-state-changed...');
            // Disparar evento customizado
            window.dispatchEvent(new CustomEvent('auth-state-changed', { 
              detail: authEventDetail
            }));
            console.log('✅ [initializeAuth] Evento auth-state-changed disparado');
            console.log('🔐 [initializeAuth] ========== FIM (SUCESSO) ==========');
            
            return;
          } else {
            console.warn('⚠️ [initializeAuth] Dados encontrados mas sem usuário');
          }
        } else {
          console.warn('⚠️ [initializeAuth] Nenhum dado encontrado no localStorage');
        }
      } catch (e) {
        console.error('❌ [initializeAuth] Erro ao ler localStorage:', e);
        console.error('❌ [initializeAuth] Stack:', e.stack);
      }
      
      // Se não tiver no localStorage, atualizar cache global com o token
      authToken = token;
      console.log('✅ [initializeAuth] Token carregado do localStorage na inicialização (sem usuário)');
      console.log('🔐 [initializeAuth] ========== FIM (TOKEN SEM USUÁRIO) ==========');
    } else {
      console.log('⚠️ [initializeAuth] Nenhum token encontrado no localStorage na inicialização');
      console.log('🔐 [initializeAuth] Estado final:', {
        hasCurrentUser: !!currentUser,
        hasAuthToken: !!authToken
      });
      console.log('🔐 [initializeAuth] ========== FIM (SEM TOKEN) ==========');
    }
  }
  
  // Executar imediatamente ao carregar
  initializeAuth();
  
  // Também executar quando o DOM estiver pronto (caso o código compilado verifique antes)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAuth);
  } else {
    initializeAuth();
  }
  
  // Executar quando a página estiver totalmente carregada
  window.addEventListener('load', function() {
    console.log('🔍 [AUTH] Página totalmente carregada, verificando token novamente...');
    initializeAuth();
  });
  
  // Expor useAuth globalmente para uso no frontend (igual ao supabase-replacement.js)
  if (typeof window !== 'undefined') {
    // Criar wrapper que sempre retorna do localStorage primeiro
    // Esta é a função que o Profile chama via window._useAuth()
    const useAuthWrapper = function() {
      console.log('🟢 [useAuthWrapper] ========== CHAMADA ==========');
      console.log('🟢 [useAuthWrapper] Timestamp:', new Date().toISOString());
      console.log('🟢 [useAuthWrapper] Stack trace:', new Error().stack);
      
      // SEMPRE verificar localStorage primeiro - resposta imediata e confiável
      console.log('🟢 [useAuthWrapper] Chamando getAuthUserFromStorage()...');
      const storageResult = getAuthUserFromStorage();
      console.log('🟢 [useAuthWrapper] Resultado getAuthUserFromStorage():', {
        hasUser: !!storageResult.user,
        userId: storageResult.user?.id,
        loading: storageResult.loading
      });
      
      // Se encontrou usuário no localStorage, retornar IMEDIATAMENTE
      if (storageResult.user) {
        console.log('✅ [useAuthWrapper] Usuário encontrado no localStorage:', {
          userId: storageResult.user.id,
          email: storageResult.user.email
        });
        console.log('🟢 [useAuthWrapper] ========== FIM (SUCESSO) ==========');
        return storageResult;
      }
      
      // Se não encontrou, retornar estado de loading
      console.log('⚠️ [useAuthWrapper] Nenhum usuário encontrado no localStorage');
      console.log('🟢 [useAuthWrapper] Verificando cache global:', {
        hasCurrentUser: !!currentUser,
        userId: currentUser?.id
      });
      
      const result = {
        user: currentUser,
        loading: currentUser ? false : true
      };
      
      console.log('🟢 [useAuthWrapper] Retornando:', {
        hasUser: !!result.user,
        userId: result.user?.id,
        loading: result.loading
      });
      console.log('🟢 [useAuthWrapper] ========== FIM (SEM USUÁRIO) ==========');
      
      return result;
    };
    
    // Criar um Proxy para capturar tentativas de chamar a função
    const useAuthProxy = new Proxy(useAuthWrapper, {
      apply: function(target, thisArg, argumentsList) {
        console.log('🟢 [Proxy] ========== useAuth() ESTÁ SENDO CHAMADO! ==========');
        console.log('🟢 [Proxy] Timestamp:', new Date().toISOString());
        console.log('🟢 [Proxy] Argumentos:', argumentsList);
        console.log('🟢 [Proxy] Stack trace:');
        try {
          console.log(new Error().stack);
        } catch (e) {
          console.log('Erro ao obter stack:', e);
        }
        
        const result = target.apply(thisArg, argumentsList);
        
        console.log('🟢 [Proxy] Resultado da chamada:', {
          hasUser: !!result.user,
          userId: result.user?.id,
          userEmail: result.user?.email,
          loading: result.loading,
          timestamp: new Date().toISOString()
        });
        console.log('🟢 [Proxy] ========== FIM DA CHAMADA ==========');
        
        return result;
      },
      get: function(target, prop) {
        // Se a propriedade for 'user' ou 'loading', retornar diretamente do localStorage
        if (prop === 'user' || prop === 'loading') {
          const storageResult = getAuthUserFromStorage();
          if (storageResult[prop] !== undefined) {
            return storageResult[prop];
          }
        }
        // Para outras propriedades, retornar undefined
        return undefined;
      }
    });
    
    // Interceptar qualquer tentativa de acessar window._useAuth ou window.useAuth
    Object.defineProperty(window, 'useAuth', {
      get: function() {
        console.log('🟡 [window.useAuth] Acesso via getter');
        return useAuthProxy;
      },
      set: function(value) {
        console.log('🟡 [window.useAuth] Tentativa de sobrescrever - bloqueada');
        // Não permitir sobrescrever
      },
      configurable: false,
      enumerable: true
    });
    
    Object.defineProperty(window, '_useAuth', {
      get: function() {
        console.log('🟡 [window._useAuth] Acesso via getter');
        return useAuthProxy;
      },
      set: function(value) {
        console.log('🟡 [window._useAuth] Tentativa de sobrescrever - bloqueada');
        // Não permitir sobrescrever
      },
      configurable: false,
      enumerable: true
    });
    
    // Também expor diretamente para compatibilidade
    window.useAuth = useAuthProxy;
    window._useAuth = useAuthProxy;
    
    console.log('✅ useAuth exposto globalmente como window.useAuth e window._useAuth');
  }
  
  console.log('✅ Interceptor do Supabase carregado!');
  console.log('🔍 [DEBUG] Protocolo atual:', window.location.protocol);
  console.log('🔍 [DEBUG] BACKEND_URL configurado:', BACKEND_URL);
  console.log('🔍 [DEBUG] isHTTPS:', isHTTPS);
})();

