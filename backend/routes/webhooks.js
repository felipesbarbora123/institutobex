import express from 'express';
import { query, transaction } from '../config/database.js';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import { sendWhatsAppMessage } from './whatsapp.js';

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
        let finalUserId = purchase.user_id;
        
        // Verificar se precisa criar/atualizar usuário (para compras sem login)
        const customerEmail = purchase.customer_data?.email;
        const customerName = purchase.customer_data?.name || 'Cliente';
        const customerPhone = purchase.customer_data?.phone;
        
        if (customerEmail) {
          // Verificar se user_id existe no banco (pode ser UUID temporário)
          const userCheck = await query(
            'SELECT id FROM profiles WHERE id = $1',
            [purchase.user_id]
          );
          
          if (userCheck.rows.length === 0) {
            // user_id não existe (é temporário), verificar se usuário existe por email
            const existingUserCheck = await query(
              'SELECT id FROM auth.users WHERE email = $1',
              [customerEmail.toLowerCase().trim()]
            );
            
            if (existingUserCheck.rows.length > 0) {
              // Usuário já existe, usar o ID existente
              finalUserId = existingUserCheck.rows[0].id;
              console.log('✅ [WEBHOOK] Usuário já existe por email, usando ID:', finalUserId);
            } else {
              // Criar novo usuário
              console.log('👤 [WEBHOOK] Criando novo usuário para o cliente...');
              
              try {
                // Usar senha fornecida pelo usuário no checkout, ou gerar uma temporária
                let userPassword = '';
                const providedPassword = purchase.customer_data?.password || 
                                       purchase.customer_data?.createPassword ||
                                       purchase.customer_data?.create_password;
                
                if (providedPassword && providedPassword.trim()) {
                  // Usar senha fornecida pelo usuário
                  userPassword = providedPassword.trim();
                  console.log('✅ [WEBHOOK] Usando senha fornecida pelo usuário no checkout');
                } else {
                  // Gerar senha temporária (fallback)
                  const taxId = purchase.customer_data?.taxId?.replace(/\D/g, '') || '';
                  const phone = purchase.customer_data?.phone?.replace(/\D/g, '') || '';
                  
                  if (taxId && taxId.length >= 6) {
                    userPassword = taxId.slice(-6);
                  } else if (phone && phone.length >= 6) {
                    userPassword = phone.slice(-6);
                  } else {
                    userPassword = Math.floor(100000 + Math.random() * 900000).toString();
                  }
                  
                  const nameInitials = customerName.trim().substring(0, 2).toUpperCase().replace(/[^A-Z]/g, '');
                  if (nameInitials.length === 2) {
                    userPassword = nameInitials + userPassword;
                  }
                  console.log('⚠️ [WEBHOOK] Senha não fornecida, gerando senha temporária');
                }
                
                const hashedPassword = await bcrypt.hash(userPassword, 10);
                const nameParts = customerName.trim().split(' ');
                const firstName = nameParts[0] || customerName;
                const lastName = nameParts.slice(1).join(' ') || '';
                
                // Criar usuário em transação
                const userResult = await transaction(async (client) => {
                  const userInsert = await client.query(
                    `INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
                     VALUES ($1, $2, NOW(), NOW(), NOW())
                     RETURNING id, email`,
                    [customerEmail.toLowerCase().trim(), hashedPassword]
                  );
                  
                  const newUserId = userInsert.rows[0].id;
                  
                  // Criar perfil
                  await client.query(
                    `INSERT INTO profiles (id, first_name, last_name, phone, cpf, created_at)
                     VALUES ($1, $2, $3, $4, $5, NOW())
                     ON CONFLICT (id) DO UPDATE SET
                       first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
                       last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
                       phone = COALESCE(EXCLUDED.phone, profiles.phone),
                       cpf = COALESCE(EXCLUDED.cpf, profiles.cpf)`,
                    [
                      newUserId,
                      firstName,
                      lastName,
                      customerPhone || null,
                      taxId || null
                    ]
                  );
                  
                  // Criar role (student)
                  await client.query(
                    `INSERT INTO user_roles (user_id, role, created_at)
                     VALUES ($1, 'student', NOW())
                     ON CONFLICT (user_id, role) DO NOTHING`,
                    [newUserId]
                  );
                  
                  return newUserId;
                });
                
                finalUserId = userResult;
                console.log('✅ [WEBHOOK] Usuário criado com sucesso! ID:', finalUserId);
                
                // Enviar credenciais por WhatsApp se disponível
                if (customerPhone) {
                  try {
                    let credentialsMessage = `🔐 *Credenciais de Acesso - Instituto Bex*\n\n`;
                    credentialsMessage += `Olá ${customerName}! 👋\n\n`;
                    credentialsMessage += `✅ *Sua conta foi criada com sucesso!*\n\n`;
                    credentialsMessage += `📧 *Email:* ${customerEmail}\n`;
                    if (providedPassword) {
                      credentialsMessage += `🔑 *Senha:* ${userPassword}\n\n`;
                    } else {
                      credentialsMessage += `🔑 *Senha temporária:* ${userPassword}\n\n`;
                      credentialsMessage += `⚠️ *Importante:* Altere sua senha após o primeiro acesso.\n\n`;
                    }
                    credentialsMessage += `🔗 Acesse: ${process.env.APP_URL || 'http://localhost:3000'}\n\n`;
                    credentialsMessage += `Bons estudos! 📖✨`;
                    
                    await sendWhatsAppMessage({
                      name: customerName,
                      phone: customerPhone,
                      message: credentialsMessage
                    });
                    console.log('✅ [WEBHOOK] Credenciais enviadas por WhatsApp');
                  } catch (whatsappError) {
                    console.error('⚠️ [WEBHOOK] Erro ao enviar credenciais por WhatsApp:', whatsappError.message);
                  }
                }
              } catch (userError) {
                console.error('❌ [WEBHOOK] Erro ao criar usuário:', userError.message);
                // Continuar com user_id original se falhar
              }
            }
          }
        }
        
        // Confirmar pagamento em transação
        await transaction(async (client) => {
          // Atualizar status da compra e user_id se foi atualizado
          await client.query(
            `UPDATE course_purchases 
             SET payment_status = 'paid', 
                 updated_at = NOW(),
                 billing_id = COALESCE(billing_id, $1),
                 user_id = $3
             WHERE id = $2`,
            [billingId, purchase.id, finalUserId]
          );
          
          // Criar matrícula se não existir (usando finalUserId que pode ter sido atualizado)
          const enrollmentCheck = await client.query(
            'SELECT id FROM course_enrollments WHERE user_id = $1 AND course_id = $2',
            [finalUserId, purchase.course_id]
          );
          
          if (enrollmentCheck.rows.length === 0) {
            await client.query(
              `INSERT INTO course_enrollments (user_id, course_id, created_at)
               VALUES ($1, $2, NOW())`,
              [finalUserId, purchase.course_id]
            );
            console.log('✅ [WEBHOOK] Matrícula criada para o curso com user_id:', finalUserId);
          } else {
            console.log('✅ [WEBHOOK] Matrícula já existe');
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
            
            // Chamar função WhatsApp diretamente (sem fazer HTTP request)
            await sendWhatsAppMessage({
              name: customerName,
              phone: purchaseData.customer_data.phone,
              courseTitle: purchaseData.course_title,
              amount: purchaseData.amount,
            });
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

