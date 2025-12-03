# 📤 Como Fazer Upload do Backend para o Servidor do Portainer

## 🎯 Entendendo a Situação

Quando você hospeda o backend no **Portainer**, você precisa:

1. ✅ **Fazer upload dos arquivos do backend** para o **servidor onde o Portainer está rodando**
2. ✅ **Configurar o Portainer** para usar esses arquivos (via volume Bind)
3. ✅ O Portainer criará um container que acessa esses arquivos

**Resumo**: Você precisa das credenciais do **servidor onde o Portainer está instalado**, não do Portainer em si!

---

## 🔍 Onde Encontrar as Credenciais do Servidor

O Portainer roda em um servidor (VPS, servidor dedicado, etc.). Você precisa das credenciais **desse servidor**:

### **Opção 1: Se Você Contratou o Servidor**

As credenciais vêm do **provedor de hospedagem** onde você contratou o servidor:

#### **Hostinger**
1. Acesse: https://www.hostinger.com.br/hpanel
2. Vá em **Servidores** ou **VPS**
3. Clique no seu servidor
4. Procure por **SSH Access** ou **Acesso SSH**
5. Você verá:
   - **IP do servidor**
   - **Usuário** (geralmente `root`)
   - **Senha SSH**
   - **Porta** (geralmente `22`)

#### **DigitalOcean**
1. Acesse: https://cloud.digitalocean.com
2. Vá em **Droplets**
3. Clique no seu droplet
4. Aba **Access** → **Console Access** ou **Reset Root Password**

#### **AWS (EC2)**
1. Acesse: https://console.aws.amazon.com/ec2
2. Vá em **Instances**
3. Selecione sua instância
4. Clique em **Connect** para ver instruções

#### **Outros Provedores**
- Vultr, Linode, Contabo, etc.
- Procure por "SSH Access" ou "Acesso SSH" no painel

---

### **Opção 2: Se Alguém Configurou o Servidor para Você**

Peça para a pessoa que configurou:
- ✅ **IP do servidor** ou **domínio**
- ✅ **Usuário SSH** (ex: `root`, `admin`)
- ✅ **Senha SSH** ou **chave SSH** (arquivo `.pem`)
- ✅ **Porta SSH** (geralmente `22`)

---

### **Opção 3: Se Você Já Tem Acesso ao Portainer**

Se você já consegue acessar o Portainer via navegador, você pode:

1. **Verificar informações do servidor**:
   - No Portainer, vá em **Settings** → **About**
   - Você pode ver informações do ambiente

2. **Usar o Console do Portainer** (alternativa):
   - Containers → Selecione um container → **Console**
   - Mas isso não é ideal para uploads grandes

---

## 📤 Passo a Passo: Upload dos Arquivos do Backend

### **PASSO 1: Preparar os Arquivos Localmente**

No seu computador, certifique-se de que você tem a pasta `backend` com todos os arquivos:

```
backend/
├── config/
├── data/
├── middleware/
├── routes/
├── schema/
├── scripts/
├── package.json
├── server.js
└── .env (opcional, você pode criar no servidor)
```

---

### **PASSO 2: Conectar ao Servidor via SSH**

#### **Windows (PowerShell ou CMD)**
```powershell
ssh root@IP_DO_SERVIDOR
# ou
ssh root@dominio-do-servidor.com
```

#### **Linux/Mac**
```bash
ssh root@IP_DO_SERVIDOR
# ou
ssh root@dominio-do-servidor.com
```

**Digite a senha quando solicitado.**

---

### **PASSO 3: Criar Diretório no Servidor**

Após conectar, crie o diretório onde os arquivos ficarão:

```bash
# Criar diretório
sudo mkdir -p /opt/institutobex/backend

# Dar permissões (importante!)
sudo chown -R 1000:1000 /opt/institutobex/backend
sudo chmod -R 755 /opt/institutobex/backend
```

**Nota**: O caminho `/opt/institutobex/backend` é um exemplo. Você pode usar outro caminho, mas **anote qual você usou** para configurar no Portainer depois!

---

### **PASSO 4: Fazer Upload dos Arquivos**

#### **Método A: Via SCP (Recomendado)**

**Do seu computador** (em um novo terminal, sem estar conectado via SSH):

##### **Windows (PowerShell)**
```powershell
# Upload de toda a pasta backend
scp -r backend root@IP_DO_SERVIDOR:/opt/institutobex/

# Ou se estiver na pasta do projeto
scp -r .\backend root@IP_DO_SERVIDOR:/opt/institutobex/
```

##### **Linux/Mac**
```bash
# Upload de toda a pasta backend
scp -r backend root@IP_DO_SERVIDOR:/opt/institutobex/

# Ou se estiver na pasta do projeto
scp -r ./backend root@IP_DO_SERVIDOR:/opt/institutobex/
```

##### **Com chave SSH (se usar)**
```bash
scp -i minha-chave.pem -r backend root@IP_DO_SERVIDOR:/opt/institutobex/
```

---

#### **Método B: Via SFTP (FileZilla, WinSCP)**

1. **Abra o FileZilla** (ou WinSCP)
2. Preencha:
   - **Host**: IP ou domínio do servidor
   - **Usuário**: `root` (ou seu usuário)
   - **Senha**: sua senha SSH
   - **Porta**: `22` (SFTP)
