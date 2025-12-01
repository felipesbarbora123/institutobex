// Edge Function do Supabase para enviar notificação WhatsApp
// Nome da função: send-whatsapp-notification
// 
// Como usar:
// 1. Acesse: https://supabase.com/dashboard/project/qxgzazewwutbikmmpkms/edge-functions
// 2. Clique em "Create Function"
// 3. Nome: send-whatsapp-notification
// 4. Cole este código
// 5. Configure as variáveis de ambiente (veja abaixo)
// 6. Deploy

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL') || 'https://mensadodo.dunis.com.br'
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY') || '3B2F25CF7B2F-41F0-8EA1-2F021B2591FC'
const EVOLUTION_INSTANCE = Deno.env.get('EVOLUTION_INSTANCE_NAME') || 'Dunis'
const APP_URL = Deno.env.get('APP_URL') || 'https://institutobex.com.br'

serve(async (req) => {
  // Configurar CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    )
  }

  try {
    const { name, phone, courseTitle, amount } = await req.json()

    // Validar dados obrigatórios
    if (!name || !phone) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nome e telefone são obrigatórios' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      )
    }

    // Formatar telefone (remover caracteres não numéricos)
    const formattedPhone = phone.replace(/\D/g, '')
    
    if (formattedPhone.length < 10) {
      return new Response(
        JSON.stringify({ success: false, error: 'Número de telefone inválido' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      )
    }

    // Montar mensagem
    let message = `🎉 *Pagamento Confirmado - Instituto Bex*\n\n`
    message += `Olá ${name}! 👋\n\n`
    message += `✅ *Seu pagamento foi recebido com sucesso!*\n\n`
    
    if (courseTitle) {
      message += `📚 *Curso:* ${courseTitle}\n`
    }
    
    if (amount) {
      const formattedAmount = parseFloat(amount).toFixed(2).replace('.', ',')
      message += `💰 *Valor:* R$ ${formattedAmount}\n`
    }
    
    message += `\n🎓 *A partir de agora, você está apto a acessar todo o conteúdo da plataforma do Instituto Bex!*\n\n`
    message += `Acesse sua conta e comece a estudar agora mesmo:\n`
    message += `🔗 Acesse: ${APP_URL}\n\n`
    message += `Bons estudos! 📖✨\n\n`
    message += `---\n`
    message += `_Instituto Bex - Transformando vidas através da educação_`

    // Enviar mensagem via Evolution API
    const evolutionResponse = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        },
        body: JSON.stringify({
          number: formattedPhone,
          text: message
        })
      }
    )

    if (!evolutionResponse.ok) {
      const errorText = await evolutionResponse.text()
      console.error('Erro na Evolution API:', errorText)
      throw new Error(`Evolution API error: ${evolutionResponse.status} - ${errorText}`)
    }

    const result = await evolutionResponse.json()

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notificação de pagamento enviada com sucesso',
        data: result
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    )

  } catch (error) {
    console.error('Erro ao enviar notificação WhatsApp:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro ao enviar notificação'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    )
  }
})

/* 
===========================================
VARIÁVEIS DE AMBIENTE A CONFIGURAR NO SUPABASE:
===========================================

1. Acesse: https://supabase.com/dashboard/project/qxgzazewwutbikmmpkms/settings/edge-functions
2. Vá em "Secrets" ou "Environment Variables"
3. Adicione:

EVOLUTION_API_URL=https://mensadodo.dunis.com.br
EVOLUTION_API_KEY=3B2F25CF7B2F-41F0-8EA1-2F021B2591FC
EVOLUTION_INSTANCE_NAME=Dunis
APP_URL=https://institutobex.com.br

===========================================
COMO CHAMAR ESTA FUNÇÃO:
===========================================

URL: https://qxgzazewwutbikmmpkms.supabase.co/functions/v1/send-whatsapp-notification

Método: POST
Headers:
  - Content-Type: application/json
  - Authorization: Bearer [SUA_CHAVE_ANON_DO_SUPABASE]

Body:
{
  "name": "João Silva",
  "phone": "5511999999999",
  "courseTitle": "Curso de Exemplo", // Opcional
  "amount": 199.90 // Opcional
}

===========================================
INTEGRAÇÃO COM CONFIRMAÇÃO DE PAGAMENTO:
===========================================

Na Edge Function "confirm-purchase", adicione no final:

// Após confirmar o pagamento e criar a matrícula
if (purchase && purchase.customer_data?.phone) {
  try {
    const whatsappResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-whatsapp-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
        },
        body: JSON.stringify({
          name: purchase.customer_data.name || 
                `${purchase.profiles?.first_name || ''} ${purchase.profiles?.last_name || ''}`.trim(),
          phone: purchase.customer_data.phone,
          courseTitle: purchase.courses?.title,
          amount: purchase.amount
        })
      }
    )
    
    if (whatsappResponse.ok) {
      console.log('✅ Notificação WhatsApp enviada com sucesso')
    } else {
      console.warn('⚠️ Erro ao enviar WhatsApp:', await whatsappResponse.text())
    }
  } catch (error) {
    console.error('❌ Erro ao chamar função WhatsApp:', error)
    // Não falha o processo de confirmação se WhatsApp falhar
  }
}

*/

