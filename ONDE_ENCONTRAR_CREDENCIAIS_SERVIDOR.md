# 🔐 Onde Encontrar Credenciais para Acessar o Servidor

## 🎯 Entendendo: Portainer Roda em um Servidor

**Importante**: O Portainer roda em um **servidor** (VPS, servidor dedicado, etc.). Para fazer upload dos arquivos do backend, você precisa das credenciais **desse servidor**, não do Portainer em si!

**Resumo**:
- ✅ Você precisa das credenciais do **servidor onde o Portainer está instalado**
- ✅ Essas credenciais vêm do **provedor de hospedagem** (Hostinger, DigitalOcean, AWS, etc.)
- ✅ Com essas credenciais, você faz upload dos arquivos do backend para o servidor
- ✅ Depois, você configura o Portainer para usar esses arquivos

**📖 Guia completo de upload**: Veja `UPLOAD_BACKEND_PORTAINER.md`

---

## 🎯 Onde Procurar as Credenciais

As credenciais de acesso ao servidor geralmente são fornecidas pelo **provedor de hospedagem** ou **administrador do servidor**. Aqui estão os locais mais comuns:

---

## 📍 Locais Onde Encontrar

### 1. **Email de Boas-Vindas do Provedor**

Quando você contrata um servidor, o provedor envia um email com:
- ✅ **IP do servidor** ou **domínio**
- ✅ **Usuário SSH** (geralmente `root`, `admin`, ou seu nome de usuário)
- ✅ **Senha SSH** (ou instruções para criar)
- ✅ **Porta SSH** (geralmente `22`)

**Provedores comuns:**
- Hostinger
- DigitalOcean
- AWS (EC2)
- Vultr
- Linode
- Contabo
- etc.

---

### 2. **Painel de Controle do Provedor**

Acesse o painel do seu provedor e procure por:

#### **Hostinger**
1. Acesse: https://www.hostinger.com.br/hpanel
2. Vá em **Servidores** ou **VPS**
3. Clique no seu servidor
4. Procure por **SSH Access** ou **Acesso SSH**
5. Você verá:
   - IP do servidor
   - Usuário
   - Senha (ou opção para resetar)
   - Porta

#### **DigitalOcean**
1. Acesse: https://cloud.digitalocean.com
2. Vá em **Droplets**
3. Clique no seu droplet
4. Aba **Access** → **Console Access** ou **Reset Root Password**
5. Ou use **Settings** → **Security** → **SSH Keys**

#### **AWS (EC2)**
1. Acesse: https://console.aws.amazon.com/ec2
2. Vá em **Instances**
3. Selecione sua instância
4. Clique em **Connect**
5. Você verá instruções de conexão
6. **Importante**: Use a chave `.pem` baixada ao criar a instância

---

### 3. **Painel do Portainer**

Se você já tem acesso ao Portainer, pode verificar informações do servidor:

1. **Acesse o Portainer**
2. No canto superior direito, clique no seu **usuário**
3. Vá em **Settings** ou **About**
4. Você pode ver informações do ambiente

**Nota**: O Portainer não mostra credenciais SSH diretamente, mas pode ajudar a identificar o servidor.

---

### 4. **Documentação do Provedor**

Cada provedor tem documentação sobre como acessar o servidor:
- **Hostinger**: https://support.hostinger.com/pt-br/articles/gerenciando-servidores-vps
- **DigitalOcean**: https://docs.digitalocean.com/products/droplets/how-to/connect-with-ssh/
- **AWS**: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AccessingInstances.html

---

## 🔑 Tipos de Credenciais

### **SSH (Acesso via Terminal)**

**Formato:**
```
Usuário: root (ou admin, ou seu usuário)
Senha: sua_senha_aqui
IP: 192.168.1.100 (ou seu-ip.com)
Porta: 22 (padrão)
```

**Exemplo de conexão:**
```bash
ssh root@192.168.1.100
# ou
ssh root@seu-servidor.com
```

---

### **Chave SSH (Mais Seguro)**

