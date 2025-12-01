# 🔄 Migração do Supabase - Guia Rápido

Este guia mostra como migrar seu projeto Supabase atual para um novo projeto.

---

## 🚀 Início Rápido

### Opção 1: Script Automatizado (Recomendado)

**Windows:**
```bash
migrar-para-novo-projeto.bat
```

**Linux/Mac:**
```bash
chmod +x migrar-para-novo-projeto.sh
./migrar-para-novo-projeto.sh
```

O script irá:
1. ✅ Extrair schema do banco de dados
2. ✅ Baixar todas as Edge Functions
3. ✅ Aplicar tudo no novo projeto
4. ✅ Fazer deploy das funções

### Opção 2: Manual (Passo a Passo)

Siga o guia completo: **[GUIA_MIGRACAO_SUPABASE.md](./GUIA_MIGRACAO_SUPABASE.md)**

---

## 📋 Pré-requisitos

- [ ] Node.js instalado
- [ ] Supabase CLI instalado: `npm install -g supabase`
- [ ] Acesso ao projeto Supabase atual
- [ ] Novo projeto Supabase criado

---

## 📁 Arquivos Criados

Após executar os scripts, você terá:

```
supabase-export/
├── migrations/          # Migrations SQL extraídas
├── functions/           # Edge Functions baixadas
├── backup/              # Backups do banco de dados
└── GUIA_MIGRACAO.md     # Guia detalhado (gerado automaticamente)
```

---

## 🔑 Informações Necessárias

Antes de começar, tenha em mãos:

1. **Project ID do projeto ATUAL:**
   - Encontre em: Dashboard > Settings > General
   - Exemplo: `qxgzazewwutbikmmpkms`

2. **Project ID do projeto NOVO:**
   - Encontre em: Dashboard > Settings > General
   - Exemplo: `abc123xyz456`

3. **Database Password do novo projeto:**
   - Encontre em: Dashboard > Settings > Database
   - Ou reset em: Settings > Database > Reset Database Password

4. **Secrets/Variáveis de Ambiente:**
   - `EVOLUTION_API_URL`
   - `EVOLUTION_API_KEY`
   - `EVOLUTION_INSTANCE_NAME`
   - `APP_URL`
   - `ABACATEPAY_API_KEY`
   - `ABACATEPAY_API_URL`
   - `ABACATEPAY_WEBHOOK_SECRET`

---

## ⚡ Comandos Úteis

### Extrair Schema Manualmente

```bash
# Vincular ao projeto antigo
supabase link --project-ref [PROJECT_ID_ANTIGO]

# Extrair apenas schema (estrutura)
supabase db dump --schema public > schema.sql

# Extrair schema + dados
supabase db dump > database-completo.sql

# Desvincular
supabase unlink
```

### Baixar Edge Functions

```bash
# Vincular ao projeto antigo
supabase link --project-ref [PROJECT_ID_ANTIGO]

# Baixar função específica
supabase functions download send-whatsapp-notification

# Baixar todas (uma por uma)
supabase functions download confirm-purchase
supabase functions download create-purchase
# ... etc

# Desvincular
supabase unlink
```

### Aplicar no Novo Projeto

```bash
# Vincular ao projeto novo
supabase link --project-ref [PROJECT_ID_NOVO]

# Inicializar (se necessário)
supabase init

# Copiar migration
cp schema.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_initial.sql

# Aplicar
supabase db push

# Deploy das funções
supabase functions deploy send-whatsapp-notification
# ... etc

# Configurar secrets
supabase secrets set EVOLUTION_API_URL=https://...
supabase secrets set EVOLUTION_API_KEY=...
# ... etc

# Desvincular
supabase unlink
```

---

## ✅ Checklist Pós-Migração

Após migrar, verifique:

- [ ] Schema aplicado corretamente
- [ ] Edge Functions deployadas
- [ ] Secrets configurados
- [ ] Frontend atualizado com novas credenciais
- [ ] Webhooks do AbacatePay atualizados
- [ ] Testes de autenticação
- [ ] Testes de pagamento
- [ ] Testes de notificações WhatsApp
- [ ] Logs funcionando

---

## 🆘 Problemas Comuns

### "Supabase CLI não encontrado"
```bash
npm install -g supabase
```

### "Erro ao vincular projeto"
- Verifique se o Project ID está correto
- Verifique se você tem acesso ao projeto
- Tente fazer login novamente: `supabase login`

### "Erro ao aplicar migrations"
- Verifique se o banco está vazio ou se há conflitos
- Use `supabase db reset` com cuidado (apaga tudo!)

### "Edge Functions não funcionam"
- Verifique se os secrets estão configurados: `supabase secrets list`
- Verifique os logs: `supabase functions logs [nome]`

---

## 📚 Documentação

- **Guia Completo**: [GUIA_MIGRACAO_SUPABASE.md](./GUIA_MIGRACAO_SUPABASE.md)
- **Script SQL**: [extrair-schema-completo.sql](./extrair-schema-completo.sql)
- **Supabase CLI Docs**: https://supabase.com/docs/reference/cli

---

## ⚠️ Importante

1. **Sempre faça backup** antes de migrar
2. **Teste em desenvolvimento** primeiro
3. **Não commite secrets** no Git (já está no .gitignore)
4. **Atualize webhooks** após migrar
5. **Verifique RLS policies** após migrar

---

**Boa migração! 🚀**


