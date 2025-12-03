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
    
    // Tentar obter do localStorage (prioridade para auth_token e sb-auth-token)
    try {
      // Primeiro tentar as chaves mais comuns
      const commonKeys = ['auth_token', 'sb-auth-token'];
      for (const key of commonKeys) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            if (parsed && (parsed.access_token || parsed.token)) {
              authToken = parsed.access_token || parsed.token;
              // Sempre atualizar o usuário se estiver no localStorage
              if (parsed.user) {
                currentUser = parsed.user;
              }
              return authToken;
            }
          }
        } catch (e) {
          console.error('❌ [getAuthToken] Erro ao parsear', key, ':', e);
        }
      }
      
      // Se não encontrar nas chaves comuns, procurar em todas as chaves
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.includes('auth') || key.includes('supabase')) {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              const parsed = JSON.parse(value);
              if (parsed && (parsed.access_token || parsed.token)) {
                authToken = parsed.access_token || parsed.token;
                // Sempre atualizar o usuário se estiver no localStorage
                if (parsed.user) {
                  currentUser = parsed.user;
                }
                return authToken;
              }
            }
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error('❌ [getAuthToken] Erro ao ler localStorage:', e);
    }
    
    return null;
  }
  
  // Função para decodificar JWT (sem verificação, apenas para obter dados)
  function decodeJWT(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = parts[1];
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return decoded;
    } catch (e) {
      return null;
    }
  }
  
  // Função para obter usuário do token
  function getUserFromToken() {
    // PRIORIDADE 1: Cache em memória
    if (currentUser) return currentUser;
    
    // PRIORIDADE 2: localStorage (mais rápido e confiável)
    try {
      const commonKeys = ['auth_token', 'sb-auth-token'];
      for (const key of commonKeys) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            if (parsed && parsed.user) {
              currentUser = parsed.user;
              return currentUser;
            }
          }
        } catch (e) {}
      }
      
      // Se não encontrar nas chaves comuns, procurar em todas as chaves
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.includes('auth') || key.includes('supabase')) {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              const parsed = JSON.parse(value);
              if (parsed && parsed.user) {
                currentUser = parsed.user;
                return currentUser;
              }
            }
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error('❌ [getUserFromToken] Erro ao ler localStorage:', e);
    }
    
    // PRIORIDADE 3: Decodificar token JWT
    const token = getAuthToken();
    if (token) {
      const decoded = decodeJWT(token);
      if (decoded && decoded.id) {
        currentUser = {
          id: decoded.id,
          email: decoded.email || null
        };
        return currentUser;
      }
    }
    
    return null;
  }
  
  // Hook de autenticação que substitui o useUser do Supabase
  function useAuth() {
    const [user, setUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    
    React.useEffect(() => {
      // Função para atualizar o usuário
      const updateUser = () => {
        const token = getAuthToken();
        if (token) {
          const userData = getUserFromToken();
          setUser(userData);
          setLoading(false);
        } else {
          setUser(null);
          setLoading(false);
        }
      };
      
      // Obter usuário inicial
      updateUser();
      
      // Listener para mudanças no localStorage (entre tabs)
      const handleStorageChange = (e) => {
        if (e.key === 'auth_token' || e.key === 'sb-auth-token') {
          console.log('🔔 [useAuth] Mudança detectada no localStorage');
          updateUser();
        }
      };
      
      // Listener para eventos customizados de autenticação (mesmo tab)
      const handleAuthChange = (e) => {
        console.log('🔔 [useAuth] Evento auth-state-changed recebido:', e.detail);
        if (e.detail && e.detail.session) {
          // Atualizar currentUser e authToken globalmente
          currentUser = e.detail.session.user;
          authToken = e.detail.session.access_token;
          setUser(e.detail.session.user);
          setLoading(false);
        } else {
          // Logout
          currentUser = null;
          authToken = null;
          setUser(null);
          setLoading(false);
        }
      };
      
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('auth-state-changed', handleAuthChange);
      
      // Verificar periodicamente (para mudanças no mesmo tab - fallback)
      const interval = setInterval(() => {
        const newToken = getAuthToken();
        const currentToken = authToken;
        if (newToken !== currentToken) {
          console.log('🔔 [useAuth] Mudança detectada no token (intervalo)');
          updateUser();
        }
      }, 1000);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('auth-state-changed', handleAuthChange);
        clearInterval(interval);
      };
    }, []);
    
    return { user, loading };
  }
  
  // Interceptar React se disponível
  let React = null;
  if (typeof window !== 'undefined' && window.React) {
    React = window.React;
  } else if (typeof global !== 'undefined' && global.React) {
    React = global.React;
  }
  
  // Expor useAuth globalmente para uso no frontend
  if (typeof window !== 'undefined') {
    window.useAuth = useAuth;
    console.log('✅ useAuth exposto globalmente');
  }
  
  // Se React não estiver disponível, tentar obter do módulo
  if (!React && typeof require !== 'undefined') {
    try {
      React = require('react');
    } catch (e) {}
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
      
      // Tentar parsear JSON, mas tratar erro se não for JSON válido
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          const text = await response.text();
          console.error('❌ [apiRequest] Erro ao parsear JSON:', jsonError);
          console.error('❌ [apiRequest] Resposta recebida:', text.substring(0, 500));
          return {
            data: null,
            error: {
              message: 'Resposta inválida do servidor',
              status: response.status
            }
          };
        }
      } else {
        const text = await response.text();
        console.warn('⚠️ [apiRequest] Resposta não é JSON:', text.substring(0, 200));
        data = text;
      }
      
      console.log(`📥 [apiRequest] Resposta ${response.status} para ${path}:`, 
        typeof data === 'object' ? JSON.stringify(data).substring(0, 200) : data.substring(0, 200));
      
      if (!response.ok) {
        console.error(`❌ [apiRequest] Erro ${response.status} em ${path}:`, data);
        return { data: null, error: typeof data === 'object' ? data : { message: data, status: response.status } };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('❌ [apiRequest] Erro de conexão em', path, ':', error.message);
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
    'course_enrollments': '/api/enrollments/my-enrollments', // GET com user_id usa my-enrollments
    'course_purchases': '/api/purchases',
    'user_roles': '/api/users/roles',
    'contact_messages': '/api/contact', // Nota: rota pode não existir ainda
    'lessons': '/api/lessons',
    'lesson_progress': '/api/progress',
    'course_materials': '/api/materials',
    'webhook_logs': '/api/webhooks/logs' // Nota: rota pode não existir ainda
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
  
  // Sistema de autenticação completamente independente
  // Armazenar callbacks de mudança de estado
  if (!window._authStateChangeCallbacks) {
    window._authStateChangeCallbacks = [];
  }
  
  // Função para notificar todos os callbacks
  function notifyAuthStateChange(event, session) {
    const authEvent = { event, session };
    console.log(`🔔 [notifyAuthStateChange] Notificando ${window._authStateChangeCallbacks.length} callback(s) com evento:`, event);
    
    // Chamar todos os callbacks registrados
    window._authStateChangeCallbacks.forEach((callback, index) => {
      try {
        callback(authEvent);
        console.log(`✅ [notifyAuthStateChange] Callback ${index + 1} executado com sucesso`);
      } catch (e) {
        console.error(`❌ [notifyAuthStateChange] Erro ao executar callback ${index + 1}:`, e);
      }
    });
    
    // Disparar evento customizado
    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: authEvent }));
  }
  
  // Função para carregar usuário do localStorage
  function loadUserFromStorage() {
    try {
      const authDataStr = localStorage.getItem('auth_token') || localStorage.getItem('sb-auth-token');
      if (authDataStr) {
        const authData = JSON.parse(authDataStr);
        if (authData.user && (authData.access_token || authData.token)) {
          currentUser = authData.user;
          authToken = authData.access_token || authData.token;
          return { user: currentUser, token: authToken };
        }
      }
    } catch (e) {
      console.error('❌ [loadUserFromStorage] Erro:', e);
    }
    return null;
  }
  
  // Carregar usuário do localStorage ao inicializar
  const loadedUser = loadUserFromStorage();
  if (loadedUser) {
    console.log('✅ [INIT] Usuário carregado do localStorage:', loadedUser.user);
    // Notificar callbacks imediatamente se houver usuário carregado
    // Isso garante que componentes que já foram montados recebam o usuário
    setTimeout(() => {
      notifyAuthStateChange('SIGNED_IN', {
        access_token: loadedUser.token,
        user: loadedUser.user
      });
    }, 0);
  }
  
  // Garantir que o usuário seja sempre carregado quando a página carrega
  // Isso é crítico para páginas que são acessadas diretamente (não via login)
  window.addEventListener('DOMContentLoaded', () => {
    const user = loadUserFromStorage();
    if (user) {
      console.log('✅ [DOMContentLoaded] Usuário carregado:', user.user);
      // Notificar callbacks novamente quando o DOM estiver pronto
      setTimeout(() => {
        notifyAuthStateChange('SIGNED_IN', {
          access_token: user.token,
          user: user.user
        });
      }, 100);
    }
  });
  
  // Também verificar quando a página fica visível novamente (navegação entre abas)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      const user = loadUserFromStorage();
      if (user) {
        console.log('✅ [visibilitychange] Usuário carregado:', user.user);
        // Atualizar cache
        currentUser = user.user;
        authToken = user.token;
      }
    }
  });
  
  // Interceptar TODAS as chamadas de autenticação do Supabase
  // Garantir que getUser() e getSession() sempre retornem imediatamente do localStorage
  // Isso é crítico para que os componentes não redirecionem para login
  
  // Criar cliente Supabase falso
  function createFakeSupabaseClient() {
    return {
      // Auth
      auth: {
        getUser: async () => {
          console.log('🔍 [getUser] Método getUser() chamado - INTERCEPTADO (SEM Supabase)');
          
          // PRIORIDADE 1: localStorage (SEMPRE verificar primeiro - mais confiável)
          // IMPORTANTE: Verificar ANTES de qualquer coisa para garantir resposta IMEDIATA e SÍNCRONA
          try {
            const authDataStr = localStorage.getItem('auth_token') || localStorage.getItem('sb-auth-token');
            if (authDataStr) {
              const authData = JSON.parse(authDataStr);
              if (authData.user && (authData.access_token || authData.token)) {
                // Atualizar cache em memória IMEDIATAMENTE
                currentUser = authData.user;
                authToken = authData.access_token || authData.token;
                console.log('✅ [getUser] Usuário retornado do localStorage (IMEDIATO):', currentUser?.id);
                // RETORNAR IMEDIATAMENTE - resposta síncrona
                return { data: { user: currentUser }, error: null };
              }
            }
          } catch (e) {
            console.error('❌ [getUser] Erro ao ler localStorage:', e);
          }
          
          // PRIORIDADE 2: Cache em memória (se localStorage não tiver dados)
          if (currentUser && authToken) {
            console.log('✅ [getUser] Usuário retornado do cache (IMEDIATO):', currentUser?.id);
            return { data: { user: currentUser }, error: null };
          }
          
          // PRIORIDADE 3: Token decodificado (também imediato)
          const token = getAuthToken();
          if (token) {
            const userFromToken = getUserFromToken();
            if (userFromToken) {
              currentUser = userFromToken;
              // Atualizar localStorage com o usuário do token (assíncrono, mas não bloqueia)
              try {
                const authData = {
                  access_token: token,
                  token: token,
                  user: currentUser,
                  expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000)
                };
                localStorage.setItem('auth_token', JSON.stringify(authData));
                localStorage.setItem('sb-auth-token', JSON.stringify(authData));
              } catch (e) {
                console.error('❌ [getUser] Erro ao salvar no localStorage:', e);
              }
              console.log('✅ [getUser] Usuário obtido do token (IMEDIATO):', currentUser?.id);
              return { data: { user: currentUser }, error: null };
            }
          }
          
          // Se não tiver token, retornar null IMEDIATAMENTE
          console.log('⚠️ [getUser] Nenhum usuário encontrado - retornando null');
          return { data: { user: null }, error: null };
          
          // PRIORIDADE 4: Backend (último recurso - APENAS se não tiver nada no localStorage/cache/token)
          // IMPORTANTE: Esta é a ÚNICA chamada assíncrona, e só acontece se não tiver dados locais
          try {
            console.log('⚠️ [getUser] Nenhum dado local encontrado, tentando backend...');
            const result = await apiRequest('GET', '/api/auth/user');
            if (result.error) {
              console.error('❌ [getUser] Erro ao obter usuário do backend:', result.error);
              return { data: { user: null }, error: result.error };
            }
            
            if (result.data && result.data.user) {
              currentUser = result.data.user;
              // Atualizar localStorage com o usuário completo
              const authData = {
                access_token: token,
                token: token,
                user: currentUser,
                expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000)
              };
              localStorage.setItem('auth_token', JSON.stringify(authData));
              localStorage.setItem('sb-auth-token', JSON.stringify(authData));
              console.log('✅ [getUser] Usuário obtido do backend e salvo:', currentUser);
              return { data: { user: currentUser }, error: null };
            }
          } catch (e) {
            console.error('❌ [getUser] Erro ao fazer requisição:', e);
          }
          
          return { data: { user: null }, error: null };
        },
        
        getSession: async () => {
          console.log('🔍 [getSession] Método getSession() chamado');
          console.trace('🔍 [getSession] Stack trace:');
          console.log('🔍 [getSession] currentUser atual:', currentUser);
          console.log('🔍 [getSession] authToken atual:', !!authToken);
          
          // PRIORIDADE 1: localStorage (SEMPRE verificar primeiro - mais confiável)
          // IMPORTANTE: Verificar ANTES de qualquer coisa para garantir resposta imediata
          try {
            const authDataStr = localStorage.getItem('auth_token') || localStorage.getItem('sb-auth-token');
            console.log('🔍 [getSession] localStorage authDataStr encontrado:', !!authDataStr);
            if (authDataStr) {
              const authData = JSON.parse(authDataStr);
              console.log('🔍 [getSession] authData parseado:', { 
                hasUser: !!authData.user, 
                hasToken: !!(authData.access_token || authData.token),
                userId: authData.user?.id 
              });
              if (authData.user && (authData.access_token || authData.token)) {
                // Atualizar cache em memória
                currentUser = authData.user;
                authToken = authData.access_token || authData.token;
                console.log('✅ [getSession] Sessão carregada do localStorage (RESPOSTA IMEDIATA):', currentUser);
                console.log('✅ [getSession] Cache atualizado - currentUser:', currentUser);
                console.log('✅ [getSession] Cache atualizado - authToken:', !!authToken);
                const result = {
                  data: {
                    session: {
                      access_token: authToken,
                      user: currentUser
                    }
                  },
                  error: null
                };
                console.log('✅ [getSession] Retornando resultado IMEDIATO:', result);
                return result;
              } else {
                console.warn('⚠️ [getSession] localStorage tem dados mas sem usuário ou token');
              }
            } else {
              console.log('⚠️ [getSession] Nenhum dado encontrado no localStorage');
            }
          } catch (e) {
            console.error('❌ [getSession] Erro ao ler localStorage:', e);
          }
          
          // PRIORIDADE 2: Cache em memória (se localStorage não tiver dados)
          const token = getAuthToken();
          if (token && currentUser) {
            console.log('✅ [getSession] Sessão retornada do cache:', currentUser);
            return {
              data: {
                session: {
                  access_token: token,
                  user: currentUser
                }
              },
              error: null
            };
          }
          
          // Se não tiver token, retornar null
          if (!token) {
            console.log('⚠️ [getSession] Nenhum token encontrado');
            return { data: { session: null }, error: null };
          }
          
          // PRIORIDADE 3: Token decodificado
          let user = getUserFromToken();
          if (user) {
            currentUser = user;
            // Atualizar localStorage com o usuário do token
            try {
              const authData = {
                access_token: token,
                token: token,
                user: user,
                expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000)
              };
              localStorage.setItem('auth_token', JSON.stringify(authData));
              localStorage.setItem('sb-auth-token', JSON.stringify(authData));
            } catch (e) {
              console.error('❌ [getSession] Erro ao salvar no localStorage:', e);
            }
            console.log('✅ [getSession] Sessão retornada do token:', user);
            return {
              data: {
                session: {
                  access_token: token,
                  user: user
                }
              },
              error: null
            };
          }
          
          // PRIORIDADE 4: Backend (último recurso)
          try {
            const userResult = await apiRequest('GET', '/api/auth/user');
            if (!userResult.error && userResult.data && userResult.data.user) {
              user = userResult.data.user;
              currentUser = user;
              // Atualizar localStorage
              const authData = {
                access_token: token,
                token: token,
                user: user,
                expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000)
              };
              localStorage.setItem('auth_token', JSON.stringify(authData));
              localStorage.setItem('sb-auth-token', JSON.stringify(authData));
              console.log('✅ [getSession] Sessão obtida do backend:', user);
              return {
                data: {
                  session: {
                    access_token: token,
                    user: user
                  }
                },
                error: null
              };
            }
          } catch (e) {
            console.error('❌ [getSession] Erro ao obter usuário do backend:', e);
          }
          
          // Se não conseguir obter usuário, retornar null
          console.log('⚠️ [getSession] Nenhum usuário encontrado');
          return { data: { session: null }, error: null };
        },
        
        // signInWithPassword - INTERCEPTADO COMPLETAMENTE - NÃO USA SUPABASE
        signInWithPassword: async (credentials) => {
          const email = credentials.email || credentials.email;
          const password = credentials.password || credentials.password;
          
          console.log('🔐 [signInWithPassword] Login INTERCEPTADO - usando backend próprio (SEM Supabase)');
          console.log('📧 Email:', email);
          console.log('🔐 [signInWithPassword] Chamando:', `${BACKEND_URL}/api/auth/signin`);
          
          try {
            // Chamar DIRETAMENTE o backend interno - SEM usar Supabase
            const response = await fetch(`${BACKEND_URL}/api/auth/signin`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ email, password })
            });
            
            const responseData = await response.json();
            
            if (!response.ok) {
              console.error('❌ [signInWithPassword] Erro no login:', responseData);
              return {
                data: null,
                error: {
                  message: responseData.error || 'Erro ao fazer login',
                  status: response.status
                }
              };
            }
            
            // Salvar token e usuário
            authToken = responseData.token;
            currentUser = responseData.user || {
              id: responseData.userId,
              email: responseData.email || email
            };
            
            console.log('✅ [signInWithPassword] Login bem-sucedido:', currentUser);
            
            // Salvar no localStorage
            const authData = {
              access_token: authToken,
              token: authToken,
              user: currentUser,
              expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000)
            };
            
            localStorage.setItem('auth_token', JSON.stringify(authData));
            localStorage.setItem('sb-auth-token', JSON.stringify(authData));
            
            // Notificar callbacks IMEDIATAMENTE usando a função centralizada
            const session = {
              access_token: authToken,
              user: currentUser
            };
            notifyAuthStateChange('SIGNED_IN', session);
            
            // Retornar no formato Supabase (compatibilidade)
            return {
              data: {
                session: session,
                user: currentUser
              },
              error: null
            };
          } catch (error) {
            console.error('❌ [signInWithPassword] Erro de conexão:', error);
            return {
              data: null,
              error: {
                message: error.message || 'Erro de conexão',
                status: 0
              }
            };
          }
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
          localStorage.removeItem('sb-auth-token');
          
          // Disparar evento de mudança de autenticação
          window.dispatchEvent(new CustomEvent('auth-state-changed', { 
            detail: { 
              event: 'SIGNED_OUT', 
              session: null 
            } 
          }));
          
          await apiRequest('POST', '/api/auth/signout');
          return { error: null };
        },
        
        onAuthStateChange: (callback) => {
          console.log('🔔 [onAuthStateChange] Registrando listener de mudanças de autenticação');
          console.trace('🔔 [onAuthStateChange] Stack trace:');
          
          // Armazenar callback globalmente para poder chamá-lo de qualquer lugar
          if (!window._authStateChangeCallbacks) {
            window._authStateChangeCallbacks = [];
          }
          window._authStateChangeCallbacks.push(callback);
          console.log(`🔔 [onAuthStateChange] Total de callbacks registrados: ${window._authStateChangeCallbacks.length}`);
          
          // Verificar estado inicial IMEDIATAMENTE (síncrono)
          const token = getAuthToken();
          console.log('🔔 [onAuthStateChange] Verificando estado inicial, token encontrado:', !!token);
          console.log('🔔 [onAuthStateChange] currentUser atual:', currentUser);
          
          // PRIORIDADE 1: Verificar localStorage primeiro (mais confiável)
          let userFound = false;
          try {
            const authDataStr = localStorage.getItem('auth_token') || localStorage.getItem('sb-auth-token');
            if (authDataStr) {
              const authData = JSON.parse(authDataStr);
              if (authData.user && (authData.access_token || authData.token)) {
                // Atualizar cache em memória
                currentUser = authData.user;
                authToken = authData.access_token || authData.token;
                userFound = true;
                console.log('🔔 [onAuthStateChange] Usuário encontrado no localStorage, notificando IMEDIATAMENTE');
                
                // Criar evento de autenticação
                const authEvent = {
                  event: 'SIGNED_IN',
                  session: {
                    access_token: authToken,
                    user: currentUser
                  }
                };
                
                // Chamar callback IMEDIATAMENTE (síncrono)
                try {
                  callback(authEvent);
                  console.log('✅ [onAuthStateChange] Callback executado IMEDIATAMENTE (localStorage - síncrono)');
                } catch (e) {
                  console.error('❌ [onAuthStateChange] Erro ao executar callback (localStorage):', e);
                }
                
                // Chamar novamente após 0ms (próximo tick)
                setTimeout(() => {
                  try {
                    callback(authEvent);
                    console.log('✅ [onAuthStateChange] Callback executado (localStorage - setTimeout 0ms)');
                  } catch (e) {
                    console.error('❌ [onAuthStateChange] Erro ao executar callback (setTimeout 0ms):', e);
                  }
                }, 0);
                
                // Chamar novamente após 50ms (garantir que o componente processou)
                setTimeout(() => {
                  try {
                    callback(authEvent);
                    console.log('✅ [onAuthStateChange] Callback executado (localStorage - setTimeout 50ms)');
                  } catch (e) {
                    console.error('❌ [onAuthStateChange] Erro ao executar callback (setTimeout 50ms):', e);
                  }
                }, 50);
                
                // Chamar novamente após 200ms (fallback)
                setTimeout(() => {
                  try {
                    callback(authEvent);
                    console.log('✅ [onAuthStateChange] Callback executado (localStorage - setTimeout 200ms)');
                  } catch (e) {
                    console.error('❌ [onAuthStateChange] Erro ao executar callback (setTimeout 200ms):', e);
                  }
                }, 200);
              }
            }
          } catch (e) {
            console.error('❌ [onAuthStateChange] Erro ao ler localStorage:', e);
          }
          
          // PRIORIDADE 2: Se já tiver usuário no cache e não foi encontrado no localStorage, notificar IMEDIATAMENTE
          if (!userFound && currentUser && token) {
            console.log('🔔 [onAuthStateChange] Usuário já autenticado no cache, notificando IMEDIATAMENTE');
            const authEvent = {
              event: 'SIGNED_IN',
              session: {
                access_token: token,
                user: currentUser
              }
            };
            try {
              callback(authEvent);
              console.log('✅ [onAuthStateChange] Callback executado IMEDIATAMENTE (cache)');
            } catch (e) {
              console.error('❌ [onAuthStateChange] Erro ao executar callback (cache):', e);
            }
          }
          
          // Se não encontrou usuário, notificar que não está autenticado
          if (!userFound && !token) {
            console.log('🔔 [onAuthStateChange] Estado inicial: não autenticado (sem token)');
            try {
              callback({
                event: 'SIGNED_OUT',
                session: null
              });
              console.log('✅ [onAuthStateChange] Callback executado com sucesso (SIGNED_OUT)');
            } catch (e) {
              console.error('❌ [onAuthStateChange] Erro ao executar callback (SIGNED_OUT):', e);
            }
          }
          
          // SEMPRE registrar os listeners, independentemente do estado inicial
          // Isso garante que mudanças futuras sejam detectadas
          
          // Listener para mudanças no localStorage (entre tabs)
          const handleStorageChange = (e) => {
            if (e.key === 'auth_token' || e.key === 'sb-auth-token') {
              console.log('🔔 [onAuthStateChange] Mudança detectada no localStorage');
              const token = getAuthToken();
              const user = getUserFromToken();
              callback({
                event: user ? 'SIGNED_IN' : 'SIGNED_OUT',
                session: user ? { access_token: token, user } : null
              });
            }
          };
          
          // Listener para eventos customizados (mesmo tab)
          const handleAuthChange = (e) => {
            console.log('🔔 [onAuthStateChange] Evento de autenticação recebido:', e.detail);
            callback(e.detail);
          };
          
          // Verificar periodicamente mudanças no mesmo tab (fallback mais agressivo)
          let lastToken = token;
          let lastUser = currentUser ? JSON.stringify(currentUser) : null;
          const checkInterval = setInterval(() => {
            const currentToken = getAuthToken();
            const currentUserStr = currentUser ? JSON.stringify(currentUser) : null;
            
            if (currentToken !== lastToken || currentUserStr !== lastUser) {
              console.log('🔔 [onAuthStateChange] Mudança detectada (token ou usuário)');
              lastToken = currentToken;
              lastUser = currentUserStr;
              
              if (currentToken && currentUser) {
                callback({
                  event: 'SIGNED_IN',
                  session: { access_token: currentToken, user: currentUser }
                });
              } else if (!currentToken) {
                callback({
                  event: 'SIGNED_OUT',
                  session: null
                });
              }
            }
          }, 200); // Verificar a cada 200ms (mais agressivo)
          
          window.addEventListener('storage', handleStorageChange);
          window.addEventListener('auth-state-changed', handleAuthChange);
          
          // Retornar função de unsubscribe
          return {
            data: {
              subscription: {
                unsubscribe: () => {
                  console.log('🔔 [onAuthStateChange] Removendo listener');
                  window.removeEventListener('storage', handleStorageChange);
                  window.removeEventListener('auth-state-changed', handleAuthChange);
                  clearInterval(checkInterval);
                  // Remover callback da lista global
                  if (window._authStateChangeCallbacks) {
                    const index = window._authStateChangeCallbacks.indexOf(callback);
                    if (index > -1) {
                      window._authStateChangeCallbacks.splice(index, 1);
                    }
                  }
                }
              }
            }
          };
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
          select: (columns = '*', options = {}) => {
            console.log(`📋 Select interceptado: ${columns}`, options);
            
            // Se for count com head, retornar apenas o count
            if (options && options.count === 'exact' && options.head === true) {
              return {
                then: async (callback) => {
                  console.log(`🔢 Count request para ${table}`);
                  const result = await apiRequest('GET', `${endpoint}?count=true`);
                  // O backend pode retornar { count: X } ou um array com length
                  let count = 0;
                  if (result.data && typeof result.data === 'object') {
                    if (typeof result.data.count === 'number') {
                      count = result.data.count;
                    } else if (Array.isArray(result.data)) {
                      count = result.data.length;
                    } else if (result.data.length !== undefined) {
                      count = result.data.length;
                    }
                  }
                  const response = { count, error: result.error };
                  console.log(`✅ Count retornado para ${table}:`, count);
                  if (callback) callback(response);
                  return response;
                }
              };
            }
            
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
                  // Para course_enrollments, usar endpoint my-enrollments que já retorna dados formatados
                  let path;
                  if (table === 'course_enrollments' && column === 'user_id') {
                    // Extrair userId do value (formato eq.{id})
                    const match = value.match(/eq\.(.+)/);
                    const userId = match ? match[1] : value;
                    path = `/api/enrollments/my-enrollments`;
                  } else {
                    path = `${endpoint}?${column}=${value}&order=${column}&asc=${options?.ascending !== false}`;
                  }
                  
                  const result = await apiRequest('GET', path);
                  
                  // Converter resposta do backend para formato esperado pelo frontend
                  let data = result.data;
                  if (table === 'course_enrollments' && Array.isArray(data)) {
                    // O backend já retorna no formato correto com courses aninhado
                    data = data;
                  } else if (result.data && result.data.enrollments) {
                    data = result.data.enrollments;
                  } else if (Array.isArray(result.data)) {
                    data = result.data;
                  }
                  
                  const response = { data, error: result.error };
                  if (callback) callback(response);
                  return response;
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
            eq: (column, value) => {
              const eqBuilder = {
                maybeSingle: async () => {
                  const path = `${endpoint}?${column}=${value}`;
                  console.log(`🔍 [eq.maybeSingle] Chamando ${path} para tabela ${table}`);
                  const result = await apiRequest('GET', path);
                  console.log(`📥 [eq.maybeSingle] Resposta recebida para ${table}:`, result);
                  if (result.error) {
                    console.error(`❌ [eq.maybeSingle] Erro em ${table}:`, result.error);
                    return result;
                  }
                  // Se for array, retornar primeiro item ou null
                  if (Array.isArray(result.data)) {
                    const response = { data: result.data.length > 0 ? result.data[0] : null, error: null };
                    console.log(`✅ [eq.maybeSingle] Retornando para ${table}:`, response);
                    return response;
                  }
                  // Se for objeto único, retornar como está
                  const response = { data: result.data || null, error: null };
                  console.log(`✅ [eq.maybeSingle] Retornando para ${table}:`, response);
                  return response;
                },
                single: async () => {
                  const path = `${endpoint}?${column}=${value}`;
                  const result = await apiRequest('GET', path);
                  if (result.error) {
                    return result;
                  }
                  // Se for array, retornar primeiro item ou null
                  if (Array.isArray(result.data)) {
                    return { data: result.data.length > 0 ? result.data[0] : null, error: null };
                  }
                  // Se for objeto único, retornar como está
                  return { data: result.data || null, error: null };
                },
                // Método then() para permitir uso direto: select().eq().then()
                then: async (callback) => {
                  const path = `${endpoint}?${column}=${value}`;
                  console.log(`🔍 [eq.then] Chamando ${path} para tabela ${table}`);
                  const result = await apiRequest('GET', path);
                  console.log(`📥 [eq.then] Resposta recebida para ${table}:`, result);
                  if (result.error) {
                    console.error(`❌ [eq.then] Erro em ${table}:`, result.error);
                    if (callback) callback(result);
                    return result;
                  }
                  // Para select().eq() sem maybeSingle/single, retornar array sempre
                  let data = result.data;
                  if (!Array.isArray(data)) {
                    // Se não for array, converter para array (ou array vazio se null)
                    data = data ? [data] : [];
                  }
                  const response = { data, error: null };
                  console.log(`✅ [eq.then] Retornando para ${table}:`, response);
                  if (callback) callback(response);
                  return response;
                },
                order: (orderColumn, options) => ({
                  then: async (callback) => {
                    const path = `${endpoint}?${column}=${value}&order=${orderColumn}&asc=${options?.ascending !== false}`;
                    const result = await apiRequest('GET', path);
                    if (result.error) {
                      if (callback) callback(result);
                      return result;
                    }
                    // Garantir que retorna array
                    let data = result.data;
                    if (!Array.isArray(data)) {
                      data = data ? [data] : [];
                    }
                    const response = { data, error: null };
                    if (callback) callback(response);
                    return response;
                  }
                })
              };
              return eqBuilder;
            },
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
            in: (column, values) => {
              const inBuilder = {
                then: async (callback) => {
                  // Formatar valores para query string (array de IDs)
                  const valuesStr = Array.isArray(values) ? values.join(',') : values;
                  const path = `${endpoint}?${column}=in.(${valuesStr})`;
                  console.log(`🔍 [in.then] Chamando ${path} para tabela ${table}`);
                  const result = await apiRequest('GET', path);
                  console.log(`📥 [in.then] Resposta recebida para ${table}:`, result);
                  
                  // Garantir que retorna array
                  let data = result.data;
                  if (!Array.isArray(data)) {
                    data = data ? [data] : [];
                  }
                  
                  const response = { data, error: result.error };
                  console.log(`✅ [in.then] Retornando para ${table}:`, response);
                  if (callback) callback(response);
                  return response;
                },
                // Permitir encadear .in() múltiplas vezes ou com outros métodos
                in: (nextColumn, nextValues) => {
                  // Se já tiver um .in(), combinar
                  return inBuilder;
                },
                eq: (nextColumn, nextValue) => ({
                  then: async (callback) => {
                    const valuesStr = Array.isArray(values) ? values.join(',') : values;
                    const path = `${endpoint}?${column}=in.(${valuesStr})&${nextColumn}=${nextValue}`;
                    const result = await apiRequest('GET', path);
                    let data = result.data;
                    if (!Array.isArray(data)) {
                      data = data ? [data] : [];
                    }
                    const response = { data, error: result.error };
                    if (callback) callback(response);
                    return response;
                  }
                }),
                order: (orderColumn, orderOptions) => ({
                  then: async (callback) => {
                    const valuesStr = Array.isArray(values) ? values.join(',') : values;
                    const path = `${endpoint}?${column}=in.(${valuesStr})&order=${orderColumn}&asc=${orderOptions?.ascending !== false}`;
                    const result = await apiRequest('GET', path);
                    let data = result.data;
                    if (!Array.isArray(data)) {
                      data = data ? [data] : [];
                    }
                    const response = { data, error: result.error };
                    if (callback) callback(response);
                    return response;
                  }
                })
              };
              return inBuilder;
            },
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
          eq: async (column, value) => {
            // Para profiles, usar endpoint específico
            let path;
            if (table === 'profiles') {
              path = `/api/users/profile/${value}`;
            } else {
              path = `${endpoint}/${value}`;
            }
            console.log(`🔄 [update] Atualizando ${table} com id=${value}:`, data);
            const result = await apiRequest('PUT', path, data);
            console.log(`✅ [update] Resultado:`, result);
            return result;
          }
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
    
    // Storage - redirecionar para API interna
    storage: {
        from: (bucket) => {
          console.log(`📦 Storage interceptado: bucket="${bucket}"`);
          return {
            upload: async (path, file, options = {}) => {
              try {
                console.log(`📤 Upload de arquivo: bucket="${bucket}", path="${path}"`);
                
                const token = getAuthToken();
                const formData = new FormData();
                formData.append('file', file);
                formData.append('path', path);
                formData.append('bucket', bucket);
                
                const response = await fetch(`${BACKEND_URL}/api/storage/upload`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token || ''}`
                  },
                  body: formData
                });
                
                if (!response.ok) {
                  const error = await response.json().catch(() => ({ error: 'Erro ao fazer upload' }));
                  return {
                    data: null,
                    error: error.error || { message: 'Erro ao fazer upload' }
                  };
                }
                
                const result = await response.json();
                console.log(`✅ Upload concluído:`, result);
                
                return {
                  data: result.data || { path: result.path || path },
                  error: null
                };
              } catch (error) {
                console.error('❌ Erro no upload:', error);
                return {
                  data: null,
                  error: { message: error.message || 'Erro ao fazer upload' }
                };
              }
            },
            remove: async (paths) => {
              try {
                console.log(`🗑️ Removendo arquivo(s): bucket="${bucket}", paths=`, paths);
                
                const token = getAuthToken();
                const pathsArray = Array.isArray(paths) ? paths : [paths];
                
                const response = await fetch(`${BACKEND_URL}/api/storage/remove`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token || ''}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ bucket, paths: pathsArray })
                });
                
                if (!response.ok) {
                  const error = await response.json().catch(() => ({ error: 'Erro ao remover arquivo' }));
                  return {
                    data: null,
                    error: error.error || { message: 'Erro ao remover arquivo' }
                  };
                }
                
                const result = await response.json();
                console.log(`✅ Arquivo(s) removido(s):`, result);
                
                return {
                  data: result.data || pathsArray,
                  error: null
                };
              } catch (error) {
                console.error('❌ Erro ao remover arquivo:', error);
                return {
                  data: null,
                  error: { message: error.message || 'Erro ao remover arquivo' }
                };
              }
            },
            getPublicUrl: (path) => {
              // Retornar URL pública do arquivo
              const publicUrl = `${BACKEND_URL}/api/storage/${bucket}/${path}`;
              console.log(`🔗 URL pública gerada: ${publicUrl}`);
              return {
                data: {
                  publicUrl: publicUrl
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
  
  // Interceptar WebSocket para bloquear conexões ao Supabase
  const originalWebSocket = window.WebSocket;
  window.WebSocket = function(url, protocols) {
    if (typeof url === 'string' && (url.includes('realtime') || url.includes('supabase') || url.includes('qxgzazewwutbikmmpkms'))) {
      console.warn('🚫 WebSocket ao Supabase BLOQUEADO:', url);
      console.warn('⚠️ Realtime não está disponível - Supabase foi removido');
      // Retornar um WebSocket falso que não faz nada
      const fakeWs = {
        readyState: 3, // CLOSED
        send: () => {},
        close: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        CONNECTING: 0,
        OPEN: 1,
        CLOSING: 2,
        CLOSED: 3
      };
      return fakeWs;
    }
    return new originalWebSocket(url, protocols);
  };
  console.log('✅ WebSocket interceptado');
  
  // Interceptar fetch para bloquear e redirecionar chamadas ao Supabase
  // IMPORTANTE: Isso deve ser feito ANTES de qualquer código ser executado
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const url = args[0];
    
    // Bloquear e redirecionar TODAS as chamadas ao Supabase
    if (typeof url === 'string') {
      // PRIMEIRO: Interceptar /auth/v1/token (login) - ANTES de qualquer outra verificação
      if (url.includes('/auth/v1/token') || url.includes('auth/v1/token') || url.endsWith('/auth/v1/token')) {
        console.log('🔄 [INTERCEPTAÇÃO] Login detectado, redirecionando para backend interno');
        console.log('🔄 [INTERCEPTAÇÃO] URL original:', url);
        console.log('⚠️ [INTERCEPTAÇÃO] NOTA: O método correto é auth.signInWithPassword() que não usa Supabase');
            
            // Extrair grant_type e dados do body
            const originalOptions = args[1] || {};
            let bodyData = {};
            
            // Tentar extrair da URL primeiro (pode ser relativa ou absoluta)
            try {
              // Se a URL for relativa, criar URL absoluta
              const absoluteUrl = url.startsWith('http') ? url : `${window.location.origin}${url.startsWith('/') ? url : '/' + url}`;
              const urlObj = new URL(absoluteUrl);
              urlObj.searchParams.forEach((value, key) => {
                bodyData[key] = value;
              });
            } catch (e) {
              // URL pode não ser válida, continuar
              console.warn('⚠️ Erro ao parsear URL:', e);
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
                  // Salvar token e usuário
                  authToken = responseData.token;
                  const user = responseData.user || {
                    id: responseData.user?.id,
                    email: responseData.user?.email || responseData.email
                  };
                  // IMPORTANTE: Atualizar currentUser ANTES de salvar no localStorage
                  currentUser = user;
                  
                  // Salvar no localStorage em formato compatível com Supabase
                  const authData = {
                    access_token: authToken,
                    token: authToken,
                    user: user,
                    expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 dias
                  };
                  
                  // Salvar em múltiplas chaves para compatibilidade
                  localStorage.setItem('auth_token', JSON.stringify(authData));
                  localStorage.setItem('sb-auth-token', JSON.stringify(authData));
                  
                  console.log('✅ Token e usuário salvos após login:', user);
                  console.log('✅ localStorage atualizado com:', JSON.stringify(authData, null, 2));
                  console.log('✅ currentUser atualizado globalmente:', currentUser);
                  console.log('✅ authToken atualizado globalmente:', !!authToken);
                  
                  // IMPORTANTE: Forçar atualização do cache ANTES de disparar eventos
                  // Isso garante que getUser() retorne o usuário imediatamente
                  console.log('🔄 [LOGIN] Verificando se getUser() retorna o usuário corretamente...');
                  setTimeout(async () => {
                    try {
                      // Criar um cliente temporário para teste
                      const testClient = createFakeSupabaseClient();
                      const testGetUser = await testClient.auth.getUser();
                      console.log('✅ [LOGIN] Teste getUser() após login:', testGetUser);
                      if (testGetUser.data && testGetUser.data.user) {
                        console.log('✅ [LOGIN] getUser() está retornando o usuário corretamente!');
                      } else {
                        console.warn('⚠️ [LOGIN] getUser() NÃO está retornando o usuário!');
                      }
                    } catch (e) {
                      console.error('❌ [LOGIN] Erro ao testar getUser():', e);
                    }
                  }, 100);
                  
                  // Disparar evento de mudança de autenticação (múltiplas vezes para garantir)
                  const authEventDetail = { 
                    event: 'SIGNED_IN', 
                    session: { 
                      access_token: authToken, 
                      user: user 
                    } 
                  };
                  
                  // Chamar callbacks diretamente (mais confiável)
                  if (window._authStateChangeCallbacks && window._authStateChangeCallbacks.length > 0) {
                    console.log(`🔔 Chamando ${window._authStateChangeCallbacks.length} callback(s) diretamente`);
                    window._authStateChangeCallbacks.forEach((cb, index) => {
                      try {
                        console.log(`🔔 Executando callback ${index + 1}/${window._authStateChangeCallbacks.length}`);
                        cb(authEventDetail);
                        console.log(`✅ Callback ${index + 1} executado com sucesso`);
                      } catch (e) {
                        console.error(`❌ Erro ao chamar callback ${index + 1}:`, e);
                      }
                    });
                  } else {
                    console.warn('⚠️ Nenhum callback registrado em _authStateChangeCallbacks ainda');
                    console.warn('⚠️ Isso é normal se o hook ainda não foi registrado - ele será notificado quando for registrado');
                  }
                  
                  // Disparar evento customizado
                  const authEvent = new CustomEvent('auth-state-changed', { 
                    detail: authEventDetail
                  });
                  window.dispatchEvent(authEvent);
                  console.log('🔔 Evento auth-state-changed disparado');
                  
                  // Disparar novamente após um pequeno delay para garantir que os listeners estejam prontos
                  setTimeout(() => {
                    if (window._authStateChangeCallbacks && window._authStateChangeCallbacks.length > 0) {
                      console.log(`🔔 Chamando ${window._authStateChangeCallbacks.length} callback(s) novamente (delay 100ms)`);
                      window._authStateChangeCallbacks.forEach((cb, index) => {
                        try {
                          cb(authEventDetail);
                        } catch (e) {
                          console.error(`❌ Erro ao chamar callback ${index + 1} (delay):`, e);
                        }
                      });
                    }
                    window.dispatchEvent(authEvent);
                    console.log('🔔 Evento auth-state-changed disparado novamente (delay 100ms)');
                  }, 100);
                  
                  // Forçar atualização após 500ms (caso o hook seja registrado depois)
                  setTimeout(() => {
                    console.log('🔔 Forçando atualização após 500ms (caso hook seja registrado depois)');
                    if (window._authStateChangeCallbacks && window._authStateChangeCallbacks.length > 0) {
                      console.log(`🔔 Chamando ${window._authStateChangeCallbacks.length} callback(s) (delay 500ms)`);
                      window._authStateChangeCallbacks.forEach((cb, index) => {
                        try {
                          cb(authEventDetail);
                        } catch (e) {
                          console.error(`❌ Erro ao chamar callback ${index + 1} (delay 500ms):`, e);
                        }
                      });
                    }
                    window.dispatchEvent(authEvent);
                  }, 500);
                  
                  // Disparar evento storage para compatibilidade
                  window.dispatchEvent(new StorageEvent('storage', {
                    key: 'auth_token',
                    newValue: JSON.stringify(authData),
                    storageArea: localStorage
                  }));
                  console.log('🔔 Evento storage disparado');
                  
                  // Retornar resposta no formato Supabase
                  return new Response(JSON.stringify({
                    access_token: responseData.token,
                    token_type: 'bearer',
                    expires_in: 3600,
                    refresh_token: responseData.token, // Usar o mesmo token como refresh
                    user: {
                      id: user.id,
                      email: user.email,
                      user_metadata: {
                        first_name: user.firstName || user.first_name,
                        last_name: user.lastName || user.last_name
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
            
            // Se chegou aqui, não é um grant_type conhecido, continuar com o fluxo normal
            return originalFetch.apply(this, args);
      }
      
      // Redirecionar /api/rest/v1/* para /api/* com mapeamento correto de tabelas
      if (url.includes('/api/rest/v1/')) {
        let newUrl = url.replace('/api/rest/v1/', '/api/');
        
        // Mapear tabelas para endpoints corretos usando TABLE_MAP
        for (const [table, endpoint] of Object.entries(TABLE_MAP)) {
          // Verificar se a URL contém o nome da tabela
          if (newUrl.includes(`/api/${table}`)) {
            newUrl = newUrl.replace(`/api/${table}`, endpoint);
            break; // Parar após encontrar a primeira correspondência
          }
        }
        
        // Mapeamentos específicos adicionais
        if (newUrl.includes('/api/user_roles')) {
          newUrl = newUrl.replace('/api/user_roles', '/api/users/roles');
        } else if (newUrl.includes('/api/profiles')) {
          newUrl = newUrl.replace('/api/profiles', '/api/users/profile');
        } else if (newUrl.includes('/api/course_enrollments')) {
          newUrl = newUrl.replace('/api/course_enrollments', '/api/enrollments/my-enrollments');
        } else if (newUrl.includes('/api/course_purchases')) {
          newUrl = newUrl.replace('/api/course_purchases', '/api/purchases');
        } else if (newUrl.includes('/api/contact_messages')) {
          newUrl = newUrl.replace('/api/contact_messages', '/api/contact');
        } else if (newUrl.includes('/api/lesson_progress')) {
          newUrl = newUrl.replace('/api/lesson_progress', '/api/progress');
        } else if (newUrl.includes('/api/course_materials')) {
          newUrl = newUrl.replace('/api/course_materials', '/api/materials');
        } else if (newUrl.includes('/api/webhook_logs')) {
          newUrl = newUrl.replace('/api/webhook_logs', '/api/webhooks/logs');
        }
        
        console.log('🔄 Redirecionando /api/rest/v1/ para /api/:', url, '→', newUrl);
        const newArgs = [...args];
        newArgs[0] = newUrl;
        return originalFetch.apply(this, newArgs);
      }
      
      // Redirecionar /rest/v1/* para /api/* (quando não começa com /api) com mapeamento correto
      if (url.includes('/rest/v1/') && !url.startsWith('/api/')) {
        let newUrl = url.replace('/rest/v1/', '/api/');
        
        // Mapear tabelas para endpoints corretos usando TABLE_MAP
        for (const [table, endpoint] of Object.entries(TABLE_MAP)) {
          // Verificar se a URL contém o nome da tabela
          if (newUrl.includes(`/api/${table}`)) {
            newUrl = newUrl.replace(`/api/${table}`, endpoint);
            break; // Parar após encontrar a primeira correspondência
          }
        }
        
        // Mapeamentos específicos adicionais
        if (newUrl.includes('/api/user_roles')) {
          newUrl = newUrl.replace('/api/user_roles', '/api/users/roles');
        } else if (newUrl.includes('/api/profiles')) {
          newUrl = newUrl.replace('/api/profiles', '/api/users/profile');
        } else if (newUrl.includes('/api/course_enrollments')) {
          newUrl = newUrl.replace('/api/course_enrollments', '/api/enrollments/my-enrollments');
        } else if (newUrl.includes('/api/course_purchases')) {
          newUrl = newUrl.replace('/api/course_purchases', '/api/purchases');
        } else if (newUrl.includes('/api/contact_messages')) {
          newUrl = newUrl.replace('/api/contact_messages', '/api/contact');
        } else if (newUrl.includes('/api/lesson_progress')) {
          newUrl = newUrl.replace('/api/lesson_progress', '/api/progress');
        } else if (newUrl.includes('/api/course_materials')) {
          newUrl = newUrl.replace('/api/course_materials', '/api/materials');
        } else if (newUrl.includes('/api/webhook_logs')) {
          newUrl = newUrl.replace('/api/webhook_logs', '/api/webhooks/logs');
        }
        
        console.log('🔄 Redirecionando /rest/v1/ para /api/:', url, '→', newUrl);
        const newArgs = [...args];
        newArgs[0] = newUrl;
        return originalFetch.apply(this, newArgs);
      }
      
      // Detectar qualquer URL do Supabase (várias formas)
      const isSupabaseUrl = url.includes('supabase.co') || 
                           url.includes('qxgzazewwutbikmmpkms') ||
                           (url.includes('/rest/v1/') && !url.includes('/api/'));
      
      if (isSupabaseUrl) {
        console.warn('⚠️ Chamada ao Supabase detectada:', url);
        
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

          // BLOQUEAR Supabase e redirecionar user_roles via proxy local
          if (url.includes('/rest/v1/user_roles') || (url.includes('user_roles') && url.includes('supabase'))) {
            console.log('🔄 Bloqueando Supabase e redirecionando user_roles via proxy local → produção');
            try {
              const urlObj = new URL(url);
              const params = new URLSearchParams(urlObj.search);
              
              // Extrair user_id do formato Supabase (user_id=eq.{id})
              let userId = null;
              if (params.has('user_id')) {
                const userIdParam = params.get('user_id');
                const match = userIdParam.match(/eq\.(.+)/);
                if (match) {
                  userId = match[1];
                } else {
                  userId = userIdParam;
                }
              }
              
              // Construir nova URL
              let newUrl = BACKEND_URL + '/api/users/roles';
              if (userId) {
                newUrl += `?user_id=eq.${userId}`;
              }
              
              console.log('📡 Requisição via proxy local:', newUrl);
              console.log('📡 Proxy redireciona para:', BACKEND_PRODUCTION + newUrl.replace(BACKEND_URL, ''));
              
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
              
              // Interceptar a resposta e transformar para formato Supabase
              const fetchPromise = originalFetch.apply(this, newArgs);
              return fetchPromise.then(async (response) => {
                // CLONAR a resposta antes de ler o body para evitar "body stream already read"
                const clonedResponse = response.clone();
                
                console.log(`📊 [fetch] Status da resposta de /api/users/roles: ${response.status} ${response.statusText}`);
                
                if (!response.ok) {
                  try {
                    const errorText = await clonedResponse.text();
                    console.error(`❌ [fetch] Erro ${response.status} em /api/users/roles:`, errorText);
                  } catch (e) {
                    console.error(`❌ [fetch] Erro ${response.status} em /api/users/roles (não foi possível ler o body)`);
                  }
                  return response;
                }
                
                try {
                  const data = await clonedResponse.json();
                  console.log('📥 [fetch] Resposta raw de /api/users/roles:', JSON.stringify(data, null, 2));
                  
                  // O backend retorna array de objetos { role: '...' }
                  // O Supabase espera array de objetos com a mesma estrutura
                  // Mas pode estar esperando que seja um array direto ou dentro de um objeto
                  const transformedData = Array.isArray(data) ? data : (data.roles || data.data || []);
                  
                  console.log('✅ [fetch] Transformando resposta de user_roles:', JSON.stringify(transformedData, null, 2));
                  console.log('✅ [fetch] Tipo da resposta transformada:', Array.isArray(transformedData) ? 'Array' : typeof transformedData);
                  console.log('✅ [fetch] Tamanho do array:', transformedData.length);
                  
                  // Criar nova resposta com dados transformados
                  const newResponse = new Response(JSON.stringify(transformedData), {
                    status: response.status,
                    statusText: response.statusText,
                    headers: {
                      ...Object.fromEntries(response.headers.entries()),
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  console.log('✅ [fetch] Nova resposta criada com status:', newResponse.status);
                  return newResponse;
                } catch (error) {
                  console.error('❌ [fetch] Erro ao transformar resposta de user_roles:', error);
                  console.error('❌ [fetch] Stack:', error.stack);
                  return response;
                }
              }).catch((error) => {
                console.error('❌ [fetch] Erro na Promise de user_roles:', error);
                throw error;
              });
            } catch (e) {
              console.error('❌ Erro ao processar URL:', e);
              let newUrl = BACKEND_URL + '/api/users/roles';
              const newArgs = [...args];
              newArgs[0] = newUrl;
              return originalFetch.apply(this, newArgs);
            }
          }

          // BLOQUEAR Supabase e redirecionar course_enrollments via proxy local
          if (url.includes('/rest/v1/course_enrollments') || (url.includes('course_enrollments') && url.includes('supabase'))) {
            console.log('🔄 Bloqueando Supabase e redirecionando course_enrollments via proxy local → produção');
            try {
              const urlObj = new URL(url);
              const params = new URLSearchParams(urlObj.search);
              
              // Se tiver user_id=eq.{id}, usar endpoint my-enrollments
              let newUrl = null;
              if (params.has('user_id')) {
                const userIdParam = params.get('user_id');
                const match = userIdParam.match(/eq\.(.+)/);
                if (match) {
                  // Usar endpoint my-enrollments que já retorna dados completos com join
                  newUrl = BACKEND_URL + '/api/enrollments/my-enrollments';
                } else {
                  newUrl = BACKEND_URL + '/api/enrollments/my-enrollments';
                }
              } else {
                // Sem user_id, usar endpoint genérico (mas precisa de autenticação)
                newUrl = BACKEND_URL + '/api/enrollments/my-enrollments';
              }
              
              console.log('📡 Requisição via proxy local:', newUrl);
              console.log('📡 Proxy redireciona para:', BACKEND_PRODUCTION + newUrl.replace(BACKEND_URL, ''));
              
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
              let newUrl = BACKEND_URL + '/api/enrollments/my-enrollments';
              const newArgs = [...args];
              newArgs[0] = newUrl;
              return originalFetch.apply(this, newArgs);
            }
          }

          // BLOQUEAR Supabase e redirecionar profiles via proxy local
          if (url.includes('/rest/v1/profiles') || (url.includes('profiles') && url.includes('supabase'))) {
            console.log('🔄 Bloqueando Supabase e redirecionando profiles via proxy local → produção');
            try {
              const urlObj = new URL(url);
              const params = new URLSearchParams(urlObj.search);
              
              // Extrair id do formato Supabase (id=eq.{id})
              let userId = null;
              if (params.has('id')) {
                const idParam = params.get('id');
                const match = idParam.match(/eq\.(.+)/);
                if (match) {
                  userId = match[1];
                } else {
                  userId = idParam;
                }
              }
              
              // Construir nova URL
              let newUrl = BACKEND_URL + '/api/users/profile';
              if (userId) {
                newUrl += `?id=eq.${userId}`;
              }
              
              console.log('📡 Requisição via proxy local:', newUrl);
              console.log('📡 Proxy redireciona para:', BACKEND_PRODUCTION + newUrl.replace(BACKEND_URL, ''));
              
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
              
              // Interceptar a resposta e transformar para formato Supabase
              const fetchPromise = originalFetch.apply(this, newArgs);
              return fetchPromise.then(async (response) => {
                // CLONAR a resposta antes de ler o body para evitar "body stream already read"
                const clonedResponse = response.clone();
                
                console.log(`📊 [fetch] Status da resposta de /api/users/profile: ${response.status} ${response.statusText}`);
                
                if (!response.ok) {
                  try {
                    const errorText = await clonedResponse.text();
                    console.error(`❌ [fetch] Erro ${response.status} em /api/users/profile:`, errorText);
                  } catch (e) {
                    console.error(`❌ [fetch] Erro ${response.status} em /api/users/profile (não foi possível ler o body)`);
                  }
                  return response;
                }
                
                try {
                  const data = await clonedResponse.json();
                  console.log('📥 [fetch] Resposta raw de /api/users/profile:', JSON.stringify(data, null, 2));
                  
                  // O backend retorna objeto { first_name, last_name, avatar_url, ... }
                  // O Supabase SEMPRE espera um array na resposta HTTP
                  // O método maybeSingle() processa o array depois e retorna o primeiro item ou null
                  const transformedData = Array.isArray(data) ? data : (data ? [data] : []);
                  
                  console.log('✅ [fetch] Transformando resposta de profiles:', JSON.stringify(transformedData, null, 2));
                  console.log('✅ [fetch] Tipo da resposta transformada:', Array.isArray(transformedData) ? 'Array' : typeof transformedData);
                  console.log('✅ [fetch] Tamanho do array:', transformedData.length);
                  if (transformedData.length > 0) {
                    console.log('✅ [fetch] Primeiro item do array:', JSON.stringify(transformedData[0], null, 2));
                  } else {
                    console.warn('⚠️ [fetch] Array vazio retornado para profiles');
                  }
                  
                  // Criar nova resposta com dados transformados
                  // IMPORTANTE: O Supabase espera um array, mesmo que vazio
                  const newResponse = new Response(JSON.stringify(transformedData), {
                    status: response.status,
                    statusText: response.statusText,
                    headers: {
                      ...Object.fromEntries(response.headers.entries()),
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  console.log('✅ [fetch] Nova resposta criada com status:', newResponse.status);
                  return newResponse;
                } catch (error) {
                  console.error('❌ [fetch] Erro ao transformar resposta de profiles:', error);
                  console.error('❌ [fetch] Stack:', error.stack);
                  return response;
                }
              }).catch((error) => {
                console.error('❌ [fetch] Erro na Promise de profiles:', error);
                throw error;
              });
            } catch (e) {
              console.error('❌ Erro ao processar URL:', e);
              let newUrl = BACKEND_URL + '/api/users/profile';
              const newArgs = [...args];
              newArgs[0] = newUrl;
              return originalFetch.apply(this, newArgs);
            }
          }
        
        // Bloquear TODAS as outras chamadas ao Supabase (SEM redirecionar)
        if (url.includes('supabase.co') || url.includes('qxgzazewwutbikmmpkms')) {
          console.error('❌ BLOQUEANDO chamada ao Supabase:', url);
          console.error('❌ SUPABASE FOI COMPLETAMENTE REMOVIDO DO SISTEMA');
          console.error('❌ Use os métodos do cliente de autenticação (auth.signInWithPassword, etc.)');
          console.error('❌ Ou use as APIs internas diretamente (/api/auth/signin, etc.)');
          return Promise.reject(new Error('Supabase foi completamente removido. Use auth.signInWithPassword() ou /api/auth/signin'));
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
      initializeAuth();
    });
  } else {
    console.log('📄 DOM já carregado - Replacement ativo!');
    initializeAuth();
  }
  
  // Função para inicializar autenticação
  async function initializeAuth() {
    console.log('🔐 [initializeAuth] Inicializando autenticação...');
    // Carregar token e usuário do localStorage
    const token = getAuthToken();
    if (token) {
      // Tentar obter usuário do localStorage primeiro
      try {
        const authDataStr = localStorage.getItem('auth_token') || localStorage.getItem('sb-auth-token');
        if (authDataStr) {
          const authData = JSON.parse(authDataStr);
          if (authData.user) {
            currentUser = authData.user;
            authToken = authData.access_token || authData.token;
            console.log('✅ [initializeAuth] Usuário autenticado carregado do localStorage:', currentUser);
            
            // Disparar evento para notificar hooks que podem estar esperando
            const authEventDetail = { 
              event: 'SIGNED_IN', 
              session: { 
                access_token: authToken, 
                user: currentUser 
              } 
            };
            
            // Chamar callbacks diretamente se existirem
            if (window._authStateChangeCallbacks && window._authStateChangeCallbacks.length > 0) {
              console.log(`🔔 [initializeAuth] Notificando ${window._authStateChangeCallbacks.length} callback(s) registrado(s)`);
              window._authStateChangeCallbacks.forEach((cb, index) => {
                try {
                  cb(authEventDetail);
                  console.log(`✅ [initializeAuth] Callback ${index + 1} notificado`);
                } catch (e) {
                  console.error(`❌ [initializeAuth] Erro ao notificar callback ${index + 1}:`, e);
                }
              });
            }
            
            // Disparar evento customizado
            window.dispatchEvent(new CustomEvent('auth-state-changed', { 
              detail: authEventDetail
            }));
            console.log('🔔 [initializeAuth] Evento auth-state-changed disparado');
            
            // Criar um mecanismo para notificar hooks que forem registrados depois
            // Verificar periodicamente se novos callbacks foram registrados
            let lastCallbackCount = window._authStateChangeCallbacks ? window._authStateChangeCallbacks.length : 0;
            const checkNewCallbacks = setInterval(() => {
              const currentCallbackCount = window._authStateChangeCallbacks ? window._authStateChangeCallbacks.length : 0;
              if (currentCallbackCount > lastCallbackCount) {
                console.log(`🔔 [initializeAuth] Novo callback registrado! Notificando...`);
                const newCallbacks = window._authStateChangeCallbacks.slice(lastCallbackCount);
                newCallbacks.forEach((cb, index) => {
                  try {
                    cb(authEventDetail);
                    console.log(`✅ [initializeAuth] Novo callback ${index + 1} notificado`);
                  } catch (e) {
                    console.error(`❌ [initializeAuth] Erro ao notificar novo callback ${index + 1}:`, e);
                  }
                });
                lastCallbackCount = currentCallbackCount;
              }
            }, 100); // Verificar a cada 100ms
            
            // Parar de verificar após 10 segundos (tempo suficiente para hooks serem registrados)
            setTimeout(() => {
              clearInterval(checkNewCallbacks);
              console.log('🔔 [initializeAuth] Parando verificação de novos callbacks');
            }, 10000);
            
            return;
          }
        }
      } catch (e) {
        console.error('Erro ao ler localStorage:', e);
      }
      
      // Se não tiver no localStorage, tentar obter do token decodificado
      let user = getUserFromToken();
      
      // Se não conseguir, tentar obter do backend
      if (!user) {
        try {
          const result = await apiRequest('GET', '/api/auth/user');
          if (!result.error && result.data && result.data.user) {
            user = result.data.user;
            currentUser = user;
            
            // Atualizar localStorage com o usuário completo
            const authData = {
              access_token: token,
              token: token,
              user: user,
              expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000)
            };
            localStorage.setItem('auth_token', JSON.stringify(authData));
            localStorage.setItem('sb-auth-token', JSON.stringify(authData));
          }
        } catch (e) {
          console.error('Erro ao inicializar autenticação:', e);
        }
      } else {
        currentUser = user;
      }
      
      if (user) {
        console.log('✅ Usuário autenticado carregado:', user);
        
        // Disparar evento para notificar componentes
        window.dispatchEvent(new CustomEvent('auth-state-changed', { 
          detail: { 
            event: 'SIGNED_IN', 
            session: { 
              access_token: token, 
              user: user 
            } 
          } 
        }));
      }
    } else {
      console.log('ℹ️ Nenhum token de autenticação encontrado');
    }
  }
})();

