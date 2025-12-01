# 🔄 Guia de Migração: Supabase → Backend Interno

Este guia mostra como migrar do Supabase para um backend interno com PostgreSQL.

---

## 📋 Pré-requisitos

- [ ] Node.js 18+ instalado
- [ ] PostgreSQL instalado e rodando
- [ ] Script de backup do banco do Supabase
- [ ] Acesso ao código fonte do frontend (ou build compilado)

---

## 🗄️ Passo 1: Configurar PostgreSQL

### 1.1. Criar Banco de Dados

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco
CREATE DATABASE institutobex;

# Criar usuário (opcional)
CREATE USER institutobex_user WITH PASSWORD 'sua_senha_segura';
GRANT ALL PRIVILEGES ON DATABASE institutobex TO institutobex_user;

# Sair
\q
```

### 1.2. Restaurar Backup do Banco

```bash
# Se você tem um dump SQL
psql -U postgres -d institutobex < backup_do_supabase.sql

# Ou via pg_restore se for formato custom
pg_restore -U postgres -d institutobex backup_do_supabase.dump
```

### 1.3. Adaptar Schema (se necessário)

O Supabase usa algumas tabelas específicas. Você pode precisar adaptar:

**Tabela `auth.users`:**
- O Supabase usa `auth.users`, mas você pode usar apenas `users`
- Ou criar um schema `auth` e manter a estrutura

**Exemplo de adaptação:**
```sql
-- Se o backup não tiver schema auth, criar:
CREATE SCHEMA IF NOT EXISTS auth;

-- Ou adaptar para usar tabela users diretamente
-- (será necessário ajustar as queries no backend)
```

---

## 🔧 Passo 2: Configurar Backend

### 2.1. Instalar Dependências

```bash
cd backend
npm install
```

### 2.2. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite o `.env`:

```env
# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=institutobex
DB_USER=postgres
DB_PASSWORD=sua_senha

# JWT (GERE UMA CHAVE SEGURA!)
JWT_SECRET=seu_jwt_secret_super_seguro_aqui

# Evolution API
EVOLUTION_API_URL=https://mensadodo.dunis.com.br
EVOLUTION_API_KEY=3B2F25CF7B2F-41F0-8EA1-2F021B2591FC
EVOLUTION_INSTANCE_NAME=Dunis

# AbacatePay
ABACATEPAY_API_KEY=sua_chave
ABACATEPAY_API_URL=https://api.abacatepay.com.br
ABACATEPAY_WEBHOOK_SECRET=seu_secret

# URLs
APP_URL=http://localhost:3000
API_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3000
```

### 2.3. Testar Conexão

```bash
npm start
```

Verifique se conecta ao banco:
- Acesse: `http://localhost:3001/health`
- Deve retornar: `{ "status": "ok", "database": "connected" }`

---

## 🔄 Passo 3: Adaptar Frontend

### 3.1. Se você tem o código fonte React

Crie um arquivo de configuração da API:

```javascript
// src/config/api.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const apiClient = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro na requisição');
    }

    return response.json();
  },

  // Métodos helper
  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },
};
```

### 3.2. Substituir Cliente Supabase

**Antes (Supabase):**
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// Buscar cursos
const { data } = await supabase.from('courses').select('*');
```

**Depois (API Backend):**
```javascript
import { apiClient } from './config/api';

// Login
const { user, token } = await apiClient.post('/api/auth/signin', {
  email,
  password,
});
localStorage.setItem('token', token);

