# 🔄 Guia Completo de Migração do Supabase

Este guia mostra como extrair todas as configurações, tabelas, dados e Edge Functions do projeto Supabase atual e aplicar em um novo projeto.

---

## 📋 Pré-requisitos

- [ ] Node.js instalado
- [ ] Supabase CLI instalado (`npm install -g supabase`)
- [ ] Acesso ao projeto Supabase atual
- [ ] Novo projeto Supabase criado

---

## 🚀 Passo 1: Executar Script de Extração

Execute o script que extrai informações do projeto atual:

```bash
node extrair-migrations-supabase.js
```

Este script irá:
- ✅ Criar a pasta `supabase-export/` com a estrutura necessária
- ✅ Gerar scripts SQL para extrair o schema
- ✅ Preparar estrutura para Edge Functions
- ✅ Criar guia de migração detalhado

---

## 📊 Passo 2: Extrair Schema do Banco de Dados

### Opção A: Via Supabase CLI (Recomendado)

```bash
# 1. Vincular ao projeto ATUAL
supabase login
supabase link --project-ref qxgzazewwutbikmmpkms

# 2. Gerar dump do schema (apenas estrutura)
supabase db dump --schema public > supabase-export/backup/schema.sql

# 3. Gerar dump completo (estrutura + dados) - CUIDADO!
supabase db dump > supabase-export/backup/database-completo.sql

# 4. Desvincular
supabase unlink
```

### Opção B: Via Dashboard (Manual)

1. **Acesse o SQL Editor do projeto atual:**
   - URL: https://supabase.com/dashboard/project/qxgzazewwutbikmmpkms/sql

2. **Execute o script `extrair-schema-completo.sql`:**
   - Abra o arquivo `extrair-schema-completo.sql`
   - Execute cada seção separadamente
   - Copie os resultados para arquivos SQL organizados

3. **Organize as migrations:**
   ```
   supabase-export/migrations/
   ├── 20240101000000_create_tables.sql
   ├── 20240101000001_add_primary_keys.sql
   ├── 20240101000002_add_foreign_keys.sql
   ├── 20240101000003_add_indexes.sql
   ├── 20240101000004_add_rls_policies.sql
   └── 20240101000005_enable_rls.sql
   ```

---

## ⚡ Passo 3: Extrair Edge Functions

### Via CLI

```bash
# Vincular ao projeto ATUAL
supabase link --project-ref qxgzazewwutbikmmpkms

# Baixar cada função
cd supabase-export/functions
supabase functions download send-whatsapp-notification
supabase functions download confirm-purchase
supabase functions download create-purchase
supabase functions download create-payment-pix
supabase functions download create-payment-card
supabase functions download abacatepay-check-status
supabase functions download validate-coupon
supabase functions download reconcile-pending-payments

# Voltar para raiz
cd ../..

# Desvincular
supabase unlink
```

### Via Dashboard (Manual)

1. **Acesse Edge Functions:**
   - URL: https://supabase.com/dashboard/project/qxgzazewwutbikmmpkms/edge-functions

2. **Para cada função:**
   - Clique na função
   - Copie o código completo
   - Salve em: `supabase-export/functions/[nome-da-funcao]/index.ts`

---

## 🔐 Passo 4: Extrair Variáveis de Ambiente (Secrets)

1. **Acesse Settings:**
   - URL: https://supabase.com/dashboard/project/qxgzazewwutbikmmpkms/settings/edge-functions

2. **Anote todas as variáveis:**
   - `EVOLUTION_API_URL`
   - `EVOLUTION_API_KEY`
   - `EVOLUTION_INSTANCE_NAME`
   - `APP_URL`
   - `ABACATEPAY_API_KEY`
   - `ABACATEPAY_API_URL`
   - `ABACATEPAY_WEBHOOK_SECRET`
   - Outras variáveis que você tenha configurado

