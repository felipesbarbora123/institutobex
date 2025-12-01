# 🧪 Guia Completo: Testar Sistema Localmente com AbacatePay

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter:

- ✅ Node.js instalado (versão 14 ou superior)
- ✅ PostgreSQL rodando localmente
- ✅ Banco de dados `institutobex` criado
- ✅ Credenciais do AbacatePay (API Key)
- ✅ ngrok instalado (para testar webhooks) - [Download](https://ngrok.com)

---

## 🔧 Passo 1: Configurar Variáveis de Ambiente

### 1.1. Editar arquivo `.env` do backend

Abra o arquivo `backend/.env` e configure:

```env
# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=institutobex
DB_USER=postgres
DB_PASSWORD=admin
DB_SSL=false

# JWT Secret (gere uma chave segura)
JWT_SECRET=seu_jwt_secret_super_seguro_aqui

# URLs
API_URL=http://localhost:3001
APP_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# AbacatePay - ⚠️ IMPORTANTE: Preencha com suas credenciais reais!
ABACATEPAY_API_KEY=sua_chave_api_abacatepay_aqui
ABACATEPAY_API_URL=https://api.abacatepay.com.br
ABACATEPAY_WEBHOOK_SECRET=webh_prod_3yyWjuy3rDRgKjfLN2YTEUTP

# Evolution API WhatsApp (já configurado)
EVOLUTION_API_URL=https://mensadodo.dunis.com.br
EVOLUTION_API_KEY=3B2F25CF7B2F-41F0-8EA1-2F021B2591FC
EVOLUTION_INSTANCE_NAME=Dunis
EVOLUTION_NUMBER=5511948248421

# Porta
PORT=3001
NODE_ENV=development
```

### 1.2. Obter Chave da API do AbacatePay

1. Acesse: https://abacatepay.com.br
2. Faça login no painel
3. Vá em **Configurações** → **API Keys**
4. Copie sua **API Key de produção** ou crie uma de teste
5. Cole no arquivo `.env` em `ABACATEPAY_API_KEY`

---

## 🗄️ Passo 2: Verificar Banco de Dados

### 2.1. Verificar se o banco está rodando

```bash
# Windows (PowerShell)
psql -U postgres -d institutobex -c "SELECT 1;"

# Se não funcionar, verifique se o PostgreSQL está rodando
```

### 2.2. Verificar se as tabelas existem

```sql
-- Conecte ao banco
psql -U postgres -d institutobex

-- Verifique as tabelas principais
\dt

-- Deve mostrar: courses, course_purchases, course_enrollments, profiles, etc.
```

Se as tabelas não existirem, execute o script de migração:
```bash
cd backend
node scripts/run-migrations.js
```

---

## 🚀 Passo 3: Iniciar o Backend

### 3.1. Instalar dependências (se necessário)

```bash
cd backend
npm install
```

### 3.2. Iniciar o servidor backend

```bash
cd backend
npm start
```

Você deve ver:
```
🚀 Servidor rodando na porta 3001
📡 Ambiente: development
✅ Conectado ao PostgreSQL
```

### 3.3. Testar se o backend está funcionando

Abra no navegador ou use curl:
```
http://localhost:3001/health
```

Deve retornar:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-01-XX..."
}
```

---

## 🌐 Passo 4: Iniciar o Frontend

### 4.1. Abrir novo terminal

Mantenha o backend rodando e abra um **novo terminal**.

### 4.2. Iniciar servidor frontend

```bash
# Na raiz do projeto
node server.js
```

Você deve ver:
```
🚀 Servidor iniciado com sucesso!
📡 URL: http://localhost:3000
```

### 4.3. Verificar se o frontend está funcionando

Abra no navegador:
```
http://localhost:3000
```

Você deve ver o site carregando. Abra o **Console do Desenvolvedor (F12)** e procure:
```
✅ Substituição completa do Supabase carregada!
📡 Todas as chamadas serão redirecionadas para: http://localhost:3001
```

---

## 🔗 Passo 5: Configurar Webhook (Opcional - para testes completos)

### 5.1. Instalar ngrok

**Windows:**
- Baixe de: https://ngrok.com/download
- Ou use: `choco install ngrok`

**Linux/Mac:**
```bash
# Via Homebrew (Mac)
brew install ngrok

