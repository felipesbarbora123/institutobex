# 🔧 Solução: Container em Loop de Restart

## 🐛 Erro Encontrado

```
Unable to create exec: Container is restarting, wait until the container is running
```

## 🎯 O Que Isso Significa?

O container está em um **loop de restart** - ele tenta iniciar, falha, reinicia, falha novamente, e assim por diante. Isso geralmente acontece porque:

- ⚠️ **Erro no comando de inicialização**
- ⚠️ **Arquivos faltando** (como `package.json`)
- ⚠️ **Variáveis de ambiente incorretas**
- ⚠️ **Dependências não instaladas**
- ⚠️ **Erro no código**

---

## ✅ Soluções

---

## 🔍 Passo 1: Verificar Logs do Container

Mesmo que o container esteja reiniciando, você pode ver os logs:

### **No Portainer:**

1. **Containers** → `institutobex-backend`
2. Clique em **Logs**
3. **Veja os últimos logs** - eles mostram o erro que está causando o restart

### **O Que Procurar nos Logs:**

- ❌ `could not read package.json` → Arquivos não encontrados
- ❌ `npm: command not found` → Node.js não instalado
- ❌ `Cannot connect to database` → Erro de conexão com banco
- ❌ `Error: ENOENT` → Arquivo não encontrado
- ❌ `Port already in use` → Porta ocupada
- ❌ Qualquer erro em vermelho

**Anote o erro** - ele vai indicar o problema!

---

## 🔍 Passo 2: Parar o Container

Para poder editar e corrigir:

1. **Portainer** → **Containers** → `institutobex-backend`
2. Clique em **Stop** (pode demorar um pouco)
3. Aguarde até o status mudar para **Stopped**

**Se não conseguir parar:**
- Tente **Kill** (força a parada)
- Ou aguarde alguns segundos e tente novamente

---

## ✅ Solução 1: Corrigir Problema Baseado nos Logs

### **Se o Erro for "package.json not found":**

1. **Verificar volume Bind**:
   - **Containers** → `institutobex-backend` → **Volumes**
   - Deve ter: Container `/app` → Host `/opt/institutobex/backend`
   - Se não tiver, adicione (veja `SOLUCAO_DIRETORIO_APP_NAO_EXISTE.md`)

2. **Verificar se arquivos estão no servidor**:
   - Crie container temporário para verificar
   - Veja `COMO_FAZER_UPLOAD_ARQUIVOS_PORTAINER.md`

### **Se o Erro for "Cannot connect to database":**

