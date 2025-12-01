# Instituto Bex - Plataforma de Cursos Online

## 📋 Sobre o Projeto

Este é um projeto de plataforma de cursos online desenvolvido com:
- **Frontend**: React + Vite (SPA - Single Page Application)
- **Backend**: Supabase (Backend as a Service)
- **PWA**: Progressive Web App (instalável)
- **Build**: Produção (arquivos compilados e otimizados)

## 🚀 Como Executar Localmente

### Pré-requisitos

1. **Node.js** instalado (versão 14 ou superior)
   - Baixe em: https://nodejs.org/
   - Verifique a instalação: `node --version`

### Passo a Passo

#### Opção 1: Usando o Servidor Node.js (Recomendado)

1. **Abra o terminal na pasta do projeto**

2. **Instale as dependências** (se necessário):
   ```bash
   npm install
   ```

3. **Inicie o servidor**:
   ```bash
   npm start
   ```
   ou
   ```bash
   node server.js
   ```

4. **Acesse no navegador**:
   ```
   http://localhost:3000
   ```

#### Opção 2: Usando Python (Alternativa)

Se você tem Python instalado:

```bash
# Python 3
python -m http.server 3000

# Python 2
python -m SimpleHTTPServer 3000
```

Depois acesse: `http://localhost:3000`

#### Opção 3: Usando PHP (Alternativa)

Se você tem PHP instalado:

```bash
php -S localhost:3000
```

Depois acesse: `http://localhost:3000`

#### Opção 4: Usando Live Server (VS Code)

Se você usa Visual Studio Code:

1. Instale a extensão "Live Server"
2. Clique com botão direito em `index.html`
3. Selecione "Open with Live Server"

## ⚙️ Configuração do Supabase

✅ **CONFIGURADO**: O projeto já possui as credenciais do Supabase de produção configuradas!

### Status da Configuração

As credenciais do Supabase estão **embutidas no código compilado** e prontas para uso:
- ✅ URL do projeto: `https://qxgzazewwutbikmmpkms.supabase.co`
- ✅ Chave API (anon) configurada
- ✅ Storage e autenticação configurados

**Você NÃO precisa fazer nenhuma configuração adicional!** O projeto está pronto para rodar.

Para mais detalhes, consulte o arquivo `CONFIGURACAO_SUPABASE.md`.

### 🛠️ Trabalhar com Supabase pelo Código Fonte

**Sim, você pode alterar o projeto do Supabase diretamente pelo código!**

Para trabalhar com Edge Functions, migrações de banco de dados e outras configurações do Supabase diretamente do código fonte, você pode usar o **Supabase CLI**.

**Configuração rápida:**

1. Execute o script de setup:
   ```bash
   # Windows
   setup-supabase-cli.bat
   
   # Linux/Mac
   chmod +x setup-supabase-cli.sh
   ./setup-supabase-cli.sh
   ```

2. Siga as instruções do script ou consulte o guia completo: **`GUIA_SUPABASE_CLI.md`**

**Benefícios:**
- ✅ Versionar Edge Functions no Git
- ✅ Fazer deploy via linha de comando
- ✅ Trabalhar com migrações de banco de dados
- ✅ Testar localmente antes de publicar
- ✅ Gerenciar secrets de forma organizada

### Estrutura do Banco de Dados

O projeto espera as seguintes tabelas no Supabase:
- `profiles` - Perfis de usuários
- `courses` - Cursos disponíveis
- `course_enrollments` - Matrículas em cursos
- `course_purchases` - Compras de cursos
- `contact_messages` - Mensagens de contato
- `user_roles` - Roles de usuários (admin, teacher, student)
- `webhook_logs` - Logs de webhooks
- `email_logs` - Logs de emails

## 📁 Estrutura do Projeto

```
institutobex/
├── index.html              # Página principal (SPA)
├── server.js               # Servidor HTTP simples
├── package.json            # Configuração Node.js
├── manifest.webmanifest    # Configuração PWA
├── sw.js                   # Service Worker (PWA)
├── registerSW.js           # Registro do Service Worker
├── workbox-b833909e.js     # Workbox (cache PWA)
├── assets/                 # Arquivos compilados
│   ├── *.js               # Componentes React compilados
│   ├── *.css              # Estilos compilados
│   └── imagens            # Assets estáticos
├── supabase/              # Supabase CLI (após configurar)
│   ├── functions/         # Edge Functions
│   └── migrations/        # Migrações do banco
├── robots.txt             # SEO
└── sitemap.xml            # SEO
```

## 🔧 Solução de Problemas

### Erro: "Cannot find module 'http'"
- **Solução**: Você está usando uma versão muito antiga do Node.js. Atualize para Node.js 14 ou superior.

### Erro: "EADDRINUSE: address already in use"
- **Solução**: A porta 3000 já está em uso. Altere a porta no arquivo `server.js` (linha `const PORT = 3000;`).

### Erro de conexão com Supabase
- **Solução**: Verifique se as credenciais do Supabase estão configuradas corretamente. Se este é um build de produção, as credenciais podem estar embutidas no código.

### Página em branco
- **Solução**: 
  1. Abra o Console do navegador (F12)
  2. Verifique se há erros de JavaScript
  3. Verifique se todos os arquivos estão sendo carregados corretamente

### Service Worker não funciona
- **Solução**: Service Workers só funcionam em servidores HTTP/HTTPS, não em `file://`. Use um dos métodos de servidor descritos acima.

## 📝 Notas Importantes

1. **Este é um build de produção**: Os arquivos estão compilados e minificados. Para fazer alterações no código, você precisaria do código fonte original.

2. **Arquivo default.php**: Este arquivo é apenas uma página padrão do Hostinger e não faz parte do projeto. Pode ser ignorado ou removido.

3. **PWA**: O projeto está configurado como Progressive Web App, podendo ser instalado em dispositivos móveis e desktops.

4. **Roteamento**: Como é uma SPA, todas as rotas são redirecionadas para `index.html` pelo servidor.

## 🆘 Suporte

Se encontrar problemas:
1. Verifique o console do navegador (F12) para erros
2. Verifique se o servidor está rodando corretamente
3. Verifique a configuração do Supabase
4. Consulte a documentação do Supabase: https://supabase.com/docs

## 📄 Licença

Este projeto é propriedade do Instituto Bex.

