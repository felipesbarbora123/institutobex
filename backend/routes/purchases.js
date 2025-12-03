import express from 'express';
import { query, transaction } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

const router = express.Router();

// IMPORTANTE: Rotas mais específicas devem vir ANTES das rotas genéricas
// Criar pagamento PIX (permite usuário temporário)
router.post('/payment/pix', async (req, res) => {
  try {
    console.log('💳 Recebida requisição para criar pagamento PIX:', JSON.stringify(req.body, null, 2));
    let { externalId, amount, customerData } = req.body;

    // Buscar compra
    const purchaseResult = await query(
      'SELECT * FROM course_purchases WHERE external_id = $1',
      [externalId]
    );

    if (purchaseResult.rows.length === 0) {
      console.error('❌ Compra não encontrada para externalId:', externalId);
      return res.status(404).json({ 
        error: 'Compra não encontrada',
        code: 'PURCHASE_NOT_FOUND'
      });
    }

    const purchase = purchaseResult.rows[0];
    
    // Se customerData não foi fornecido ou está vazio, usar dados da compra
    if (!customerData || Object.keys(customerData).length === 0) {
      if (purchase.customer_data && typeof purchase.customer_data === 'object') {
        customerData = purchase.customer_data;
        console.log('📋 Usando dados do cliente da compra:', customerData);
      }
    }
    
    // Se ainda não houver amount, usar da compra
    if (!amount && purchase.amount) {
      amount = parseFloat(purchase.amount);
      console.log('💰 Usando valor da compra:', amount);
    }

    // Validar configuração do AbacatePay
    if (!process.env.ABACATEPAY_API_URL || !process.env.ABACATEPAY_API_KEY) {
      console.error('❌ AbacatePay não configurado! Verifique ABACATEPAY_API_URL e ABACATEPAY_API_KEY no .env');
      return res.status(500).json({
        error: 'Gateway de pagamento não configurado',
        code: 'PAYMENT_GATEWAY_NOT_CONFIGURED',
        message: 'Configure ABACATEPAY_API_URL e ABACATEPAY_API_KEY no arquivo .env'
      });
    }

    // Construir URL do endpoint - API do AbacatePay: /v1/pixQrCode/create
    let apiBaseUrl = process.env.ABACATEPAY_API_URL.replace(/\/$/, ''); // Remove barra final
    const apiUrl = `${apiBaseUrl}/v1/pixQrCode/create`;

    console.log('📡 Chamando AbacatePay:', apiUrl);
    
    // Preparar headers
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ABACATEPAY_API_KEY}`,
    };
    
    // Preparar body da requisição conforme documentação da API
    // Formato esperado: amount, expiresIn, description, customer, metadata
    // IMPORTANTE: A API não aceita strings vazias, apenas valores válidos ou não enviar o campo
    
    // Validar e preparar dados do cliente
    const customer = {};
    
    if (customerData?.name && customerData.name.trim()) {
      customer.name = customerData.name.trim();
    }
    
    if (customerData?.phone && customerData.phone.trim()) {
      // Remover caracteres não numéricos e formatar
      const phone = customerData.phone.replace(/\D/g, '');
      if (phone.length >= 10) {
        customer.cellphone = phone;
      }
    }
    
    if (customerData?.email && customerData.email.trim()) {
      // Validar formato de email básico
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(customerData.email.trim())) {
        customer.email = customerData.email.trim();
      }
    }
    
    if (customerData?.taxId && customerData.taxId.trim()) {
      // Remover caracteres não numéricos do CPF/CNPJ
      const taxId = customerData.taxId.replace(/\D/g, '');
      if (taxId.length >= 11) {
        customer.taxId = taxId;
      }
    }
    
    // Se não houver nenhum dado do cliente válido, usar valores padrão mínimos
    if (Object.keys(customer).length === 0) {
      console.warn('⚠️ Nenhum dado válido do cliente encontrado, usando valores padrão');
      customer.name = 'Cliente';
      customer.email = 'cliente@exemplo.com'; // Email padrão válido
    }
    
    const requestBody = {
      amount: Math.round(amount * 100), // Converter para centavos (API espera em centavos)
      expiresIn: 3600, // 1 hora em segundos (pode ser configurável)
      description: `Pagamento do curso - ${externalId}`,
      customer: customer,
      metadata: {
        externalId: externalId,
      }
    };
    
    console.log('🔑 Usando AbacatePay API Key (API direta)');
    console.log('📦 Body da requisição:', JSON.stringify(requestBody, null, 2));
    
    // Chamar AbacatePay
    console.log('🚀 Enviando requisição para:', apiUrl);
    const abacateResponse = await axios.post(
      apiUrl,
      requestBody,
      {
        headers,
      }
    );
    
    console.log('✅ Resposta recebida do AbacatePay:', JSON.stringify(abacateResponse.data, null, 2));

    // A API do AbacatePay retorna: { error: null, data: { id, brCode, brCodeBase64, ... } }
    // Ou diretamente: { id, qrCode, ... }
    const responseData = abacateResponse.data.data || abacateResponse.data;
    
    // Extrair ID (billingId)
    const billingId = responseData.id || 
                     responseData.billingId || 
                     responseData.transactionId;
    
    // Extrair QR Code (pode ser brCodeBase64 ou qrCode)
    const qrCode = responseData.brCodeBase64 || 
                   responseData.qrCode || 
                   responseData.qr_code || 
                   responseData.qrcode;
    
    // Extrair código PIX copia e cola (pode ser brCode ou copyPaste)
    const copiaCola = responseData.brCode || 
                      responseData.copyPaste || 
                      responseData.copy_paste || 
                      responseData.copia_cola ||
                      responseData.pixCopyPaste;

    if (!billingId) {
      console.error('❌ Resposta do AbacatePay não contém ID:', abacateResponse.data);
      return res.status(500).json({
        error: 'Resposta inválida do gateway',
        code: 'INVALID_GATEWAY_RESPONSE',
        message: 'A resposta do AbacatePay não contém o ID esperado',
        details: process.env.NODE_ENV === 'development' ? abacateResponse.data : undefined
      });
    }

    const finalBillingId = billingId;

    // Atualizar compra com billing_id
    await query(
      'UPDATE course_purchases SET billing_id = $1 WHERE external_id = $2',
      [finalBillingId, externalId]
    );

    // Validar se temos os dados necessários
    if (!qrCode && !copiaCola) {
      console.error('❌ QR Code e código PIX não foram retornados pela API');
      return res.status(500).json({
        error: 'Dados do PIX não foram retornados',
        code: 'PIX_DATA_MISSING',
        message: 'A API do AbacatePay não retornou o QR Code ou código PIX',
        details: process.env.NODE_ENV === 'development' ? {
          responseData: responseData
        } : undefined
      });
    }

    console.log('✅ Pagamento PIX criado com sucesso, billingId:', finalBillingId);
    console.log('📦 Dados retornados:', {
      qr_code: qrCode ? 'Presente (' + (qrCode.length > 50 ? qrCode.substring(0, 50) + '...' : qrCode) + ')' : 'Ausente',
      copia_cola: copiaCola ? 'Presente (' + copiaCola.substring(0, 50) + '...)' : 'Ausente',
      billingId: finalBillingId
    });
    
    // Retornar no formato esperado pelo frontend (Supabase Edge Function)
    // O frontend espera: { data: { qr_code, copia_cola, billingId }, error: null }
    const response = {
      data: {
        qr_code: qrCode,
        copia_cola: copiaCola,
        billingId: finalBillingId,
        id: finalBillingId,
      },
      error: null
    };
    
    res.json(response);
  } catch (error) {
    console.error('Erro ao criar pagamento PIX:', error);
    
    // Se for erro do axios (chamada à API)
    if (error.response) {
      console.error('❌ Resposta do AbacatePay:', error.response.status, error.response.data);
      
      if (error.response.status === 401) {
        return res.status(500).json({
          error: 'Erro de autenticação com AbacatePay',
          code: 'ABACATEPAY_AUTH_ERROR',
          message: 'API Key inválida ou expirada. Verifique ABACATEPAY_API_KEY no .env',
          details: process.env.NODE_ENV === 'development' ? error.response.data : undefined
        });
      }
      
      if (error.response.status === 404) {
        const errorMessage = error.response.data?.message || error.response.data?.error || 'Endpoint não encontrado';
        console.error('❌ Endpoint não encontrado:', error.config?.url);
        console.error('   Mensagem da API:', errorMessage);
        console.error('   Verifique a documentação da API do AbacatePay para o endpoint correto');
        console.error('   Endpoints comuns:');
        console.error('     - /api/payment/pix');
        console.error('     - /api/v1/payment/pix');
        console.error('     - /payment/pix');
        console.error('     - /pix');
        
        return res.status(500).json({
          error: 'Endpoint não encontrado na API do AbacatePay',
          code: 'ABACATEPAY_ENDPOINT_ERROR',
          message: `Rota não encontrada: ${errorMessage}. Verifique a documentação da API do AbacatePay para o endpoint correto.`,
          details: process.env.NODE_ENV === 'development' ? {
            url: error.config?.url,
            apiBaseUrl: process.env.ABACATEPAY_API_URL,
            errorMessage: errorMessage,
            suggestion: 'Verifique no painel do AbacatePay ou na documentação qual é o endpoint correto para criar pagamentos PIX'
          } : undefined
        });
      }
      
      return res.status(500).json({
        error: 'Erro ao criar pagamento PIX',
        code: 'PIX_CREATE_ERROR',
        message: error.response.data?.error || error.response.data?.message || 'Erro desconhecido do gateway',
        details: process.env.NODE_ENV === 'development' ? error.response.data : undefined
      });
    }
    
    // Se for erro de conexão
    if (error.request) {
      console.error('❌ Sem resposta do AbacatePay. Verifique a URL:', process.env.ABACATEPAY_API_URL);
      return res.status(500).json({
        error: 'Erro de conexão com AbacatePay',
        code: 'ABACATEPAY_CONNECTION_ERROR',
        message: 'Não foi possível conectar ao gateway de pagamento. Verifique ABACATEPAY_API_URL no .env',
        details: process.env.NODE_ENV === 'development' ? {
          url: process.env.ABACATEPAY_API_URL,
          error: error.message
        } : undefined
      });
    }
    
    // Outros erros
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao criar pagamento PIX',
      code: 'PIX_CREATE_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Criar pagamento Cartão (permite usuário temporário)
router.post('/payment/card', async (req, res) => {
  try {
    console.log('💳 Recebida requisição para criar pagamento Cartão:', JSON.stringify(req.body, null, 2));
    const { externalId, amount, customerData, courseId } = req.body;

    // Validar configuração do AbacatePay
    if (!process.env.ABACATEPAY_API_URL || !process.env.ABACATEPAY_API_KEY) {
      return res.status(500).json({
        error: 'Gateway de pagamento não configurado',
        code: 'PAYMENT_GATEWAY_NOT_CONFIGURED'
      });
    }

    // Construir URL do endpoint - API do AbacatePay: /v1/billing/create
    let apiBaseUrl = process.env.ABACATEPAY_API_URL.replace(/\/$/, ''); // Remove barra final
    const apiUrl = `${apiBaseUrl}/v1/billing/create`;

    console.log('📡 Chamando AbacatePay (Cartão):', apiUrl);

    // Preparar headers
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ABACATEPAY_API_KEY}`,
    };

    // Buscar dados do curso para incluir no billing
    let courseTitle = 'Curso';
    if (courseId) {
      const courseResult = await query(
        'SELECT title FROM courses WHERE id = $1',
        [courseId]
      );
      if (courseResult.rows.length > 0) {
        courseTitle = courseResult.rows[0].title;
      }
    }

    // Preparar body da requisição conforme documentação da API
    // Formato esperado: frequency, methods, products, returnUrl, completionUrl, customer, externalId, metadata
    const requestBody = {
      frequency: 'ONE_TIME',
      methods: ['PIX', 'CREDIT_CARD', 'DEBIT_CARD'], // Permitir múltiplos métodos
      products: [
        {
          externalId: courseId || externalId,
          name: courseTitle,
          description: `Acesso ao curso: ${courseTitle}`,
          quantity: 1,
          price: Math.round(amount * 100), // Converter para centavos
        }
      ],
      returnUrl: `${process.env.APP_URL || 'http://localhost:3000'}/checkout/success`,
      completionUrl: `${process.env.APP_URL || 'http://localhost:3000'}/checkout/success`,
      customer: (() => {
        const customer = {};
        
        if (customerData?.name && customerData.name.trim()) {
          customer.name = customerData.name.trim();
        }
        
        if (customerData?.phone && customerData.phone.trim()) {
          const phone = customerData.phone.replace(/\D/g, '');
          if (phone.length >= 10) {
            customer.cellphone = phone;
          }
        }
        
        if (customerData?.email && customerData.email.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailRegex.test(customerData.email.trim())) {
            customer.email = customerData.email.trim();
          }
        }
        
        if (customerData?.taxId && customerData.taxId.trim()) {
          const taxId = customerData.taxId.replace(/\D/g, '');
          if (taxId.length >= 11) {
            customer.taxId = taxId;
          }
        }
        
        // Se não houver dados válidos, usar valores padrão
        if (Object.keys(customer).length === 0) {
          customer.name = 'Cliente';
          customer.email = 'cliente@exemplo.com';
        }
        
        return customer;
      })(),
      allowCoupons: false,
      coupons: [],
      externalId: externalId,
      metadata: {
        externalId: externalId,
        courseId: courseId,
      }
    };

    console.log('📦 Body da requisição:', JSON.stringify(requestBody, null, 2));

    // Chamar AbacatePay
    const abacateResponse = await axios.post(
      apiUrl,
      requestBody,
      {
        headers,
      }
    );

    console.log('✅ Resposta recebida do AbacatePay:', JSON.stringify(abacateResponse.data, null, 2));

    // A API retorna: id, paymentUrl, etc.
    const billingId = abacateResponse.data.id || 
                     abacateResponse.data.billingId;
    
    const paymentUrl = abacateResponse.data.paymentUrl || 
                      abacateResponse.data.payment_url ||
                      abacateResponse.data.url;

    res.json({
      payment_url: paymentUrl,
      billingId: billingId,
    });
  } catch (error) {
    console.error('Erro ao criar pagamento Cartão:', error);
    res.status(500).json({ 
      error: 'Erro ao criar pagamento Cartão',
      code: 'CARD_CREATE_ERROR'
    });
  }
});