# Ou baixe de: https://ngrok.com/download
```

### 5.2. Expor o backend localmente

Em um **novo terminal**:

```bash
ngrok http 3001
```

Você verá algo como:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3001
```

**Copie a URL HTTPS** (ex: `https://abc123.ngrok.io`)

### 5.3. Configurar webhook no AbacatePay

1. Acesse: https://abacatepay.com.br
2. Vá em **Configurações** → **Webhooks**
3. Configure:
   - **URL:** `https://abc123.ngrok.io/api/webhooks/abacatepay` (use sua URL do ngrok)
   - **Secret:** `webh_prod_3yyWjuy3rDRgKjfLN2YTEUTP`
   - **Eventos:** Pagamentos aprovados/confirmados
4. Salve

**⚠️ IMPORTANTE:** A URL do ngrok muda a cada vez que você reinicia. Se reiniciar o ngrok, atualize a URL no painel do AbacatePay.

---

## 💳 Passo 6: Testar Fluxo de Pagamento

### 6.1. Acessar página de checkout

1. Abra: `http://localhost:3000`
2. Navegue até um curso
3. Clique em **"Comprar"** ou **"Finalizar Compra"**
4. Você será redirecionado para a página de checkout

### 6.2. Preencher dados do checkout

1. **Nome completo:** Seu nome
2. **CPF:** Use um CPF válido (ou de teste)
3. **Celular:** (XX) 9XXXX-XXXX
4. **E-mail:** Seu email
5. **Senha:** (se não estiver logado)

### 6.3. Testar Pagamento PIX

1. Selecione **"PIX"** como método de pagamento
2. Clique em **"Finalizar com PIX"**
3. **O que deve acontecer:**
   - ✅ QR Code deve aparecer
   - ✅ Código PIX (copia e cola) deve aparecer
   - ✅ No console do navegador, deve ver: `🔄 Chamando backend: create-payment-pix`
   - ✅ Na aba Network, deve ver requisição para `localhost:3001/api/purchases/payment/pix`

4. **Verificar no backend:**
   - No terminal do backend, deve aparecer logs da requisição
   - Deve mostrar a chamada ao AbacatePay

5. **Pagar o PIX:**
   - Use o app do seu banco para escanear o QR Code
   - Ou copie o código PIX e pague
   - **Use um valor mínimo** para teste!

6. **Aguardar confirmação:**
   - Se o webhook estiver configurado, a confirmação será automática
   - Caso contrário, o sistema faz polling a cada 3 segundos
   - Quando confirmado, você será redirecionado para o curso

### 6.4. Testar Pagamento com Cartão

1. Selecione **"Cartão"** como método de pagamento
2. Clique em **"Finalizar com CARTÃO"**
3. **O que deve acontecer:**
   - ✅ Você será redirecionado para o AbacatePay
   - ✅ No console, deve ver: `🔄 Chamando backend: create-payment-card`
   - ✅ Na aba Network, deve ver requisição para `localhost:3001/api/purchases/payment/card`

4. **No AbacatePay:**
   - Preencha os dados do cartão (use cartão de teste se disponível)
   - Finalize o pagamento
   - Você será redirecionado de volta para o site

5. **Verificar acesso:**
   - Após retornar, o sistema deve verificar o pagamento
   - Se aprovado, você terá acesso ao curso

---

## 🔍 Passo 7: Verificar se Está Funcionando

### 7.1. Verificar Console do Navegador (F12)

Procure por:
- ✅ `✅ Substituição completa do Supabase carregada!`
- ✅ `🔄 Chamando backend: create-payment-pix` (ou create-payment-card)
- ❌ **NÃO deve ver** erros de conexão com Supabase
- ❌ **NÃO deve ver** requisições para `supabase.co`

### 7.2. Verificar Aba Network (F12 → Network)

