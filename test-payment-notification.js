// Script de teste para notificação de pagamento confirmado via WhatsApp
// Execute: node test-payment-notification.js

const whatsappAPI = require('./whatsapp-api');

async function testarNotificacaoPagamento() {
  console.log('🧪 Testando notificação de pagamento confirmado via WhatsApp...\n');

  // ⚙️ CONFIGURE O NÚMERO AQUI (apenas uma vez)
  const testNumber = '555384681446'; // Substitua por um número real para testar
  const testName = 'João Silva'; // Nome para teste

  // Teste 1: Verificar se número tem WhatsApp
  console.log('1️⃣ Verificando se número tem WhatsApp...');
  try {
    const hasWhatsApp = await whatsappAPI.checkWhatsAppNumber(testNumber);
    console.log(`✅ Número ${testNumber} ${hasWhatsApp ? 'TEM' : 'NÃO TEM'} WhatsApp\n`);
    
    if (!hasWhatsApp) {
      console.log('⚠️ ATENÇÃO: O número não possui WhatsApp. O teste de envio pode falhar.\n');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar número:', error.message);
  }

  // Teste 2: Enviar notificação de pagamento
  console.log('2️⃣ Enviando notificação de pagamento confirmado...');
  try {
    const result = await whatsappAPI.sendPaymentConfirmation({
      name: testName,
      phone: testNumber, // Usa o mesmo número configurado acima
      courseTitle: 'Curso de Teste',
      amount: 199.90
    });
    console.log('✅ Notificação enviada com sucesso!');
    console.log('📱 Resposta:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Erro ao enviar notificação:', error.message);
    console.log('\n💡 Verifique:');
    console.log('   - Se o número tem WhatsApp cadastrado');
    console.log('   - Se a API Evolution está rodando');
    console.log('   - Se as credenciais estão corretas');
  }
}

// Executar testes
testarNotificacaoPagamento();

