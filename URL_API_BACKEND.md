# 🔗 URL da API do Backend

## ✅ Descobrir URL da API

### **Passo 1: Descobrir IP do Servidor**

1. **Containers** → Qualquer container → **Console**
2. **Executar**:
   ```bash
   ip route | grep default | awk '{print $3}'
   ```
3. **Anotar o IP** (ex: `192.168.1.100`)

---

### **Passo 2: Verificar Porta Mapeada**

1. **Containers** → `institutobex-backend` → **Ports**
2. **Verificar**:
   - Container: `3001`
   - Host: `XXXX` (anote este número)

**Se não estiver mapeada**, você precisa mapear:
- **Container**: `3001`
- **Host**: `3001` (ou outra porta disponível)

---

### **Passo 3: Montar URL da API**

**URL da API**: `http://IP_DO_SERVIDOR:PORTA_HOST`

**Exemplo**: `http://192.168.1.100:3001`

---

## ✅ Testar API no Navegador

### **1. Health Check (Teste Básico)**

Abra no navegador:
```
http://IP_DO_SERVIDOR:PORTA/health
```

**Exemplo**: `http://192.168.1.100:3001/health`

**Deve retornar**:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-12-02T..."
}
```

---

### **2. Listar Cursos**

```
http://IP_DO_SERVIDOR:PORTA/api/courses
```

**Exemplo**: `http://192.168.1.100:3001/api/courses`

---

### **3. Verificar Autenticação**

```
http://IP_DO_SERVIDOR:PORTA/api/auth/me
```

**Exemplo**: `http://192.168.1.100:3001/api/auth/me`

---

## 📋 Rotas Principais da API

- **Health**: `/health`
- **Autenticação**: `/api/auth/*`
- **Cursos**: `/api/courses/*`
- **Compras**: `/api/purchases/*`
- **WhatsApp**: `/api/whatsapp/*`
- **Aulas**: `/api/lessons/*`
- **Matrículas**: `/api/enrollments/*`
- **Progresso**: `/api/progress/*`
- **Cupons**: `/api/coupons/*`
- **Webhooks**: `/api/webhooks/*`
- **Materiais**: `/api/materials/*`

---

## ✅ Configurar Frontend

### **Opção 1: Variável de Ambiente**

No arquivo `.env` ou `.env.production` do frontend:

```env
VITE_API_URL=http://IP_DO_SERVIDOR:PORTA
# ou
REACT_APP_API_URL=http://IP_DO_SERVIDOR:PORTA
```

**Exemplo**: `VITE_API_URL=http://192.168.1.100:3001`

---

### **Opção 2: Configurar no Código**

Se o frontend usa Supabase, substitua a URL:

**Antes**:
```javascript
const supabaseUrl = 'https://qxgzazewwutbikmmpkms.supabase.co'
```

**Depois**:
```javascript
const apiUrl = 'http://192.168.1.100:3001'
```

---

## ✅ Configurar CORS no Backend

1. **Containers** → `institutobex-backend` → **Environment**
2. **Adicionar/Editar**:
   - **Name**: `CORS_ORIGIN`
   - **Value**: `http://IP_DO_SERVIDOR:PORTA_FRONTEND` (ex: `http://192.168.1.100:3000`)

---

## 📋 Exemplo Completo

**Backend:**
- IP: `192.168.1.100`
- Porta: `3001`
- URL: `http://192.168.1.100:3001`

**Frontend:**
- IP: `192.168.1.100`
- Porta: `3000`
- URL: `http://192.168.1.100:3000`

**Configuração:**

**Backend (.env):**
```env
API_URL=http://192.168.1.100:3001
APP_URL=http://192.168.1.100:3000
CORS_ORIGIN=http://192.168.1.100:3000
```

**Frontend (.env):**
```env
VITE_API_URL=http://192.168.1.100:3001
```

---

## ✅ Próximos Passos

1. ✅ Descobrir IP do servidor
2. ✅ Verificar porta mapeada
3. ✅ Testar `/health` no navegador
4. ✅ Configurar `API_URL` no frontend
5. ✅ Configurar `CORS_ORIGIN` no backend
6. ✅ Testar requisições do frontend

---

## 🔗 Referências

- `ACESSAR_APIS_E_CONFIGURAR_FRONTEND.md` - Guia completo
- `COMO_DESCOBRIR_IP_SERVIDOR_PORTAINER.md` - Descobrir IP

---

## ✅ Resumo

**URL da API**: `http://IP_DO_SERVIDOR:PORTA`

**Teste**: `http://IP_DO_SERVIDOR:PORTA/health`

**Frontend**: Configure `VITE_API_URL` ou `REACT_APP_API_URL`

**Pronto!** Use essa URL no frontend! 🚀






