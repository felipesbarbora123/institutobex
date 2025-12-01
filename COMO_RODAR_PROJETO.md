# 🚀 Como Rodar o Projeto Completo

## ✅ Status Atual

- ✅ **Backend**: Rodando na porta 3001
- ✅ **Frontend**: Rodando na porta 3000
- ✅ **Banco de Dados**: PostgreSQL configurado e populado

---

## 🖥️ Servidores

### Backend (API)
- **Porta**: 3001
- **URL**: http://localhost:3001
- **Status**: ✅ Rodando
- **Comando**: `cd backend && npm start`

### Frontend (Site)
- **Porta**: 3000
- **URL**: http://localhost:3000
- **Status**: ✅ Rodando
- **Comando**: `node server.js` (na raiz do projeto)

---

## 🌐 Acessar o Site

Abra no navegador:
```
http://localhost:3000
```

---

## ⚠️ IMPORTANTE: Adaptar Frontend

O frontend atual ainda está configurado para usar o **Supabase**. Você precisa:

### Opção 1: Adaptar Código Fonte (se tiver)

Se você tem o código fonte React/Vite:

1. Atualizar configuração da API para apontar para o novo backend
2. Substituir cliente Supabase por chamadas HTTP para o backend
3. Recompilar o frontend

### Opção 2: Criar Proxy (Temporário)

Criar um proxy no `server.js` que redirecione chamadas do Supabase para o novo backend.

### Opção 3: Manter Supabase Temporariamente

Se quiser testar o frontend primeiro, pode manter o Supabase rodando enquanto adapta.

---

## 🔧 Verificar se Está Funcionando

### Backend
```bash
curl http://localhost:3001/health
```

Deve retornar:
```json
{
  "status": "ok",
  "database": "connected"
}
```

### Frontend
Abra no navegador: http://localhost:3000

---

## 📋 Checklist

- [x] Backend rodando (porta 3001)
- [x] Frontend rodando (porta 3000)
- [x] Banco de dados configurado
- [x] Dados importados
- [ ] Frontend adaptado para usar novo backend
- [ ] Testar login/registro
- [ ] Testar listagem de cursos
- [ ] Testar compras/pagamentos

---

## 🆘 Problemas Comuns

### Frontend não carrega
- Verifique se o servidor está rodando: `node server.js`
- Verifique a porta 3000: http://localhost:3000

### Erros de conexão no console
- O frontend ainda está tentando conectar ao Supabase
- Precisa adaptar o código para usar o novo backend

### Backend não responde
- Verifique se está rodando: `cd backend && npm start`
- Verifique logs no terminal

---

**Acesse: http://localhost:3000 🚀**