3. **Salve em um arquivo temporário:**
   ```bash
   # Criar arquivo com secrets (NÃO COMMITAR NO GIT!)
   cat > supabase-export/secrets.txt << EOF
   EVOLUTION_API_URL=https://mensadodo.dunis.com.br
   EVOLUTION_API_KEY=3B2F25CF7B2F-41F0-8EA1-2F021B2591FC
   EVOLUTION_INSTANCE_NAME=Dunis
   APP_URL=https://institutobex.com.br
   ABACATEPAY_API_KEY=sua_chave_aqui
   ABACATEPAY_API_URL=https://api.abacatepay.com.br
   ABACATEPAY_WEBHOOK_SECRET=seu_secret_aqui
   EOF
   ```

⚠️ **IMPORTANTE**: Adicione `supabase-export/secrets.txt` ao `.gitignore`!

---

## 🎯 Passo 5: Aplicar no Novo Projeto

### 5.1. Vincular ao Novo Projeto

```bash
# Vincular ao NOVO projeto
supabase link --project-ref [NOVO_PROJECT_ID]

# Quando solicitado:
# - Database Password: (senha do novo projeto - encontre em Settings > Database)
# - Git Branch: main
```

### 5.2. Inicializar Estrutura Local

```bash
# Inicializar (se ainda não tiver)
supabase init

# Isso criará:
# supabase/
# ├── config.toml
# ├── functions/
# └── migrations/
```

### 5.3. Copiar e Aplicar Migrations

```bash
# Copiar migrations
cp supabase-export/migrations/*.sql supabase/migrations/

# OU se você gerou via CLI:
cp supabase-export/backup/schema.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_initial_schema.sql

# Aplicar migrations
supabase db push

# Verificar status
supabase migration list
```

### 5.4. Importar Dados (Opcional)

⚠️ **CUIDADO**: Isso sobrescreverá dados existentes!

```bash
# Opção 1: Via CLI (se tiver dump completo)
psql -h [HOST_DO_NOVO_PROJETO] -U postgres -d postgres -f supabase-export/backup/database-completo.sql

# Opção 2: Via Dashboard
# 1. Acesse SQL Editor do novo projeto
# 2. Abra o arquivo de backup
# 3. Execute o SQL
```

### 5.5. Deploy das Edge Functions

```bash
# Copiar funções para estrutura correta
mkdir -p supabase/functions

# Copiar cada função
cp -r supabase-export/functions/send-whatsapp-notification supabase/functions/
cp -r supabase-export/functions/confirm-purchase supabase/functions/
# ... (repetir para cada função)

# OU copiar todas de uma vez
cp -r supabase-export/functions/* supabase/functions/

# Deploy de todas as funções
supabase functions deploy

# OU deploy individual
supabase functions deploy send-whatsapp-notification
supabase functions deploy confirm-purchase
# ... (repetir para cada função)
```

### 5.6. Configurar Secrets no Novo Projeto

```bash
# Configurar cada secret
supabase secrets set EVOLUTION_API_URL=https://mensadodo.dunis.com.br
supabase secrets set EVOLUTION_API_KEY=3B2F25CF7B2F-41F0-8EA1-2F021B2591FC
supabase secrets set EVOLUTION_INSTANCE_NAME=Dunis
supabase secrets set APP_URL=https://institutobex.com.br
supabase secrets set ABACATEPAY_API_KEY=sua_chave_aqui
supabase secrets set ABACATEPAY_API_URL=https://api.abacatepay.com.br
supabase secrets set ABACATEPAY_WEBHOOK_SECRET=seu_secret_aqui

# Verificar
supabase secrets list
```

---

## 🔄 Passo 6: Atualizar Frontend

### 6.1. Atualizar Credenciais do Supabase

1. **Obter novas credenciais:**
   - Acesse: https://supabase.com/dashboard/project/[NOVO_PROJECT_ID]/settings/api
   - Copie:
     - Project URL: `https://[NOVO_PROJECT_ID].supabase.co`
     - anon/public key

2. **Atualizar no código:**
   - Se você tem o código fonte, atualize as variáveis de ambiente
   - Se está usando build compilado, você precisará recompilar

### 6.2. Recompilar Frontend (se necessário)

```bash
# Se você tem o código fonte React/Vite
npm install
npm run build

# Os novos arquivos compilados terão as novas credenciais
```

---

