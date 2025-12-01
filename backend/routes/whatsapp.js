import express from 'express';
import axios from 'axios';
import { query } from '../config/database.js';

const router = express.Router();

// Enviar notificação WhatsApp
router.post('/send', async (req, res) => {
  let formattedPhone = null;
  let message = '';
  
  try {
    const { name, phone, courseTitle, amount, message: customMessage } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ 
        error: 'Nome e telefone são obrigatórios',
        code: 'MISSING_FIELDS'
      });
    }

    // Formatar telefone - remover caracteres não numéricos
    formattedPhone = phone.replace(/\D/g, '');
    
    if (formattedPhone.length < 10) {
      return res.status(400).json({ 
        error: 'Número de telefone inválido',
        code: 'INVALID_PHONE'
      });
    }
    
    // Adicionar código do país (55 para Brasil) se não tiver
    // Se o número começa com 55, já tem código do país
    // Se não, adicionar 55
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    }
    
    console.log(`📱 [WHATSAPP] Telefone formatado: ${formattedPhone} (original: ${phone})`);

    // Se houver mensagem customizada, usar ela. Caso contrário, montar mensagem padrão
    if (customMessage) {
      message = customMessage;
    } else {
      // Montar mensagem padrão de pagamento confirmado
      message = `🎉 *Pagamento Confirmado - Instituto Bex*\n\n`;
      message += `Olá ${name}! 👋\n\n`;
      message += `✅ *Seu pagamento foi recebido com sucesso!*\n\n`;
      
      if (courseTitle) {
        message += `📚 *Curso:* ${courseTitle}\n`;
      }
      
      if (amount) {
        const formattedAmount = parseFloat(amount).toFixed(2).replace('.', ',');
        message += `💰 *Valor:* R$ ${formattedAmount}\n`;
      }
      
      message += `\n🎓 *A partir de agora, você está apto a acessar todo o conteúdo da plataforma do Instituto Bex!*\n\n`;
      message += `Acesse sua conta e comece a estudar agora mesmo:\n`;
      message += `🔗 Acesse: ${process.env.APP_URL || 'https://institutobex.com.br'}\n\n`;
      message += `Bons estudos! 📖✨\n\n`;
      message += `---\n`;
      message += `_Instituto Bex - Transformando vidas através da educação_`;
    }

    // Enviar via Evolution API
    const evolutionUrl = `${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE_NAME}`;
    const requestBody = {
      number: formattedPhone,
      text: message
    };
    
    console.log(`📤 [WHATSAPP] Enviando para: ${evolutionUrl}`);
    console.log(`📤 [WHATSAPP] Body:`, JSON.stringify(requestBody, null, 2));
    console.log(`📤 [WHATSAPP] Headers:`, {
      'Content-Type': 'application/json',
      'apikey': process.env.EVOLUTION_API_KEY ? 'Configurada' : 'Não configurada'
    });
    
    const evolutionResponse = await axios.post(
      evolutionUrl,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.EVOLUTION_API_KEY
        }
      }
    );
    
    console.log(`✅ [WHATSAPP] Resposta recebida:`, JSON.stringify(evolutionResponse.data, null, 2));

    // Log do envio
    await query(
      `INSERT INTO whatsapp_logs (phone, message, status, created_at)
       VALUES ($1, $2, 'sent', NOW())`,
      [formattedPhone, message]
    ).catch(err => {
      console.error('Erro ao salvar log do WhatsApp:', err);
      // Não falha se não conseguir salvar o log
    });

    res.json({
      success: true,
      message: 'Notificação enviada com sucesso',
      data: evolutionResponse.data
    });
  } catch (error) {
    console.error('❌ [WHATSAPP] Erro ao enviar WhatsApp:', error.message);
    
    // Log detalhado do erro
    if (error.response) {
      console.error('❌ [WHATSAPP] Resposta do erro:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    if (error.request) {
      console.error('❌ [WHATSAPP] Request feito mas sem resposta:', {
        url: error.config?.url,
        method: error.config?.method
      });
    }
    
    // Log do erro no banco
    await query(
      `INSERT INTO whatsapp_logs (phone, message, status, error_message, created_at)
       VALUES ($1, $2, 'error', $3, NOW())`,
      [req.body.phone || formattedPhone, message || '', error.message || 'Erro desconhecido']
    ).catch(err => {
      console.error('Erro ao salvar log de erro:', err);
    });

    res.status(500).json({
      success: false,
      error: error.response?.data?.error || error.message || 'Erro ao enviar notificação',
      code: 'WHATSAPP_SEND_ERROR',
      details: error.response?.data || null
    });
  }
});

export default router;

