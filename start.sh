#!/bin/bash

echo "========================================"
echo "  Instituto Bex - Iniciando Servidor"
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

# Verificar se server.js existe
if [ ! -f "server.js" ]; then
    echo "[ERRO] Arquivo server.js não encontrado!"
    echo ""
    exit 1
fi

echo "[OK] Iniciando servidor..."
echo ""
echo "Acesse: http://localhost:3000"
echo ""
echo "Pressione Ctrl+C para parar o servidor."
echo ""

# Iniciar o servidor
node server.js

