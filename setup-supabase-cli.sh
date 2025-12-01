#!/bin/bash

echo "========================================"
echo "  Configuração do Supabase CLI"
echo "========================================"
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "[ERRO] Node.js não encontrado!"
    echo ""
    echo "Por favor, instale o Node.js:"
    echo "https://nodejs.org/"
    echo ""
    exit 1
fi

echo "[OK] Node.js encontrado"
node --version
echo ""

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "[AVISO] Supabase CLI não encontrado!"
    echo ""
    echo "Instalando Supabase CLI via npm..."
    echo ""
    npm install -g supabase
    if [ $? -ne 0 ]; then
        echo "[ERRO] Falha ao instalar Supabase CLI"
        echo ""
        echo "Tente instalar manualmente:"
        echo "npm install -g supabase"
        echo ""
        exit 1
    fi
    echo "[OK] Supabase CLI instalado com sucesso!"
else
    echo "[OK] Supabase CLI encontrado"
    supabase --version
fi
echo ""

echo "========================================"
echo "  Próximos Passos:"
echo "========================================"
echo ""
echo "1. Fazer login no Supabase:"
echo "   supabase login"
echo ""
echo "2. Vincular ao projeto:"
echo "   supabase link --project-ref qxgzazewwutbikmmpkms"
echo ""
echo "3. Inicializar estrutura (se necessário):"
echo "   supabase init"
echo ""
echo "4. Baixar Edge Functions existentes:"
echo "   supabase functions download send-whatsapp-notification"
echo "   supabase functions download confirm-purchase"
echo ""
echo "5. Configurar secrets:"
echo "   supabase secrets set EVOLUTION_API_URL=https://mensadodo.dunis.com.br"
echo "   supabase secrets set EVOLUTION_API_KEY=3B2F25CF7B2F-41F0-8EA1-2F021B2591FC"
echo "   supabase secrets set EVOLUTION_INSTANCE_NAME=Dunis"
echo "   supabase secrets set APP_URL=https://institutobex.com.br"
echo ""
echo "Para mais detalhes, consulte: GUIA_SUPABASE_CLI.md"
echo ""

