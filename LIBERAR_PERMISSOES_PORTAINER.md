# 🔓 Como Liberar Permissões no Portainer para Ver Credenciais SSH

## 🎯 Situação

Você tem acesso ao Portainer, mas não consegue ver as credenciais SSH do servidor. Isso acontece porque seu usuário não tem permissões suficientes.

---

## 👨‍💼 Para o Administrador (Cliente)

O administrador precisa dar permissões adequadas ao seu usuário. Aqui está como fazer:

---

## 📋 PASSO 1: Acessar Configurações de Usuário

1. **Acesse o Portainer** como administrador
2. No menu lateral, clique em **Users** (ou **Usuários**)
3. Encontre o usuário que precisa de permissões
4. Clique no usuário para editar

---

## 📋 PASSO 2: Configurar Permissões

### **Opção A: Dar Acesso de Administrador (Mais Simples)**

1. Na página do usuário, procure por **Role** ou **Função**
2. Selecione **Administrator** (ou **Admin**)
3. Salve as alterações

**⚠️ Atenção**: Isso dá acesso total ao Portainer. Use apenas se confiar no usuário.

---

### **Opção B: Criar Role Personalizada (Mais Seguro)**

1. No menu lateral, vá em **Roles** (ou **Funções**)
2. Clique em **Add role** (ou **Adicionar função**)
3. Dê um nome: `Developer` ou `Desenvolvedor`
4. Configure as permissões:

#### **Permissões Necessárias:**

✅ **Containers**:
- View
- Create
- Update
- Delete
- Exec console
- View logs

✅ **Volumes**:
- View
- Create
- Update
- Delete

✅ **Networks**:
- View
- Create
- Update
- Delete

✅ **Stacks**:
- View
- Create
- Update
- Delete

✅ **Settings** (opcional, para ver informações do servidor):
- View

5. Salve a role
6. Volte em **Users** e atribua essa role ao usuário

---

## 📋 PASSO 3: Verificar Permissões

Após configurar, o usuário deve conseguir:
- ✅ Ver e gerenciar containers
- ✅ Ver e criar volumes
- ✅ Ver logs dos containers
- ✅ Acessar console dos containers
- ✅ Ver informações do ambiente (Settings → About)

---

## ⚠️ Limitação: Credenciais SSH

**Importante**: O Portainer **NÃO armazena credenciais SSH** do servidor. As credenciais SSH são do **sistema operacional do servidor**, não do Portainer.

**O que o Portainer mostra:**
- ✅ Informações dos containers
- ✅ Volumes e seus caminhos
- ✅ Logs dos containers
- ✅ Console dos containers

**O que o Portainer NÃO mostra:**
- ❌ Senha SSH do servidor
- ❌ Chaves SSH do servidor
- ❌ Credenciais de acesso ao servidor

---

## 🔄 Alternativas: Fazer Upload Sem Credenciais SSH

Se você não tem acesso SSH direto, existem alternativas:

---

### **Alternativa 1: Usar Console do Container no Portainer**

Você pode usar o console do container para baixar arquivos ou usar Git:

1. **Portainer** → **Containers** → Selecione um container (ou crie um temporário)
2. Clique em **Console**
3. Selecione **sh** ou **/bin/sh**
4. Clique em **Connect**

Agora você pode usar comandos:

```bash
# Instalar ferramentas (se necessário)
apk add git curl wget  # Para Alpine Linux
# ou
apt-get update && apt-get install -y git curl wget  # Para Debian/Ubuntu

# Clonar repositório Git
cd /opt/institutobex
git clone https://seu-repositorio.git
cd seu-repositorio
cp -r backend /opt/institutobex/

# Ou baixar arquivos via wget/curl
wget https://seu-servidor.com/backend.zip
unzip backend.zip -d /opt/institutobex/
```

---

### **Alternativa 2: Upload via Volume Bind + Portainer**

1. **Peça ao administrador** para criar um volume temporário ou usar um existente
2. **Configure um container temporário** com volume Bind apontando para `/tmp/upload`
3. **Use o console** do container para mover arquivos

---

### **Alternativa 3: Usar Stack com Git no Portainer**

1. **Portainer** → **Stacks** → **Add stack**
2. Use o método **Repository**
3. Configure para clonar do Git e fazer build automaticamente

