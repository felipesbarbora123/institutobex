# 📁 Estrutura Recomendada para Supabase no Código

Este documento mostra como organizar o código do Supabase após configurar o CLI.

---

## 📂 Estrutura de Pastas

Após executar `supabase init` e configurar o projeto, você terá:

```
institutobex/
├── supabase/
│   ├── config.toml                    # Configuração do projeto
│   ├── functions/                     # Edge Functions
│   │   ├── send-whatsapp-notification/
│   │   │   └── index.ts              # Função de envio WhatsApp
│   │   └── confirm-purchase/
│   │       └── index.ts              # Função de confirmação de pagamento
│   ├── migrations/                    # Migrações do banco de dados
│   │   ├── 20240101000000_initial.sql
│   │   └── 20240102000000_add_whatsapp_logs.sql
│   └── seed.sql                      # Dados iniciais (opcional)
├── .env.local                        # Variáveis locais (não commitado)
├── .gitignore
└── ...
```

---

## 🔧 Edge Functions

### 1. send-whatsapp-notification

**Localização:** `supabase/functions/send-whatsapp-notification/index.ts`

**Código:** Use o arquivo `supabase-edge-function-example.ts` como base.

**Deploy:**
```bash
supabase functions deploy send-whatsapp-notification
```

### 2. confirm-purchase

**Localização:** `supabase/functions/confirm-purchase/index.ts`

**Código:** 
- Se você já tem essa função no dashboard, baixe ela:
  ```bash
  supabase functions download confirm-purchase
  ```
- Ou crie manualmente e adicione o código do arquivo `codigo-para-confirm-purchase.ts` na função existente.

**Deploy:**
```bash
supabase functions deploy confirm-purchase
```

---

## 🗄️ Migrações

### Criar Nova Migração

```bash
supabase migration new nome_da_migracao
```

### Exemplo de Migração

**Arquivo:** `supabase/migrations/20240101000000_add_whatsapp_logs.sql`

```sql
-- Criar tabela de logs do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  message TEXT,
  status TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_phone ON whatsapp_logs(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created_at ON whatsapp_logs(created_at);
```

### Aplicar Migrações

```bash
# Aplicar no projeto remoto
supabase db push

# Ver status
supabase migration list
```

---

## 🔐 Variáveis de Ambiente (Secrets)

### Configurar Secrets

```bash
# Definir secrets no Supabase
supabase secrets set EVOLUTION_API_URL=https://mensadodo.dunis.com.br
supabase secrets set EVOLUTION_API_KEY=3B2F25CF7B2F-41F0-8EA1-2F021B2591FC
supabase secrets set EVOLUTION_INSTANCE_NAME=Dunis
supabase secrets set APP_URL=https://institutobex.com.br

# Listar secrets
supabase secrets list
```

### Arquivo Local (.env.local)

Para desenvolvimento local, crie `.env.local` (não commitado):

```env
EVOLUTION_API_URL=https://mensadodo.dunis.com.br
EVOLUTION_API_KEY=3B2F25CF7B2F-41F0-8EA1-2F021B2591FC
EVOLUTION_INSTANCE_NAME=Dunis
APP_URL=https://institutobex.com.br
```

---

## 🚀 Workflow de Desenvolvimento

### 1. Fazer Alterações

```bash
# Editar Edge Function
code supabase/functions/send-whatsapp-notification/index.ts
```

### 2. Testar Localmente (Opcional)

```bash
# Iniciar ambiente local
supabase start

# Testar função
supabase functions serve send-whatsapp-notification --env-file .env.local
```

### 3. Fazer Deploy

```bash
# Deploy de uma função
supabase functions deploy send-whatsapp-notification

# Deploy de todas as funções
supabase functions deploy
```

### 4. Verificar Logs

```bash
# Ver logs em tempo real
supabase functions logs send-whatsapp-notification --follow

# Ver últimas 100 linhas
supabase functions logs send-whatsapp-notification --limit 100
```

---

## 📋 Comandos Úteis

### Edge Functions

```bash
# Listar todas as funções
supabase functions list

# Ver detalhes de uma função
supabase functions get send-whatsapp-notification

# Deletar função
supabase functions delete send-whatsapp-notification

# Ver logs
supabase functions logs send-whatsapp-notification
```

### Banco de Dados

```bash
# Ver diferenças entre local e remoto
supabase db diff

# Aplicar migrações
supabase db push

# Ver status das migrações
supabase migration list

# Gerar tipos TypeScript
supabase gen types typescript --linked > types/database.types.ts
```

### Projeto

```bash
# Ver status
supabase status

# Ver informações do projeto
supabase projects list

# Desvincular projeto
supabase unlink
```

---

## ✅ Checklist de Setup

- [ ] Supabase CLI instalado
- [ ] Login realizado (`supabase login`)
- [ ] Projeto vinculado (`supabase link`)
- [ ] Estrutura inicializada (`supabase init`)
- [ ] Edge Functions criadas/baixadas
- [ ] Secrets configurados
- [ ] Migrações aplicadas (se houver)
- [ ] Teste de deploy realizado

---

## 🔄 Migrar do Dashboard para Código

Se você já tem Edge Functions criadas pelo dashboard:

1. **Baixar funções existentes:**
   ```bash
   supabase functions download send-whatsapp-notification
   supabase functions download confirm-purchase
   ```

2. **Ou criar manualmente:**
   - Copie o código do dashboard
   - Crie a estrutura de pastas
   - Cole o código
   - Faça deploy

---

## 📚 Próximos Passos

1. Leia o guia completo: `GUIA_SUPABASE_CLI.md`
2. Configure o projeto: Execute `setup-supabase-cli.bat` ou `setup-supabase-cli.sh`
3. Comece a trabalhar com o código!

---

**Agora você tem controle total do Supabase pelo código fonte! 🎉**

