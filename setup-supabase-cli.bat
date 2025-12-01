@echo off
echo ========================================
echo   Configuracao do Supabase CLI
echo ========================================
echo.

REM Verificar se Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Node.js nao encontrado!
    echo.
    echo Por favor, instale o Node.js:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js encontrado
node --version
echo.

REM Verificar se Supabase CLI está instalado
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [AVISO] Supabase CLI nao encontrado!
    echo.
    echo Instalando Supabase CLI via npm...
    echo.
    npm install -g supabase
    if %ERRORLEVEL% NEQ 0 (
        echo [ERRO] Falha ao instalar Supabase CLI
        echo.
        echo Tente instalar manualmente:
        echo npm install -g supabase
        echo.
        pause
        exit /b 1
    )
    echo [OK] Supabase CLI instalado com sucesso!
) else (
    echo [OK] Supabase CLI encontrado
    supabase --version
)
echo.

echo ========================================
echo   Proximos Passos:
echo ========================================
echo.
echo 1. Fazer login no Supabase:
echo    supabase login
echo.
echo 2. Vincular ao projeto:
echo    supabase link --project-ref qxgzazewwutbikmmpkms
echo.
echo 3. Inicializar estrutura (se necessario):
echo    supabase init
echo.
echo 4. Baixar Edge Functions existentes:
echo    supabase functions download send-whatsapp-notification
echo    supabase functions download confirm-purchase
echo.
echo 5. Configurar secrets:
echo    supabase secrets set EVOLUTION_API_URL=https://mensadodo.dunis.com.br
echo    supabase secrets set EVOLUTION_API_KEY=3B2F25CF7B2F-41F0-8EA1-2F021B2591FC
echo    supabase secrets set EVOLUTION_INSTANCE_NAME=Dunis
echo    supabase secrets set APP_URL=https://institutobex.com.br
echo.
echo Para mais detalhes, consulte: GUIA_SUPABASE_CLI.md
echo.
pause

