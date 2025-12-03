# ✅ psql Mostrando Versão: O Que Significa?

## 🎯 O Que Você Viu

Quando você executou:
```bash
psql -U postgres -d institutobex
```

E apareceu:
```
psql (15.15)
```

## ✅ Isso É Bom!

Isso significa que:
- ✅ O `psql` está instalado e funcionando
- ✅ O PostgreSQL está rodando
- ✅ O comando está tentando conectar

**O que acontece agora:**
- O psql está **pedindo a senha** (mas não mostra na tela por segurança)
- Você precisa **digitar a senha** e pressionar Enter

---

## 🔐 Como Proceder

### **Passo 1: Digitar a Senha**

1. **Digite a senha** do PostgreSQL (a mesma de `POSTGRES_PASSWORD`)
2. **Não aparecerá nada na tela** (por segurança, senhas não são mostradas)
3. **Pressione Enter**

**Exemplo:**
```
psql (15.15)
Password for user postgres: [digite a senha aqui - não aparece nada]
```

### **Passo 2: Se Conectar com Sucesso**

Você verá algo como:
```
psql (15.15)
Type "help" for help.

institutobex=#
```

**✅ Pronto! Você está conectado!**

O prompt `institutobex=#` significa que você está conectado ao banco `institutobex`.

---

## 🐛 Se Der Erro de Senha

Se aparecer:
```
psql: error: connection to server at "localhost" (127.0.0.1), port 5432 failed: FATAL: password authentication failed for user "postgres"
```

**Solução:**
1. Verifique a senha nas variáveis de ambiente:
   - **Portainer** → **Containers** → `institutobex-db` → **Environment variables**
   - Veja `POSTGRES_PASSWORD`
2. Use a senha correta
3. Tente novamente

---

## 📝 Comandos Úteis Após Conectar

Depois de conectar (quando ver `institutobex=#`), você pode usar:

```sql
-- Ver todas as tabelas
\dt

-- Ver estrutura de uma tabela
\d nome_da_tabela

-- Listar todos os bancos
\l

-- Ver usuários
\du

-- Executar query
SELECT * FROM usuarios LIMIT 10;

-- Ver ajuda
\?

-- Sair
\q
```

---

## 🔍 Verificar Senha no Portainer

Se você não sabe qual é a senha:

1. **Portainer** → **Containers** → `institutobex-db`
2. Role até **Environment variables**
3. Procure por `POSTGRES_PASSWORD`
4. A senha está lá (pode estar oculta, clique para revelar)

---

## 💡 Dica: Conectar Sem Pedir Senha

Se você quer conectar sem digitar senha toda vez, pode usar variável de ambiente:

```bash
# Definir senha como variável
export PGPASSWORD='sua_senha_aqui'

# Conectar (não vai pedir senha)
psql -U postgres -d institutobex
```

**⚠️ Atenção**: Isso deixa a senha no histórico. Use apenas para testes.

---

## ✅ Resumo

**O que você viu:**
```
psql (15.15)
```

**O que fazer:**
1. ✅ Digite a senha (não aparece na tela)
2. ✅ Pressione Enter
3. ✅ Se conectar, você verá: `institutobex=#`

**Se der erro:**
- Verifique a senha no Portainer (Environment variables)
- Use a senha correta

---

**Pronto!** Agora você sabe que precisa digitar a senha! 🔐