## 🔗 Passo 7: Atualizar Integrações Externas

### 7.1. Webhooks do AbacatePay

1. Acesse o painel do AbacatePay
2. Atualize a URL do webhook para:
   ```
   https://[NOVO_PROJECT_ID].supabase.co/functions/v1/[nome-da-funcao-webhook]
   ```

### 7.2. Outros Serviços

- Verifique se há outros serviços que chamam o Supabase
- Atualize as URLs e chaves de API

---

## ✅ Passo 8: Verificações Finais

### Checklist de Testes

- [ ] **Autenticação:**
  - [ ] Login funciona
  - [ ] Registro funciona
  - [ ] Recuperação de senha funciona

- [ ] **Cursos:**
  - [ ] Listagem de cursos funciona
  - [ ] Detalhes do curso funcionam
  - [ ] Acesso ao conteúdo funciona

- [ ] **Pagamentos:**
  - [ ] Criação de compra funciona
  - [ ] Pagamento PIX funciona
  - [ ] Pagamento Cartão funciona
  - [ ] Confirmação automática funciona

- [ ] **Notificações:**
  - [ ] WhatsApp é enviado após pagamento
  - [ ] Logs estão sendo gerados

- [ ] **Admin:**
  - [ ] Painel admin acessível
  - [ ] Logs visíveis
  - [ ] Gerenciamento de cursos funciona

### Verificar Logs

```bash
# Ver logs das Edge Functions
supabase functions logs send-whatsapp-notification
supabase functions logs confirm-purchase

# Ver logs em tempo real
supabase functions logs send-whatsapp-notification --follow
```

### Verificar Banco de Dados

```bash
# Ver status das migrations
supabase migration list

# Ver diferenças (se houver)
supabase db diff
```

---

## 🆘 Solução de Problemas

### Erro ao aplicar migrations

**Problema:** Conflitos ou erros ao aplicar migrations

**Solução:**
```bash
# Verificar status
supabase migration list

# Se necessário, resetar (CUIDADO: apaga tudo!)
supabase db reset

# Aplicar novamente
supabase db push
```

### Edge Functions não funcionam

**Problema:** Funções retornam erro 500

**Solução:**
1. Verificar logs: `supabase functions logs [nome]`
2. Verificar se secrets estão configurados: `supabase secrets list`
3. Verificar código da função
4. Testar localmente: `supabase functions serve [nome]`

### RLS bloqueando acesso

**Problema:** Não consegue acessar dados mesmo autenticado

**Solução:**
1. Verificar políticas RLS no Dashboard
2. Temporariamente desabilitar para debug:
   ```sql
   ALTER TABLE [tabela] DISABLE ROW LEVEL SECURITY;
   ```
3. Verificar e corrigir políticas
4. Reabilitar: `ALTER TABLE [tabela] ENABLE ROW LEVEL SECURITY;`

### Dados não foram migrados

**Problema:** Tabelas criadas mas sem dados

**Solução:**
1. Verificar se o dump inclui dados
2. Importar dados manualmente via SQL Editor
3. Ou usar `supabase db dump` com dados

---

## 📚 Recursos Adicionais

- **Documentação Supabase CLI**: https://supabase.com/docs/reference/cli
- **Migrations Guide**: https://supabase.com/docs/guides/cli/local-development#database-migrations
- **Edge Functions**: https://supabase.com/docs/guides/functions
- **RLS Policies**: https://supabase.com/docs/guides/auth/row-level-security

---

## 📝 Resumo Rápido

```bash
# EXTRAÇÃO (projeto antigo)
supabase link --project-ref qxgzazewwutbikmmpkms
supabase db dump --schema public > backup/schema.sql
supabase functions download [nome]
supabase unlink

# APLICAÇÃO (projeto novo)
supabase link --project-ref [NOVO_ID]
supabase init
cp backup/schema.sql supabase/migrations/
supabase db push
cp -r functions/* supabase/functions/
supabase functions deploy
supabase secrets set [VAR]=[VALOR]
```

---

**Boa migração! 🚀**

Se tiver dúvidas, consulte a documentação do Supabase ou abra uma issue.


