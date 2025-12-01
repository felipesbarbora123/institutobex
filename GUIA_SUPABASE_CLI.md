# 🚀 Guia: Trabalhar com Supabase pelo Código Fonte

## ✅ Sim, você pode alterar o projeto do Supabase diretamente pelo código!

Este guia mostra como configurar o **Supabase CLI** para trabalhar com Edge Functions, migrações de banco de dados e outras configurações diretamente do código fonte.

---

## 📋 Pré-requisitos

1. **Node.js** instalado (versão 14 ou superior)
2. **Supabase CLI** instalado
3. Acesso ao projeto Supabase (credenciais)

---

## 🔧 Passo 1: Instalar o Supabase CLI

### Windows (PowerShell)

```powershell
# Opção 1: Usando Scoop (recomendado)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Opção 2: Usando npm
npm install -g supabase
```

### Verificar Instalação

```bash
supabase --version
```

---

## 🔗 Passo 2: Fazer Login no Supabase

```bash
supabase login
```

Isso abrirá o navegador para autenticação. Após fazer login, você estará conectado.

---

## 📁 Passo 3: Inicializar o Projeto Supabase Localmente

### 3.1. Vincular ao Projeto Existente

```bash
# Vincular ao projeto existente
supabase link --project-ref qxgzazewwutbikmmpkms
```

Quando solicitado, informe:
- **Database Password**: (senha do banco de dados - você pode resetar no dashboard se não souber)
- **Git Branch**: `main` ou `master`

### 3.2. Inicializar Estrutura Local (se ainda não existir)

```bash
# Criar estrutura de pastas do Supabase
supabase init
```

Isso criará a seguinte estrutura:

```
institutobex/
├── supabase/
│   ├── config.toml          # Configuração do projeto
│   ├── functions/           # Edge Functions
│   │   └── send-whatsapp-notification/
│   │       └── index.ts
│   ├── migrations/          # Migrações do banco de dados
│   │   └── YYYYMMDDHHMMSS_nome_migracao.sql
│   └── seed.sql            # Dados iniciais (opcional)
```

---

## 📝 Passo 4: Trabalhar com Edge Functions

### 4.1. Criar uma Nova Edge Function

```bash
# Criar função
supabase functions new nome-da-funcao
```

### 4.2. Editar Edge Function Existente

As Edge Functions ficam em `supabase/functions/nome-da-funcao/index.ts`

**Exemplo:** Para a função `send-whatsapp-notification`:

1. Crie a pasta: `supabase/functions/send-whatsapp-notification/`
2. Crie o arquivo: `supabase/functions/send-whatsapp-notification/index.ts`
3. Cole o código do arquivo `supabase-edge-function-example.ts`

### 4.3. Testar Edge Function Localmente

```bash
# Iniciar ambiente local (opcional, para testar)
supabase start

# Testar função localmente
supabase functions serve send-whatsapp-notification --env-file .env.local
```

### 4.4. Fazer Deploy da Edge Function

```bash
# Deploy de uma função específica
supabase functions deploy send-whatsapp-notification

# Deploy de todas as funções
supabase functions deploy
```

---

## 🗄️ Passo 5: Trabalhar com Migrações de Banco de Dados

### 5.1. Criar Nova Migração

```bash
# Criar migração
supabase migration new nome_da_migracao
```

Isso criará um arquivo em `supabase/migrations/YYYYMMDDHHMMSS_nome_da_migracao.sql`

### 5.2. Aplicar Migrações

```bash
# Aplicar migrações pendentes no projeto remoto
supabase db push

# Ver status das migrações
supabase migration list
```

### 5.3. Reverter Migração

```bash
# Reverter última migração
supabase migration repair --status reverted
```

---

## 🔐 Passo 6: Configurar Variáveis de Ambiente

### 6.1. Criar Arquivo de Secrets

Crie um arquivo `.env.local` na raiz do projeto:

```env
EVOLUTION_API_URL=https://mensadodo.dunis.com.br
EVOLUTION_API_KEY=3B2F25CF7B2F-41F0-8EA1-2F021B2591FC
EVOLUTION_INSTANCE_NAME=Dunis
APP_URL=https://institutobex.com.br
```

### 6.2. Configurar Secrets no Supabase

```bash
# Definir secret
supabase secrets set EVOLUTION_API_URL=https://mensadodo.dunis.com.br
supabase secrets set EVOLUTION_API_KEY=3B2F25CF7B2F-41F0-8EA1-2F021B2591FC
supabase secrets set EVOLUTION_INSTANCE_NAME=Dunis
supabase secrets set APP_URL=https://institutobex.com.br

# Listar secrets
supabase secrets list
```

---

## 📦 Passo 7: Estrutura Completa do Projeto

Após configurar, sua estrutura ficará assim:

```
institutobex/
├── supabase/
│   ├── config.toml
│   ├── functions/
│   │   ├── send-whatsapp-notification/
│   │   │   └── index.ts
│   │   └── confirm-purchase/
│   │       └── index.ts
│   └── migrations/
│       └── YYYYMMDDHHMMSS_*.sql
├── assets/
├── index.html
├── package.json
└── ...
```

---

## 🚀 Workflow de Desenvolvimento

### Fluxo Recomendado:

1. **Fazer alterações no código local**
   ```bash
   # Editar Edge Function
   code supabase/functions/send-whatsapp-notification/index.ts
   ```

2. **Testar localmente (opcional)**
   ```bash
   supabase functions serve send-whatsapp-notification
   ```

3. **Fazer deploy**
   ```bash
   supabase functions deploy send-whatsapp-notification
   ```

4. **Verificar logs**
   ```bash
   supabase functions logs send-whatsapp-notification
   ```

---

## 📋 Comandos Úteis

### Edge Functions

```bash
# Listar funções
supabase functions list

# Ver logs de uma função
supabase functions logs nome-da-funcao

# Deletar função
supabase functions delete nome-da-funcao
```

### Banco de Dados

```bash
# Ver diferenças entre local e remoto
supabase db diff

# Resetar banco local (cuidado!)
supabase db reset

# Gerar tipos TypeScript do banco
supabase gen types typescript --linked > types/database.types.ts
```

### Projeto

```bash
# Ver status do projeto
supabase status

# Ver informações do projeto vinculado
supabase projects list

# Desvincular projeto
supabase unlink
```

---

## ⚠️ Importante

1. **Sempre faça backup** antes de aplicar migrações em produção
2. **Teste localmente** antes de fazer deploy
3. **Use Git** para versionar suas alterações
4. **Secrets sensíveis** não devem ser commitados no Git

---

## 🔄 Migrar Edge Functions Existentes

Se você já tem Edge Functions criadas pelo dashboard:

1. **Baixar função existente:**
   ```bash
   supabase functions download send-whatsapp-notification
   ```

2. **Ou criar manualmente:**
   - Copie o código do dashboard
   - Crie `supabase/functions/nome-da-funcao/index.ts`
   - Cole o código
   - Faça deploy: `supabase functions deploy nome-da-funcao`

---

## 📚 Recursos Adicionais

- **Documentação Supabase CLI**: https://supabase.com/docs/reference/cli
- **Edge Functions Docs**: https://supabase.com/docs/guides/functions
- **Migrations Guide**: https://supabase.com/docs/guides/cli/local-development#database-migrations

---

## ✅ Checklist de Configuração

- [ ] Supabase CLI instalado
- [ ] Login realizado (`supabase login`)
- [ ] Projeto vinculado (`supabase link`)
- [ ] Estrutura inicializada (`supabase init`)
- [ ] Edge Functions migradas para código
- [ ] Secrets configurados
- [ ] Teste de deploy realizado

---

**Agora você pode trabalhar com o Supabase diretamente pelo código fonte! 🎉**

