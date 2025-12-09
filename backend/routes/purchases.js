import express from 'express';
import { query, transaction } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { sendWhatsAppMessage } from './whatsapp.js';

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
    console.log('💳 [CARD-PAYMENT] ========== INÍCIO ==========');
    console.log('💳 [CARD-PAYMENT] Recebida requisição para criar pagamento Cartão:', JSON.stringify(req.body, null, 2));
    const { externalId, amount, customerData, courseId } = req.body;

    // Buscar compra para obter dados faltantes
    let purchase = null;
    if (externalId) {
      const purchaseResult = await query(
        'SELECT * FROM course_purchases WHERE external_id = $1',
        [externalId]
      );
      
      if (purchaseResult.rows.length > 0) {
        purchase = purchaseResult.rows[0];
        console.log('✅ [CARD-PAYMENT] Compra encontrada:', {
          id: purchase.id,
          external_id: purchase.external_id,
          amount: purchase.amount,
          course_id: purchase.course_id,
          has_customer_data: !!purchase.customer_data
        });
      } else {
        console.warn('⚠️ [CARD-PAYMENT] Compra não encontrada para externalId:', externalId);
      }
    }

    // Usar dados da compra se não foram fornecidos
    let finalAmount = amount;
    let finalCustomerData = customerData;
    let finalCourseId = courseId;
    
    if (purchase) {
      if (!finalAmount && purchase.amount) {
        finalAmount = parseFloat(purchase.amount);
        console.log('💰 [CARD-PAYMENT] Usando valor da compra:', finalAmount);
      }
      
      if ((!finalCustomerData || Object.keys(finalCustomerData).length === 0) && purchase.customer_data) {
        finalCustomerData = purchase.customer_data;
        console.log('📋 [CARD-PAYMENT] Usando dados do cliente da compra');
      }
      
      if (!finalCourseId && purchase.course_id) {
        finalCourseId = purchase.course_id;
        console.log('📚 [CARD-PAYMENT] Usando course_id da compra:', finalCourseId);
      }
    }

    // Validar dados obrigatórios
    if (!finalAmount || finalAmount <= 0) {
      console.error('❌ [CARD-PAYMENT] Valor inválido:', finalAmount);
      return res.status(400).json({
        error: 'Valor inválido',
        code: 'INVALID_AMOUNT'
      });
    }

    if (!externalId) {
      console.error('❌ [CARD-PAYMENT] externalId não fornecido');
      return res.status(400).json({
        error: 'externalId é obrigatório',
        code: 'MISSING_EXTERNAL_ID'
      });
    }

    // Validar configuração do AbacatePay
    if (!process.env.ABACATEPAY_API_URL || !process.env.ABACATEPAY_API_KEY) {
      console.error('❌ [CARD-PAYMENT] AbacatePay não configurado!');
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
    if (finalCourseId) {
      try {
        const courseResult = await query(
          'SELECT title FROM courses WHERE id = $1',
          [finalCourseId]
        );
        if (courseResult.rows.length > 0) {
          courseTitle = courseResult.rows[0].title;
          console.log('📚 [CARD-PAYMENT] Título do curso encontrado:', courseTitle);
        } else {
          console.warn('⚠️ [CARD-PAYMENT] Curso não encontrado para courseId:', finalCourseId);
        }
      } catch (courseError) {
        console.error('❌ [CARD-PAYMENT] Erro ao buscar curso:', courseError.message);
        // Continuar com título padrão
      }
    }

    // Preparar body da requisição conforme documentação da API
    // Formato esperado: frequency, methods, products, returnUrl, completionUrl, customer, externalId, metadata
    const requestBody = {
      frequency: 'ONE_TIME',
      methods: ['CARD'], // Para pagamento com cartão, usar apenas 'CARD' (a API não aceita 'CREDIT_CARD' ou 'DEBIT_CARD')
      products: [
        {
          externalId: finalCourseId || externalId,
          name: courseTitle,
          description: `Acesso ao curso: ${courseTitle}`,
          quantity: 1,
          price: Math.round(finalAmount * 100), // Converter para centavos
        }
      ],
      returnUrl: `${process.env.APP_URL || 'http://localhost:3000'}/checkout/success`,
      completionUrl: `${process.env.APP_URL || 'http://localhost:3000'}/checkout/success`,
      customer: (() => {
        const customer = {};
        
        if (finalCustomerData?.name && finalCustomerData.name.trim()) {
          customer.name = finalCustomerData.name.trim();
        }
        
        if (finalCustomerData?.phone && finalCustomerData.phone.trim()) {
          const phone = finalCustomerData.phone.replace(/\D/g, '');
          if (phone.length >= 10) {
            customer.cellphone = phone;
          }
        }
        
        if (finalCustomerData?.email && finalCustomerData.email.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailRegex.test(finalCustomerData.email.trim())) {
            customer.email = finalCustomerData.email.trim();
          }
        }
        
        if (finalCustomerData?.taxId && finalCustomerData.taxId.trim()) {
          const taxId = finalCustomerData.taxId.replace(/\D/g, '');
          if (taxId.length >= 11) {
            customer.taxId = taxId;
          }
        }
        
        // Se não houver dados válidos, usar valores padrão
        if (Object.keys(customer).length === 0) {
          customer.name = 'Cliente';
          customer.email = 'cliente@exemplo.com';
        }
        
        console.log('👤 [CARD-PAYMENT] Dados do cliente preparados:', {
          hasName: !!customer.name,
          hasEmail: !!customer.email,
          hasCellphone: !!customer.cellphone,
          hasTaxId: !!customer.taxId
        });
        
        return customer;
      })(),
      allowCoupons: false,
      coupons: [],
      externalId: externalId,
      metadata: {
        externalId: externalId,
        courseId: finalCourseId,
      }
    };

    console.log('📦 [CARD-PAYMENT] Body da requisição:', JSON.stringify(requestBody, null, 2));
    console.log('💳 [CARD-PAYMENT] Métodos de pagamento configurados:', requestBody.methods);
    console.log('📡 [CARD-PAYMENT] Chamando AbacatePay:', apiUrl);
    console.log('🔑 [CARD-PAYMENT] API Key configurada:', process.env.ABACATEPAY_API_KEY ? 'SIM' : 'NÃO');

    // Chamar AbacatePay
    let abacateResponse;
    try {
      abacateResponse = await axios.post(
        apiUrl,
        requestBody,
        {
          headers,
          timeout: 30000, // 30 segundos de timeout
        }
      );
      console.log('✅ [CARD-PAYMENT] Resposta recebida do AbacatePay:', JSON.stringify(abacateResponse.data, null, 2));
    } catch (axiosError) {
      console.error('❌ [CARD-PAYMENT] Erro na chamada do AbacatePay:', axiosError.message);
      if (axiosError.response) {
        console.error('❌ [CARD-PAYMENT] Status:', axiosError.response.status);
        console.error('❌ [CARD-PAYMENT] Data:', JSON.stringify(axiosError.response.data, null, 2));
      }
      throw axiosError; // Re-throw para ser capturado pelo catch externo
    }

    // A API retorna: { error: null, data: { id, url, ... } }
    // Extrair dados da resposta (pode estar em data.data ou diretamente em data)
    const responseData = abacateResponse.data.data || abacateResponse.data;
    
    const billingId = responseData.id || 
                     responseData.billingId ||
                     responseData.billing_id;
    
    const paymentUrl = responseData.url ||
                      responseData.paymentUrl || 
                      responseData.payment_url;

    if (!billingId) {
      console.error('❌ [CARD-PAYMENT] billingId não encontrado na resposta do AbacatePay');
      console.error('❌ [CARD-PAYMENT] Resposta completa:', JSON.stringify(abacateResponse.data, null, 2));
      console.error('❌ [CARD-PAYMENT] responseData extraído:', JSON.stringify(responseData, null, 2));
      return res.status(500).json({
        error: 'Resposta inválida do gateway de pagamento',
        code: 'INVALID_GATEWAY_RESPONSE',
        message: 'ID de billing não encontrado na resposta',
        details: process.env.NODE_ENV === 'development' ? {
          fullResponse: abacateResponse.data,
          extractedData: responseData
        } : undefined
      });
    }

    console.log('✅ [CARD-PAYMENT] Pagamento criado com sucesso:', {
      billingId: billingId,
      hasPaymentUrl: !!paymentUrl
    });

    // Atualizar billing_id na compra se existir
    if (purchase && billingId) {
      try {
        await query(
          'UPDATE course_purchases SET billing_id = $1, updated_at = NOW() WHERE id = $2',
          [billingId, purchase.id]
        );
        console.log('✅ [CARD-PAYMENT] billing_id atualizado na compra');
      } catch (updateError) {
        console.error('⚠️ [CARD-PAYMENT] Erro ao atualizar billing_id (não crítico):', updateError.message);
      }
    }

    console.log('💳 [CARD-PAYMENT] ========== FIM (SUCESSO) ==========');
    res.json({
      payment_url: paymentUrl,
      billingId: billingId,
    });
  } catch (error) {
    console.error('❌ [CARD-PAYMENT] Erro ao criar pagamento Cartão:', error);
    console.error('❌ [CARD-PAYMENT] Mensagem:', error.message);
    console.error('❌ [CARD-PAYMENT] Stack:', error.stack);
    
    // Se for erro do axios, logar detalhes da resposta
    if (error.response) {
      console.error('❌ [CARD-PAYMENT] Resposta do AbacatePay:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    // Se for erro de requisição (sem resposta)
    if (error.request) {
      console.error('❌ [CARD-PAYMENT] Requisição enviada mas sem resposta:', {
        url: typeof apiUrl !== 'undefined' ? apiUrl : 'N/A',
        hasHeaders: typeof headers !== 'undefined' ? !!headers : false,
        hasBody: typeof requestBody !== 'undefined' ? !!requestBody : false
      });
    }
    
    res.status(500).json({ 
      error: 'Erro ao criar pagamento Cartão',
      code: 'CARD_CREATE_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' && error.response ? error.response.data : undefined
    });
  }
});

