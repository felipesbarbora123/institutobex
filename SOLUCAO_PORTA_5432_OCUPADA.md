# 🔧 Solução: Porta 5432 Já Está em Uso

## ❌ Erro

```
Failed starting container: driver failed programming external connectivity 
on endpoint institutobex-db: failed to bind port 0.0.0.0:5432/tcp: 
Error starting userland proxy: listen tcp4 0.0.0.0:5432: bind: address already in use
```

## 🔍 Causa

A porta 5432 já está sendo usada por outro container ou serviço PostgreSQL.

## ✅ Solução: Usar Porta Diferente

### Passo 1: Verificar o que está usando a porta 5432

**No Portainer:**
1. Vá em **Containers**
2. Procure por containers PostgreSQL rodando
3. Verifique qual porta está mapeada

**Ou via terminal (se tiver acesso SSH):**
```bash
sudo lsof -i :5432
# ou
sudo netstat -tulpn | grep 5432
```

### Passo 2: Usar Porta Diferente no Host

Ao criar o container PostgreSQL no Portainer:

**Aba "Network ports configuration":**
- **Container**: `5432` (sempre 5432 dentro do container)
- **Host**: `5433` (ou outra porta disponível)

**Portas recomendadas:**
- `5433` - Mais comum
- `5434` - Alternativa
- `15432` - Porta alta, raramente usada
- `25432` - Outra opção

### Passo 3: Configurar Backend

⚠️ **IMPORTANTE**: O backend **NÃO precisa** ser alterado!

**Por quê?**
- Os containers se comunicam pela **network interna** do Docker
- O backend usa `DB_HOST=postgres` (nome do container)
- A porta usada é a **porta do container** (5432), não a do Host
- O mapeamento de porta (Host:5433 → Container:5432) é apenas para acesso externo

**Configuração do Backend (mantenha assim):**
```
DB_HOST = postgres
DB_PORT = 5432
```

✅ **Isso está correto!** O backend se conecta ao container PostgreSQL pela network interna usando a porta 5432 do container.

### Passo 4: Se Precisar Acessar do Host

Se você precisar acessar o PostgreSQL diretamente do servidor (fora do Docker), use a porta do Host:

```bash
# Exemplo se mapeou Host:5433
psql -h localhost -p 5433 -U postgres -d institutobex
```

## 📝 Exemplo Completo

### Container PostgreSQL

**Port mapping:**
```
Container: 5432
Host: 5433
```

**Variáveis de ambiente:**
```
POSTGRES_DB=institutobex
POSTGRES_USER=postgres
POSTGRES_PASSWORD=sua_senha
```

### Container Backend

**Variáveis de ambiente:**
```
DB_HOST=postgres          ← Nome do container
DB_PORT=5432              ← Porta do container (não do Host!)
DB_NAME=institutobex
DB_USER=postgres
DB_PASSWORD=sua_senha
```

✅ **Funciona perfeitamente!** Os containers se comunicam pela network interna.

## 🔄 Se Já Criou o Container

Se você já tentou criar o container e deu erro:

1. **Remova o container com erro:**
   - Containers > `institutobex-db` > **Remove**

2. **Crie novamente com porta diferente:**
   - Siga os passos acima usando porta `5433` (ou outra disponível)

## ✅ Checklist

- [ ] Verificou qual porta está disponível
- [ ] Configurou Host port diferente (ex: 5433)
- [ ] Container port continua 5432
- [ ] Backend configurado com `DB_HOST=postgres` e `DB_PORT=5432`
- [ ] Ambos containers na mesma network
- [ ] Container criado com sucesso

## 🎯 Resumo

- **Host Port**: Use `5433` (ou outra disponível) - apenas para acesso externo
- **Container Port**: Sempre `5432` - usado internamente
- **Backend DB_PORT**: Sempre `5432` - conecta ao container pela network interna
- **Backend DB_HOST**: `postgres` - nome do container na network

## 📞 Próximos Passos

1. ✅ Ajustar porta do Host para 5433
2. ✅ Criar container PostgreSQL
3. ✅ Verificar se backend conecta (deve funcionar normalmente)
4. ✅ Testar health check: `curl http://servidor:3001/health`

