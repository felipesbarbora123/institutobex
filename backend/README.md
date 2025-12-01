# Backend API - Instituto Bex

Backend Node.js/Express para substituir o Supabase, usando PostgreSQL diretamente.

## 📋 Estrutura

```
backend/
├── config/
│   └── database.js          # Configuração PostgreSQL
├── middleware/
│   └── auth.js              # Autenticação JWT
├── routes/
│   ├── auth.js              # Rotas de autenticação
│   ├── courses.js           # Rotas de cursos
│   ├── purchases.js         # Rotas de compras/pagamentos
│   └── whatsapp.js          # Rotas de WhatsApp
├── scripts/
│   └── migrate.js           # Script de migração do banco
├── server.js                # Servidor Express
├── package.json
└── .env.example             # Exemplo de variáveis de ambiente
```

## 🚀 Instalação

1. **Instalar dependências:**
```bash
cd backend
npm install
```

2. **Configurar variáveis de ambiente:**
```bash
cp .env.example .env
# Edite o .env com suas configurações
```

3. **Configurar banco de dados:**
   - Crie o banco PostgreSQL
   - Execute o script de backup que você tem
   - Ou use o script de migração (após adaptar)

4. **Iniciar servidor:**
```bash
npm start
# ou para desenvolvimento
npm run dev
```

## 🔧 Configuração

### Variáveis de Ambiente

Veja `.env.example` para todas as variáveis necessárias.

Principais:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - PostgreSQL
- `JWT_SECRET` - Chave secreta para JWT (GERE UMA SEGURA!)
- `EVOLUTION_API_URL`, `EVOLUTION_API_KEY` - WhatsApp
- `ABACATEPAY_API_KEY` - Pagamentos

## 📡 Endpoints

### Autenticação
- `POST /api/auth/signup` - Registrar usuário
- `POST /api/auth/signin` - Login
- `GET /api/auth/user` - Obter usuário atual
- `POST /api/auth/signout` - Logout

### Cursos
- `GET /api/courses` - Listar cursos
- `GET /api/courses/:id` - Obter curso
- `POST /api/courses` - Criar curso (admin)
- `PUT /api/courses/:id` - Atualizar curso (admin)
- `DELETE /api/courses/:id` - Deletar curso (admin)

### Compras
- `POST /api/purchases` - Criar compra
- `POST /api/purchases/payment/pix` - Criar pagamento PIX
- `POST /api/purchases/payment/card` - Criar pagamento Cartão
- `GET /api/purchases/payment/status/:billingId` - Verificar status
- `POST /api/purchases/confirm` - Confirmar compra

### WhatsApp
- `POST /api/whatsapp/send` - Enviar notificação

## 🔐 Autenticação

O backend usa JWT (JSON Web Tokens). Após login, inclua o token no header:

```
Authorization: Bearer <token>
```

## 📊 Banco de Dados

O backend espera as mesmas tabelas do Supabase:
- `auth.users` - Usuários
- `profiles` - Perfis
- `courses` - Cursos
- `course_enrollments` - Matrículas
- `course_purchases` - Compras
- `user_roles` - Roles
- `webhook_logs` - Logs
- `whatsapp_logs` - Logs WhatsApp

## 🔄 Migração do Supabase

1. Execute o backup do banco no seu PostgreSQL
2. Adapte o schema se necessário (veja `scripts/migrate.js`)
3. Configure as variáveis de ambiente
4. Inicie o servidor
5. Atualize o frontend para usar a nova API

## ⚠️ Importante

- Gere um `JWT_SECRET` seguro em produção
- Configure CORS corretamente
- Use HTTPS em produção
- Configure rate limiting adequado
- Faça backup regular do banco