// Verificar status do pagamento (não requer autenticação)
router.get('/payment/status/:billingId', async (req, res) => {
  const startTime = Date.now();
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { billingId } = req.params;
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`🚀 [STATUS-${requestId}] ========== INÍCIO DA VERIFICAÇÃO ==========`);
    console.log(`📅 [STATUS-${requestId}] Timestamp: ${new Date().toISOString()}`);
    console.log(`🆔 [STATUS-${requestId}] Request ID: ${requestId}`);
    console.log(`🔑 [STATUS-${requestId}] billingId recebido: ${billingId}`);
    console.log(`📋 [STATUS-${requestId}] Headers:`, {
      authorization: req.headers.authorization ? 'Presente' : 'Ausente',
      'content-type': req.headers['content-type'],
      origin: req.headers.origin,
      'user-agent': req.headers['user-agent']?.substring(0, 50)
    });
    console.log(`📋 [STATUS-${requestId}] Query params:`, req.query);
    console.log(`📋 [STATUS-${requestId}] Body:`, req.body);
    console.log('───────────────────────────────────────────────────────────────');

    // Verificar no banco primeiro
    console.log(`🔍 [STATUS-${requestId}] Buscando compra no banco de dados...`);
    const purchaseResult = await query(
      'SELECT * FROM course_purchases WHERE billing_id = $1',
      [billingId]
    );
    
    console.log(`📊 [STATUS-${requestId}] Resultado da busca no banco:`, {
      encontradas: purchaseResult.rows.length,
      billingId: billingId
    });

    if (purchaseResult.rows.length === 0) {
      console.log(`⚠️ [STATUS-${requestId}] ========== COMPRA NÃO ENCONTRADA NO BANCO ==========`);
      console.log(`⚠️ [STATUS-${requestId}] Compra não encontrada no banco para billingId: ${billingId}`);
      console.log(`⚠️ [STATUS-${requestId}] Continuando para verificar no AbacatePay...`);
    }

    if (purchaseResult.rows.length > 0) {
      const purchase = purchaseResult.rows[0];
      console.log(`✅ [STATUS-${requestId}] Compra encontrada no banco!`);
      console.log(`📊 [STATUS-${requestId}] Dados da compra:`, {
        id: purchase.id,
        external_id: purchase.external_id,
        billing_id: purchase.billing_id,
        payment_status: purchase.payment_status,
        user_id: purchase.user_id,
        course_id: purchase.course_id,
        amount: purchase.amount,
        payment_method: purchase.payment_method,
        created_at: purchase.created_at,
        updated_at: purchase.updated_at,
        has_customer_data: !!purchase.customer_data
      });
      
      if (purchase.customer_data) {
        console.log(`👤 [STATUS-${requestId}] Dados do cliente:`, {
          name: purchase.customer_data?.name,
          email: purchase.customer_data?.email,
          phone: purchase.customer_data?.phone ? 'Presente' : 'Ausente',
          taxId: purchase.customer_data?.taxId ? 'Presente' : 'Ausente'
        });
      }
      
      // Se já está pago, verificar e criar matrícula se necessário antes de retornar
      if (purchase.payment_status === 'paid') {
        console.log(`💰 [STATUS-${requestId}] ========== PAGAMENTO JÁ ESTÁ PAID ==========`);
        console.log(`✅ [STATUS-${requestId}] Pagamento já está pago no banco, verificando matrícula...`);
        
        // Verificar se usuário existe e criar matrícula se necessário
        let userId = purchase.user_id;
        
        // Se não tem user_id, tentar criar/verificar usuário
        if (!userId) {
          const customerEmail = purchase.customer_data?.email;
          if (customerEmail) {
            const existingUserCheck = await query(
              'SELECT id FROM auth.users WHERE email = $1',
              [customerEmail.toLowerCase().trim()]
            );
            
            if (existingUserCheck.rows.length > 0) {
              userId = existingUserCheck.rows[0].id;
              // Atualizar user_id na compra
              await query(
                'UPDATE course_purchases SET user_id = $1 WHERE id = $2',
                [userId, purchase.id]
              );
              console.log(`✅ [STATUS-${requestId}] user_id atualizado na compra:`, userId);
            } else {
              // Criar usuário se não existir
              console.log('👤 [STATUS] Criando usuário para compra já paga...');
              try {
                const customerName = purchase.customer_data?.name || 'Cliente';
                const nameParts = customerName.trim().split(' ');
                const firstName = nameParts[0] || customerName;
                const lastName = nameParts.slice(1).join(' ') || '';
                
                // Gerar senha temporária
                const taxId = purchase.customer_data?.taxId?.replace(/\D/g, '') || '';
                const phone = purchase.customer_data?.phone?.replace(/\D/g, '') || '';
                let userPassword = '';
                
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
                
                const hashedPassword = await bcrypt.hash(userPassword, 10);
                
                userId = await transaction(async (client) => {
                  const userInsert = await client.query(
                    `INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
                     VALUES ($1, $2, NOW(), NOW(), NOW())
                     RETURNING id, email`,
                    [customerEmail.toLowerCase().trim(), hashedPassword]
                  );
                  
                  const newUserId = userInsert.rows[0].id;
                  
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
                      purchase.customer_data?.phone || null,
                      purchase.customer_data?.taxId || null
                    ]
                  );
                  
                  await client.query(
                    `INSERT INTO user_roles (user_id, role, created_at)
                     VALUES ($1, 'student', NOW())
                     ON CONFLICT (user_id, role) DO NOTHING`,
                    [newUserId]
                  );
                  
                  // Atualizar user_id na compra
                  await client.query(
                    'UPDATE course_purchases SET user_id = $1 WHERE id = $2',
                    [newUserId, purchase.id]
                  );
                  
                  return newUserId;
                });
                
                console.log('✅ [STATUS] Usuário criado com sucesso! ID:', userId);
              } catch (userError) {
                console.error('❌ [STATUS] Erro ao criar usuário:', userError.message);
              }
            }
          }
        }
        
        // Criar matrícula se usuário existe e matrícula não existe
        if (userId) {
          try {
            const enrollmentCheck = await query(
              'SELECT id FROM course_enrollments WHERE user_id = $1 AND course_id = $2',
              [userId, purchase.course_id]
            );
            
            if (enrollmentCheck.rows.length === 0) {
              console.log('📚 [STATUS] Criando matrícula para compra já paga...');
              await query(
                'INSERT INTO course_enrollments (user_id, course_id, enrolled_at) VALUES ($1, $2, NOW())',
                [userId, purchase.course_id]
              );
              console.log('✅ [STATUS] Matrícula criada com sucesso!');
            } else {
              console.log('✅ [STATUS] Matrícula já existe');
            }
          } catch (enrollmentError) {
            console.error('⚠️ [STATUS] Erro ao criar matrícula:', enrollmentError.message);
          }
        } else {
          console.warn('⚠️ [STATUS] user_id não disponível, matrícula não será criada');
        }
        
        // Buscar dados completos da compra com informações do curso
        const fullPurchaseResult = await query(
          `SELECT cp.*, c.title as course_title 
           FROM course_purchases cp
           JOIN courses c ON c.id = cp.course_id
           WHERE cp.billing_id = $1`,
          [billingId]
        );
        
        const responseData = {
          success: true,
          status: 'PAID', // Frontend espera maiúsculas
          purchase: fullPurchaseResult.rows.length > 0 ? fullPurchaseResult.rows[0] : purchase,
        };
        
        console.log('📤 [STATUS] Retornando resposta (banco já pago):', JSON.stringify({
          status: responseData.status,
          purchaseId: responseData.purchase?.id,
          courseTitle: responseData.purchase?.course_title
        }));
        
        return res.json(responseData);
      }
    }

    // Se não encontrou ou não está pago, verificar no AbacatePay
    console.log(`🌐 [STATUS-${requestId}] ========== VERIFICANDO NO ABACATEPAY ==========`);
    console.log(`📡 [STATUS-${requestId}] Compra não encontrada ou não está paga, verificando no AbacatePay...`);
    
    // Construir URL do endpoint - API do AbacatePay: /v1/pixQrCode/check
    // A API espera o ID do QR Code como query parameter
    let apiBaseUrl = process.env.ABACATEPAY_API_URL?.replace(/\/$/, '') || 'https://api.abacatepay.com';
    const apiUrl = `${apiBaseUrl}/v1/pixQrCode/check?id=${billingId}`;

    // Preparar headers
    const headers = {
      'Authorization': `Bearer ${process.env.ABACATEPAY_API_KEY}`,
    };

    console.log(`📡 [STATUS-${requestId}] URL do AbacatePay: ${apiUrl}`);
    console.log(`🔑 [STATUS-${requestId}] API Key configurada:`, process.env.ABACATEPAY_API_KEY ? 'SIM' : 'NÃO');
    console.log(`🔑 [STATUS-${requestId}] API Key preview:`, process.env.ABACATEPAY_API_KEY ? `${process.env.ABACATEPAY_API_KEY.substring(0, 10)}...` : 'N/A');
    console.log(`📋 [STATUS-${requestId}] Headers da requisição:`, {
      'Authorization': headers.Authorization ? 'Presente' : 'Ausente',
      'Content-Type': 'application/json'
    });

    // Verificar status no AbacatePay
    console.log(`⏳ [STATUS-${requestId}] Enviando requisição para AbacatePay...`);
    const abacateRequestStart = Date.now();
    
    let abacateResponse;
    try {
      abacateResponse = await axios.get(
        apiUrl,
        {
          headers,
          timeout: 30000 // 30 segundos
        }
      );
      
      const abacateRequestDuration = Date.now() - abacateRequestStart;
      console.log(`✅ [STATUS-${requestId}] Resposta recebida do AbacatePay em ${abacateRequestDuration}ms`);
      console.log(`📥 [STATUS-${requestId}] Status HTTP: ${abacateResponse.status}`);
      console.log(`📥 [STATUS-${requestId}] Dados completos da resposta:`, JSON.stringify(abacateResponse.data, null, 2));
    } catch (abacateError) {
      const abacateRequestDuration = Date.now() - abacateRequestStart;
      console.error(`❌ [STATUS-${requestId}] ERRO ao consultar AbacatePay após ${abacateRequestDuration}ms`);
      console.error(`❌ [STATUS-${requestId}] Tipo do erro:`, abacateError.constructor.name);
      console.error(`❌ [STATUS-${requestId}] Mensagem:`, abacateError.message);
      console.error(`❌ [STATUS-${requestId}] Código:`, abacateError.code);
      console.error(`❌ [STATUS-${requestId}] Response status:`, abacateError.response?.status);
      console.error(`❌ [STATUS-${requestId}] Response data:`, abacateError.response?.data);
      console.error(`❌ [STATUS-${requestId}] Stack:`, abacateError.stack);
      
      // Retornar erro
      return res.status(500).json({
        success: false,
        error: 'Erro ao verificar status no AbacatePay',
        message: abacateError.message,
        code: abacateError.code,
        requestId: requestId
      });
    }

    // A API retorna: status, paidAt, etc.
    console.log(`🔍 [STATUS-${requestId}] Extraindo status da resposta...`);
    const status = abacateResponse.data.status || 
                   abacateResponse.data.paymentStatus ||
                   abacateResponse.data.data?.status ||
                   'PENDING';

    console.log(`📊 [STATUS-${requestId}] Status extraído:`, {
      status_original: status,
      data_status: abacateResponse.data.status,
      data_paymentStatus: abacateResponse.data.paymentStatus,
      data_data_status: abacateResponse.data.data?.status,
      status_final: status
    });

    // Mapear status da API para nosso formato
    let mappedStatus = status;
    let updatedPurchase = null;
    
    console.log(`🔍 [STATUS-${requestId}] Verificando se status indica pagamento confirmado...`);
    console.log(`🔍 [STATUS-${requestId}] Status para comparação: "${status}" (tipo: ${typeof status})`);
    
    if (status === 'PAID' || status === 'APPROVED' || status === 'CONFIRMED' || status === 'paid') {
      console.log(`💰 [STATUS-${requestId}] ========== PAGAMENTO CONFIRMADO NO ABACATEPAY ==========`);
      console.log(`✅ [STATUS-${requestId}] Status indica pagamento confirmado!`);
      mappedStatus = 'paid';
      
      // Se o pagamento foi confirmado, atualizar no banco e processar
      if (purchaseResult.rows.length > 0) {
        const purchase = purchaseResult.rows[0];
        console.log(`🔍 [STATUS-${requestId}] Verificando status atual da compra:`, {
          billingId,
          currentStatus: purchase.payment_status,
          newStatus: mappedStatus,
          needsUpdate: purchase.payment_status !== 'paid',
          purchaseId: purchase.id,
          courseId: purchase.course_id,
          userId: purchase.user_id
        });
        
        // Sempre atualizar e processar quando status é paid, mesmo se já estava paid
        // Isso garante que WhatsApp seja enviado mesmo em caso de re-verificação
        const wasAlreadyPaid = purchase.payment_status === 'paid';
        
        // Variável para rastrear se o usuário foi criado nesta execução
        let userWasCreatedInThisExecution = false;
        let userPasswordForWhatsApp = null;
        
        if (!wasAlreadyPaid) {
          console.log(`💰 [STATUS-${requestId}] ==========================================`);
          console.log(`💰 [STATUS-${requestId}] PAGAMENTO CONFIRMADO! Atualizando banco...`);
          console.log(`💰 [STATUS-${requestId}] billingId:`, billingId);
          console.log(`💰 [STATUS-${requestId}] Status anterior:`, purchase.payment_status);
          console.log(`💰 [STATUS-${requestId}] Status novo: paid`);
          console.log(`💰 [STATUS-${requestId}] ==========================================`);
          
          // Atualizar status da compra
          console.log(`💾 [STATUS-${requestId}] Atualizando status da compra no banco...`);
          const updateStart = Date.now();
          await query(
            'UPDATE course_purchases SET payment_status = $1, updated_at = NOW() WHERE billing_id = $2',
            ['paid', billingId]
          );
          const updateDuration = Date.now() - updateStart;
          console.log(`✅ [STATUS-${requestId}] Status atualizado no banco em ${updateDuration}ms`);
        } else {
          console.log(`💰 [STATUS-${requestId}] Pagamento já estava marcado como paid, mas verificando WhatsApp...`);
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
        
        // WhatsApp será enviado APENAS quando a matrícula for criada (ver código abaixo)
        // Isso garante que seja enviado apenas uma vez e inclua credenciais quando necessário
        console.log('📱 [STATUS] WhatsApp será enviado após criação da matrícula (se necessário)');
          
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
              // Verificar novamente se o usuário não foi criado por outro processo (race condition)
              const finalUserCheck = await query(
                'SELECT id FROM auth.users WHERE email = $1',
                [customerEmail.toLowerCase().trim()]
              );
              
              if (finalUserCheck.rows.length > 0) {
                // Usuário foi criado por outro processo, usar o ID existente
                userId = finalUserCheck.rows[0].id;
                console.log('✅ [STATUS] Usuário já existe (criado por outro processo), usando ID:', userId);
                
                // Atualizar user_id na compra
                await query(
                  'UPDATE course_purchases SET user_id = $1 WHERE id = $2',
                  [userId, purchase.id]
                );
              } else {
                // Criar novo usuário
                console.log('👤 [STATUS] Criando novo usuário para o cliente...');
              
                try {
                // Usar senha fornecida pelo usuário no checkout, ou gerar uma temporária
                let userPassword = '';
                const providedPassword = updatedPurchase?.customer_data?.password || 
                                       updatedPurchase?.customer_data?.createPassword ||
                                       updatedPurchase?.customer_data?.create_password;
                
                if (providedPassword && providedPassword.trim()) {
                  // Usar senha fornecida pelo usuário
                  userPassword = providedPassword.trim();
                  console.log('✅ [STATUS] Usando senha fornecida pelo usuário no checkout');
                } else {
                  // Gerar senha temporária mais segura (fallback)
                  // Usar últimos 6 dígitos do CPF ou telefone + primeiras 2 letras do nome
                  const taxId = updatedPurchase?.customer_data?.taxId?.replace(/\D/g, '') || '';
                  const phone = updatedPurchase?.customer_data?.phone?.replace(/\D/g, '') || '';
                  
                  if (taxId && taxId.length >= 6) {
                    // Usar últimos 6 dígitos do CPF
                    userPassword = taxId.slice(-6);
                  } else if (phone && phone.length >= 6) {
                    // Usar últimos 6 dígitos do telefone
                    userPassword = phone.slice(-6);
                  } else {
                    // Gerar senha aleatória de 6 dígitos
                    userPassword = Math.floor(100000 + Math.random() * 900000).toString();
                  }
                  
                  // Adicionar primeiras 2 letras do nome (maiúsculas) para tornar mais segura
                  const nameInitials = customerName.trim().substring(0, 2).toUpperCase().replace(/[^A-Z]/g, '');
                  if (nameInitials.length === 2) {
                    userPassword = nameInitials + userPassword;
                  }
                  console.log('⚠️ [STATUS] Senha não fornecida, gerando senha temporária');
                }
                
                // Hash da senha
                const hashedPassword = await bcrypt.hash(userPassword, 10);
                
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
                  
                  // Criar perfil (se não existir)
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
                
                // Marcar que usuário foi criado nesta execução (para incluir credenciais no WhatsApp)
                userWasCreatedInThisExecution = true;
                userPasswordForWhatsApp = userPassword;
                } catch (userError) {
                  console.error('❌ [STATUS] Erro ao criar usuário:', userError.message);
                  console.error('❌ [STATUS] Detalhes do erro:', userError.code, userError.detail);
                  // Continuar mesmo se falhar, mas não criar enrollment
                }
              }
            }
          }
          
          // Criar enrollment se ainda não existir (após criar/verificar usuário)
          let enrollmentCreated = false;
          try {
            console.log(`📚 [STATUS-${requestId}] ========== VERIFICANDO/CRIANDO ENROLLMENT ==========`);
            console.log(`📚 [STATUS-${requestId}] userId disponível:`, userId ? 'SIM' : 'NÃO');
            console.log(`📚 [STATUS-${requestId}] course_id:`, purchase.course_id);
            
            if (userId) {
              console.log(`🔍 [STATUS-${requestId}] Verificando se enrollment já existe...`);
              const enrollmentCheck = await query(
                'SELECT * FROM course_enrollments WHERE user_id = $1 AND course_id = $2',
                [userId, purchase.course_id]
              );
              
              console.log(`📊 [STATUS-${requestId}] Resultado da verificação de enrollment:`, {
                encontrados: enrollmentCheck.rows.length,
                user_id: userId,
                course_id: purchase.course_id
              });
              
              if (enrollmentCheck.rows.length === 0) {
                console.log(`📚 [STATUS-${requestId}] Enrollment não existe, criando...`);
                
                await query(
                  'INSERT INTO course_enrollments (user_id, course_id, enrolled_at) VALUES ($1, $2, NOW())',
                  [userId, purchase.course_id]
                );
                console.log(`✅ [STATUS-${requestId}] Enrollment criado com sucesso!`);
                enrollmentCreated = true;
                
                // Enviar WhatsApp APENAS quando a matrícula é criada pela primeira vez
                // Incluir credenciais se o usuário foi criado nesta execução
                console.log(`📱 [STATUS-${requestId}] ========== ENVIANDO WHATSAPP ==========`);
                console.log(`📱 [STATUS-${requestId}] Verificando se deve enviar WhatsApp...`);
                console.log(`📱 [STATUS-${requestId}] Tem telefone:`, updatedPurchase?.customer_data?.phone ? 'SIM' : 'NÃO');
                console.log(`📱 [STATUS-${requestId}] Enrollment criado:`, enrollmentCreated ? 'SIM' : 'NÃO');
                console.log(`📱 [STATUS-${requestId}] Usuário criado nesta execução:`, userWasCreatedInThisExecution ? 'SIM' : 'NÃO');
                
                if (updatedPurchase?.customer_data?.phone) {
                  try {
                    const customerName = updatedPurchase.customer_data?.name || 'Cliente';
                    const customerPhone = updatedPurchase.customer_data.phone;
                    const customerEmail = updatedPurchase.customer_data?.email || purchase.customer_data?.email;
                    
                    console.log(`📱 [STATUS-${requestId}] Dados para WhatsApp:`, {
                      name: customerName,
                      phone: customerPhone,
                      email: customerEmail,
                      userWasCreated: userWasCreatedInThisExecution,
                      hasPassword: !!userPasswordForWhatsApp
                    });
                    
                    console.log(`📱 [STATUS-${requestId}] Enviando notificação WhatsApp (pagamento confirmado + credenciais se necessário)...`);
                    
                    // Montar mensagem completa
                    let whatsappMessage = `🎉 *Pagamento Confirmado - Instituto Bex*\n\n`;
                    whatsappMessage += `Olá ${customerName}! 👋\n\n`;
                    whatsappMessage += `✅ *Seu pagamento foi recebido com sucesso!*\n\n`;
                    
                    if (updatedPurchase.course_title) {
                      whatsappMessage += `📚 *Curso:* ${updatedPurchase.course_title}\n`;
                    }
                    
                    if (updatedPurchase.amount) {
                      const formattedAmount = parseFloat(updatedPurchase.amount).toFixed(2).replace('.', ',');
                      whatsappMessage += `💰 *Valor:* R$ ${formattedAmount}\n`;
                    }
                    
                    // Se o usuário foi criado nesta execução, incluir credenciais
                    if (userWasCreatedInThisExecution && customerEmail && userPasswordForWhatsApp) {
                      whatsappMessage += `\n🔐 *Credenciais de Acesso:*\n`;
                      whatsappMessage += `📧 *Email:* ${customerEmail}\n`;
                      
                      // Verificar se senha foi fornecida pelo usuário ou gerada
                      const passwordWasProvided = updatedPurchase?.customer_data?.password || 
                                                 updatedPurchase?.customer_data?.createPassword ||
                                                 updatedPurchase?.customer_data?.create_password;
                      
                      if (passwordWasProvided && passwordWasProvided.trim()) {
                        whatsappMessage += `🔑 *Senha:* ${userPasswordForWhatsApp}\n\n`;
                      } else {
                        whatsappMessage += `🔑 *Senha temporária:* ${userPasswordForWhatsApp}\n`;
                        whatsappMessage += `⚠️ *Importante:* Altere sua senha após o primeiro acesso.\n\n`;
                      }
                    }
                    
                    whatsappMessage += `🎓 *A partir de agora, você está apto a acessar todo o conteúdo da plataforma do Instituto Bex!*\n\n`;
                    whatsappMessage += `Acesse sua conta e comece a estudar agora mesmo:\n`;
                    whatsappMessage += `🔗 Acesse: ${process.env.APP_URL || 'https://institutobex.com.br'}\n\n`;
                    whatsappMessage += `Bons estudos! 📖✨\n\n`;
                    whatsappMessage += `---\n`;
                    whatsappMessage += `_Instituto Bex - Transformando vidas através da educação_`;
                    
                    console.log(`📱 [STATUS-${requestId}] Mensagem WhatsApp (primeiros 200 chars):`, whatsappMessage.substring(0, 200));
                    
                    const whatsappStart = Date.now();
                    await sendWhatsAppMessage({
                      name: customerName,
                      phone: customerPhone,
                      message: whatsappMessage
                    });
                    const whatsappDuration = Date.now() - whatsappStart;
                    
                    console.log(`✅ [STATUS-${requestId}] Notificação WhatsApp enviada com sucesso em ${whatsappDuration}ms!`);
                    if (userWasCreatedInThisExecution) {
                      console.log(`✅ [STATUS-${requestId}] Credenciais incluídas na mensagem`);
                    }
                  } catch (whatsappError) {
                    console.error(`⚠️ [STATUS-${requestId}] Erro ao enviar WhatsApp (não crítico):`, whatsappError.message);
                    console.error(`⚠️ [STATUS-${requestId}] Stack do erro WhatsApp:`, whatsappError.stack);
                  }
                } else {
                  console.log(`⚠️ [STATUS-${requestId}] WhatsApp não será enviado - telefone não disponível`);
                }
              } else {
                console.log(`✅ [STATUS-${requestId}] Enrollment já existe, WhatsApp não será enviado novamente`);
              }
            } else {
              console.warn(`⚠️ [STATUS-${requestId}] user_id não disponível, enrollment não será criado`);
            }
          } catch (enrollmentError) {
            console.error(`❌ [STATUS-${requestId}] Erro ao criar enrollment (não crítico):`, enrollmentError.message);
            console.error(`❌ [STATUS-${requestId}] Stack do erro enrollment:`, enrollmentError.stack);
            // Não falha o processo se enrollment falhar
          }
    } else {
      // Se já estava pago, buscar dados atualizados
      console.log(`📊 [STATUS-${requestId}] Status não é paid, buscando dados atualizados da compra...`);
      const updatedPurchaseResult = await query(
        `SELECT cp.*, c.title as course_title 
         FROM course_purchases cp
         JOIN courses c ON c.id = cp.course_id
         WHERE cp.billing_id = $1`,
        [billingId]
      );
      
      if (updatedPurchaseResult.rows.length > 0) {
        updatedPurchase = updatedPurchaseResult.rows[0];
        console.log(`✅ [STATUS-${requestId}] Dados atualizados da compra obtidos`);
      } else {
        console.log(`⚠️ [STATUS-${requestId}] Compra não encontrada após atualização`);
      }
    }
    } else if (status === 'PENDING' || status === 'WAITING' || status === 'pending') {
      mappedStatus = 'pending';
      console.log(`⏳ [STATUS-${requestId}] Status mapeado para: pending`);
    } else if (status === 'CANCELLED' || status === 'CANCELED' || status === 'cancelled') {
      mappedStatus = 'cancelled';
      console.log(`❌ [STATUS-${requestId}] Status mapeado para: cancelled`);
    } else {
      console.log(`⚠️ [STATUS-${requestId}] Status desconhecido: ${status}, mapeando para: ${mappedStatus}`);
    }

    console.log(`📤 [STATUS-${requestId}] ========== PREPARANDO RESPOSTA ==========`);
    console.log(`📤 [STATUS-${requestId}] Status mapeado final:`, mappedStatus);
    console.log(`📤 [STATUS-${requestId}] Tem updatedPurchase:`, updatedPurchase ? 'SIM' : 'NÃO');

    // Se o status é "paid" e temos a compra atualizada, retornar no formato esperado
    if (mappedStatus === 'paid' && updatedPurchase) {
      const responseData = {
        success: true,
        status: 'PAID', // Frontend espera maiúsculas
        purchase: updatedPurchase,
      };
      
      const totalDuration = Date.now() - startTime;
      console.log(`📤 [STATUS-${requestId}] Retornando resposta (gateway confirmou):`, JSON.stringify({
        status: responseData.status,
        purchaseId: responseData.purchase?.id,
        courseTitle: responseData.purchase?.course_title,
        duration: `${totalDuration}ms`
      }, null, 2));
      console.log(`✅ [STATUS-${requestId}] ========== SUCESSO - PAGAMENTO CONFIRMADO ==========`);
      console.log(`⏱️ [STATUS-${requestId}] Tempo total: ${totalDuration}ms`);
      console.log('═══════════════════════════════════════════════════════════════');
      
      return res.json(responseData);
    }

    const responseData = {
      success: true,
      status: mappedStatus,
      originalStatus: status,
      details: abacateResponse.data,
    };
    
    const totalDuration = Date.now() - startTime;
    console.log(`📤 [STATUS-${requestId}] Retornando resposta (status pendente):`, JSON.stringify({
      status: responseData.status,
      originalStatus: responseData.originalStatus,
      duration: `${totalDuration}ms`
    }, null, 2));
    console.log(`⏳ [STATUS-${requestId}] ========== PAGAMENTO AINDA PENDENTE ==========`);
    console.log(`⏱️ [STATUS-${requestId}] Tempo total: ${totalDuration}ms`);
    console.log('═══════════════════════════════════════════════════════════════');
    
    res.json(responseData);
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error('═══════════════════════════════════════════════════════════════');
    console.error(`❌ [STATUS-${requestId}] ========== ERRO NA VERIFICAÇÃO ==========`);
    console.error(`❌ [STATUS-${requestId}] Erro ao verificar status:`, error.message);
    console.error(`❌ [STATUS-${requestId}] Tipo do erro:`, error.constructor.name);
    console.error(`❌ [STATUS-${requestId}] Código do erro:`, error.code);
    console.error(`❌ [STATUS-${requestId}] Stack completo:`, error.stack);
    
    if (error.response) {
      console.error(`❌ [STATUS-${requestId}] Resposta do AbacatePay:`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    
    if (error.request) {
      console.error(`❌ [STATUS-${requestId}] Request que causou erro:`, {
        method: error.config?.method,
        url: error.config?.url,
        headers: error.config?.headers
      });
    }
    
    console.error(`⏱️ [STATUS-${requestId}] Tempo até erro: ${totalDuration}ms`);
    console.error(`❌ [STATUS-${requestId}] ========== FIM DO ERRO ==========`);
    console.error('═══════════════════════════════════════════════════════════════');
    
    res.status(500).json({ 
      success: false,
      error: 'Erro ao verificar status do pagamento',
      code: 'STATUS_CHECK_ERROR',
      message: error.message,
      requestId: requestId
    });
  }
});

