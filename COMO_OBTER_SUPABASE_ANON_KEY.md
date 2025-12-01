# 🔑 Como Obter a Supabase Anon Key

## ⚠️ Problema

O erro `401 - Invalid webhook secret` ocorre porque a `SUPABASE_ANON_KEY` não está configurada no `backend/.env`.

## 📝 Solução

### 1. Acesse o Painel do Supabase

A URL da Edge Function indica que o projeto é: `onjzrwghvrbbtcxfavlm`

Acesse:
```
https://supabase.com/dashboard/project/onjzrwghvrbbtcxfavlm/settings/api
```

### 2. Copie a Anon Key

No painel do Supabase:
1. Vá em **Settings** → **API**
2. Procure por **Project API keys**
3. Copie a chave **`anon` `public`** (não a `service_role`)

### 3. Adicione no `backend/.env`

Adicione esta linha no arquivo `backend/.env`:

```env
# Supabase Anon Key (para chamar Edge Functions)
SUPABASE_ANON_KEY=sua_anon_key_aqui
```

**Exemplo:**
```env
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uanpyd2dodnJyYnRjeGZhdmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMTI5MjAsImV4cCI6MjA3OTc4ODkyMH0.sua_chave_aqui
```

### 4. Reinicie o Servidor

Após adicionar a chave, reinicie o servidor backend:

```bash
cd backend
# Pare o servidor (Ctrl+C)
# Inicie novamente
npm start
```

## 🔍 Como Identificar a Chave Correta

A anon key geralmente:
- Começa com `eyJ` (é um JWT)
- Está marcada como `anon` ou `public`
- **NÃO** é a `service_role` (essa é secreta e não deve ser usada no frontend/backend público)

## ⚠️ Importante

- **Anon Key**: Pública, segura para uso no frontend/backend
- **Service Role Key**: Secreta, nunca exponha publicamente
- **Webhook Secret**: Apenas para validar webhooks recebidos

## 🧪 Teste

Após configurar, teste novamente. O erro 401 deve desaparecer!

