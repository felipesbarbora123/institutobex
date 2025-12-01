@echo off
echo ========================================
echo   Instituto Bex - Iniciando Servidor
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

REM Verificar se server.js existe
if not exist "server.js" (
    echo [ERRO] Arquivo server.js nao encontrado!
    echo.
    pause
    exit /b 1
)

echo [OK] Iniciando servidor...
echo.
echo Acesse: http://localhost:3000
echo.
echo Pressione Ctrl+C para parar o servidor.
echo.

REM Iniciar o servidor
node server.js

pause