// Criar compra (permite usuário temporário)
router.post('/', async (req, res) => {
  try {
    console.log('📦 Recebida requisição para criar compra:', JSON.stringify(req.body, null, 2));
    console.log('📦 Headers Authorization:', req.headers.authorization ? 'Presente' : 'Ausente');
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
        // O token JWT usa 'userId' como campo, não 'id'
        finalUserId = decoded.userId || decoded.id;
        console.log('✅ userId extraído do token:', finalUserId);
        console.log('✅ Token decodificado:', { userId: decoded.userId, id: decoded.id });
      } else {
        console.log('⚠️ Token não fornecido ou JWT_SECRET não configurado');
      }
    } catch (e) {
      // Token inválido ou não fornecido, usar userId do body
      console.log('⚠️ Token não fornecido ou inválido:', e.message);
      console.log('⚠️ Usando userId do body ou criando temporário');
    }
    
    // Se não tiver userId, criar um UUID temporário
    // A tabela espera UUID, então vamos gerar um UUID válido
    if (!finalUserId || finalUserId.startsWith('temp_')) {
      // Gerar UUID válido para usuário temporário
      finalUserId = randomUUID();
      console.log('🔑 Gerado UUID temporário para usuário:', finalUserId);
      console.warn('⚠️ ATENÇÃO: Compra sendo criada com userId temporário! Isso pode causar problemas na criação de matrícula.');
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

// Confirmar compra (webhook ou manual) - autenticação opcional para permitir webhooks
router.post('/confirm', async (req, res) => {
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

      // Verificar se precisa criar/atualizar usuário
      let finalUserId = purchase.user_id;
      const customerEmail = purchase.customer_data?.email;
      const customerName = purchase.customer_data?.name || 'Cliente';
      const customerPhone = purchase.customer_data?.phone;
      
      // Se não tem user_id válido ou user_id não existe no banco, criar/verificar usuário
      if (!finalUserId || !customerEmail) {
        console.warn('⚠️ [CONFIRM] user_id ou email não disponível, não será possível criar usuário');
      } else {
        // Verificar se user_id existe no banco
        const userCheck = await client.query(
          'SELECT id FROM auth.users WHERE id = $1',
          [finalUserId]
        );
        
        if (userCheck.rows.length === 0) {
          // user_id não existe, verificar se usuário existe por email
          const existingUserCheck = await client.query(
            'SELECT id FROM auth.users WHERE email = $1',
            [customerEmail.toLowerCase().trim()]
          );
          
          if (existingUserCheck.rows.length > 0) {
            // Usuário já existe, usar o ID existente
            finalUserId = existingUserCheck.rows[0].id;
            console.log('✅ [CONFIRM] Usuário já existe por email, usando ID:', finalUserId);
          } else {
            // Criar novo usuário
            console.log('👤 [CONFIRM] Criando novo usuário para o cliente...');
            
            try {
              // Gerar senha temporária
              const taxId = purchase.customer_data?.taxId?.replace(/\D/g, '') || '';
              const phone = purchase.customer_data?.phone?.replace(/\D/g, '') || '';
              let userPassword = '';
              
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
              
              const hashedPassword = await bcrypt.hash(userPassword, 10);
              const nameParts = customerName.trim().split(' ');
              const firstName = nameParts[0] || customerName;
              const lastName = nameParts.slice(1).join(' ') || '';
              
              // Criar usuário
              const userInsert = await client.query(
                `INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
                 VALUES ($1, $2, NOW(), NOW(), NOW())
                 RETURNING id, email`,
                [customerEmail.toLowerCase().trim(), hashedPassword]
              );
              
              finalUserId = userInsert.rows[0].id;
              
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
                  finalUserId,
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
                [finalUserId]
              );
              
              console.log('✅ [CONFIRM] Usuário criado com sucesso! ID:', finalUserId);
            } catch (userError) {
              console.error('❌ [CONFIRM] Erro ao criar usuário:', userError.message);
              // Continuar mesmo se falhar
            }
          }
          
          // Atualizar user_id na compra se foi alterado
          if (finalUserId !== purchase.user_id) {
            await client.query(
              'UPDATE course_purchases SET user_id = $1 WHERE id = $2',
              [finalUserId, purchase.id]
            );
            console.log('✅ [CONFIRM] user_id atualizado na compra');
          }
        }
      }

      // Atualizar status
      await client.query(
        `UPDATE course_purchases 
         SET payment_status = 'paid', updated_at = NOW(), user_id = $2
         WHERE external_id = $1`,
        [externalId, finalUserId]
      );

      // Criar matrícula se não existir (usando finalUserId que pode ter sido atualizado)
      if (finalUserId) {
        const enrollmentCheck = await client.query(
          'SELECT id FROM course_enrollments WHERE user_id = $1 AND course_id = $2',
          [finalUserId, purchase.course_id]
        );

        if (enrollmentCheck.rows.length === 0) {
          console.log('📚 [CONFIRM] Criando matrícula para o curso...');
          await client.query(
            `INSERT INTO course_enrollments (user_id, course_id, created_at)
             VALUES ($1, $2, NOW())`,
            [finalUserId, purchase.course_id]
          );
          console.log('✅ [CONFIRM] Matrícula criada com sucesso!');
        } else {
          console.log('✅ [CONFIRM] Matrícula já existe');
        }
      } else {
        console.warn('⚠️ [CONFIRM] user_id não disponível, matrícula não será criada');
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
          
          // Chamar função WhatsApp diretamente
          await sendWhatsAppMessage({
            name: customerName,
            phone: result.customer_data.phone,
            courseTitle: result.course_title,
            amount: result.amount,
          });
          
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

