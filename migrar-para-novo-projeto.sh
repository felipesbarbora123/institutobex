#!/bin/bash

# ============================================
# Script de Migração do Supabase
# Migra de um projeto Supabase para outro
# ============================================

set -e  # Parar em caso de erro

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para imprimir mensagens
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se Supabase CLI está instalado
check_supabase_cli() {
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI não encontrado!"
        print_info "Instale com: npm install -g supabase"
        exit 1
    fi
    print_success "Supabase CLI encontrado"
}

# Solicitar informações
echo "============================================"
echo "  Migração do Supabase"
echo "============================================"
echo ""

read -p "Project ID do projeto ATUAL: " OLD_PROJECT_ID
read -p "Project ID do projeto NOVO: " NEW_PROJECT_ID
read -p "Deseja migrar dados também? (s/N): " MIGRATE_DATA

MIGRATE_DATA=${MIGRATE_DATA:-N}

echo ""
print_info "Iniciando migração..."
print_info "Projeto antigo: $OLD_PROJECT_ID"
print_info "Projeto novo: $NEW_PROJECT_ID"
echo ""

# Verificar CLI
check_supabase_cli

# Criar estrutura de pastas
mkdir -p supabase-export/{migrations,functions,backup}
print_success "Estrutura de pastas criada"

# ============================================
# FASE 1: EXTRAÇÃO DO PROJETO ANTIGO
# ============================================
echo ""
print_info "FASE 1: Extraindo do projeto antigo..."
echo ""

# Vincular ao projeto antigo
print_info "Vinculando ao projeto antigo..."
supabase link --project-ref "$OLD_PROJECT_ID" || {
    print_error "Erro ao vincular ao projeto antigo"
    exit 1
}

# Extrair schema
print_info "Extraindo schema do banco de dados..."
if [ "$MIGRATE_DATA" = "s" ] || [ "$MIGRATE_DATA" = "S" ]; then
    supabase db dump > supabase-export/backup/database-completo.sql
    print_success "Dump completo (schema + dados) criado"
else
    supabase db dump --schema public > supabase-export/backup/schema.sql
    print_success "Dump do schema criado"
fi

# Extrair Edge Functions
print_info "Extraindo Edge Functions..."
FUNCTIONS=(
    "send-whatsapp-notification"
    "confirm-purchase"
    "create-purchase"
    "create-payment-pix"
    "create-payment-card"
    "abacatepay-check-status"
    "validate-coupon"
    "reconcile-pending-payments"
)

cd supabase-export/functions
for func in "${FUNCTIONS[@]}"; do
    print_info "  Baixando: $func"
    supabase functions download "$func" 2>/dev/null && print_success "    ✅ $func" || print_warning "    ⚠️  $func não encontrada"
done
cd ../..

# Desvincular do projeto antigo
print_info "Desvinculando do projeto antigo..."
supabase unlink
print_success "Desvinculado do projeto antigo"

# ============================================
# FASE 2: APLICAÇÃO NO PROJETO NOVO
# ============================================
echo ""
print_info "FASE 2: Aplicando no projeto novo..."
echo ""

# Vincular ao projeto novo
print_info "Vinculando ao projeto novo..."
supabase link --project-ref "$NEW_PROJECT_ID" || {
    print_error "Erro ao vincular ao projeto novo"
    exit 1
}

# Inicializar estrutura
if [ ! -d "supabase" ]; then
    print_info "Inicializando estrutura do Supabase..."
    supabase init
    print_success "Estrutura inicializada"
fi

# Aplicar migrations
print_info "Aplicando migrations..."
if [ "$MIGRATE_DATA" = "s" ] || [ "$MIGRATE_DATA" = "S" ]; then
    cp supabase-export/backup/database-completo.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_initial_schema_and_data.sql
else
    cp supabase-export/backup/schema.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_initial_schema.sql
fi

supabase db push
print_success "Migrations aplicadas"

# Deploy das Edge Functions
print_info "Fazendo deploy das Edge Functions..."
if [ -d "supabase-export/functions" ]; then
    mkdir -p supabase/functions
    cp -r supabase-export/functions/* supabase/functions/ 2>/dev/null || true
    
    for func in "${FUNCTIONS[@]}"; do
        if [ -d "supabase/functions/$func" ]; then
            print_info "  Deploy: $func"
            supabase functions deploy "$func" && print_success "    ✅ $func" || print_warning "    ⚠️  Erro ao fazer deploy de $func"
        fi
    done
fi

# Configurar secrets
echo ""
print_warning "IMPORTANTE: Configure os secrets manualmente!"
print_info "Execute: supabase secrets set [VAR]=[VALOR]"
print_info "Ou configure via Dashboard: Settings > Edge Functions > Secrets"
echo ""

# Desvincular do projeto novo
print_info "Desvinculando do projeto novo..."
supabase unlink
print_success "Desvinculado do projeto novo"

# ============================================
# RESUMO
# ============================================
echo ""
echo "============================================"
print_success "Migração concluída!"
echo "============================================"
echo ""
print_info "Próximos passos:"
echo "  1. Configure os secrets no novo projeto"
echo "  2. Atualize as credenciais no frontend"
echo "  3. Atualize os webhooks do AbacatePay"
echo "  4. Teste todas as funcionalidades"
echo ""
print_info "Arquivos salvos em: supabase-export/"
echo ""


