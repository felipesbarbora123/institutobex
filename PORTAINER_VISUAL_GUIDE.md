# 🖼️ Guia Visual - Portainer

## 📍 Navegação no Portainer

### Menu Lateral
```
Portainer
├── 🏠 Home
├── 🐳 Containers        ← Criar containers aqui
├── 🖼️ Images
├── 🌐 Networks          ← Criar network aqui
├── 💾 Volumes           ← Criar volume aqui
├── 📦 Stacks            ← Usar docker-compose aqui
└── ⚙️ Settings
```

---

## 🎯 Passo 1: Criar Network

### Localização
**Menu Lateral** > **Networks** > **Add network**

### Campos a Preencher
```
┌─────────────────────────────────────┐
│ Name: institutobex-network          │
│ Driver: bridge                      │
│                                     │
│ [Create the network]                │
└─────────────────────────────────────┘
```

✅ Clique em **Create the network**

---

## 🎯 Passo 2: Criar Volume

⚠️ **IMPORTANTE**: Se já existe um volume `postgres_data`, você tem duas opções:

### Opção A: Reutilizar Volume Existente
- Use o volume `postgres_data` existente (apenas se estiver vazio ou puder ser compartilhado)
- Pule para o Passo 3

### Opção B: Criar Novo Volume

### Localização
**Menu Lateral** > **Volumes** > **Add volume**

### Campos a Preencher
```
┌─────────────────────────────────────┐
│ Name: institutobex_postgres_data    │
│ Driver: local                       │
│                                     │
│ [Create the volume]                 │
└─────────────────────────────────────┘
```

✅ Clique em **Create the volume**

**Nota**: Se criar novo volume, use `institutobex_postgres_data` no Passo 3.

---

## 🎯 Passo 3: Criar Container PostgreSQL

### Localização
**Menu Lateral** > **Containers** > **Add container**

### Aba "Container configuration"
```
┌─────────────────────────────────────┐
│ Name: institutobex-db               │
│ Image: postgres:15-alpine           │
└─────────────────────────────────────┘
```

### Aba "Network ports configuration"
```
┌─────────────────────────────────────┐
│ Container: 5432                     │
│ Host: 5433  ← Use porta diferente! │
│                                     │
│ [map additional ports]              │
└─────────────────────────────────────┘
```

⚠️ **IMPORTANTE**: 
- Se a porta 5432 já está em uso, use `5433`, `5434` ou outra disponível no Host
- O Container sempre usa `5432` internamente
- O Backend não precisa ser alterado (usa porta do container via network interna)

### Aba "Volumes"
```
┌─────────────────────────────────────┐
│ Volume: postgres_data               │
│        (ou institutobex_postgres_data)│
│ Container: /var/lib/postgresql/data │
│                                     │
│ [map additional volume]             │
└─────────────────────────────────────┘
```

⚠️ **ATENÇÃO**: 
- Se reutilizar volume existente: use `postgres_data`
- Se criou novo volume: use `institutobex_postgres_data`
- **NÃO** reutilize se o volume tem dados de outro projeto!

### Aba "Env"
```
┌─────────────────────────────────────┐
│ POSTGRES_DB = institutobex          │
│ POSTGRES_USER = postgres            │
│ POSTGRES_PASSWORD = sua_senha       │
│ PGDATA = /var/lib/postgresql/...    │
│                                     │
│ [add environment variable]          │
└─────────────────────────────────────┘
```

### Aba "Restart policy"
```
┌─────────────────────────────────────┐
│ ○ No                                │
│ ○ Always                            │
│ ● Unless stopped  ← SELECIONE ESTE  │
│ ○ On failure                        │
└─────────────────────────────────────┘
```

### Aba "Networks"
```
┌─────────────────────────────────────┐
│ ● institutobex-network              │
│                                     │
│ [Select a network]                  │
└─────────────────────────────────────┘
```

✅ Clique em **Deploy the container**

---

## 🎯 Passo 4: Criar Container Backend

### Localização
**Menu Lateral** > **Containers** > **Add container**

### Aba "Container configuration"
```
┌─────────────────────────────────────┐
│ Name: institutobex-backend          │
│ Image: node:20-alpine               │
└─────────────────────────────────────┘
```

### Aba "Network ports configuration"
```
┌─────────────────────────────────────┐
│ Container: 3001                     │
│ Host: 3001                          │
│                                     │
│ [map additional ports]              │
└─────────────────────────────────────┘
```

