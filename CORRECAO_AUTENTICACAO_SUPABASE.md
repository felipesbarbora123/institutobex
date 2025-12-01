# 🔧 Correção: Autenticação com Supabase Edge Functions

## ⚠️ Problema Identificado

O erro `401 - Invalid webhook secret` ocorria porque:
- ❌ O código estava usando o **webhook secret do AbacatePay** como token de autenticação
- ❌ Para chamar **Edge Functions do Supabase**, é necessário usar o **`apikey` (anon key) do Supabase**

## ✅ Solução Implementada

O código foi ajustado para:
1. **Detectar se a URL é do Supabase** (contém `supabase.co`)
2. **Usar `apikey` do Supabase** quando for uma Edge Function do Supabase
3. **Usar Authorization Bearer** quando for API direta do AbacatePay

## 📝 Configuração Necessária

### Opção 1: Usar Supabase Anon Key (Recomendado)

Adicione no `backend/.env`:

```env
# Supabase Anon Key (para chamar Edge Functions)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4Z3phemV3d3V0YmlrbW1wa21zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzczMzQsImV4cCI6MjA3ODQ1MzMzNH0.xrFvKmMHGPAu82dO-MwGDNWC8mbVE-GI_DkgEEdf4Kc

# URL e chave do AbacatePay (via Supabase Edge Function)
ABACATEPAY_API_URL=https://onjzrwghvrbbtcxfavlm.supabase.co/functions/v1/webhook-abacatepay
ABACATEPAY_API_KEY=webh_prod_3yyWjuy3rDRgKjfLN2YTEUTP
```

### Opção 2: Usar Fallback Automático

Se não configurar `SUPABASE_ANON_KEY`, o código tentará usar `ABACATEPAY_API_KEY` como fallback (mas isso pode não funcionar).

## 🔍 Como Funciona Agora

1. **Quando a URL contém `supabase.co`**:
   - Usa header `apikey` com a anon key do Supabase
   - Usa header `Authorization: Bearer <anon_key>`
   - Isso permite chamar Edge Functions do Supabase

2. **Quando a URL é da API direta do AbacatePay**:
   - Usa apenas `Authorization: Bearer <api_key>`
   - Usa a API key real do AbacatePay

## 📌 Importante

- **Webhook Secret**: Usado apenas para **VALIDAR** webhooks recebidos do AbacatePay
- **Supabase Anon Key**: Usado para **CHAMAR** Edge Functions do Supabase
- **AbacatePay API Key**: Usado para **CHAMAR** a API direta do AbacatePay

## 🧪 Teste

Após configurar, reinicie o servidor e teste novamente. O erro 401 deve desaparecer!

