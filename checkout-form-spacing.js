/**
 * Reduzir espaçamento entre campos do formulário no checkout
 */

(function() {
  'use strict';
  
  // Função para aplicar estilos
  function applyFormSpacing() {
    // Verificar se já foi aplicado
    if (document.getElementById('checkout-form-spacing-styles')) {
      return;
    }
    
    // Criar estilos
    const style = document.createElement('style');
    style.id = 'checkout-form-spacing-styles';
    style.textContent = `
      /* Reduzir espaçamento entre campos do formulário no checkout */
      form.space-y-4 > * + * {
        margin-top: 0.75rem !important; /* Reduzido de 1rem (16px) para 0.75rem (12px) */
      }
      
      form[class*="space-y"] > * + * {
        margin-top: 0.75rem !important;
      }
      
      /* Reduzir espaçamento em divs com space-y dentro do formulário */
      form div[class*="space-y-4"] > * + * {
        margin-top: 0.75rem !important;
      }
      
      form div[class*="space-y-2"] > * + * {
        margin-top: 0.5rem !important; /* Reduzido de 0.5rem para manter proporção */
      }
      
      /* Reduzir espaçamento entre grupos de campos */
      form > div[class*="space-y"] {
        margin-bottom: 0.75rem !important;
      }
      
      /* Reduzir padding interno dos campos */
      form input[type="text"],
      form input[type="email"],
      form input[type="tel"],
      form input[type="password"] {
        padding-top: 0.5rem !important;
        padding-bottom: 0.5rem !important;
      }
      
      /* Reduzir espaçamento entre label e input */
      form label + input,
      form label + div {
        margin-top: 0.25rem !important;
      }
      
      /* Reduzir espaçamento em divs com space-y-2 (labels e inputs) */
      form div[class*="space-y-2"] {
        gap: 0.5rem !important;
      }
      
      /* Aplicar especificamente no checkout */
      [class*="Checkout"] form div[class*="space-y"],
      [id*="checkout"] form div[class*="space-y"],
      form[class*="checkout"] div[class*="space-y"] {
        gap: 0.5rem !important;
      }
      
      /* Reduzir espaçamento vertical geral no formulário */
      form > * {
        margin-bottom: 0.75rem !important;
      }
      
      form > *:last-child {
        margin-bottom: 0 !important;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // Aplicar quando a página carregar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyFormSpacing);
  } else {
    applyFormSpacing();
  }
  
  // Aplicar quando novos elementos forem adicionados (SPA)
  function setupObserver() {
    if (!document.body) {
      // Se o body ainda não existe, tentar novamente depois
      setTimeout(setupObserver, 100);
      return;
    }
    
    const observer = new MutationObserver((mutations) => {
      let shouldApply = false;
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            // Verificar se é um formulário ou contém formulário
            if (node.tagName === 'FORM' || (node.querySelector && node.querySelector('form'))) {
              shouldApply = true;
            }
          }
        });
      });
      
      if (shouldApply) {
        setTimeout(applyFormSpacing, 100);
      }
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
  
  // Aplicar novamente após um tempo para garantir
  setTimeout(applyFormSpacing, 500);
  setTimeout(applyFormSpacing, 1000);
  setTimeout(applyFormSpacing, 2000);
  
  console.log('✅ Checkout form spacing ajustado!');
})();

