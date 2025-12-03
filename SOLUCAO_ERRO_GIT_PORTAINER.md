# 🔧 Solução: Erro de Autenticação Git no Portainer

## 🐛 Erro Encontrado

```
invalid username or token
Password authentication is not supported for git operations
```

## 🎯 Causa do Problema

Este erro acontece quando:
- ✅ O repositório é **privado** e precisa de autenticação
- ❌ Você está tentando usar **senha** ao invés de **token**
- ❌ O **token está incorreto** ou expirado
- ❌ O **username está incorreto**

**Importante**: GitHub, GitLab e outros serviços **não aceitam mais senhas** para operações Git via HTTPS. Você precisa usar um **token de acesso pessoal**.

---

## ✅ Soluções

---

## 🔑 Solução 1: Usar Token de Acesso Pessoal (Recomendado)

### **Passo 1: Criar Token no GitHub/GitLab**

#### **GitHub:**
1. Acesse: https://github.com/settings/tokens
2. Clique em **Generate new token** → **Generate new token (classic)**
3. Dê um nome: `Portainer Access`
4. Selecione escopos:
   - ✅ `repo` (acesso completo a repositórios privados)
5. Clique em **Generate token**
6. **COPIE O TOKEN** (você só verá uma vez!)

#### **GitLab:**
1. Acesse: https://gitlab.com/-/user_settings/personal_access_tokens
2. Dê um nome: `Portainer Access`
3. Selecione escopos:
   - ✅ `read_repository`
   - ✅ `write_repository` (se precisar fazer push)
4. Clique em **Create personal access token**
5. **COPIE O TOKEN**

#### **Bitbucket:**
1. Acesse: https://bitbucket.org/account/settings/app-passwords/
2. Clique em **Create app password**
3. Dê um nome: `Portainer Access`
4. Selecione permissões:
   - ✅ `Repositories: Read`
5. Clique em **Create**
6. **COPIE A SENHA** (é o token)

---

### **Passo 2: Usar Token no Console do Portainer**

No console do container, use o token no lugar da senha:

#### **Método A: Inserir Token na URL (Mais Seguro)**

```bash
# GitHub
git clone https://SEU_TOKEN@github.com/usuario/repositorio.git /upload/backend

# GitLab
git clone https://oauth2:SEU_TOKEN@gitlab.com/usuario/repositorio.git /upload/backend

# Bitbucket
git clone https://usuario:SEU_TOKEN@bitbucket.org/usuario/repositorio.git /upload/backend
```

**⚠️ Atenção**: O token aparecerá no histórico de comandos. Use o Método B se preferir mais segurança.

---

#### **Método B: Usar Git Credential Helper (Mais Seguro)**

```bash
# Configurar Git
git config --global credential.helper store

# Fazer clone (vai pedir username e password)
git clone https://github.com/usuario/repositorio.git /upload/backend

# Quando pedir:
# Username: seu-usuario-github
# Password: SEU_TOKEN (cole o token aqui, não a senha!)
```

---

#### **Método C: Usar Variável de Ambiente**

```bash
# Definir token como variável
export GIT_TOKEN="seu-token-aqui"

# Usar na URL
git clone https://${GIT_TOKEN}@github.com/usuario/repositorio.git /upload/backend

# Ou para GitLab
git clone https://oauth2:${GIT_TOKEN}@gitlab.com/usuario/repositorio.git /upload/backend
```

---

## 🔑 Solução 2: Usar SSH Key (Alternativa)

Se você tem acesso SSH, pode usar chave SSH:

### **Passo 1: Gerar Chave SSH (No Seu Computador)**

```bash
# Gerar chave SSH
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"

# Ou se não suportar ed25519:
ssh-keygen -t rsa -b 4096 -C "seu-email@exemplo.com"
```

### **Passo 2: Adicionar Chave no GitHub/GitLab**

#### **GitHub:**
1. Copie a chave pública: `cat ~/.ssh/id_ed25519.pub`
2. Acesse: https://github.com/settings/keys
3. Clique em **New SSH key**
4. Cole a chave e salve

#### **GitLab:**
1. Copie a chave pública: `cat ~/.ssh/id_ed25519.pub`
2. Acesse: https://gitlab.com/-/profile/keys
3. Cole a chave e salve

### **Passo 3: Usar SSH no Console do Portainer**

```bash
# Copiar chave privada para o container (via console)
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Cole a chave privada (você precisa copiar do seu computador)
cat > ~/.ssh/id_ed25519 << 'EOF'
-----BEGIN OPENSSH PRIVATE KEY-----
[cole sua chave privada aqui]
-----END OPENSSH PRIVATE KEY-----
EOF

chmod 600 ~/.ssh/id_ed25519

# Testar conexão
ssh -T git@github.com
# Deve mostrar: "Hi usuario! You've successfully authenticated..."

# Clonar usando SSH
git clone git@github.com:usuario/repositorio.git /upload/backend
```

**⚠️ Atenção**: Não é recomendado colocar chaves privadas em containers. Use tokens se possível.

---

## 🔑 Solução 3: Tornar Repositório Público (Temporariamente)

Se o repositório pode ser público temporariamente:

1. **GitHub/GitLab** → Repositório → **Settings** → **General** → **Visibility**
2. Mude para **Public**
3. Faça o clone sem autenticação:
   ```bash
   git clone https://github.com/usuario/repositorio.git /upload/backend
   ```
4. Depois pode voltar para privado

---

## 🔑 Solução 4: Fazer Upload Sem Git (Alternativa)

Se não conseguir usar Git, você pode fazer upload de outras formas:

### **Opção A: Baixar ZIP do Repositório**

```bash
# No console do container
apk add wget unzip  # ou apt-get install -y wget unzip

# GitHub: Baixar ZIP
wget https://github.com/usuario/repositorio/archive/refs/heads/main.zip -O repo.zip
unzip repo.zip -d /upload/
mv /upload/repositorio-main/backend /upload/backend

# GitLab: Baixar ZIP
wget https://gitlab.com/usuario/repositorio/-/archive/main/repositorio-main.zip -O repo.zip
unzip repo.zip -d /upload/
mv /upload/repositorio-main/backend /upload/backend
```

**⚠️ Limitação**: Só funciona para repositórios públicos ou se você tiver link de download.

---

### **Opção B: Upload Manual via Servidor Web**

1. **Compacte os arquivos** no seu computador: `zip -r backend.zip backend/`
2. **Coloque em um servidor web** (Google Drive, Dropbox, servidor próprio, etc.)
3. **No console do Portainer**:
   ```bash
   apk add wget unzip
   wget https://seu-servidor.com/backend.zip -O backend.zip
   unzip backend.zip -d /upload/
   ```

---

### **Opção C: Usar SCP (Se Tiver Acesso SSH)**

Se você conseguir acesso SSH ao servidor (mesmo que temporário):

```bash
# Do seu computador
scp -r backend root@servidor:/opt/institutobex/
```

---

## 📋 Passo a Passo Completo (Recomendado)

### **Usando Token do GitHub:**

1. **Criar token** no GitHub (veja Solução 1)
2. **No console do Portainer**:
   ```bash
   # Instalar Git
   apk add git  # ou apt-get install -y git
   
   # Criar diretório
   mkdir -p /upload/backend
   
   # Clonar usando token
   git clone https://SEU_TOKEN@github.com/usuario/repositorio.git /upload/temp
   cp -r /upload/temp/backend /upload/
   rm -rf /upload/temp
   
   # Ajustar permissões
   chown -R 1000:1000 /upload/backend
   chmod -R 755 /upload/backend
   
   # Verificar
   ls -la /upload/backend
   ```

---

## 🐛 Problemas Comuns

### **Erro: "fatal: could not read Username"**

**Solução**: Use o token na URL:
```bash
git clone https://SEU_TOKEN@github.com/usuario/repositorio.git
```

### **Erro: "fatal: Authentication failed"**

**Solução**: 
- Verifique se o token está correto
- Verifique se o token não expirou
- Verifique se o token tem permissões `repo` (GitHub) ou `read_repository` (GitLab)

### **Erro: "repository not found"**

**Solução**:
- Verifique se o repositório existe
- Verifique se o token tem acesso ao repositório
- Verifique se o nome do usuário/repositório está correto

### **Token não funciona**

**Solução**:
- Crie um novo token
- Verifique os escopos/permissões do token
- Para GitHub, use token "classic", não "fine-grained"

---

## 🔒 Segurança

### **Boas Práticas:**

1. ✅ **Use tokens** ao invés de senhas
2. ✅ **Não compartilhe tokens** publicamente
3. ✅ **Revogue tokens** que não está mais usando
4. ✅ **Use tokens com escopos mínimos** necessários
5. ✅ **Não coloque tokens** em arquivos versionados

### **Limpar Histórico (Se Usou Token na URL):**

```bash
# Limpar histórico do bash
history -c
history -w

# Ou usar método com credential helper (mais seguro)
```

---

## 📝 Exemplo Completo: GitHub com Token

```bash
# 1. Instalar Git
apk add git

# 2. Configurar Git (opcional)
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"

# 3. Clonar usando token
export GIT_TOKEN="ghp_seu_token_aqui"
git clone https://${GIT_TOKEN}@github.com/usuario/repositorio.git /upload/temp

# 4. Mover apenas a pasta backend
cp -r /upload/temp/backend /upload/
rm -rf /upload/temp

# 5. Limpar variável (segurança)
unset GIT_TOKEN

# 6. Ajustar permissões
chown -R 1000:1000 /upload/backend
chmod -R 755 /upload/backend
```

---

## 🔗 Referências

- `COMO_FAZER_UPLOAD_ARQUIVOS_PORTAINER.md` - Como fazer upload no Portainer
- `CONFIGURACAO_PORTAINER_PASSO_A_PASSO.md` - Configuração completa

---

## ✅ Resumo Rápido

**Para resolver o erro:**

1. ✅ **Crie um token** no GitHub/GitLab (não use senha!)
2. ✅ **Use o token na URL** do clone:
   ```bash
   git clone https://SEU_TOKEN@github.com/usuario/repositorio.git
   ```
3. ✅ **Ou use credential helper** e cole o token quando pedir senha

**Pronto!** Agora você consegue clonar repositórios privados no Portainer! 🚀

