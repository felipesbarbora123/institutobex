@echo off
REM ============================================
REM Script de Migração do Supabase (Windows)
REM Migra de um projeto Supabase para outro
REM ============================================

setlocal enabledelayedexpansion

echo ============================================
echo   Migração do Supabase
echo ============================================
echo.

REM Verificar se Supabase CLI está instalado
where supabase >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Supabase CLI não encontrado!
    echo ℹ️  Instale com: npm install -g supabase
    exit /b 1
)
echo ✅ Supabase CLI encontrado
echo.

REM Solicitar informações
set /p OLD_PROJECT_ID="Project ID do projeto ATUAL: "
set /p NEW_PROJECT_ID="Project ID do projeto NOVO: "
set /p MIGRATE_DATA="Deseja migrar dados também? (s/N): "

if "%MIGRATE_DATA%"=="" set MIGRATE_DATA=N

echo.
echo ℹ️  Iniciando migração...
echo ℹ️  Projeto antigo: %OLD_PROJECT_ID%
echo ℹ️  Projeto novo: %NEW_PROJECT_ID%
echo.

REM Criar estrutura de pastas
if not exist "supabase-export" mkdir supabase-export
if not exist "supabase-export\migrations" mkdir supabase-export\migrations
if not exist "supabase-export\functions" mkdir supabase-export\functions
if not exist "supabase-export\backup" mkdir supabase-export\backup
echo ✅ Estrutura de pastas criada

REM ============================================
REM FASE 1: EXTRAÇÃO DO PROJETO ANTIGO
REM ============================================
echo.
echo ℹ️  FASE 1: Extraindo do projeto antigo...
echo.

REM Vincular ao projeto antigo
echo ℹ️  Vinculando ao projeto antigo...
supabase link --project-ref %OLD_PROJECT_ID%
if %errorlevel% neq 0 (
    echo ❌ Erro ao vincular ao projeto antigo
    exit /b 1
)

REM Extrair schema
echo ℹ️  Extraindo schema do banco de dados...
if /i "%MIGRATE_DATA%"=="s" (
    supabase db dump > supabase-export\backup\database-completo.sql
    echo ✅ Dump completo (schema + dados) criado
) else (
    supabase db dump --schema public > supabase-export\backup\schema.sql
    echo ✅ Dump do schema criado
)

REM Extrair Edge Functions
echo ℹ️  Extraindo Edge Functions...
cd supabase-export\functions

set FUNCTIONS=send-whatsapp-notification confirm-purchase create-purchase create-payment-pix create-payment-card abacatepay-check-status validate-coupon reconcile-pending-payments

for %%f in (%FUNCTIONS%) do (
    echo   Baixando: %%f
    supabase functions download %%f >nul 2>&1
    if !errorlevel! equ 0 (
        echo     ✅ %%f
    ) else (
        echo     ⚠️  %%f não encontrada
    )
)

cd ..\..

REM Desvincular do projeto antigo
echo ℹ️  Desvinculando do projeto antigo...
supabase unlink
echo ✅ Desvinculado do projeto antigo

REM ============================================
REM FASE 2: APLICAÇÃO NO PROJETO NOVO
REM ============================================
echo.
echo ℹ️  FASE 2: Aplicando no projeto novo...
echo.

REM Vincular ao projeto novo
echo ℹ️  Vinculando ao projeto novo...
supabase link --project-ref %NEW_PROJECT_ID%
if %errorlevel% neq 0 (
    echo ❌ Erro ao vincular ao projeto novo
    exit /b 1
)

REM Inicializar estrutura
if not exist "supabase" (
    echo ℹ️  Inicializando estrutura do Supabase...
    supabase init
    echo ✅ Estrutura inicializada
)

REM Aplicar migrations
echo ℹ️  Aplicando migrations...
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set timestamp=%datetime:~0,14%

if /i "%MIGRATE_DATA%"=="s" (
    copy supabase-export\backup\database-completo.sql supabase\migrations\%timestamp%_initial_schema_and_data.sql >nul
) else (
    copy supabase-export\backup\schema.sql supabase\migrations\%timestamp%_initial_schema.sql >nul
)

supabase db push
if %errorlevel% equ 0 (
    echo ✅ Migrations aplicadas
) else (
    echo ⚠️  Erro ao aplicar migrations
)

REM Deploy das Edge Functions
echo ℹ️  Fazendo deploy das Edge Functions...
if exist "supabase-export\functions" (
    if not exist "supabase\functions" mkdir supabase\functions
    xcopy /E /I /Y supabase-export\functions supabase\functions >nul
    
    for %%f in (%FUNCTIONS%) do (
        if exist "supabase\functions\%%f" (
            echo   Deploy: %%f
            supabase functions deploy %%f >nul 2>&1
            if !errorlevel! equ 0 (
                echo     ✅ %%f
            ) else (
                echo     ⚠️  Erro ao fazer deploy de %%f
            )
        )
    )
)

REM Desvincular do projeto novo
echo ℹ️  Desvinculando do projeto novo...
supabase unlink
echo ✅ Desvinculado do projeto novo

REM ============================================
REM RESUMO
REM ============================================
echo.
echo ============================================
echo ✅ Migração concluída!
echo ============================================
echo.
echo ℹ️  Próximos passos:
echo   1. Configure os secrets no novo projeto
echo   2. Atualize as credenciais no frontend
echo   3. Atualize os webhooks do AbacatePay
echo   4. Teste todas as funcionalidades
echo.
echo ℹ️  Arquivos salvos em: supabase-export\
echo.

pause


