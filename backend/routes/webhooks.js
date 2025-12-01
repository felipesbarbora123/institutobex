import express from 'express';
import { query, transaction } from '../config/database.js';
import axios from 'axios';

const router = express.Router();

// Webhook do AbacatePay
router.post('/abacatepay', async (req, res) => {
  try {
    const webhookData = req.body;
    const webhookSecret = process.env.ABACATEPAY_WEBHOOK_SECRET;
    
    console.log('📥 Webhook recebido do AbacatePay:', JSON.stringify(webhookData, null, 2));
    
    // Validar webhook secret (se fornecido)
    // O AbacatePay pode enviar o secret no header ou no body
    const receivedSecret = req.headers['x-webhook-secret'] || 
                          req.headers['webhook-secret'] || 
                          req.body?.secret;
    
    if (webhookSecret && receivedSecret && receivedSecret !== webhookSecret) {
      console.warn('⚠️ Webhook secret inválido');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Registrar webhook no log
    await query(
      `INSERT INTO webhook_logs (provider, event_type, payload, processed, created_at)
       VALUES ($1, $2, $3::jsonb, false, NOW())`,
      ['abacatepay', eventType || 'unknown', JSON.stringify(webhookData)]
    ).catch(err => {
      console.error('Erro ao registrar webhook log:', err);
      // Continuar mesmo se não conseguir registrar o log
    });
    
    // Processar diferentes tipos de eventos
    const eventType = webhookData.type || webhookData.event || webhookData.status;
    const billingId = webhookData.billingId || webhookData.billing_id || webhookData.id;
    const externalId = webhookData.externalId || webhookData.external_id;
    const status = webhookData.status || webhookData.payment_status;
    
    console.log(`📊 Evento: ${eventType}, Status: ${status}, BillingId: ${billingId}`);
    
    // Se o pagamento foi aprovado/pago
    if (status === 'PAID' || status === 'APPROVED' || status === 'paid' || eventType === 'payment.approved') {
      // Buscar compra pelo billing_id ou external_id
      let purchaseResult;
      
      if (billingId) {
        purchaseResult = await query(
          'SELECT * FROM course_purchases WHERE billing_id = $1',
          [billingId]
        );
      }
      
      if ((!purchaseResult || purchaseResult.rows.length === 0) && externalId) {
        purchaseResult = await query(
          'SELECT * FROM course_purchases WHERE external_id = $1',
          [externalId]
        );
      }
      
      if (purchaseResult && purchaseResult.rows.length > 0) {
        const purchase = purchaseResult.rows[0];
        
        // Se já foi confirmado, não fazer nada
        if (purchase.payment_status === 'paid' || purchase.payment_status === 'approved') {
          console.log('✅ Pagamento já confirmado anteriormente');
          return res.json({ success: true, message: 'Already confirmed' });
        }
        
        // Confirmar pagamento em transação
        await transaction(async (client) => {
          // Atualizar status da compra
          await client.query(
            `UPDATE course_purchases 
             SET payment_status = 'paid', 
                 updated_at = NOW(),
                 billing_id = COALESCE(billing_id, $1)
             WHERE id = $2`,
            [billingId, purchase.id]
          );
          
          // Criar matrícula se não existir
          const enrollmentCheck = await client.query(
            'SELECT id FROM course_enrollments WHERE user_id = $1 AND course_id = $2',
            [purchase.user_id, purchase.course_id]
          );
          
          if (enrollmentCheck.rows.length === 0) {
            await client.query(
              `INSERT INTO course_enrollments (user_id, course_id, created_at)
               VALUES ($1, $2, NOW())`,
              [purchase.user_id, purchase.course_id]
            );
            console.log('✅ Matrícula criada para o curso');
          }
        });
        
        // Marcar webhook como processado
        await query(
          `UPDATE webhook_logs 
           SET processed = true, updated_at = NOW()
           WHERE provider = 'abacatepay' 
           AND payload->>'id' = $1 
           OR payload->>'billingId' = $1
           ORDER BY created_at DESC LIMIT 1`,
          [billingId || externalId]
        ).catch(err => {
          console.error('Erro ao atualizar log do webhook:', err);
        });
        
        // Buscar dados completos para notificação
        const fullPurchase = await query(
          `SELECT cp.*, c.title as course_title, 
                  COALESCE(p.first_name, cp.customer_data->>'name', '') as first_name,
                  COALESCE(p.last_name, '') as last_name
           FROM course_purchases cp
           JOIN courses c ON c.id = cp.course_id
           LEFT JOIN profiles p ON p.id = cp.user_id
           WHERE cp.id = $1`,
          [purchase.id]
        );
        
        const purchaseData = fullPurchase.rows[0];
        
        // Enviar notificação WhatsApp (assíncrono, não bloqueia)
        if (purchaseData?.customer_data?.phone) {
          try {
            const customerName = `${purchaseData.first_name || ''} ${purchaseData.last_name || ''}`.trim() || 
                                purchaseData.customer_data?.name || 
                                'Cliente';
            
            console.log('📱 Enviando notificação WhatsApp para:', purchaseData.customer_data.phone);
            
            await axios.post(
              `${process.env.API_URL || 'http://localhost:3001'}/api/whatsapp/send`,
              {
                name: customerName,
                phone: purchaseData.customer_data.phone,
                courseTitle: purchaseData.course_title,
                amount: purchaseData.amount,
              }
            );
            console.log('✅ Notificação WhatsApp enviada com sucesso');
          } catch (whatsappError) {
            console.error('⚠️ Erro ao enviar WhatsApp (não crítico):', whatsappError.message);
            // Não falha o processo se WhatsApp falhar
          }
        } else {
          console.log('⚠️ Telefone não encontrado nos dados do cliente, WhatsApp não será enviado');
        }
        
        console.log('✅ Pagamento confirmado e acesso liberado');
        return res.json({ 
          success: true, 
          message: 'Payment confirmed and access granted',
          purchaseId: purchase.id
        });
      } else {
        console.warn('⚠️ Compra não encontrada para billingId:', billingId, 'ou externalId:', externalId);
        return res.status(404).json({ 
          error: 'Purchase not found',
          billingId,
          externalId
        });
      }
    }
    
    // Para outros eventos, apenas confirmar recebimento
    res.json({ 
      success: true, 
      message: 'Webhook received',
      eventType,
      status
    });
    
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    
    // Registrar erro no log
    try {
      await query(
        `INSERT INTO webhook_logs (source, payload, error, created_at)
         VALUES ($1, $2::jsonb, $3, NOW())`,
        ['abacatepay', JSON.stringify(req.body), error.message]
      );
    } catch (logError) {
      console.error('Erro ao registrar log:', logError);
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;

