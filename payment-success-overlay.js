/**
 * Overlay de Sucesso de Pagamento
 * Exibe uma tela de sucesso quando o pagamento for confirmado
 */

(function() {
  'use strict';
  
  // Flag global para indicar que o pagamento foi confirmado e o polling deve parar
  window.paymentConfirmed = false;
  window.paymentConfirmedBillingId = null;
  
  // Escutar evento de pagamento confirmado (disparado pelo supabase-replacement.js)
  window.addEventListener('paymentConfirmed', (event) => {
    console.log('🎉 Evento de pagamento confirmado recebido!');
    
    // Marcar como confirmado para parar o polling
    window.paymentConfirmed = true;
    if (event.detail && event.detail.purchase && event.detail.purchase.billing_id) {
      window.paymentConfirmedBillingId = event.detail.purchase.billing_id;
    }
    
    // Exibir overlay apenas uma vez
    if (!document.getElementById('payment-success-overlay')) {
      createSuccessOverlay();
    }
  });
  
  // Criar elemento de overlay de sucesso
  function createSuccessOverlay() {
    // Remover overlay existente se houver
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
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      animation: fadeIn 0.3s ease-in;
    `;
    
    // Criar card de sucesso
    const card = document.createElement('div');
    card.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 500px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.4s ease-out;
    `;
    
    // Ícone de sucesso (checkmark animado)
    const icon = document.createElement('div');
    icon.style.cssText = `
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      background: #10b981;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: scaleIn 0.5s ease-out;
    `;
    
    const checkmark = document.createElement('div');
    checkmark.innerHTML = `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
    icon.appendChild(checkmark);
    
    // Título
    const title = document.createElement('h2');
    title.textContent = '🎉 Pagamento Recebido com Sucesso!';
    title.style.cssText = `
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 12px;
    `;
    
    // Mensagem
    const message = document.createElement('p');
    message.textContent = 'Seu pagamento foi confirmado e o acesso ao curso foi liberado. Você será redirecionado em instantes...';
    message.style.cssText = `
      font-size: 16px;
      color: #6b7280;
      margin-bottom: 24px;
      line-height: 1.6;
    `;
    
    // Indicador de carregamento
    const loader = document.createElement('div');
    loader.style.cssText = `
      width: 40px;
      height: 40px;
      margin: 0 auto;
      border: 4px solid #e5e7eb;
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    `;
    
    // Adicionar elementos ao card
    card.appendChild(icon);
    card.appendChild(title);
    card.appendChild(message);
    card.appendChild(loader);
    
    // Adicionar card ao overlay
    overlay.appendChild(card);
    
    // Adicionar estilos de animação
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes slideUp {
        from {
          transform: translateY(30px);
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
        }
        to {
          transform: scale(1);
        }
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    // Adicionar ao body (verificar se existe)
    if (document.body) {
      document.body.appendChild(overlay);
    } else {
      // Se o body ainda não existe, adicionar quando estiver disponível
      const addToBody = () => {
        if (document.body) {
          document.body.appendChild(overlay);
        } else {
          setTimeout(addToBody, 100);
        }
      };
      addToBody();
    }
    
    // Remover após 4 segundos
    setTimeout(() => {
      if (overlay && overlay.parentNode) {
        overlay.style.animation = 'fadeOut 0.3s ease-in';
        setTimeout(() => {
          overlay.remove();
        }, 300);
      }
    }, 4000);
    
    return overlay;
  }
  
  // Expor função globalmente
  window.showPaymentSuccessOverlay = createSuccessOverlay;
  
  // Interceptar quando o pagamento for confirmado
  const originalConsoleLog = console.log;
  const originalToast = window.toast;
  
  // Interceptar console.log para detectar confirmação
  console.log = function(...args) {
    const message = args.join(' ');
    
    // Detectar quando o pagamento é confirmado
    if (message.includes('✅ Pagamento confirmado') || 
        message.includes('✅ [REALTIME] Pagamento confirmado') ||
        message.includes('Pagamento aprovado') ||
        message.includes('matrícula encontrada')) {
      
      // Criar overlay de sucesso
      const overlay = createSuccessOverlay();
      
      // Remover após 3 segundos (antes do redirecionamento)
      setTimeout(() => {
        if (overlay && overlay.parentNode) {
          overlay.style.animation = 'fadeOut 0.3s ease-in';
          setTimeout(() => {
            overlay.remove();
          }, 300);
        }
      }, 3000);
    }
    
    // Chamar console.log original
    originalConsoleLog.apply(console, args);
  };
  
  // Interceptar redirecionamentos para mostrar overlay antes
  const originalNavigate = window.location.replace;
  const originalAssign = window.location.assign;
  
  // Interceptar quando detectar redirecionamento para curso
  const checkForRedirect = () => {
    const currentPath = window.location.pathname;
    if (currentPath.includes('/curso/') && sessionStorage.getItem('payment_just_confirmed')) {
      sessionStorage.removeItem('payment_just_confirmed');
      const overlay = createSuccessOverlay();
      setTimeout(() => {
        if (overlay && overlay.parentNode) {
          overlay.remove();
        }
      }, 3000);
    }
  };
  
  // Verificar a cada segundo
  setInterval(checkForRedirect, 1000);
  
  // Interceptar quando toast de sucesso for exibido
  if (window.useToast) {
    const originalUseToast = window.useToast;
    window.useToast = function() {
      const toast = originalUseToast();
      const originalToast = toast.toast;
      
      toast.toast = function(options) {
        if (options && 
            (options.title && options.title.includes('Pagamento aprovado')) ||
            (options.title && options.title.includes('✅'))) {
          const overlay = createSuccessOverlay();
          setTimeout(() => {
            if (overlay && overlay.parentNode) {
              overlay.remove();
            }
          }, 3000);
        }
        return originalToast.call(this, options);
      };
      
      return toast;
    };
  }
  
  // Interceptar mudanças no localStorage (quando matrícula é criada)
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    originalSetItem.call(this, key, value);
    
    // Se uma matrícula foi criada (detectado por mudanças no estado)
    if (key.includes('enrollment') || key.includes('payment')) {
      // Verificar se pagamento foi confirmado
      setTimeout(() => {
        const enrollmentCheck = document.querySelector('[data-payment-confirmed="true"]');
        if (enrollmentCheck) {
          const overlay = createSuccessOverlay();
          setTimeout(() => {
            if (overlay && overlay.parentNode) {
              overlay.remove();
            }
          }, 3000);
        }
      }, 500);
    }
  };
  
  // Método mais direto: interceptar quando o estado muda para "verifying" e depois detecta sucesso
  let lastPaymentState = null;
  const checkPaymentState = () => {
    // Procurar por elementos que indicam verificação de pagamento
    const verifyingElements = document.querySelectorAll('[class*="verifying"], [class*="Verificando"]');
    const successMessages = document.querySelectorAll('[class*="success"], [class*="aprovado"], [class*="confirmado"]');
    
    if (successMessages.length > 0 && !document.getElementById('payment-success-overlay')) {
      const overlay = createSuccessOverlay();
      setTimeout(() => {
        if (overlay && overlay.parentNode) {
          overlay.remove();
        }
      }, 3000);
    }
  };
  
  // Verificar a cada 500ms
  setInterval(checkPaymentState, 500);
  
  // Interceptar mensagens de toast do sistema
  function setupObserver() {
    if (!document.body) {
      // Se o body ainda não existe, tentar novamente depois
      setTimeout(setupObserver, 100);
      return;
    }
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            const text = node.textContent || '';
            if ((text.includes('Pagamento aprovado') || 
                 text.includes('Pagamento confirmado') ||
                 text.includes('curso foi liberado')) &&
                !document.getElementById('payment-success-overlay')) {
              const overlay = createSuccessOverlay();
              setTimeout(() => {
                if (overlay && overlay.parentNode) {
                  overlay.remove();
                }
              }, 3000);
            }
          }
        });
      });
    });
    
    try {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    } catch (e) {
      console.warn('Erro ao configurar observer:', e);
    }
  }
  
  // Configurar observer quando o body estiver disponível
  if (document.body) {
    setupObserver();
  } else {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupObserver);
    } else {
      setTimeout(setupObserver, 100);
    }
  }
  
  // Escutar evento de pagamento confirmado (disparado pelo supabase-replacement.js)
  window.addEventListener('paymentConfirmed', (event) => {
    console.log('🎉 Evento de pagamento confirmado recebido!');
    if (!document.getElementById('payment-success-overlay')) {
      const overlay = createSuccessOverlay();
      setTimeout(() => {
        if (overlay && overlay.parentNode) {
          overlay.style.animation = 'fadeOut 0.3s ease-in';
          setTimeout(() => {
            overlay.remove();
          }, 300);
        }
      }, 4000);
    }
  });
  
  // Também escutar se a função global estiver disponível
  if (window.showPaymentSuccessOverlay) {
    // Já está disponível, não fazer nada
  } else {
    // Expor função globalmente
    window.showPaymentSuccessOverlay = createSuccessOverlay;
  }
  
  console.log('✅ Payment Success Overlay carregado!');
})();

