# 📱 Integração com API Evolution WhatsApp

## 📋 Visão Geral

Este projeto foi configurado para integrar com a **API Evolution WhatsApp**, permitindo o envio automático de mensagens quando:
- Um novo contato é enviado pelo formulário do site
- Notificações para administradores
- Confirmações para clientes

## 🚀 Configuração Inicial

### 1. Instalar dependências (se necessário)

O projeto já usa apenas módulos nativos do Node.js, então não precisa instalar pacotes adicionais.

### 2. Configurar variáveis de ambiente

1. **Copie o arquivo de exemplo:**
   ```bash
   copy .env.example .env
   ```
   (No Linux/Mac: `cp .env.example .env`)

2. **Edite o arquivo `.env`** e preencha com suas credenciais:

   ```env
   EVOLUTION_API_URL=https://mensadodo.dunis.com.br
   EVOLUTION_API_KEY=3B2F25CF7B2F-41F0-8EA1-2F021B2591FC
   EVOLUTION_INSTANCE_NAME=default
   EVOLUTION_NUMBER=5511999999999
   ```

   **✅ CONFIGURADO**: As credenciais já estão configuradas no arquivo `whatsapp-api.js`:
   - ✅ URL: `https://mensadodo.dunis.com.br`
   - ✅ API Key: `3B2F25CF7B2F-41F0-8EA1-2F021B2591FC`
   - ✅ Instância: `Dunis` (detectada automaticamente)
   - ✅ Número de destino: `5511948248421` (detectado automaticamente)
   - ✅ **Status**: Totalmente funcional e testado!

   **Onde encontrar essas informações:**
   - `EVOLUTION_API_URL`: URL onde sua API Evolution está rodando
   - `EVOLUTION_API_KEY`: Chave de API gerada no painel da Evolution
   - `EVOLUTION_INSTANCE_NAME`: Nome da instância criada na Evolution
   - `EVOLUTION_NUMBER`: Número que receberá as notificações (formato: 5511999999999)

### 3. Carregar variáveis de ambiente

Para carregar o arquivo `.env`, você precisa instalar o pacote `dotenv`:

```bash
npm install dotenv
```

Depois, adicione no início do `server.js`:
```javascript
require('dotenv').config();
```

**OU** configure as variáveis diretamente no arquivo `whatsapp-api.js` (menos seguro, mas funciona sem instalar pacotes).

## 📡 Endpoints da API

### POST `/api/whatsapp/send`

Envia uma mensagem via WhatsApp.

**Request Body:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "subject": "Dúvida sobre curso",
  "message": "Gostaria de saber mais informações...",
  "phone": "11999999999" // Opcional
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* resposta da API Evolution */ }
}
```

### GET `/api/whatsapp/status`

Verifica o status da instância do WhatsApp.

**Response:**
```json
{
  "success": true,
  "data": { /* status da instância */ }
}
```

## 🔧 Como Usar

### Opção 1: Integração Automática (Recomendado)

Para integrar automaticamente quando um contato é enviado, você pode:

1. **Criar um webhook no Supabase** que chama o endpoint quando uma nova mensagem é inserida na tabela `contact_messages`

2. **Ou modificar o frontend** (se tiver acesso ao código fonte) para chamar o endpoint após salvar no Supabase

### Opção 2: Chamada Manual

Você pode chamar o endpoint diretamente do frontend:

```javascript
// Exemplo de uso no frontend
async function enviarWhatsApp(dadosContato) {
  try {
    const response = await fetch('http://localhost:3000/api/whatsapp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: dadosContato.name,
        email: dadosContato.email,
        subject: dadosContato.subject,
        message: dadosContato.message,
        phone: dadosContato.phone // opcional
      })
    });
    
    const result = await response.json();
    if (result.success) {
      console.log('WhatsApp enviado com sucesso!');
    }
  } catch (error) {
    console.error('Erro ao enviar WhatsApp:', error);
  }
}
```

## 📝 Formato das Mensagens

### Notificação para Administrador

Quando um novo contato é enviado, o administrador recebe:

```
📧 *Nova Mensagem de Contato - Instituto Bex*

👤 *Nome:* João Silva
📧 *Email:* joao@email.com
📱 *Telefone:* 11999999999
📌 *Assunto:* Dúvida sobre curso

💬 *Mensagem:*
Gostaria de saber mais informações sobre o curso...

---
_Enviado automaticamente pelo sistema_
```

### Confirmação para Cliente

Se o cliente forneceu telefone, ele recebe:

```
Olá João Silva! Recebemos sua mensagem sobre "Dúvida sobre curso". Entraremos em contato em breve!
```

## 🔒 Segurança

⚠️ **IMPORTANTE:**
- Nunca exponha sua `EVOLUTION_API_KEY` no código frontend
- Use variáveis de ambiente para credenciais
- Em produção, configure CORS adequadamente no `server.js`
- Considere adicionar autenticação nos endpoints da API

## 🐛 Solução de Problemas

### Erro: "EVOLUTION_NUMBER não configurado"
- Verifique se o arquivo `.env` existe e está configurado
- Ou configure diretamente no arquivo `whatsapp-api.js`

### Erro: "Request Error: connect ECONNREFUSED"
- Verifique se a API Evolution está rodando
- Confirme se a URL em `EVOLUTION_API_URL` está correta

### Erro: "API Error: 401"
- Verifique se a `EVOLUTION_API_KEY` está correta
- Confirme se a chave tem permissões para enviar mensagens

### Erro: "API Error: 404"
- Verifique se o `EVOLUTION_INSTANCE_NAME` está correto
- Confirme se a instância existe e está ativa na Evolution

## 📚 Documentação da API Evolution

Para mais informações sobre a API Evolution, consulte:
- Documentação oficial: https://doc.evolution-api.com/
- Endpoints disponíveis: https://doc.evolution-api.com/v1.0.0/endpoints

## 🔄 Próximos Passos

1. ✅ Configurar variáveis de ambiente
2. ✅ Testar envio de mensagem manual
3. ⬜ Integrar com formulário de contato (webhook ou frontend)
4. ⬜ Configurar CORS para produção
5. ⬜ Adicionar logs de envio
6. ⬜ Implementar retry em caso de falha

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do servidor Node.js
2. Teste a API Evolution diretamente (Postman/Insomnia)
3. Verifique a documentação da Evolution API
4. Confirme se todas as variáveis de ambiente estão corretas

