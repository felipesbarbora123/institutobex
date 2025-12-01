# 📤 Como Fazer Upload de Arquivos no Portainer (Sem Acesso SSH)

## 🎯 Situação

Você já tem permissões para criar e gerenciar containers no Portainer, mas precisa fazer upload dos arquivos do backend. Aqui estão as formas de fazer isso **usando o Portainer**.

---

## 🔍 Como Verificar Suas Permissões

1. **Acesse o Portainer**
2. No canto superior direito, clique no seu **usuário**
3. Vá em **My account** ou **Minha conta**
4. Você verá suas permissões e roles

**Ou**:

1. **Portainer** → **Users** → Clique no seu usuário
2. Veja a seção **Roles** ou **Funções**

---

## 📤 Métodos para Fazer Upload dos Arquivos

---

## 🚀 Método 1: Usar Console do Container (Mais Prático)

Este é o método mais direto usando o Portainer:

### **Passo 1: Criar Container Temporário**

1. **Portainer** → **Containers** → **Add container**
2. Preencha:
   - **Name**: `upload-temp` (ou qualquer nome)
   - **Image**: `alpine:latest` (ou `ubuntu:latest`)
3. Na aba **Volumes**, clique em **map additional volume**:
   - **Volume**: Selecione **Bind**
   - **Container**: `/upload`
   - **Host**: `/opt/institutobex` (ou o caminho onde você quer colocar os arquivos)
4. Na aba **Command & Logging**:
   - **Command**: `tail -f /dev/null` (para manter o container rodando)
5. Clique em **Deploy the container**

### **Passo 2: Acessar o Console**

1. **Containers** → `upload-temp` → **Console**
2. Selecione **sh** ou **/bin/sh**
3. Clique em **Connect**

### **Passo 3: Instalar Ferramentas e Fazer Upload**

No console, execute:

```bash
# Instalar ferramentas necessárias
apk add git curl wget unzip  # Para Alpine
# ou
apt-get update && apt-get install -y git curl wget unzip  # Para Ubuntu

# Criar diretório
mkdir -p /upload/backend

# Opção A: Clonar do Git (se você tem repositório)
cd /upload
git clone https://seu-repositorio.git
cp -r seu-repositorio/backend /upload/

# Opção B: Baixar arquivo ZIP (se você tem os arquivos em algum lugar)
cd /upload
wget https://seu-servidor.com/backend.zip
unzip backend.zip -d .
# Ou
curl -O https://seu-servidor.com/backend.zip
unzip backend.zip -d .

# Opção C: Criar arquivos manualmente (para arquivos pequenos)
cd /upload/backend
# Use comandos como echo, cat, etc. para criar arquivos
```

### **Passo 4: Verificar e Ajustar Permissões**

```bash
# Ajustar permissões
chown -R 1000:1000 /upload/backend
chmod -R 755 /upload/backend

# Verificar se os arquivos estão lá
ls -la /upload/backend
```

### **Passo 5: Remover Container Temporário**

1. **Containers** → `upload-temp` → **Stop**
2. Depois clique em **Remove**

---

## 🚀 Método 2: Usar Git no Container do Backend

Se você vai criar o container do backend, pode usar Git diretamente:

### **Passo 1: Criar Container do Backend**

1. **Portainer** → **Containers** → **Add container**
2. Preencha:
   - **Name**: `institutobex-backend`
   - **Image**: `node:20-alpine`
3. Na aba **Volumes**, clique em **map additional volume**:
   - **Volume**: Selecione **Bind**
   - **Container**: `/app`
   - **Host**: `/opt/institutobex/backend`
4. Na aba **Command & Logging**:
   - **Working directory**: `/app`
   - **Command**: `sh -c "git clone https://seu-repositorio.git /app && npm install && npm start"`
5. Configure o resto (portas, variáveis de ambiente, etc.)
6. Clique em **Deploy the container**

**Vantagem**: Os arquivos são baixados automaticamente ao iniciar o container.

---

## 🚀 Método 3: Usar Stack com Git Repository

### **Passo 1: Criar Stack**

1. **Portainer** → **Stacks** → **Add stack**
2. Nome: `institutobex`
3. Método: **Repository**
4. Preencha:
   - **Repository URL**: `https://seu-repositorio.git`
   - **Repository reference**: `main` (ou `master`)
   - **Compose path**: `docker-compose.yml` (se estiver na raiz)
5. Clique em **Deploy the stack**

**Nota**: Isso funciona se você tiver um `docker-compose.yml` no repositório.

---

## 🚀 Método 4: Upload Manual via Console (Arquivos Pequenos)

Para arquivos pequenos, você pode criar manualmente:

1. **Criar container** com volume Bind (como no Método 1)
2. **Acessar console**
3. **Criar arquivos**:

```bash
cd /upload/backend

# Criar package.json
cat > package.json << 'EOF'
{
  "name": "institutobex-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
EOF

# Criar server.js
cat > server.js << 'EOF'
const express = require('express');
const app = express();
app.listen(3001, () => console.log('Server running on port 3001'));
EOF

# E assim por diante...
```

**⚠️ Limitação**: Só funciona para arquivos pequenos e poucos arquivos.

---

## 🚀 Método 5: Usar Volume com Arquivo Compartilhado

Se você tem acesso a um servidor web ou compartilhamento:

1. **Coloque os arquivos** em um servidor web (Google Drive, Dropbox com link direto, servidor FTP, etc.)
2. **Use o console** do container para baixar:

```bash
# Baixar do Google Drive (usando wget)
wget --no-check-certificate 'https://drive.google.com/uc?export=download&id=SEU_ID' -O backend.zip
unzip backend.zip -d /upload/

# Baixar de servidor web
wget https://seu-servidor.com/backend.zip
unzip backend.zip -d /upload/
```

---

## 📋 Passo a Passo Completo (Recomendado)

### **Cenário: Você tem os arquivos no seu computador**

**Opção A: Usar Git (Recomendado)**

1. **Crie um repositório Git** (GitHub, GitLab, Bitbucket, etc.)
2. **Faça upload dos arquivos** para o repositório
3. **No Portainer**, use o Método 1 ou 2 para clonar o repositório

**Opção B: Usar Servidor Web Temporário**

1. **Coloque os arquivos** em um servidor web (Google Drive, Dropbox, servidor próprio, etc.)
2. **No Portainer**, use o console para baixar via `wget` ou `curl`

**Opção C: Pedir ao Cliente**

1. **Envie os arquivos** para o cliente (email, Google Drive, etc.)
2. **Peça para ele fazer upload** via SSH
3. **Configure o Portainer** depois

---

## 🔍 Como Descobrir o Caminho no Servidor

Para saber onde colocar os arquivos:

1. **Portainer** → **Containers** → Selecione um container existente
2. Role até **Volumes**
3. Veja o campo **Host** - esse é o caminho no servidor
4. Exemplo: `/opt/institutobex/backend`

**Ou**:

1. **Portainer** → **Volumes**
2. Clique em um volume
3. Veja a seção **Mounts**

---

## ✅ Checklist: Upload dos Arquivos

- [ ] Decidir qual método usar (Git, wget, etc.)
- [ ] Criar container temporário ou usar container do backend
- [ ] Mapear volume Bind para o caminho desejado
- [ ] Acessar console do container
- [ ] Instalar ferramentas (git, wget, unzip, etc.)
- [ ] Fazer download/clonar os arquivos
- [ ] Verificar se os arquivos estão no lugar certo
- [ ] Ajustar permissões (`chown -R 1000:1000` e `chmod -R 755`)
- [ ] Configurar container do backend (se ainda não fez)
- [ ] Testar se o backend está funcionando

---

## 🐛 Problemas Comuns

### **Erro: "Permission denied" ao criar arquivos**

**Solução:**
```bash
# No console do container
chown -R 1000:1000 /upload/backend
chmod -R 755 /upload/backend
```

### **Erro: "git: command not found"**

**Solução:**
```bash
# Instalar Git
apk add git  # Alpine
# ou
apt-get update && apt-get install -y git  # Ubuntu
```

### **Erro: "wget: command not found"**

**Solução:**
```bash
# Instalar wget
apk add wget  # Alpine
# ou
apt-get update && apt-get install -y wget  # Ubuntu
```

### **Arquivos não aparecem no container do backend**

**Solução:**
1. Verifique se o caminho do volume está correto
2. Verifique se os arquivos estão no caminho correto no servidor
3. Verifique permissões

---

## 💡 Dica: Usar Git é Mais Fácil

**Recomendação**: Se possível, use Git:

1. **Crie um repositório** (GitHub, GitLab, etc.)
2. **Faça upload dos arquivos** para o repositório
3. **No Portainer**, use o console para clonar:
   ```bash
   git clone https://seu-repositorio.git /upload/backend
   ```

**Vantagens**:
- ✅ Fácil de atualizar depois
- ✅ Versionamento
- ✅ Não precisa fazer upload manual toda vez

---

## 🔗 Referências

- `CONFIGURACAO_PORTAINER_PASSO_A_PASSO.md` - Como configurar containers
- `COMO_VER_CAMINHOS_ARQUIVOS_PORTAINER.md` - Onde ver caminhos
- `UPLOAD_BACKEND_PORTAINER.md` - Guia completo de upload

---

## 📞 Resumo Rápido

**Para fazer upload sem acesso SSH:**

1. ✅ **Criar container** com volume Bind
2. ✅ **Acessar console** do container
3. ✅ **Usar Git** para clonar repositório OU **wget/curl** para baixar arquivos
4. ✅ **Ajustar permissões**
5. ✅ **Configurar container do backend**

**Pronto!** Agora você sabe como fazer upload dos arquivos usando apenas o Portainer! 🚀