1. **Verificar variáveis de ambiente**:
   - **Containers** → `institutobex-backend` → **Environment variables`
   - Verifique:
     - `DB_HOST=institutobex-db` (nome do container PostgreSQL)
     - `DB_PORT=5432`
     - `DB_NAME=institutobex`
     - `DB_USER=postgres`
     - `DB_PASSWORD` (senha correta)

2. **Verificar se PostgreSQL está rodando**:
   - **Containers** → `institutobex-db` → Status deve ser **Running**

### **Se o Erro for "npm: command not found":**

1. **Verificar imagem**:
   - Deve ser `node:20-alpine` ou similar
   - Se for `alpine:latest`, mude para `node:20-alpine`

### **Se o Erro for "Port already in use":**

1. **Mudar porta**:
   - **Network ports** → Mude Host para outra porta (ex: `3002`)

---

## ✅ Solução 2: Ajustar Command para Debug

Para ver melhor o erro, ajuste o comando:

1. **Containers** → `institutobex-backend` → **Duplicate/Edit**

2. **Command & Logging** → **Command**:
   ```bash
   sh -c "cd /app && ls -la && npm install && npm start"
   ```
   
   Isso vai mostrar os arquivos antes de tentar instalar.

3. **Ou para debug mais detalhado**:
   ```bash
   sh -c "cd /app && pwd && ls -la && cat package.json && npm install && npm start"
   ```

4. **Deploy** e veja os logs

---

## ✅ Solução 3: Usar Comando Simples para Testar

Para testar se o volume está funcionando:

1. **Containers** → `institutobex-backend` → **Duplicate/Edit**

2. **Command & Logging** → **Command**:
   ```bash
   tail -f /dev/null
   ```
   
   Isso mantém o container rodando sem fazer nada.

3. **Deploy**

4. **Acessar console**:
   - Agora deve conseguir acessar o console
   - Verifique: `ls -la /app/`

5. **Testar manualmente**:
   ```bash
   cd /app
   ls -la
   npm install
   npm start
   ```

6. **Ver o erro real** no console

---

## ✅ Solução 4: Verificar Configuração Completa

Certifique-se de que o container tem:

1. ✅ **Image**: `node:20-alpine` (ou similar com Node.js)

2. ✅ **Volume Bind**:
   - Container: `/app`
   - Host: `/opt/institutobex/backend`

3. ✅ **Working directory**: `/app`

4. ✅ **Command**: `sh -c "npm install && npm start"`

5. ✅ **Environment variables**: Todas configuradas

6. ✅ **Network**: `institutobex-network`

7. ✅ **Restart policy**: `Unless stopped` (ou `Always`)

---

## 🔍 Passo 3: Verificar Logs em Tempo Real

Para ver os logs enquanto o container reinicia:

1. **Containers** → `institutobex-backend` → **Logs**
2. Clique em **Auto-refresh** (se disponível)
3. Veja os erros aparecendo em tempo real

---

## 🐛 Problemas Comuns e Soluções

### **Problema 1: Container não para de reiniciar**

**Solução:**
1. Tente **Kill** ao invés de **Stop**
2. Ou aguarde alguns segundos e tente novamente
3. Se não funcionar, remova e recrie o container

### **Problema 2: Não consigo ver os logs**

**Solução:**
1. Aguarde alguns segundos
2. Atualize a página
3. Tente ver logs de outro container para comparar

### **Problema 3: Logs não mostram erro claro**

**Solução:**
1. Use comando de debug (veja Solução 2)
2. Ou use `tail -f /dev/null` para manter container rodando
3. Acesse console e execute comandos manualmente

### **Problema 4: Volume não está montado**

**Solução:**
1. Pare o container
2. Adicione volume Bind (veja `SOLUCAO_DIRETORIO_APP_NAO_EXISTE.md`)
3. Recrie o container

---

## 📋 Checklist de Troubleshooting

- [ ] Verificar logs do container (veja o erro)
- [ ] Parar container (Stop ou Kill)
- [ ] Verificar volume Bind está configurado
- [ ] Verificar arquivos estão no servidor
- [ ] Verificar variáveis de ambiente
- [ ] Verificar imagem do container (deve ter Node.js)
- [ ] Verificar comando de inicialização
- [ ] Verificar se PostgreSQL está rodando
- [ ] Testar com comando simples (`tail -f /dev/null`)
- [ ] Acessar console e testar manualmente

---

## 💡 Dica: Comando de Debug

Use este comando para ver exatamente o que está acontecendo:

```bash
sh -c "cd /app && echo '=== PWD ===' && pwd && echo '=== LS ===' && ls -la && echo '=== PACKAGE.JSON ===' && cat package.json && echo '=== NPM INSTALL ===' && npm install && echo '=== NPM START ===' && npm start"
```

Isso vai mostrar cada passo e onde está falhando.

---

## 🔗 Referências

- `SOLUCAO_PACKAGE_JSON_NAO_ENCONTRADO.md` - Erro de package.json
- `SOLUCAO_DIRETORIO_APP_NAO_EXISTE.md` - Diretório /app não existe
- `COMO_FAZER_UPLOAD_ARQUIVOS_PORTAINER.md` - Fazer upload de arquivos
- `CONFIGURACAO_PORTAINER_PASSO_A_PASSO.md` - Configuração completa

---

## ✅ Resumo Rápido

**Para resolver container em loop de restart:**

1. ✅ **Ver logs** do container (veja o erro)
2. ✅ **Parar** container (Stop ou Kill)
3. ✅ **Identificar** problema baseado nos logs
4. ✅ **Corrigir** problema (volume, arquivos, variáveis, etc.)
5. ✅ **Testar** com comando simples (`tail -f /dev/null`)
6. ✅ **Acessar console** e testar manualmente
7. ✅ **Corrigir** comando de inicialização
8. ✅ **Recriar** container

**Pronto!** Siga os passos para identificar e resolver o problema! 🚀