### Aba "Volumes"
```
┌─────────────────────────────────────┐
│ Volume: Bind                        │
│ Container: /app                     │
│ Host: /opt/institutobex/backend     │
│                                     │
│ [map additional volume]             │
└─────────────────────────────────────┘
```

⚠️ **IMPORTANTE**: Ajuste o caminho "Host" conforme o local dos arquivos!

### Aba "Command & Logging"
```
┌─────────────────────────────────────┐
│ Working directory: /app             │
│                                     │
│ Command:                            │
│ sh -c "npm install && npm start"    │
└─────────────────────────────────────┘
```

### Aba "Env"
```
┌─────────────────────────────────────┐
│ DB_HOST = postgres                  │
│ DB_PORT = 5432                      │
│ DB_NAME = institutobex              │
│ DB_USER = postgres                  │
│ DB_PASSWORD = mesma_senha_postgres  │
│ DB_SSL = false                      │
│ JWT_SECRET = seu_jwt_secret         │
│ PORT = 3001                         │
│ NODE_ENV = production               │
│ API_URL = https://api.institutobex  │
│ APP_URL = https://institutobex.com  │
│ CORS_ORIGIN = https://institutobex  │
│ ABACATEPAY_API_URL = ...            │
│ ABACATEPAY_API_KEY = ...            │
│ EVOLUTION_API_URL = ...             │
│ EVOLUTION_API_KEY = ...             │
│ EVOLUTION_INSTANCE_NAME = ...       │
│                                     │
│ [add environment variable]          │
└─────────────────────────────────────┘
```

### Aba "Restart policy"
```
┌─────────────────────────────────────┐
│ ● Unless stopped  ← SELECIONE ESTE  │
└─────────────────────────────────────┘
```

### Aba "Networks"
```
┌─────────────────────────────────────┐
│ ● institutobex-network              │
└─────────────────────────────────────┘
```

✅ Clique em **Deploy the container**

---

## 🎯 Passo 5: Verificar Logs

### Localização
**Containers** > `institutobex-backend` > **Logs**

### O que você deve ver:
```
✅ Conectado ao PostgreSQL
🚀 Servidor rodando na porta 3001
```

### Se houver erros:
- Verifique as variáveis de ambiente
- Verifique se o PostgreSQL está rodando
- Verifique o caminho do volume

---

## 🎯 Passo 6: Executar Migrations

### Localização
**Containers** > `institutobex-backend` > **Console**

### Interface do Console:
```
┌─────────────────────────────────────┐
│ Console - institutobex-backend      │
│                                     │
│ Shell: /bin/sh                      │
│                                     │
│ [Connect]                           │
└─────────────────────────────────────┘
```

### Após conectar, digite:
```bash
npm run migrate
```

### Você deve ver:
```
✅ Migrations executadas com sucesso!
```

---

## 🎯 Passo 7: Testar API

### No navegador ou terminal:
```
http://seu-servidor-ip:3001/health
```

### Resposta esperada:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-11-27T..."
}
```

---

## 🔄 Atualizar Container

### Para atualizar o código:

1. **Opção A: Reiniciar**
   - Containers > `institutobex-backend` > **Restart**

2. **Opção B: Recreate**
   - Containers > `institutobex-backend` > **Duplicate/Edit**
   - Faça alterações
   - Clique em **Deploy the container**

---

## 🐛 Verificar Problemas

### Container não inicia?
1. Vá em **Logs**
2. Procure por erros em vermelho
3. Verifique variáveis de ambiente
4. Verifique portas disponíveis

### Erro de conexão com banco?
1. Verifique se `DB_HOST=postgres` (nome do container)
2. Verifique se ambos estão na mesma network
3. Verifique se a senha está correta

### Erro de permissões?
1. Verifique o caminho do volume
2. No servidor: `chmod -R 755 /caminho/backend`

---

## ✅ Checklist Visual

```
□ Network criada
□ Volume criado
□ Container PostgreSQL rodando (status: Running)
□ Container Backend rodando (status: Running)
□ Logs sem erros
□ Health check funcionando
□ Migrations executadas
```

---

## 📞 Próximos Passos

1. ✅ Containers configurados
2. ✅ Migrations executadas
3. ⏭️ Configurar domínio (opcional)
4. ⏭️ Configurar SSL (opcional)
5. ⏭️ Atualizar frontend para usar nova URL

---

Para mais detalhes, consulte:
- `CONFIGURACAO_PORTAINER_PASSO_A_PASSO.md` - Passo a passo detalhado
- `GUIA_PORTAINER.md` - Guia completo

