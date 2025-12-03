# 🌐 Acessar APIs e Configurar Frontend

## 🎯 Objetivo

Descobrir a URL da API do backend e configurar o frontend para usar essa URL.

---

## ✅ Passo 1: Descobrir URL da API

### **Opção A: Via Portainer (Recomendado)**

1. **Containers** → `institutobex-backend` → **Ports**
2. **Verificar mapeamento de portas**:
   - Container: `3001`
   - Host: `XXXX` (anote este número)
3. **Verificar IP do servidor**:
   - **Containers** → Qualquer container → **Console**
   - Executar: `hostname -I` ou `ip addr show`
   - Ou verificar no painel do seu provedor de hospedagem

**URL da API será**: `http://IP_DO_SERVIDOR:PORTA_HOST`

**Exemplo**: `http://192.168.1.100:3001`

---

### **Opção B: Via Console do Container**

1. **Containers** → `institutobex-backend` → **Console**
2. **Executar**:
   ```bash
   # Ver IP do container
   hostname -I
   
   # Ver variáveis de ambiente
   env | grep API_URL
   env | grep PORT
   ```

---

### **Opção C: Verificar Portas Mapeadas**

1. **Containers** → `institutobex-backend` → **Ports**
2. **Verificar**:
   - Se porta `3001` está mapeada para o host
   - Qual porta do host está sendo usada

**Se não estiver mapeada**, você precisa mapear:
- **Container**: `3001`
- **Host**: `3001` (ou outra porta disponível)

---

## ✅ Passo 2: Testar API no Navegador

### **Health Check**

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

### **Listar Rotas Disponíveis**

As principais rotas da API são:

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

## ✅ Passo 3: Configurar Variável de Ambiente no Backend

### **No Portainer:**

1. **Containers** → `institutobex-backend` → **Duplicate/Edit**
2. **Environment** → **Add environment variable**:
   - **Name**: `API_URL`
   - **Value**: `http://IP_DO_SERVIDOR:PORTA` (ex: `http://192.168.1.100:3001`)
   - **Name**: `APP_URL`
   - **Value**: `http://IP_DO_SERVIDOR:PORTA_FRONTEND` (ex: `http://192.168.1.100:3000`)

3. **Deploy**

---

## ✅ Passo 4: Atualizar Frontend

### **Opção A: Se Frontend Está em Arquivo de Configuração**

1. **Localizar arquivo de configuração** (geralmente `.env`, `.env.production`, ou arquivo de config)
2. **Atualizar**:
   ```env
   VITE_API_URL=http://IP_DO_SERVIDOR:PORTA
   # ou
   REACT_APP_API_URL=http://IP_DO_SERVIDOR:PORTA
   ```

### **Opção B: Se Frontend Usa Supabase (Código Compilado)**

Se o frontend está compilado e usa Supabase, você precisa:

1. **Verificar onde está a URL da API** no código compilado
2. **Substituir** a URL do Supabase pela URL do seu backend
3. **Ou criar um proxy** no frontend

### **Opção C: Configurar Proxy no Frontend**

Se o frontend está em outro servidor/porta, configure um proxy:

**No `vite.config.js` ou `package.json`**:
```javascript
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://IP_DO_SERVIDOR:PORTA',
        changeOrigin: true
      }
    }
  }
}
```

---

## ✅ Passo 5: Verificar CORS

Se o frontend está em outro domínio/porta, verifique CORS:

1. **Containers** → `institutobex-backend` → **Environment**
2. **Verificar** `CORS_ORIGIN`:
   - Deve incluir a URL do frontend
   - Exemplo: `http://localhost:3000,http://IP_DO_SERVIDOR:3000`

---

## 📋 Exemplo Completo

### **Backend:**
- **IP do Servidor**: `192.168.1.100`
- **Porta Mapeada**: `3001`
- **URL da API**: `http://192.168.1.100:3001`

### **Frontend:**
- **IP do Servidor**: `192.168.1.100`
- **Porta**: `3000`
- **URL do Frontend**: `http://192.168.1.100:3000`

### **Configuração:**

**Backend (.env ou Environment):**
```env
API_URL=http://192.168.1.100:3001
APP_URL=http://192.168.1.100:3000
CORS_ORIGIN=http://192.168.1.100:3000
```

**Frontend (.env ou config):**
```env
VITE_API_URL=http://192.168.1.100:3001
```

---

## 🔍 Testar APIs no Navegador

### **1. Health Check:**
```
http://192.168.1.100:3001/health
```

### **2. Listar Cursos:**
```
http://192.168.1.100:3001/api/courses
```

### **3. Verificar Autenticação:**
```
http://192.168.1.100:3001/api/auth/me
```

---

## 🐛 Problemas Comuns

### **Problema 1: CORS Error**

**Solução**: Adicionar URL do frontend em `CORS_ORIGIN` no backend.

### **Problema 2: Connection Refused**

**Solução**: Verificar se porta está mapeada e firewall está aberto.

### **Problema 3: 404 Not Found**

**Solução**: Verificar se rota está correta (deve começar com `/api/`).

---

## 📋 Checklist

- [ ] Descobrir IP do servidor
- [ ] Verificar porta mapeada no Portainer
- [ ] Testar `/health` no navegador
- [ ] Configurar `API_URL` no backend
- [ ] Configurar `API_URL` no frontend
- [ ] Verificar CORS
- [ ] Testar requisições do frontend

---

## 🔗 Referências

- `COMO_DESCOBRIR_IP_SERVIDOR_PORTAINER.md` - Descobrir IP
- `CONFIGURACAO_PORTAINER_PASSO_A_PASSO.md` - Configuração Portainer

---

## ✅ Resumo

**Para acessar as APIs:**

1. ✅ Descobrir IP do servidor e porta mapeada
2. ✅ URL da API: `http://IP:PORTA`
3. ✅ Testar: `http://IP:PORTA/health`
4. ✅ Configurar `API_URL` no frontend
5. ✅ Verificar CORS se necessário

**Pronto!** Siga os passos para configurar o frontend! 🚀

