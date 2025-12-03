# 🔧 Corrigir Estrutura de Diretórios no Portainer

## 🐛 Problema

A estrutura ficou assim:
```
/opt/institutobex/upload/backend/institutobex/backend
```

**O correto deveria ser:**
```
/opt/institutobex/backend
```

---

## ✅ Solução: Mover Arquivos para o Lugar Correto

### **Método 1: Via Console do Container (Recomendado)**

1. **Portainer** → **Containers** → Selecione o container que tem acesso ao volume
2. Clique em **Console**
3. Selecione **sh** ou **/bin/sh**
4. Clique em **Connect**

No console, execute:

```bash
# Verificar a estrutura atual
ls -la /opt/institutobex/upload/backend/institutobex/backend

# Criar diretório correto (se não existir)
mkdir -p /opt/institutobex/backend

# Mover arquivos para o lugar correto
mv /opt/institutobex/upload/backend/institutobex/backend/* /opt/institutobex/backend/
mv /opt/institutobex/upload/backend/institutobex/backend/.* /opt/institutobex/backend/ 2>/dev/null || true

# Verificar se os arquivos estão no lugar certo
ls -la /opt/institutobex/backend

# Você deve ver: package.json, server.js, config/, routes/, etc.

# Limpar estrutura antiga (opcional)
rm -rf /opt/institutobex/upload

# Ajustar permissões
chown -R 1000:1000 /opt/institutobex/backend
chmod -R 755 /opt/institutobex/backend
```

---

### **Método 2: Usar Container Temporário**

Se você não tem um container com acesso ao volume:

1. **Portainer** → **Containers** → **Add container**
2. Preencha:
   - **Name**: `fix-structure`
   - **Image**: `alpine:latest`
3. Na aba **Volumes**, clique em **map additional volume**:
   - **Volume**: Selecione **Bind**
   - **Container**: `/data`
   - **Host**: `/opt/institutobex`
4. Na aba **Command & Logging**:
   - **Command**: `tail -f /dev/null`
5. Clique em **Deploy the container**
6. Acesse o **Console** e execute os comandos do Método 1 (ajustando os caminhos)
7. Remova o container temporário depois

---

## 🔍 Verificar Estrutura Correta

Após mover, verifique se está correto:

```bash
# Ver estrutura
ls -la /opt/institutobex/backend

# Deve mostrar:
# - package.json
# - server.js
# - config/
# - routes/
# - middleware/
# - data/
# - schema/
# - scripts/
# - .env (se existir)
```

---

## 📋 Estrutura Correta Esperada

```
/opt/institutobex/
└── backend/
    ├── package.json
    ├── server.js
    ├── .env
    ├── config/
    │   └── database.js
    ├── routes/
    │   ├── auth.js
    │   ├── courses.js
    │   └── ...
    ├── middleware/
    │   └── auth.js
    ├── data/
    ├── schema/
    └── scripts/
```

---

## ⚙️ Configurar Portainer com Caminho Correto

Agora configure o container do backend no Portainer:

1. **Portainer** → **Containers** → **Add container** (ou edite existente)
2. Na aba **Volumes**, configure:
   - **Volume**: Selecione **Bind**
   - **Container**: `/app`
   - **Host**: `/opt/institutobex/backend` ← **CAMINHO CORRETO!**
3. Salve e reinicie o container

---

## 🐛 Se Ainda Estiver com Problemas

### **Verificar Caminho Atual:**

```bash
# No console do container
pwd
ls -la
```

### **Verificar Volume no Portainer:**

1. **Portainer** → **Containers** → Selecione o container
2. Role até **Volumes**
3. Verifique o campo **Host** - deve ser `/opt/institutobex/backend`

### **Recriar Estrutura do Zero:**

Se preferir começar do zero:

```bash
# Remover tudo
rm -rf /opt/institutobex/backend
rm -rf /opt/institutobex/upload

# Criar diretório correto
mkdir -p /opt/institutobex/backend
chown -R 1000:1000 /opt/institutobex/backend
chmod -R 755 /opt/institutobex/backend

# Fazer clone novamente (diretamente no lugar certo)
cd /opt/institutobex
git clone https://SEU_TOKEN@github.com/usuario/repositorio.git temp
cp -r temp/backend/* /opt/institutobex/backend/
rm -rf temp
```

---

## 💡 Dica: Como Evitar Isso no Futuro

Ao clonar o repositório, clone diretamente no lugar certo:

```bash
# ❌ ERRADO (cria estrutura aninhada)
cd /opt/institutobex/upload/backend
git clone https://repositorio.git
# Resulta em: /opt/institutobex/upload/backend/repositorio/backend

# ✅ CORRETO (clona e copia apenas o backend)
cd /opt/institutobex
git clone https://repositorio.git temp
cp -r temp/backend/* /opt/institutobex/backend/
rm -rf temp
```

**Ou melhor ainda**, se o repositório só tem a pasta backend:

```bash
# Clonar e mover direto
cd /opt/institutobex
git clone https://repositorio.git temp
mv temp/backend /opt/institutobex/
rm -rf temp
```

---

## ✅ Checklist

- [ ] Verificar estrutura atual
- [ ] Mover arquivos para `/opt/institutobex/backend`
- [ ] Verificar se todos os arquivos estão lá
- [ ] Ajustar permissões
- [ ] Limpar estrutura antiga
- [ ] Configurar Portainer com caminho correto
- [ ] Testar se o container consegue acessar os arquivos

---

## 🔗 Referências

- `CONFIGURACAO_PORTAINER_PASSO_A_PASSO.md` - Configuração completa
- `COMO_FAZER_UPLOAD_ARQUIVOS_PORTAINER.md` - Como fazer upload
- `SOLUCAO_ERRO_GIT_PORTAINER.md` - Resolver erros Git

---

**Pronto!** Agora a estrutura deve estar correta! 🚀