1. Filtre por **XHR** ou **Fetch**
2. Ao gerar QR Code, deve ver:
   - ✅ `POST http://localhost:3001/api/purchases` (criar compra)
   - ✅ `POST http://localhost:3001/api/purchases/payment/pix` (gerar PIX)
   - ❌ **NÃO deve ver** requisições para `supabase.co`

### 7.3. Verificar Logs do Backend

No terminal do backend, você deve ver:
```
Executada query ...
🔄 Chamando AbacatePay...
✅ QR Code gerado com sucesso
```

### 7.4. Verificar Banco de Dados

```sql
-- Ver compras criadas
SELECT * FROM course_purchases ORDER BY created_at DESC LIMIT 5;

-- Ver matrículas criadas
SELECT * FROM course_enrollments ORDER BY created_at DESC LIMIT 5;

-- Ver logs de webhooks
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 5;
```

---

## 🐛 Troubleshooting (Solução de Problemas)

### Problema 1: "Erro ao criar pagamento PIX"

**Possíveis causas:**
- ❌ Chave da API do AbacatePay não configurada ou inválida
- ❌ Backend não está rodando
- ❌ Erro de conexão com AbacatePay

**Solução:**
1. Verifique se `ABACATEPAY_API_KEY` está no `.env`
2. Verifique se a chave está correta no painel do AbacatePay
3. Verifique os logs do backend para ver o erro específico

### Problema 2: "QR Code não aparece"

**Possíveis causas:**
- ❌ Erro na chamada ao backend
- ❌ Erro na chamada ao AbacatePay
- ❌ Frontend não está interceptando corretamente

**Solução:**
1. Abra o Console (F12) e veja os erros
2. Verifique a aba Network para ver qual requisição falhou
3. Verifique os logs do backend

### Problema 3: "Pagamento não confirma automaticamente"

**Possíveis causas:**
- ❌ Webhook não configurado
- ❌ ngrok não está rodando
- ❌ URL do webhook incorreta no AbacatePay

**Solução:**
1. Verifique se o ngrok está rodando
2. Verifique se a URL do webhook está correta no AbacatePay
3. Verifique os logs do backend para ver se o webhook está chegando
4. O sistema faz polling a cada 3 segundos como fallback

### Problema 4: "Erro de CORS"

**Possíveis causas:**
- ❌ CORS não configurado corretamente no backend

**Solução:**
1. Verifique `CORS_ORIGIN` no `.env` do backend
2. Deve estar: `CORS_ORIGIN=http://localhost:3000`
3. Reinicie o backend

### Problema 5: "Erro ao conectar ao banco"

**Possíveis causas:**
- ❌ PostgreSQL não está rodando
- ❌ Credenciais incorretas no `.env`

**Solução:**
1. Verifique se o PostgreSQL está rodando
2. Verifique as credenciais no `.env`
3. Teste a conexão: `psql -U postgres -d institutobex`

---

## ✅ Checklist Final

Antes de testar, verifique:

- [ ] Backend rodando na porta 3001
- [ ] Frontend rodando na porta 3000
- [ ] Banco de dados conectado
- [ ] `ABACATEPAY_API_KEY` configurada no `.env`
- [ ] Console do navegador mostra: "✅ Substituição completa do Supabase carregada!"
- [ ] ngrok rodando (se quiser testar webhooks)
- [ ] Webhook configurado no AbacatePay (se quiser testar confirmação automática)

---

## 📝 Notas Importantes

1. **Use valores mínimos** para testes de pagamento
2. **O ngrok muda a URL** a cada reinício - atualize no AbacatePay
3. **Webhooks são opcionais** - o sistema faz polling como fallback
4. **Em produção**, use HTTPS e uma URL fixa para webhooks
5. **Monitore os logs** do backend para debug

---

## 🎯 Próximos Passos

Após testar localmente:

1. ✅ Testar todos os fluxos de pagamento
2. ✅ Verificar se as matrículas são criadas corretamente
3. ✅ Testar notificações WhatsApp
4. ✅ Preparar para produção (HTTPS, URL fixa, etc.)

---

**Boa sorte com os testes! 🚀**

