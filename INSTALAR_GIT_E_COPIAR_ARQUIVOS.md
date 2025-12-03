# 📋 Instalar Git e Copiar Arquivos para Volume Nomeado

## 🎯 Objetivo

Instalar git no container, clonar repositório e copiar arquivos para volume nomeado.

---

## ✅ Solução: Comando Completo com Instalação do Git

### **Passo 1: Criar Volume Nomeado**

1. **Volumes** → **Add volume**
2. **Name**: `backend_app_data`
3. **Driver**: `local`
4. **Create**

---

### **Passo 2: Configurar Container com Instalação do Git**

1. **Containers** → `institutobex-backend` → **Kill**

2. **Duplicate/Edit**:

3. **Volumes**:
   - **Adicionar**: **Named volume** → `backend_app_data` em `/app`

4. **Command & Logging** → **Command**:
   
   **Para Alpine Linux (node:20-alpine):**
   ```bash
   sh -c "apk add --no-cache git; cd /tmp; git clone https://SEU_TOKEN@github.com/usuario/repositorio.git temp; cp -r temp/backend/* /app/; rm -rf temp; cd /app; npm install && npm start"
   ```
   
   **Para Debian/Ubuntu (node:20):**
   ```bash
   sh -c "apt-get update; apt-get install -y git; cd /tmp; git clone https://SEU_TOKEN@github.com/usuario/repositorio.git temp; cp -r temp/backend/* /app/; rm -rf temp; cd /app; npm install && npm start"
   ```

5. **Working directory**: `/app`

6. **Deploy**

---

## ✅ Verificar Qual Imagem Está Sendo Usada

Para saber qual comando usar, verifique a imagem do container:

1. **Containers** → `institutobex-backend` → **Image**
2. **Se for `node:20-alpine`**: Use comando com `apk`
3. **Se for `node:20` ou `node:20-slim`**: Use comando com `apt-get`

---

## ✅ Comando Completo (Alpine - Mais Comum)

```bash
sh -c "apk add --no-cache git; cd /tmp; git clone https://SEU_TOKEN@github.com/usuario/repositorio.git temp; cp -r temp/backend/* /app/; rm -rf temp; cd /app; npm install && npm start"
```

---

## ✅ Comando Completo (Debian/Ubuntu)

```bash
sh -c "apt-get update; apt-get install -y git; cd /tmp; git clone https://SEU_TOKEN@github.com/usuario/repositorio.git temp; cp -r temp/backend/* /app/; rm -rf temp; cd /app; npm install && npm start"
```

---

## ✅ Depois da Primeira Execução (Arquivos Já no Volume)

Após a primeira execução bem-sucedida, os arquivos já estarão no volume nomeado. Você pode simplificar o comando:

1. **Containers** → `institutobex-backend` → **Duplicate/Edit**

2. **Command**:
   ```bash
   sh -c "cd /app && npm install && npm start"
   ```

3. **Deploy**

**Agora não precisa mais instalar git ou clonar!**

---

## 🔍 Verificar Se Funcionou

1. **Logs** do container devem mostrar:
   - ✅ Git sendo instalado
   - ✅ Repositório sendo clonado
   - ✅ Arquivos sendo copiados
   - ✅ npm install executando
   - ✅ Servidor iniciando

2. **Console** do container:
   ```bash
   ls -la /app/package.json
   # Deve mostrar o arquivo!
   ```

---

## 🐛 Problemas Comuns

### **Problema 1: Ainda dá erro "git: not found"**

**Solução**: Verifique se está usando o comando correto para sua imagem:
- Alpine: `apk add --no-cache git`
- Debian: `apt-get update && apt-get install -y git`

### **Problema 2: Erro de autenticação Git**

**Solução**: Use Personal Access Token:
```bash
git clone https://SEU_TOKEN@github.com/usuario/repositorio.git
```

### **Problema 3: Arquivos ainda são deletados**

**Solução**: Certifique-se de que o volume nomeado está montado em `/app`:
- **Volumes** → Named volume `backend_app_data` em `/app`

---

## 📋 Checklist

- [ ] Criar volume nomeado `backend_app_data`
- [ ] Verificar qual imagem está sendo usada (Alpine ou Debian)
- [ ] Configurar comando com instalação do git
- [ ] Usar comando correto (`apk` ou `apt-get`)
- [ ] Verificar logs para confirmar instalação
- [ ] Após primeira execução, simplificar comando

---

## 🔗 Referências

- `RESOLVER_ARQUIVOS_DELETADOS_APOS_RESTART.md` - Persistir arquivos
- `SOLUCAO_ERRO_GIT_PORTAINER.md` - Erros de Git

---

## ✅ Resumo

**Para instalar git e copiar arquivos:**

1. ✅ **Alpine**: `apk add --no-cache git && ...`
2. ✅ **Debian**: `apt-get update && apt-get install -y git && ...`
3. ✅ **Depois**: Simplificar comando para apenas `cd /app && npm install && npm start`

**Pronto!** Use o comando correto para sua imagem! 🚀