**Exemplo de docker-compose.yml**:
```yaml
version: '3.8'

services:
  backend:
    image: node:20-alpine
    container_name: institutobex-backend
    working_dir: /app
    command: sh -c "git clone https://seu-repositorio.git /app && npm install && npm start"
    volumes:
      - ./backend:/app
    # ... resto da configuração
```

---

### **Alternativa 4: Pedir ao Administrador para Fazer Upload**

Se você não tem acesso SSH, a opção mais prática é:

1. **Compacte os arquivos do backend** no seu computador
2. **Envie para o administrador** (via email, Google Drive, etc.)
3. **Peça para ele fazer upload** via SSH para o caminho correto
4. **Configure o Portainer** depois

---

## 📝 Instruções para o Administrador Fazer Upload

Envie estas instruções para o administrador:

### **Passo 1: Conectar ao Servidor**
```bash
ssh root@IP_DO_SERVIDOR
# ou
ssh root@dominio-do-servidor.com
```

### **Passo 2: Criar Diretório**
```bash
sudo mkdir -p /opt/institutobex/backend
sudo chown -R 1000:1000 /opt/institutobex/backend
sudo chmod -R 755 /opt/institutobex/backend
```

### **Passo 3: Fazer Upload**
```bash
# Se ele recebeu um arquivo .zip
cd /opt/institutobex
unzip backend.zip -d .

# Ou se recebeu via SCP
scp -r backend root@servidor:/opt/institutobex/
```

### **Passo 4: Verificar**
```bash
ls -la /opt/institutobex/backend
# Deve mostrar: package.json, server.js, etc.
```

---

## 🔍 Como Descobrir o Caminho dos Arquivos no Portainer

Mesmo sem acesso SSH, você pode descobrir onde os arquivos devem ficar:

1. **Portainer** → **Containers** → Selecione um container existente
2. Role até a seção **Volumes**
3. Veja o campo **Host** - esse é o caminho no servidor
4. Exemplo: `/opt/institutobex/backend`

**Ou**:

1. **Portainer** → **Volumes**
2. Clique em um volume
3. Veja a seção **Mounts** para ver onde está montado

---

## 📋 Checklist para o Administrador

Peça ao administrador para:

- [ ] Dar permissões adequadas no Portainer (Administrator ou role personalizada)
- [ ] Fazer upload dos arquivos do backend para o servidor (se você não tiver acesso SSH)
- [ ] Informar o caminho onde os arquivos foram colocados (ex: `/opt/institutobex/backend`)
- [ ] Configurar permissões corretas (`chown -R 1000:1000` e `chmod -R 755`)

---

## 💡 Solução Recomendada

**A melhor solução** é pedir ao administrador para:

1. ✅ **Fazer upload dos arquivos** via SSH (ele tem acesso)
2. ✅ **Informar o caminho** onde colocou (ex: `/opt/institutobex/backend`)
3. ✅ **Dar permissões** no Portainer para você configurar os containers

Assim você pode:
- ✅ Configurar os containers no Portainer
- ✅ Ver logs
- ✅ Gerenciar os containers
- ✅ Fazer atualizações futuras (pedindo upload novamente ou usando Git)

---

## 🔗 Referências

- `UPLOAD_BACKEND_PORTAINER.md` - Como fazer upload do backend
- `CONFIGURACAO_PORTAINER_PASSO_A_PASSO.md` - Como configurar containers
- `COMO_VER_CAMINHOS_ARQUIVOS_PORTAINER.md` - Onde ver caminhos no Portainer

---

## 📞 Resumo para Enviar ao Cliente

**Mensagem sugerida para o cliente:**

```
Olá!

Para eu conseguir configurar o backend no Portainer, preciso de:

1. **Permissões no Portainer**: 
   - Acesse Portainer → Users → [meu usuário]
   - Mude a Role para "Administrator" (ou crie uma role com permissões de Containers, Volumes, Networks, Stacks)

2. **Upload dos arquivos do backend**:
   - Preciso que você faça upload da pasta "backend" para o servidor
   - Caminho sugerido: /opt/institutobex/backend
   - Comandos:
     ssh root@servidor
     mkdir -p /opt/institutobex/backend
     # Fazer upload dos arquivos (via SCP, Git, ou outro método)
     chown -R 1000:1000 /opt/institutobex/backend
     chmod -R 755 /opt/institutobex/backend

3. **Informar o caminho**: Me diga onde você colocou os arquivos para eu configurar no Portainer.

Obrigado!
```

---

**Pronto!** Agora você tem todas as informações para pedir as permissões e fazer o upload dos arquivos! 🚀


