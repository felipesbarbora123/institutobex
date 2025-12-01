# 📁 Como Ver e Configurar Caminhos de Arquivos no Portainer

## 🎯 Onde Ver os Caminhos dos Arquivos no Servidor

No Portainer, você pode ver e configurar os caminhos onde os arquivos ficam no servidor através de **Volumes** (especialmente volumes do tipo **Bind**).

---

## 📍 Localização no Portainer

### Opção 1: Ver Caminhos em Containers Existentes

1. **Acesse o Portainer**
2. No menu lateral, clique em **Containers**
3. Clique no container que você quer verificar (ex: `institutobex-backend`)
4. Role a página até a seção **Volumes**
5. Você verá algo como:

```
Volumes
├── Bind mount
│   ├── Container: /app
│   └── Host: /opt/institutobex/backend  ← ESTE É O CAMINHO NO SERVIDOR
```

**O caminho "Host" é onde os arquivos ficam no servidor!**

---

### Opção 2: Ver Caminhos em Volumes

1. No menu lateral, clique em **Volumes**
2. Você verá uma lista de volumes
3. Clique em um volume para ver detalhes
4. Na seção **Mounts**, você verá:
   - Qual container está usando
   - O caminho no servidor (se for volume Bind)

---

## 🔧 Como Configurar/Editar o Caminho

### Para Containers Existentes

1. **Containers** > Selecione o container (ex: `institutobex-backend`)
2. Clique em **Duplicate/Edit** (botão no topo)
3. Role até a aba **Volumes**
4. Você verá os volumes mapeados
5. Para editar:
   - Clique no volume existente
   - Altere o campo **Host** (caminho no servidor)
   - Exemplo: `/opt/institutobex/backend` → `/home/usuario/institutobex/backend`
6. Clique em **Deploy the container**

⚠️ **ATENÇÃO**: Ao editar, o container será recriado. Certifique-se de que o novo caminho existe no servidor!

---

### Para Criar Novo Container

1. **Containers** > **Add container**
2. Preencha as informações básicas
3. Na aba **Volumes**, clique em **map additional volume**
4. Selecione **Bind** (para mapear diretório do servidor)
5. Preencha:
   - **Container**: `/app` (caminho dentro do container)
   - **Host**: `/opt/institutobex/backend` (caminho no servidor) ← **AQUI VOCÊ DEFINE ONDE COLOCAR OS ARQUIVOS**
6. Clique em **Deploy the container**

---

## 📂 Exemplos de Caminhos Comuns no Servidor

### Linux
```
/opt/institutobex/backend
/home/usuario/institutobex/backend
/var/www/institutobex/backend
/root/institutobex/backend
```

### Windows (se usar Docker Desktop)
```
C:\Projetos\institutobex\backend
D:\Projetos\institutobex\backend
```

---

## 🔍 Como Descobrir o Caminho Atual no Servidor

### Método 1: Via Portainer (Console)

1. **Containers** > Selecione o container
2. Clique em **Console**
3. Selecione **sh** ou **/bin/sh**
4. Clique em **Connect**
5. Execute:
   ```bash
   # Ver onde está montado
   mount | grep /app
   
   # Ou ver o diretório atual
   pwd
   
   # Listar arquivos
   ls -la
   ```

### Método 2: Via SSH no Servidor

1. Conecte-se ao servidor via SSH
2. Execute:
   ```bash
   # Ver containers Docker
   docker ps
   
   # Ver detalhes do container (incluindo volumes)
   docker inspect institutobex-backend | grep -A 10 Mounts
   
   # Ou ver de forma mais legível
   docker inspect institutobex-backend --format='{{json .Mounts}}' | python3 -m json.tool
   ```

---

## 📝 Exemplo Prático: Configurar Backend

### Passo a Passo

1. **Preparar diretório no servidor** (via SSH):
   ```bash
   # Criar diretório
   sudo mkdir -p /opt/institutobex/backend
   
   # Dar permissões
   sudo chown -R 1000:1000 /opt/institutobex/backend
   sudo chmod -R 755 /opt/institutobex/backend
   ```

2. **Fazer upload dos arquivos**:
   ```bash
   # Via SCP (do seu computador)
   scp -r backend/* usuario@servidor:/opt/institutobex/backend/
   
   # Ou via Git (no servidor)
   cd /opt/institutobex
   git clone seu-repositorio
   ```

3. **Configurar no Portainer**:
   - **Containers** > **Add container**
   - **Name**: `institutobex-backend`
   - **Image**: `node:20-alpine`
   - **Volumes** > **map additional volume**:
     - **Volume**: Selecione **Bind**
     - **Container**: `/app`
     - **Host**: `/opt/institutobex/backend` ← **CAMINHO NO SERVIDOR**
   - Clique em **Deploy the container**

---

## ⚠️ Importante

### Permissões

O container precisa ter permissão para acessar o diretório. Normalmente:
```bash
# No servidor
sudo chown -R 1000:1000 /caminho/do/projeto
sudo chmod -R 755 /caminho/do/projeto
```

### Caminho Absoluto vs Relativo

- **Use sempre caminho absoluto** no campo "Host"
- ✅ Correto: `/opt/institutobex/backend`
- ❌ Errado: `./backend` ou `backend`

### Verificar se o Caminho Existe

Antes de criar o container, certifique-se de que o diretório existe:
```bash
# No servidor
ls -la /opt/institutobex/backend
```

---

## 🎯 Resumo Rápido

**Para ver onde colocar arquivos:**

1. **Containers** > Selecione container > Seção **Volumes** > Veja o campo **Host**

**Para configurar onde colocar arquivos:**

1. **Containers** > **Add container** ou **Duplicate/Edit**
2. Aba **Volumes** > **map additional volume**
3. Selecione **Bind**
4. Campo **Host** = caminho no servidor onde ficam os arquivos
5. Campo **Container** = caminho dentro do container (ex: `/app`)

---

## 🔗 Referências

- `CONFIGURACAO_PORTAINER_PASSO_A_PASSO.md` - Guia completo de configuração
- `PORTAINER_VISUAL_GUIDE.md` - Guia visual passo a passo
- `GUIA_PORTAINER.md` - Guia geral do Portainer