// Verificar status do pagamento (não requer autenticação)
router.get('/payment/status/:billingId', async (req, res) => {
  try {
    const { billingId } = req.params;
    console.log('🔍 [STATUS] Verificando status do pagamento para billingId:', billingId);

    // Verificar no banco primeiro
    const purchaseResult = await query(
      'SELECT * FROM course_purchases WHERE billing_id = $1',
      [billingId]
    );

    if (purchaseResult.rows.length > 0) {
      const purchase = purchaseResult.rows[0];
      console.log('📊 [STATUS] Compra encontrada no banco. Status atual:', purchase.payment_status);
      
      // Se já está pago, retornar diretamente com dados completos do curso
      if (purchase.payment_status === 'paid') {
        // Buscar dados completos da compra com informações do curso
        const fullPurchaseResult = await query(
          `SELECT cp.*, c.title as course_title 
           FROM course_purchases cp
           JOIN courses c ON c.id = cp.course_id
           WHERE cp.billing_id = $1`,
          [billingId]
        );
        
        if (fullPurchaseResult.rows.length > 0) {
          return res.json({
            status: 'paid',
            purchase: fullPurchaseResult.rows[0],
          });
        }
        
        // Fallback se não encontrar com join
        return res.json({
          status: 'paid',
          purchase: purchase,
        });
      }
    }

    // Se não encontrou ou não está pago, verificar no AbacatePay
    // Construir URL do endpoint - API do AbacatePay: /v1/pixQrCode/check
    // A API espera o ID do QR Code como query parameter
    let apiBaseUrl = process.env.ABACATEPAY_API_URL.replace(/\/$/, ''); // Remove barra final
    const apiUrl = `${apiBaseUrl}/v1/pixQrCode/check?id=${billingId}`;

    // Preparar headers
    const headers = {
      'Authorization': `Bearer ${process.env.ABACATEPAY_API_KEY}`,
    };

    console.log('📡 [STATUS] Verificando status no AbacatePay:', apiUrl);
    console.log('🔑 [STATUS] Usando API Key:', process.env.ABACATEPAY_API_KEY ? 'Configurada' : 'NÃO CONFIGURADA');

    // Verificar status no AbacatePay
    const abacateResponse = await axios.get(
      apiUrl,
      {
        headers,
      }
    );

    console.log('✅ [STATUS] Status recebido do AbacatePay:', JSON.stringify(abacateResponse.data, null, 2));

    // A API retorna: status, paidAt, etc.
    const status = abacateResponse.data.status || 
                   abacateResponse.data.paymentStatus ||
                   abacateResponse.data.data?.status ||
                   'PENDING';

    // Mapear status da API para nosso formato
    let mappedStatus = status;
    let updatedPurchase = null;
    
    if (status === 'PAID' || status === 'APPROVED' || status === 'CONFIRMED' || status === 'paid') {
      mappedStatus = 'paid';
      
      // Se o pagamento foi confirmado, atualizar no banco e processar
      if (purchaseResult.rows.length > 0) {
        const purchase = purchaseResult.rows[0];
        console.log('🔍 [STATUS] Verificando status atual da compra:', {
          billingId,
          currentStatus: purchase.payment_status,
          newStatus: mappedStatus,
          needsUpdate: purchase.payment_status !== 'paid'
        });
        
        // Sempre atualizar e processar quando status é paid, mesmo se já estava paid
        // Isso garante que WhatsApp seja enviado mesmo em caso de re-verificação
        const wasAlreadyPaid = purchase.payment_status === 'paid';
        
        if (!wasAlreadyPaid) {
          console.log('💰 [STATUS] ==========================================');
          console.log('💰 [STATUS] PAGAMENTO CONFIRMADO! Atualizando banco...');
          console.log('💰 [STATUS] billingId:', billingId);
          console.log('💰 [STATUS] Status anterior:', purchase.payment_status);
          console.log('💰 [STATUS] Status novo: paid');
          console.log('💰 [STATUS] ==========================================');
          
          // Atualizar status da compra
          await query(
            'UPDATE course_purchases SET payment_status = $1, updated_at = NOW() WHERE billing_id = $2',
            ['paid', billingId]
          );
        } else {
          console.log('💰 [STATUS] Pagamento já estava marcado como paid, mas verificando WhatsApp...');
        }
        
        // Buscar dados atualizados da compra com informações do curso
        const updatedPurchaseResult = await query(
          `SELECT cp.*, c.title as course_title 
           FROM course_purchases cp
           JOIN courses c ON c.id = cp.course_id
           WHERE cp.billing_id = $1`,
          [billingId]
        );
        
        if (updatedPurchaseResult.rows.length > 0) {
          updatedPurchase = updatedPurchaseResult.rows[0];
        }
        
        // Enviar WhatsApp SEMPRE quando status é paid (mesmo se já estava paid antes)
        // Isso garante que não perdemos o envio em caso de re-verificação
        if (updatedPurchase?.customer_data?.phone) {
            try {
              const customerName = updatedPurchase.customer_data?.name || 'Cliente';
              
              console.log('📱 [STATUS] Enviando notificação WhatsApp para:', updatedPurchase.customer_data.phone);
              console.log('📱 [STATUS] Dados do cliente:', {
                name: customerName,
                phone: updatedPurchase.customer_data.phone,
                courseTitle: updatedPurchase.course_title,
                amount: updatedPurchase.amount
              });
              
              // Chamar endpoint WhatsApp do próprio backend
              // Se API_URL não estiver configurado, usar localhost (self-call)
              // Em produção, API_URL deve estar configurado para a URL completa do backend
              const baseUrl = process.env.API_URL || 'http://localhost:3001';
              const whatsappUrl = `${baseUrl}/api/whatsapp/send`;
              
              // Log adicional para debug
              console.log('🔍 [STATUS] API_URL configurado:', process.env.API_URL || 'NÃO CONFIGURADO (usando localhost)');
              console.log('🔍 [STATUS] Base URL:', baseUrl);
              
              console.log('📱 [STATUS] ==========================================');
              console.log('📱 [STATUS] ENVIANDO WHATSAPP - PAGAMENTO CONFIRMADO');
              console.log('📱 [STATUS] URL:', whatsappUrl);
              console.log('📱 [STATUS] Dados:', {
                name: customerName,
                phone: updatedPurchase.customer_data.phone,
                courseTitle: updatedPurchase.course_title,
                amount: updatedPurchase.amount
              });
              console.log('📱 [STATUS] ==========================================');
              
              const whatsappResponse = await axios.post(
                whatsappUrl,
                {
                  name: customerName,
                  phone: updatedPurchase.customer_data.phone,
                  courseTitle: updatedPurchase.course_title,
                  amount: updatedPurchase.amount,
                },
                {
                  timeout: 15000, // 15 segundos de timeout
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  validateStatus: () => true // Aceitar qualquer status para logar
                }
              );
              
              if (whatsappResponse.status === 200 || whatsappResponse.status === 201) {
                console.log('✅ [STATUS] Notificação WhatsApp enviada com sucesso!');
                console.log('✅ [STATUS] Resposta:', JSON.stringify(whatsappResponse.data, null, 2));
              } else {
                console.error('⚠️ [STATUS] WhatsApp retornou status:', whatsappResponse.status);
                console.error('⚠️ [STATUS] Resposta:', JSON.stringify(whatsappResponse.data, null, 2));
              }
            } catch (whatsappError) {
              console.error('⚠️ [STATUS] Erro ao enviar WhatsApp (não crítico):', whatsappError.message);
              if (whatsappError.response) {
                console.error('⚠️ [STATUS] Resposta do erro WhatsApp:', whatsappError.response.status, whatsappError.response.data);
              }
              if (whatsappError.request) {
                console.error('⚠️ [STATUS] Request feito mas sem resposta. URL:', whatsappError.config?.url);
              }
              // Não falha o processo se WhatsApp falhar
            }
          } else {
            console.log('⚠️ [STATUS] Telefone não encontrado nos dados do cliente, WhatsApp não será enviado');
            console.log('⚠️ [STATUS] customer_data:', updatedPurchase?.customer_data);
          }
          
          // Criar ou verificar usuário antes de criar enrollment
          let userId = purchase.user_id;
          const customerEmail = updatedPurchase?.customer_data?.email;
          const customerName = updatedPurchase?.customer_data?.name || 'Cliente';
          const customerPhone = updatedPurchase?.customer_data?.phone;
          
          // Verificar se precisa criar usuário
          let needToCreateUser = false;
          
          if (!customerEmail) {
            console.warn('⚠️ [STATUS] Email do cliente não encontrado, não será possível criar usuário');
          } else {
            // Verificar se user_id existe no banco
            if (userId) {
              const userCheck = await query(
                'SELECT id FROM auth.users WHERE id = $1',
                [userId]
              );
              
              if (userCheck.rows.length === 0) {
                // user_id não existe no banco, precisa criar
                console.warn('⚠️ [STATUS] user_id não encontrado em auth.users, será criado novo usuário');
                needToCreateUser = true;
                userId = null;
              } else {
                console.log('✅ [STATUS] Usuário já existe com ID:', userId);
              }
            } else {
              // Não tem user_id, verificar se usuário existe por email
              const existingUserCheck = await query(
                'SELECT id FROM auth.users WHERE email = $1',
                [customerEmail.toLowerCase().trim()]
              );
              
              if (existingUserCheck.rows.length > 0) {
                // Usuário já existe, usar o ID existente
                userId = existingUserCheck.rows[0].id;
                console.log('✅ [STATUS] Usuário já existe por email, usando ID:', userId);
                
                // Atualizar user_id na compra
                await query(
                  'UPDATE course_purchases SET user_id = $1 WHERE id = $2',
                  [userId, purchase.id]
                );
                console.log('✅ [STATUS] user_id atualizado na compra');
              } else {
                // Usuário não existe, precisa criar
                needToCreateUser = true;
              }
            }
            
            // Criar usuário se necessário
            if (needToCreateUser) {
              // Criar novo usuário
              console.log('👤 [STATUS] Criando novo usuário para o cliente...');
              
              try {
                // Gerar senha temporária mais segura
                // Usar últimos 6 dígitos do CPF ou telefone + primeiras 2 letras do nome
                let tempPassword = '';
                const taxId = updatedPurchase?.customer_data?.taxId?.replace(/\D/g, '') || '';
                const phone = updatedPurchase?.customer_data?.phone?.replace(/\D/g, '') || '';
                
                if (taxId && taxId.length >= 6) {
                  // Usar últimos 6 dígitos do CPF
                  tempPassword = taxId.slice(-6);
                } else if (phone && phone.length >= 6) {
                  // Usar últimos 6 dígitos do telefone
                  tempPassword = phone.slice(-6);
                } else {
                  // Gerar senha aleatória de 6 dígitos
                  tempPassword = Math.floor(100000 + Math.random() * 900000).toString();
                }
                
                // Adicionar primeiras 2 letras do nome (maiúsculas) para tornar mais segura
                const nameInitials = customerName.trim().substring(0, 2).toUpperCase().replace(/[^A-Z]/g, '');
                if (nameInitials.length === 2) {
                  tempPassword = nameInitials + tempPassword;
                }
                
                // Hash da senha
                const hashedPassword = await bcrypt.hash(tempPassword, 10);
                
                // Separar nome em first_name e last_name
                const nameParts = customerName.trim().split(' ');
                const firstName = nameParts[0] || customerName;
                const lastName = nameParts.slice(1).join(' ') || '';
                
                // Criar usuário em transação
                const userResult = await transaction(async (client) => {
                  // Criar usuário
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
                     VALUES ($1, $2, $3, $4, $5, NOW())`,
                    [
                      newUserId,
                      firstName,
                      lastName,
                      updatedPurchase?.customer_data?.phone || null,
                      updatedPurchase?.customer_data?.taxId || null
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
                
                userId = userResult;
                console.log('✅ [STATUS] Usuário criado com sucesso! ID:', userId);
                
                // Atualizar user_id na compra
                await query(
                  'UPDATE course_purchases SET user_id = $1 WHERE id = $2',
                  [userId, purchase.id]
                );
                
                // Enviar credenciais por WhatsApp
                if (customerPhone) {
                  try {
                    let credentialsMessage = `🔐 *Credenciais de Acesso - Instituto Bex*\n\n`;
                    credentialsMessage += `Olá ${customerName}! 👋\n\n`;
                    credentialsMessage += `✅ *Sua conta foi criada com sucesso!*\n\n`;
                    credentialsMessage += `📧 *Email:* ${customerEmail}\n`;
                    credentialsMessage += `🔑 *Senha temporária:* ${tempPassword}\n\n`;
                    credentialsMessage += `⚠️ *Importante:* Altere sua senha após o primeiro acesso.\n\n`;
                    credentialsMessage += `🔗 Acesse: ${process.env.APP_URL || 'http://localhost:3000'}\n\n`;
                    credentialsMessage += `Bons estudos! 📖✨`;
                    
                    // Enviar mensagem de credenciais via WhatsApp
                    const baseUrl = process.env.API_URL || 'http://localhost:3001';
                    const whatsappUrl = `${baseUrl}/api/whatsapp/send`;
                    
                    console.log('📱 [PURCHASE] Enviando credenciais via WhatsApp:', whatsappUrl);
                    
                    await axios.post(
                      whatsappUrl,
                      {
                        name: customerName,
                        phone: customerPhone,
                        message: credentialsMessage
                      }
                    );
                    console.log('✅ [STATUS] Credenciais enviadas por WhatsApp');
                  } catch (whatsappError) {
                    console.error('⚠️ [STATUS] Erro ao enviar credenciais por WhatsApp:', whatsappError.message);
                  }
                }
              } catch (userError) {
                console.error('❌ [STATUS] Erro ao criar usuário:', userError.message);
                // Continuar mesmo se falhar, mas não criar enrollment
              }
            }
          }
          
          // Criar enrollment se ainda não existir (após criar/verificar usuário)
          try {
            if (userId) {
              const enrollmentCheck = await query(
                'SELECT * FROM course_enrollments WHERE user_id = $1 AND course_id = $2',
                [userId, purchase.course_id]
              );
              
              if (enrollmentCheck.rows.length === 0) {
                console.log('📚 [STATUS] Criando enrollment para o curso...');
                
                await query(
                  'INSERT INTO course_enrollments (user_id, course_id, enrolled_at) VALUES ($1, $2, NOW())',
                  [userId, purchase.course_id]
                );
                console.log('✅ [STATUS] Enrollment criado com sucesso!');
              } else {
                console.log('✅ [STATUS] Enrollment já existe');
              }
            } else {
              console.warn('⚠️ [STATUS] user_id não disponível, enrollment não será criado');
            }
          } catch (enrollmentError) {
            console.error('⚠️ [STATUS] Erro ao criar enrollment (não crítico):', enrollmentError.message);
            // Não falha o processo se enrollment falhar
          }
        } else {
          // Se já estava pago, buscar dados atualizados
          const updatedPurchaseResult = await query(
            `SELECT cp.*, c.title as course_title 
             FROM course_purchases cp
             JOIN courses c ON c.id = cp.course_id
             WHERE cp.billing_id = $1`,
            [billingId]
          );
          
          if (updatedPurchaseResult.rows.length > 0) {
            updatedPurchase = updatedPurchaseResult.rows[0];
          }
        }
      }
    } else if (status === 'PENDING' || status === 'WAITING' || status === 'pending') {
      mappedStatus = 'pending';
    } else if (status === 'CANCELLED' || status === 'CANCELED' || status === 'cancelled') {
      mappedStatus = 'cancelled';
    }

    console.log('📤 [STATUS] Retornando status:', mappedStatus);

    // Se o status é "paid" e temos a compra atualizada, retornar no formato esperado
    if (mappedStatus === 'paid' && updatedPurchase) {
      return res.json({
        status: 'paid',
        purchase: updatedPurchase,
      });
    }

    res.json({
      success: true,
      status: mappedStatus,
      originalStatus: status,
      details: abacateResponse.data,
    });
  } catch (error) {
    console.error('❌ [STATUS] Erro ao verificar status:', error.message);
    console.error('❌ [STATUS] Stack:', error.stack);
    if (error.response) {
      console.error('❌ [STATUS] Resposta do AbacatePay:', error.response.status, error.response.data);
    }
    res.status(500).json({ 
      error: 'Erro ao verificar status do pagamento',
      code: 'STATUS_CHECK_ERROR',
      message: error.message
    });
  }
});

// Criar compra (permite usuário temporário)
router.post('/', async (req, res) => {
  try {
    console.log('📦 Recebida requisição para criar compra:', JSON.stringify(req.body, null, 2));
    const { courseId, amount, paymentMethod, customerData, orderBumps, userId } = req.body;
    
    // Validação básica
    if (!courseId) {
      console.error('❌ courseId não fornecido');
      return res.status(400).json({ 
        error: 'courseId é obrigatório',
        code: 'MISSING_COURSE_ID'
      });
    }
    
    if (!amount || amount <= 0) {
      console.error('❌ amount inválido:', amount);
      return res.status(400).json({ 
        error: 'amount é obrigatório e deve ser maior que zero',
        code: 'INVALID_AMOUNT'
      });
    }
    
    // Tentar obter userId do token se disponível, senão usar o fornecido
    let finalUserId = userId;
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token && process.env.JWT_SECRET) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        finalUserId = decoded.id;
      }
    } catch (e) {
      // Token inválido ou não fornecido, usar userId do body
      console.log('Token não fornecido ou inválido, usando userId do body ou criando temporário');
    }
    
    // Se não tiver userId, criar um UUID temporário
    // A tabela espera UUID, então vamos gerar um UUID válido
    if (!finalUserId || finalUserId.startsWith('temp_')) {
      // Gerar UUID válido para usuário temporário
      finalUserId = randomUUID();
      console.log('🔑 Gerado UUID temporário para usuário:', finalUserId);
    }

    // Usar externalId fornecido pelo frontend, ou gerar um novo se não fornecido
    let externalId = req.body.externalId;
    if (!externalId) {
      externalId = `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🔑 Gerado novo externalId:', externalId);
    } else {
      console.log('✅ Usando externalId fornecido pelo frontend:', externalId);
    }

    console.log('📝 Dados para inserção:', {
      finalUserId,
      courseId,
      amount,
      externalId,
      paymentMethod: paymentMethod || 'pix',
      customerData: customerData || {}
    });

    const result = await transaction(async (client) => {
      // Criar registro de compra
      try {
        const purchaseResult = await client.query(
          `INSERT INTO course_purchases 
           (user_id, course_id, amount, payment_status, external_id, payment_method, customer_data, created_at)
           VALUES ($1, $2, $3, 'pending', $4, $5, $6::jsonb, NOW())
           RETURNING *`,
          [finalUserId, courseId, amount, externalId, paymentMethod || 'pix', JSON.stringify(customerData || {})]
        );

        console.log('✅ Compra criada com sucesso:', purchaseResult.rows[0].id);
        return purchaseResult.rows[0];
      } catch (dbError) {
        console.error('❌ Erro ao inserir no banco:', dbError);
        console.error('❌ Detalhes do erro:', {
          message: dbError.message,
          code: dbError.code,
          detail: dbError.detail,
          hint: dbError.hint
        });
        throw dbError;
      }
    });

    res.status(201).json({ 
      purchase: result,
      externalId: result.external_id
    });
  } catch (error) {
    console.error('Erro ao criar compra:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao criar compra',
      code: 'PURCHASE_CREATE_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Confirmar compra (webhook ou manual)
router.post('/confirm', authenticateToken, async (req, res) => {
  try {
    const { externalId, billingId } = req.body;

    const result = await transaction(async (client) => {
      // Buscar compra
      const purchaseResult = await client.query(
        'SELECT * FROM course_purchases WHERE external_id = $1',
        [externalId]
      );

      if (purchaseResult.rows.length === 0) {
        throw new Error('Compra não encontrada');
      }

      const purchase = purchaseResult.rows[0];

      // Atualizar status
      await client.query(
        `UPDATE course_purchases 
         SET payment_status = 'paid', updated_at = NOW()
         WHERE external_id = $1`,
        [externalId]
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
      }

      // Buscar dados completos para WhatsApp
      const fullPurchase = await client.query(
        `SELECT cp.*, c.title as course_title, 
                COALESCE(p.first_name, cp.customer_data->>'name', '') as first_name,
                COALESCE(p.last_name, '') as last_name
         FROM course_purchases cp
         JOIN courses c ON c.id = cp.course_id
         LEFT JOIN profiles p ON p.id = cp.user_id
         WHERE cp.external_id = $1`,
        [externalId]
      );

      return fullPurchase.rows[0];
    });

    // Enviar WhatsApp (assíncrono, não bloqueia)
    if (result?.customer_data?.phone) {
      try {
        const customerName = `${result.first_name || ''} ${result.last_name || ''}`.trim() || 
                            result.customer_data?.name || 
                            'Cliente';
        
        console.log('📱 Enviando notificação WhatsApp para:', result.customer_data.phone);
        
              // Usar URL do próprio backend (self-call)
              const whatsappUrl = process.env.API_URL 
                ? `${process.env.API_URL}/api/whatsapp/send`
                : `http://localhost:3001/api/whatsapp/send`;
              
              console.log('📱 [PURCHASE] Chamando endpoint WhatsApp:', whatsappUrl);
              
              await axios.post(
                whatsappUrl,
          {
            name: customerName,
            phone: result.customer_data.phone,
            courseTitle: result.course_title,
            amount: result.amount,
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

    res.json({ 
      success: true,
      purchase: result,
      message: 'Compra confirmada e acesso liberado'
    });
  } catch (error) {
    console.error('Erro ao confirmar compra:', error);
    res.status(500).json({ 
      error: 'Erro ao confirmar compra',
      code: 'PURCHASE_CONFIRM_ERROR'
    });
  }
});

// Reconciliação de pagamentos pendentes
router.post('/reconcile', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user.id;

    // Verificar se o userId corresponde ao usuário autenticado
    if (userId && userId !== currentUserId) {
      return res.status(403).json({
        error: 'Não autorizado',
        code: 'UNAUTHORIZED'
      });
    }

    const targetUserId = userId || currentUserId;

    // Buscar compras pendentes do usuário
    const pendingPurchases = await query(
      `SELECT * FROM course_purchases 
       WHERE user_id = $1 
       AND payment_status = 'pending'
       AND billing_id IS NOT NULL`,
      [targetUserId]
    );

    const results = [];

    for (const purchase of pendingPurchases.rows) {
      try {
        // Construir URL do endpoint - API do AbacatePay: /v1/pixQrCode/check
        let apiBaseUrl = process.env.ABACATEPAY_API_URL.replace(/\/$/, ''); // Remove barra final
        const apiUrl = `${apiBaseUrl}/v1/pixQrCode/check?id=${purchase.billing_id}`;

        // Preparar headers
        const headers = {
          'Authorization': `Bearer ${process.env.ABACATEPAY_API_KEY}`,
        };

        // Verificar status no AbacatePay
        const abacateResponse = await axios.get(
          apiUrl,
          {
            headers,
          }
        );

        const status = abacateResponse.data.status || 
                       abacateResponse.data.paymentStatus ||
                       'PENDING';

        if (status === 'PAID' || status === 'APPROVED' || status === 'CONFIRMED') {
          // Confirmar compra
          await transaction(async (client) => {
            // Atualizar status
            await client.query(
              `UPDATE course_purchases 
               SET payment_status = 'paid', updated_at = NOW()
               WHERE id = $1`,
              [purchase.id]
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
            }
          });

          results.push({
            purchaseId: purchase.id,
            externalId: purchase.external_id,
            status: 'reconciled'
          });
        } else {
          results.push({
            purchaseId: purchase.id,
            externalId: purchase.external_id,
            status: 'still_pending'
          });
        }
      } catch (error) {
        console.error(`Erro ao reconciliar compra ${purchase.id}:`, error);
        results.push({
          purchaseId: purchase.id,
          externalId: purchase.external_id,
          status: 'error',
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      results: results,
      total: results.length,
      reconciled: results.filter(r => r.status === 'reconciled').length
    });
  } catch (error) {
    console.error('Erro ao reconciliar pagamentos:', error);
    res.status(500).json({
      error: 'Erro ao reconciliar pagamentos',
      code: 'RECONCILE_ERROR'
    });
  }
});

export default router;

