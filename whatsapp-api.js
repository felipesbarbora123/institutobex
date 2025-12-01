// Módulo para integração com API Evolution WhatsApp
// Documentação: https://doc.evolution-api.com/

const https = require('https');
const http = require('http');

/**
 * Configuração da API Evolution WhatsApp
 * Configure estas variáveis no arquivo .env ou diretamente aqui
 */
const EVOLUTION_API_CONFIG = {
  baseUrl: process.env.EVOLUTION_API_URL || 'https://mensadodo.dunis.com.br', // URL da sua API Evolution
  apiKey: process.env.EVOLUTION_API_KEY || '3B2F25CF7B2F-41F0-8EA1-2F021B2591FC', // Sua chave de API
  instanceName: process.env.EVOLUTION_INSTANCE_NAME || 'Dunis', // Nome da instância (encontrado: "Dunis")
  number: process.env.EVOLUTION_NUMBER || '5511948248421', // Número do WhatsApp (encontrado: 5511948248421)
};

/**
 * Envia uma mensagem de texto via WhatsApp usando API Evolution
 * @param {string} to - Número de destino (formato: 5511999999999)
 * @param {string} message - Mensagem a ser enviada
 * @param {object} options - Opções adicionais (delay, presence, etc)
 * @returns {Promise<object>} Resposta da API
 */
