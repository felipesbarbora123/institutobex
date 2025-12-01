// ============================================
// CÓDIGO PARA ADICIONAR NA FUNÇÃO confirm-purchase
// ============================================
// 
// INSTRUÇÕES:
// 1. Abra a função confirm-purchase no Supabase
// 2. Localize onde a matrícula é criada (inserção em course_enrollments)
// 3. Adicione este código ANTES do final da função (antes do return)
// 4. Ajuste os campos conforme necessário (ver comentários)
// 5. Faça deploy
//
// ============================================

// ============================================
// ENVIAR NOTIFICAÇÃO WHATSAPP
// ============================================
try {
  // Buscar dados completos da compra
  const { data: purchase, error: purchaseError } = await supabase
    .from('course_purchases')
    .select(`
      *,
      courses (title),
      profiles (first_name, last_name)
    `)
    .eq('external_id', externalId)
    .single();
  
  if (!purchaseError && purchase) {
    // Extrair telefone do customer_data
    // ⚠️ AJUSTE: Verifique como o telefone está armazenado na sua tabela
    // Pode estar em: customer_data.phone, customer_data.phone_number, etc.
    const customerPhone = purchase.customer_data?.phone || 
                         purchase.customer_data?.phone_number ||
                         purchase.customer_data?.telefone ||
                         purchase.phone;
    
    if (customerPhone) {
      // Montar nome do cliente
      // ⚠️ AJUSTE: Verifique como o nome está armazenado
      const customerName = purchase.customer_data?.name || 
                          purchase.customer_data?.full_name ||
                          purchase.customer_data?.nome ||
                          `${purchase.profiles?.first_name || ''} ${purchase.profiles?.last_name || ''}`.trim() ||
                          'Cliente';
      
      // Chamar função de WhatsApp
      const whatsappResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-whatsapp-notification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          },
          body: JSON.stringify({
            name: customerName,
            phone: customerPhone,
            courseTitle: purchase.courses?.title || null,
            amount: purchase.amount || null
          })
        }
      );
      
      if (whatsappResponse.ok) {
        const whatsappResult = await whatsappResponse.json();
        console.log('✅ Notificação WhatsApp enviada com sucesso:', whatsappResult);
      } else {
        const errorText = await whatsappResponse.text();
        console.warn('⚠️ Erro ao enviar WhatsApp:', errorText);
        // Não falha o processo se WhatsApp falhar
      }
    } else {
      console.log('ℹ️ Telefone não encontrado nos dados da compra. WhatsApp não será enviado.');
      console.log('Dados disponíveis:', JSON.stringify(purchase.customer_data, null, 2));
    }
  } else {
    console.warn('⚠️ Não foi possível buscar dados da compra para enviar WhatsApp:', purchaseError);
  }
} catch (whatsappError) {
  console.error('❌ Erro ao processar notificação WhatsApp:', whatsappError);
  // ⚠️ IMPORTANTE: Não lançar erro aqui para não interromper a confirmação do pagamento
  // O acesso ao curso deve ser liberado mesmo se o WhatsApp falhar
}

// ============================================
// FIM DO CÓDIGO
// ============================================

/*
============================================
NOTAS IMPORTANTES:
============================================

1. Este código deve ser adicionado APÓS criar a matrícula
2. O código está dentro de um try/catch para não interromper o processo
3. Se o WhatsApp falhar, o pagamento ainda será confirmado
4. Ajuste os campos conforme sua estrutura de dados

============================================
COMO VERIFICAR OS CAMPOS CORRETOS:
============================================

1. No Supabase Dashboard, vá em Table Editor
2. Abra a tabela course_purchases
3. Veja um registro de compra
4. Verifique como está o campo customer_data
5. Ajuste o código acima para buscar no campo correto

Exemplo de customer_data:
{
  "name": "João Silva",
  "phone": "5511999999999",
  "email": "joao@email.com"
}

Ou pode estar assim:
{
  "full_name": "João Silva",
  "phone_number": "5511999999999",
  "email": "joao@email.com"
}

Ajuste o código conforme sua estrutura!

============================================
*/