3. Clique em **Conectar**
4. Navegue até `/opt/institutobex/` no servidor
5. Arraste a pasta `backend` do seu computador para o servidor

---

#### **Método C: Via Git (Se o Servidor Tem Git)**

1. **No servidor** (via SSH):
   ```bash
   cd /opt/institutobex
   git clone seu-repositorio-git
   cd seu-repositorio-git
   # Os arquivos estarão aqui
   ```

2. **Ou copiar apenas a pasta backend**:
   ```bash
   cp -r seu-repositorio-git/backend /opt/institutobex/
   ```

---

### **PASSO 5: Verificar se os Arquivos Foram Enviados**

**No servidor** (via SSH):

```bash
# Verificar se os arquivos estão lá
ls -la /opt/institutobex/backend

# Você deve ver:
# - package.json
# - server.js
# - config/
# - routes/
# etc.
```

---

### **PASSO 6: Configurar o Portainer**

Agora que os arquivos estão no servidor, configure o Portainer:

1. **Acesse o Portainer** (via navegador)
2. Vá em **Containers** → **Add container**
3. Preencha:
   - **Name**: `institutobex-backend`
   - **Image**: `node:20-alpine`
4. Na aba **Volumes**, clique em **map additional volume**:
   - **Volume**: Selecione **Bind**
   - **Container**: `/app`
   - **Host**: `/opt/institutobex/backend` ← **O CAMINHO ONDE VOCÊ FEZ UPLOAD!**
5. Configure o resto (portas, variáveis de ambiente, etc.)
6. Clique em **Deploy the container**

**📖 Guia completo**: Veja `CONFIGURACAO_PORTAINER_PASSO_A_PASSO.md`

---

## 🔄 Atualizar Arquivos no Futuro

Quando você precisar atualizar os arquivos:

### **Método 1: Via SCP (Novamente)**
```bash
# Do seu computador
scp -r backend root@IP_DO_SERVIDOR:/opt/institutobex/
```

### **Método 2: Via Git (No Servidor)**
```bash
# Conecte via SSH
ssh root@IP_DO_SERVIDOR

# Vá até o diretório
cd /opt/institutobex/backend

# Atualize via Git
git pull

# Ou se você fez upload manual, faça upload novamente
```

### **Método 3: Reiniciar Container no Portainer**
Após atualizar os arquivos:
1. Portainer → Containers → `institutobex-backend`
2. Clique em **Restart** (ou **Recreate** se necessário)

---

## ⚠️ Importante: Permissões

O container precisa ter permissão para acessar os arquivos. Certifique-se de:

```bash
# No servidor (via SSH)
sudo chown -R 1000:1000 /opt/institutobex/backend
sudo chmod -R 755 /opt/institutobex/backend
```

**Por quê?** O container Node.js geralmente roda como usuário `1000`, então os arquivos precisam ter permissões corretas.

---

## 📋 Checklist Completo

- [ ] Obter credenciais SSH do servidor (IP, usuário, senha)
- [ ] Conectar ao servidor via SSH
- [ ] Criar diretório `/opt/institutobex/backend` (ou outro de sua escolha)
- [ ] Configurar permissões (`chown` e `chmod`)
- [ ] Fazer upload dos arquivos do backend (via SCP, SFTP, ou Git)
- [ ] Verificar se os arquivos estão no servidor
- [ ] Configurar container no Portainer com o caminho correto
- [ ] Testar se o backend está funcionando

---

## 🐛 Problemas Comuns

### **Erro: "Permission denied"**
**Solução:**
```bash
sudo chown -R 1000:1000 /opt/institutobex/backend
sudo chmod -R 755 /opt/institutobex/backend
```

### **Erro: "Connection refused" ao conectar via SSH**
**Solução:**
- Verifique se o IP está correto
- Verifique se a porta SSH está correta (geralmente `22`)
- Verifique se o firewall permite conexões SSH

### **Erro: "No such file or directory" no container**
**Solução:**
- Verifique se o caminho no Portainer está correto
- Verifique se os arquivos realmente estão no servidor
- Verifique se o caminho é absoluto (começa com `/`)

### **Container não inicia**
**Solução:**
1. Verifique os logs: Portainer → Containers → `institutobex-backend` → **Logs**
2. Verifique se o `package.json` está presente
3. Verifique se as permissões estão corretas

---

## 🔗 Referências

- `ONDE_ENCONTRAR_CREDENCIAIS_SERVIDOR.md` - Onde encontrar credenciais
- `CONFIGURACAO_PORTAINER_PASSO_A_PASSO.md` - Como configurar no Portainer
- `COMO_VER_CAMINHOS_ARQUIVOS_PORTAINER.md` - Onde ver caminhos no Portainer

---

## 💡 Dica Final

**Anote o caminho que você usou!** Você precisará dele ao configurar o Portainer:
- Exemplo: `/opt/institutobex/backend`
- Esse caminho vai no campo **Host** do volume Bind no Portainer

---

**Pronto!** Agora você sabe como fazer upload dos arquivos do backend para o servidor onde o Portainer está rodando! 🚀