Alguns provedores usam chaves SSH ao invés de senha:

**AWS, DigitalOcean, etc.**
- Arquivo `.pem` ou `.ppk`
- Baixado ao criar o servidor
- Precisa de permissões corretas

**Exemplo:**
```bash
# Linux/Mac
chmod 400 minha-chave.pem
ssh -i minha-chave.pem root@seu-servidor.com

# Windows (usando PowerShell)
ssh -i C:\caminho\minha-chave.pem root@seu-servidor.com
```

---

### **FTP/SFTP (Upload de Arquivos)**

Alguns provedores oferecem acesso FTP:

**Hostinger, cPanel, etc.**
- Usuário FTP
- Senha FTP
- Servidor FTP: `ftp.seu-servidor.com` ou IP
- Porta: `21` (FTP) ou `22` (SFTP)

**Ferramentas:**
- **FileZilla** (gratuito)
- **WinSCP** (Windows)
- **Cyberduck** (Mac/Windows)

---

## 📋 Checklist: O Que Você Precisa

Para fazer upload de arquivos, você precisa de:

- [ ] **IP do servidor** ou **domínio**
- [ ] **Usuário SSH** (ex: `root`, `admin`)
- [ ] **Senha SSH** ou **chave SSH** (arquivo `.pem`)
- [ ] **Porta SSH** (geralmente `22`)
- [ ] **Caminho onde colocar os arquivos** (ex: `/opt/institutobex/backend`)

---

## 🚀 Como Usar as Credenciais

### **Método 1: SSH (Terminal)**

#### **Windows (PowerShell ou CMD)**
```bash
ssh root@seu-servidor.com
# Digite a senha quando solicitado
```

#### **Linux/Mac**
```bash
ssh root@seu-servidor.com
# Digite a senha quando solicitado
```

#### **Com chave SSH (Linux/Mac)**
```bash
chmod 400 minha-chave.pem
ssh -i minha-chave.pem root@seu-servidor.com
```

---

### **Método 2: SCP (Upload de Arquivos)**

#### **Windows (PowerShell)**
```powershell
# Upload de arquivo
scp arquivo.txt root@seu-servidor.com:/opt/institutobex/

# Upload de pasta
scp -r backend root@seu-servidor.com:/opt/institutobex/
```

#### **Linux/Mac**
```bash
# Upload de arquivo
scp arquivo.txt root@seu-servidor.com:/opt/institutobex/

# Upload de pasta
scp -r backend root@seu-servidor.com:/opt/institutobex/
```

#### **Com chave SSH**
```bash
scp -i minha-chave.pem -r backend root@seu-servidor.com:/opt/institutobex/
```

---

### **Método 3: SFTP (FileZilla, WinSCP)**

1. **Abra o FileZilla** (ou WinSCP)
2. Preencha:
   - **Host**: IP ou domínio do servidor
   - **Usuário**: `root` (ou seu usuário)
   - **Senha**: sua senha
   - **Porta**: `22` (SFTP) ou `21` (FTP)
3. Clique em **Conectar**
4. Navegue até o diretório desejado
5. Arraste e solte os arquivos

---

## 🔍 Como Descobrir se Você Já Tem Acesso

### **Teste 1: Tentar Conectar via SSH**

```bash
# Tente conectar
ssh root@seu-servidor.com

# Se pedir senha, você tem acesso!
# Se der erro, você precisa das credenciais
```

### **Teste 2: Verificar no Portainer**

1. Acesse o Portainer
2. Vá em **Containers** > Selecione um container
3. Clique em **Console**
4. Se conseguir abrir o console, você tem acesso ao servidor (via Portainer)

---

## ⚠️ Se Você Não Tem as Credenciais

### **Opção 1: Contatar o Provedor**

1. Acesse o suporte do provedor
2. Solicite:
   - Reset de senha SSH
   - Informações de acesso
   - Criação de novo usuário SSH

### **Opção 2: Resetar Senha no Painel**

