// Script de teste para API WhatsApp
// Execute: node test-whatsapp.js

const whatsappAPI = require('./whatsapp-api');

async function testarWhatsApp() {
  console.log('🧪 Testando integração com API Evolution WhatsApp...\n');

  // Teste 1: Verificar status da instância
  console.log('1️⃣ Verificando status da instância...');
  try {
    const status = await whatsappAPI.checkInstanceStatus();
    console.log('✅ Status:', JSON.stringify(status, null, 2));
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error.message);
  }

  console.log('\n');

  // Teste 2: Enviar mensagem de teste
  console.log('2️⃣ Enviando mensagem de teste...');
  try {
    const result = await whatsappAPI.sendContactNotification({
      name: 'Teste Sistema',
      email: 'teste@institutobex.com',
      subject: 'Teste de Integração',
      message: 'Esta é uma mensagem de teste da integração com WhatsApp.',
      phone: '11999999999' // Opcional
    });
    console.log('✅ Mensagem enviada com sucesso!');
    console.log('📱 Resposta:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error.message);
    console.log('\n💡 Verifique:');
    console.log('   - Se a API Evolution está rodando');
    console.log('   - Se as credenciais estão corretas no arquivo .env');
    console.log('   - Se a instância está configurada e ativa');
  }
}

// Executar testes
testarWhatsApp();

