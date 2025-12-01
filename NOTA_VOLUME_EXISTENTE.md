# ⚠️ Nota Importante - Volume PostgreSQL Existente

## Situação

Já existe um volume chamado `postgres_data` no Portainer do cliente.

## ⚠️ Decisão Importante

Você precisa decidir:

### Opção 1: Reutilizar Volume Existente ✅

**Use esta opção se:**
- O volume está vazio
- O volume pode ser compartilhado entre projetos
- Você quer usar o mesmo banco de dados

**Como fazer:**
- No Passo 3 (Criar Container PostgreSQL), selecione o volume `postgres_data` existente
- **ATENÇÃO**: Se o volume tem dados de outro projeto, eles serão sobrescritos!

### Opção 2: Criar Novo Volume ✅ (Recomendado)

**Use esta opção se:**
- O volume existente tem dados de outro projeto
- Você quer manter os dados separados
- Você quer evitar conflitos

**Como fazer:**
1. No Passo 3 (Criar Volume), crie um novo volume com nome: `institutobex_postgres_data`
2. No Passo 4 (Criar Container PostgreSQL), selecione este novo volume

## 📝 Recomendação

**Recomendo criar um novo volume** (`institutobex_postgres_data`) para:
- ✅ Evitar conflitos
- ✅ Manter dados separados
- ✅ Facilitar backup/restore
- ✅ Evitar sobrescrever dados existentes

## 🔄 Se Já Configurou com Volume Existente

Se você já configurou usando o volume existente e quer mudar:

1. **Pare o container PostgreSQL**:
   - Containers > `institutobex-db` > **Stop**

2. **Crie novo volume**:
   - Volumes > **Add volume** > Nome: `institutobex_postgres_data`

3. **Edite o container**:
   - Containers > `institutobex-db` > **Duplicate/Edit**
   - Aba "Volumes" > Mude para `institutobex_postgres_data`
   - Clique em **Deploy the container**

4. **Execute migrations novamente**:
   - Console do backend > `npm run migrate`

## ✅ Checklist

- [ ] Decidiu qual opção usar
- [ ] Se reutilizar: verificou que volume está vazio/compartilhado
- [ ] Se criar novo: criou volume `institutobex_postgres_data`
- [ ] Configurou container com volume correto
- [ ] Executou migrations

## 📞 Dúvidas?

Se não tiver certeza, **sempre crie um novo volume** para evitar problemas!