Muitos provedores permitem resetar a senha:
- **Hostinger**: Painel → Servidor → Reset Password
- **DigitalOcean**: Droplet → Access → Reset Root Password
- **AWS**: EC2 → Instance → Actions → Security → Reset Password

### **Opção 3: Usar Portainer para Upload**

Se você tem acesso ao Portainer, pode:
1. Usar o **Console** do container
2. Usar comandos como `wget` ou `curl` para baixar arquivos
3. Ou editar arquivos diretamente no container

---

## 📝 Exemplo Prático: Hostinger

### **Passo a Passo**

1. **Acesse o painel Hostinger**
   - https://www.hostinger.com.br/hpanel
   - Faça login

2. **Vá em Servidores/VPS**
   - Menu lateral → **Servidores** ou **VPS**
   - Clique no seu servidor

3. **Encontre SSH Access**
   - Procure por **SSH Access** ou **Acesso SSH**
   - Você verá:
     ```
     IP: 123.456.789.0
     Usuário: root
     Senha: ******** (clique para revelar)
     Porta: 22
     ```

4. **Use as credenciais**
   ```bash
   ssh root@123.456.789.0
   # Digite a senha quando solicitado
   ```

---

## 🔐 Segurança

### **Boas Práticas**

1. ✅ **Use chaves SSH** ao invés de senhas (mais seguro)
2. ✅ **Altere a senha padrão** se fornecida pelo provedor
3. ✅ **Use senhas fortes** (mínimo 16 caracteres, misture letras, números, símbolos)
4. ✅ **Não compartilhe credenciais** publicamente
5. ✅ **Use SFTP** ao invés de FTP (mais seguro)

### **Gerar Chave SSH (Recomendado)**

```bash
# Gerar chave SSH
ssh-keygen -t rsa -b 4096 -C "seu-email@exemplo.com"

# Copiar chave pública para o servidor
ssh-copy-id root@seu-servidor.com

# Agora você pode conectar sem senha!
ssh root@seu-servidor.com
```

---

## 📞 Próximos Passos

Depois de obter as credenciais:

1. ✅ **Teste a conexão SSH**
2. ✅ **Crie o diretório** para os arquivos (ex: `/opt/institutobex/backend`)
3. ✅ **Faça upload dos arquivos** (via SCP, SFTP, ou Git)
4. ✅ **Configure permissões** (`chmod` e `chown`)
5. ✅ **Configure o Portainer** com o caminho correto

**Guia completo**: Veja `CONFIGURACAO_PORTAINER_PASSO_A_PASSO.md`

---

## 🔗 Referências

- `UPLOAD_BACKEND_PORTAINER.md` - ⭐ **GUIA COMPLETO** de como fazer upload do backend para o servidor do Portainer
- `CONFIGURACAO_PORTAINER_PASSO_A_PASSO.md` - Como configurar no Portainer
- `COMO_VER_CAMINHOS_ARQUIVOS_PORTAINER.md` - Onde ver caminhos no Portainer
- `GUIA_PORTAINER.md` - Guia completo do Portainer

---

## ❓ Perguntas Frequentes

### **Q: Não recebi email com credenciais**
**A:** Verifique a pasta de spam. Se não encontrar, acesse o painel do provedor e procure por "SSH Access" ou "Acesso SSH".

### **Q: Esqueci a senha SSH**
**A:** Acesse o painel do provedor e procure por "Reset Password" ou "Reset Root Password".

### **Q: Posso usar o Portainer para fazer upload?**
**A:** Sim, você pode usar o Console do container no Portainer, mas SSH é mais prático para uploads grandes.

### **Q: Qual porta usar?**
**A:** SSH geralmente usa porta `22`. FTP usa `21`. SFTP usa `22` (mesma do SSH).

### **Q: Preciso de acesso root?**
**A:** Não necessariamente, mas facilita. Você pode usar um usuário com permissões sudo.

---

**💡 Dica**: Guarde as credenciais em um local seguro (gerenciador de senhas) e nunca as compartilhe publicamente!