async function sendTextMessage(to, message, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${EVOLUTION_API_CONFIG.baseUrl}/message/sendText/${EVOLUTION_API_CONFIG.instanceName}`);
    
    const payload = JSON.stringify({
      number: to,
      text: message,
      delay: options.delay || 1200,
      presence: options.presence || 'composing',
      ...options
    });

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'apikey': EVOLUTION_API_CONFIG.apiKey
      }
    };

    const protocol = url.protocol === 'https:' ? https : http;
    
    const req = protocol.request(url, requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(`API Error: ${res.statusCode} - ${data}`));
          }
        } catch (error) {
          reject(new Error(`Parse Error: ${error.message} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request Error: ${error.message}`));
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Envia uma mensagem formatada para contato do site
 * @param {object} contactData - Dados do contato {name, email, subject, message, phone?}
 * @returns {Promise<object>} Resposta da API
 */
async function sendContactNotification(contactData) {
  const { name, email, subject, message, phone } = contactData;
  
  // Formatar número de telefone (remover caracteres não numéricos)
  const formattedPhone = phone ? phone.replace(/\D/g, '') : null;
  
  // Criar mensagem formatada
  const notificationMessage = `📧 *Nova Mensagem de Contato - Instituto Bex*

👤 *Nome:* ${name}
📧 *Email:* ${email}
${formattedPhone ? `📱 *Telefone:* ${formattedPhone}\n` : ''}📌 *Assunto:* ${subject}

💬 *Mensagem:*
${message}

---
_Enviado automaticamente pelo sistema_`;

  // Se tiver telefone, enviar para o telefone também
  if (formattedPhone) {
    try {
      await sendTextMessage(formattedPhone, `Olá ${name}! Recebemos sua mensagem sobre "${subject}". Entraremos em contato em breve!`);
    } catch (error) {
      console.error('Erro ao enviar confirmação para o cliente:', error);
    }
  }

  // Enviar notificação para o número configurado
  if (!EVOLUTION_API_CONFIG.number) {
    throw new Error('EVOLUTION_NUMBER não configurado. Configure o número de destino no arquivo .env');
  }

  return sendTextMessage(EVOLUTION_API_CONFIG.number, notificationMessage);
}

/**
 * Verifica o status da instância
 * @returns {Promise<object>} Status da instância
 */
async function checkInstanceStatus() {
  return new Promise((resolve, reject) => {
    const url = new URL(`${EVOLUTION_API_CONFIG.baseUrl}/instance/fetchInstances`);
    
    const requestOptions = {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_CONFIG.apiKey
      }
    };

    const protocol = url.protocol === 'https:' ? https : http;
    
    const req = protocol.request(url, requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`Parse Error: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request Error: ${error.message}`));
    });

    req.end();
  });
}

/**
 * Verifica se um número tem WhatsApp
 * @param {string} phoneNumber - Número de telefone (formato: 5511999999999)
 * @returns {Promise<boolean>} true se o número tem WhatsApp, false caso contrário
 */
async function checkWhatsAppNumber(phoneNumber) {
  return new Promise((resolve) => {
    // Formatar número (remover caracteres não numéricos)
    const formattedNumber = phoneNumber.replace(/\D/g, '');
    
    if (!formattedNumber || formattedNumber.length < 10) {
      resolve(false);
      return;
    }

    // Tentar diferentes endpoints da API Evolution
    const endpoints = [
      `/chat/whatsappNumbers/${EVOLUTION_API_CONFIG.instanceName}?numbers=${formattedNumber}`,
      `/chat/checkNumber/${EVOLUTION_API_CONFIG.instanceName}?number=${formattedNumber}`,
      `/chat/exists/${EVOLUTION_API_CONFIG.instanceName}?number=${formattedNumber}`
    ];

    let currentEndpoint = 0;

    const tryEndpoint = () => {
      if (currentEndpoint >= endpoints.length) {
        // Se todos os endpoints falharem, assume que tem WhatsApp para tentar enviar
        console.warn('⚠️ Não foi possível verificar número WhatsApp, tentando enviar mesmo assim');
        resolve(true);
        return;
      }

      const url = new URL(`${EVOLUTION_API_CONFIG.baseUrl}${endpoints[currentEndpoint]}`);
      
      const requestOptions = {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_CONFIG.apiKey
        }
      };

      const protocol = url.protocol === 'https:' ? https : http;
      
      const req = protocol.request(url, requestOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          // Se status for 200-299, tentar processar resposta
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const response = JSON.parse(data);
              
              // Verificar diferentes formatos de resposta
              if (Array.isArray(response) && response.length > 0) {
                const numberInfo = response.find(item => 
                  (item.jid && item.jid.includes(formattedNumber)) ||
                  (item.number && item.number.includes(formattedNumber))
                );
                resolve(numberInfo ? (numberInfo.exists === true || numberInfo.exists === 'true') : false);
                return;
              } else if (response.exists !== undefined) {
                resolve(response.exists === true || response.exists === 'true');
                return;
              } else if (response.hasWhatsApp !== undefined) {
                resolve(response.hasWhatsApp === true || response.hasWhatsApp === 'true');
                return;
              }
            } catch (error) {
              // Se não conseguir parsear, tenta próximo endpoint
            }
          }
          
          // Se não funcionou, tenta próximo endpoint
          currentEndpoint++;
          tryEndpoint();
        });
      });

      req.on('error', (error) => {
        // Se der erro, tenta próximo endpoint
        currentEndpoint++;
        tryEndpoint();
      });

      req.setTimeout(5000, () => {
        req.destroy();
        currentEndpoint++;
        tryEndpoint();
      });

      req.end();
    };

    tryEndpoint();
  });
}

/**
 * Envia notificação de pagamento confirmado para o cliente
 * @param {object} paymentData - Dados do pagamento {name, phone, courseTitle?, amount?}
 * @returns {Promise<object>} Resposta da API
 */
async function sendPaymentConfirmation(paymentData) {
  const { name, phone, courseTitle, amount } = paymentData;
  
  if (!phone) {
    throw new Error('Número de telefone é obrigatório para enviar notificação de pagamento.');
  }

  // Formatar número de telefone (remover caracteres não numéricos)
  const formattedPhone = phone.replace(/\D/g, '');
  
  if (formattedPhone.length < 10) {
    throw new Error('Número de telefone inválido.');
  }

  // Verificar se o número tem WhatsApp
  console.log(`🔍 Verificando se o número ${formattedPhone} tem WhatsApp...`);
  const hasWhatsApp = await checkWhatsAppNumber(formattedPhone);
  
  if (!hasWhatsApp) {
    console.log(`⚠️ Número ${formattedPhone} não possui WhatsApp. Notificação não será enviada.`);
    throw new Error('Este número não possui WhatsApp cadastrado.');
  }

  console.log(`✅ Número ${formattedPhone} possui WhatsApp. Enviando notificação...`);

  // Criar mensagem formatada
  const message = `🎉 *Pagamento Confirmado - Instituto Bex*

Olá ${name}! 👋

✅ *Seu pagamento foi recebido com sucesso!*

${courseTitle ? `📚 *Curso:* ${courseTitle}\n` : ''}${amount ? `💰 *Valor:* R$ ${parseFloat(amount).toFixed(2).replace('.', ',')}\n` : ''}
🎓 *A partir de agora, você está apto a acessar todo o conteúdo da plataforma do Instituto Bex!*

Acesse sua conta e comece a estudar agora mesmo:
🔗 Acesse: ${process.env.APP_URL || 'https://institutobex.com.br'}

Bons estudos! 📖✨

---
_Instituto Bex - Transformando vidas através da educação_`;

  try {
    const result = await sendTextMessage(formattedPhone, message);
    console.log(`✅ Notificação de pagamento enviada com sucesso para ${formattedPhone}`);
    return result;
  } catch (error) {
    console.error(`❌ Erro ao enviar notificação de pagamento para ${formattedPhone}:`, error);
    throw error;
  }
}

module.exports = {
  sendTextMessage,
  sendContactNotification,
  checkInstanceStatus,
  checkWhatsAppNumber,
  sendPaymentConfirmation,
  EVOLUTION_API_CONFIG
};