// Buscar cursos
const { courses } = await apiClient.get('/api/courses');
```

### 3.3. Adaptar Autenticação

**Contexto de Auth:**
```javascript
// src/contexts/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../config/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const { user } = await apiClient.get('/api/auth/user');
      setUser(user);
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    const { user, token } = await apiClient.post('/api/auth/signin', {
      email,
      password,
    });
    localStorage.setItem('token', token);
    setUser(user);
    return { user, token };
  };

  const signUp = async (email, password, firstName, lastName) => {
    const { user, token } = await apiClient.post('/api/auth/signup', {
      email,
      password,
      firstName,
      lastName,
    });
    localStorage.setItem('token', token);
    setUser(user);
    return { user, token };
  };

  const signOut = async () => {
    await apiClient.post('/api/auth/signout');
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### 3.4. Se você NÃO tem o código fonte

Se o frontend está compilado, você precisará:

1. **Criar um proxy no servidor frontend** que redirecione chamadas do Supabase para o novo backend
2. **Ou recompilar o frontend** com as novas configurações

**Opção: Proxy no server.js (frontend):**
```javascript
// Adicionar no server.js existente
if (pathname.startsWith('/rest/v1/') || pathname.startsWith('/auth/v1/')) {
  // Proxy para o novo backend
  const proxyUrl = `http://localhost:3001${pathname.replace('/rest/v1', '/api')}`;
  // ... fazer proxy da requisição
}
```

---

## 🔐 Passo 4: Migrar Autenticação

### 4.1. Adaptar Tabela de Usuários

Se o backup do Supabase tiver a tabela `auth.users`, você pode:

**Opção A: Manter estrutura do Supabase**
- Manter schema `auth`
- Manter tabela `auth.users`
- Backend já está preparado para isso

**Opção B: Migrar para estrutura simples**
```sql
-- Criar tabela users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  encrypted_password VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrar dados
INSERT INTO users (id, email, encrypted_password, created_at, updated_at)
SELECT id, email, encrypted_password, created_at, updated_at
FROM auth.users;
```

Se usar Opção B, ajuste o backend para usar `users` ao invés de `auth.users`.

### 4.2. Migrar Senhas

⚠️ **IMPORTANTE**: As senhas do Supabase usam bcrypt, mas podem ter configurações diferentes.

Se as senhas não funcionarem após migrar:
1. Implemente "recuperação de senha" forçada
2. Ou migre as senhas adaptando o hash

---

## 📡 Passo 5: Migrar Edge Functions

As Edge Functions do Supabase foram convertidas em rotas do Express:

| Edge Function | Nova Rota |
|--------------|-----------|
| `create-purchase` | `POST /api/purchases` |
| `create-payment-pix` | `POST /api/purchases/payment/pix` |
| `create-payment-card` | `POST /api/purchases/payment/card` |
| `abacatepay-check-status` | `GET /api/purchases/payment/status/:billingId` |
| `confirm-purchase` | `POST /api/purchases/confirm` |
| `send-whatsapp-notification` | `POST /api/whatsapp/send` |

---

## 🧪 Passo 6: Testes

### 6.1. Testar Backend

```bash
# Health check
curl http://localhost:3001/health

# Testar login
curl -X POST http://localhost:3001/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"senha123"}'
```

### 6.2. Testar Frontend

1. Iniciar backend: `cd backend && npm start`
2. Iniciar frontend: `npm start` (ou servidor estático)
3. Testar:
   - [ ] Login
   - [ ] Registro
   - [ ] Listar cursos
   - [ ] Criar compra
   - [ ] Pagamento PIX
   - [ ] Pagamento Cartão
   - [ ] Confirmação de pagamento
   - [ ] Envio de WhatsApp

---

## 🔧 Passo 7: Ajustes Finais

### 7.1. Webhooks do AbacatePay

Atualize a URL do webhook para apontar para o novo backend:

```
Antes: https://qxgzazewwutbikmmpkms.supabase.co/functions/v1/confirm-purchase
Depois: https://seu-dominio.com/api/purchases/confirm
```

### 7.2. CORS

Configure CORS no backend para permitir requisições do frontend:

```javascript
// backend/server.js
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
```

### 7.3. Rate Limiting

O backend já tem rate limiting configurado. Ajuste se necessário.

---

## 📝 Checklist Final

- [ ] PostgreSQL configurado e rodando
- [ ] Backup do banco restaurado
- [ ] Schema adaptado (se necessário)
- [ ] Backend configurado e rodando
- [ ] Variáveis de ambiente configuradas
- [ ] Frontend adaptado para usar nova API
- [ ] Autenticação funcionando
- [ ] Pagamentos funcionando
- [ ] WhatsApp funcionando
- [ ] Webhooks atualizados
- [ ] Testes realizados
- [ ] Deploy em produção (se aplicável)

---

## 🆘 Problemas Comuns

### Erro de conexão com PostgreSQL

- Verifique se o PostgreSQL está rodando
- Verifique credenciais no `.env`
- Verifique se o banco existe

### Senhas não funcionam

- Verifique se o hash das senhas está correto
- Implemente recuperação de senha
- Ou migre senhas adaptando o hash

### CORS bloqueando requisições

- Configure `CORS_ORIGIN` no `.env`
- Verifique headers no backend

### Token JWT inválido

- Verifique `JWT_SECRET` no `.env`
- Gere um novo secret seguro
- Limpe tokens antigos do localStorage

---

## 📚 Próximos Passos

1. Implementar Realtime (WebSockets) se necessário
2. Implementar Storage (S3 ou local) se necessário
3. Adicionar mais validações
4. Implementar logs mais detalhados
5. Adicionar monitoramento

---

**Boa migração! 🚀**

