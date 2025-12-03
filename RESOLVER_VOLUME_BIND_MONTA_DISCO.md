# 🔧 Resolver: Volume Bind Monta Disco ao Invés de Diretório

## 🐛 Problema Identificado

- ❌ `mount | grep "/opt/institutobex/backend"` mostra: `/dev/sda1 on /opt/institutobex/backend`
- ❌ Volume Bind não está funcionando - está montando disco ao invés do diretório
- ❌ Diretório está vazio porque não está conectado ao servidor

## 🎯 Causa

O Portainer/Docker está criando um diretório vazio e montando um disco nele, ao invés de fazer bind mount do diretório do servidor. Isso pode acontecer por:
- ⚠️ Volume Bind não está configurado corretamente
- ⚠️ Portainer não está aplicando o bind mount
- ⚠️ Conflito com outra configuração

---

## ✅ Soluções

---

## ✅ Solução 1: Usar Caminho Diferente no Container

Se `/opt/institutobex/backend` está sendo montado como disco, use outro caminho:

### **Passo 1: Parar Container**

1. **Kill** o container

### **Passo 2: Configurar Volume Bind em Caminho Diferente**

1. **Duplicate/Edit**

2. **Volumes**:
   - Remover volume de `/opt/institutobex/backend` (se existir)
   - Adicionar novo:
     - **Bind** → Container `/app` → Host `/opt/institutobex/backend`

3. **Command & Logging**:
   - **Command**: `sh -c "cd /app && npm install && npm start"`
   - **Working directory**: `/app`

4. **Deploy**

### **Passo 3: Verificar**

```bash
# Deve mostrar bind mount agora
mount | grep /app
# Deve mostrar: /opt/institutobex/backend on /app type bind

# Verificar arquivos
ls -la /app/package.json
```

---

## ✅ Solução 2: Usar Volume Nomeado

Se Bind não funciona, use volume nomeado:

### **Passo 1: Criar Volume Nomeado**

1. **Volumes** → **Add volume**
2. **Name**: `backend_app_files`
3. **Driver**: `local`
4. **Create**

### **Passo 2: Copiar Arquivos para o Volume**

1. **Criar container temporário**:
   - **Name**: `copy-to-volume`
   - **Image**: `alpine:latest`
   - **Volumes**:
     - Volume nomeado `backend_app_files` em `/data`
     - Bind: Container `/source`, Host `/opt/institutobex/backend`
   - **Command**: `sh -c "cp -r /source/* /data/ && tail -f /dev/null"`
   - **Deploy**

2. **Aguardar** arquivos serem copiados

3. **Remover** container temporário

### **Passo 3: Usar Volume no Backend**

1. **Containers** → `institutobex-backend` → **Duplicate/Edit**

2. **Volumes**:
   - Remover volume atual
   - Adicionar: Volume nomeado `backend_app_files` em `/app`

3. **Command & Logging**:
   - **Command**: `sh -c "cd /app && npm install && npm start"`
   - **Working directory**: `/app`

4. **Deploy**

---

## ✅ Solução 3: Usar Git Clone Direto no Container

Se volume Bind não funciona, clone direto no container:

1. **Containers** → `institutobex-backend` → **Duplicate/Edit**

2. **Volumes**: Remover todos os volumes

3. **Command & Logging**:
   - **Command**:
     ```bash
     sh -c "cd /tmp && git clone https://SEU_TOKEN@github.com/usuario/repositorio.git temp && cp -r temp/backend/* /app/ && rm -rf temp && cd /app && npm install && npm start"
     ```
   - **Working directory**: `/app`

4. **Deploy**

**Vantagem**: Não depende do volume Bind

---

## ✅ Solução 4: Copiar Arquivos na Inicialização

Criar script que copia arquivos na inicialização:

1. **Command & Logging** → **Command**:
   ```bash
   sh -c "if [ ! -f /app/package.json ]; then apk add git && cd /tmp && git clone https://SEU_TOKEN@github.com/usuario/repositorio.git temp && cp -r temp/backend/* /app/ && rm -rf temp; fi && cd /app && npm install && npm start"
   ```

**Mas**: Precisa de volume persistente para `/app` ou vai copiar toda vez.

---

## 🔍 Verificar Por Que Bind Não Funciona

### **Possíveis Causas:**

1. **Permissões do Portainer**:
   - Usuário pode não ter permissão para criar bind mounts
   - Verificar permissões do usuário

2. **Configuração do Docker**:
   - Docker pode estar configurado para não permitir bind mounts
   - Verificar configuração do Docker

3. **Caminho do Host**:
   - Caminho pode não existir ou estar incorreto
   - Verificar se `/opt/institutobex/backend` existe no servidor

4. **Conflito**:
   - Pode haver conflito com working directory ou outro volume
   - Verificar todas as configurações

---

## ✅ Solução Recomendada: Usar /app com Bind

### **Passo a Passo:**

1. **Kill** container

2. **Duplicate/Edit**

3. **Volumes**:
   - Remover volume de `/opt/institutobex/backend`
   - Adicionar: **Bind** → Container `/app` → Host `/opt/institutobex/backend`

4. **Command & Logging**:
   - **Command**: `sh -c "cd /app && npm install && npm start"`
   - **Working directory**: `/app`

5. **Deploy**

6. **Verificar**:
   ```bash
   mount | grep /app
   # Deve mostrar: /opt/institutobex/backend on /app type bind
   ```

---

## 📋 Checklist

- [ ] Parar container (Kill)
- [ ] Remover volume de `/opt/institutobex/backend`
- [ ] Adicionar volume Bind: Container `/app` → Host `/opt/institutobex/backend`
- [ ] Ajustar comando para usar `/app`
- [ ] Deploy
- [ ] Verificar `mount | grep /app` - deve mostrar bind mount
- [ ] Verificar `ls -la /app/package.json` - deve mostrar arquivo

---

## 🔗 Referências

- `VOLUME_BIND_DIRETORIO_VAZIO.md` - Diretório vazio
- `DIAGNOSTICO_VOLUME_BIND_NAO_FUNCIONA_DEFINITIVO.md` - Diagnóstico completo
- `FORCAR_VOLUME_BIND_APLICAR.md` - Forçar volume Bind

---

## ✅ Resumo

**Problema**: Volume Bind monta disco (`/dev/sda1`) ao invés do diretório.

**Solução Recomendada**:
1. ✅ **Usar caminho diferente** no container (`/app` ao invés de `/opt/institutobex/backend`)
2. ✅ **Configurar Bind**: Container `/app` → Host `/opt/institutobex/backend`
3. ✅ **Ajustar comando** para usar `/app`
4. ✅ **Deploy**

**Alternativas**:
- Usar volume nomeado
- Usar Git clone direto no container

**Pronto!** Use `/app` como caminho no container e configure o Bind! 🚀

