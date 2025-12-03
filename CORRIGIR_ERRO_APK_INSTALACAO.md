# 🔧 Corrigir Erro: apk unable to select packages

## 🐛 Erro

```
ERROR: unable to select packages:
  /tmp (no such package):
    required by: world[/tmp]
  cd (no such package):
    required by: world[cd]
```

## 🎯 Causa

O comando está sendo interpretado incorretamente. O `apk` está tentando instalar `/tmp` e `cd` como pacotes porque o `&&` não está sendo interpretado corretamente pelo shell.

---

## ✅ Solução: Usar Ponto e Vírgula (;) ao Invés de &&

Trocar `&&` por `;` para separar comandos:

### **Comando Corrigido (Alpine):**

```bash
sh -c "apk add --no-cache git; cd /tmp; git clone https://SEU_TOKEN@github.com/usuario/repositorio.git temp; cp -r temp/backend/* /app/; rm -rf temp; cd /app; npm install && npm start"
```

### **Comando Corrigido (Debian/Ubuntu):**

```bash
sh -c "apt-get update; apt-get install -y git; cd /tmp; git clone https://SEU_TOKEN@github.com/usuario/repositorio.git temp; cp -r temp/backend/* /app/; rm -rf temp; cd /app; npm install && npm start"
```

---

## 🔍 Diferença Entre && e ;

- **`&&`**: Executa próximo comando apenas se anterior teve sucesso
- **`;`**: Executa próximo comando sempre, independente do resultado

**Para instalação e cópia, usar `;` é mais seguro!**

---

## ✅ Configuração Correta

1. **Containers** → `institutobex-backend` → **Duplicate/Edit**

2. **Volumes**:
   - **Named volume** → `backend_app_data` em `/app`

3. **Command & Logging** → **Command**:
   
   **Alpine:**
   ```bash
   sh -c "apk add --no-cache git; cd /tmp; git clone https://SEU_TOKEN@github.com/usuario/repositorio.git temp; cp -r temp/backend/* /app/; rm -rf temp; cd /app; npm install && npm start"
   ```

4. **Working directory**: `/app`

5. **Deploy**

---

## ✅ Alternativa: Usar Script Separado

Se ainda der erro, criar um script:

### **Command:**

```bash
sh -c "apk add --no-cache git bash; bash -c 'cd /tmp && git clone https://SEU_TOKEN@github.com/usuario/repositorio.git temp && cp -r temp/backend/* /app/ && rm -rf temp && cd /app && npm install && npm start'"
```

---

## 📋 Checklist

- [ ] Trocar `&&` por `;` no comando
- [ ] Manter `&&` apenas no final (npm install && npm start)
- [ ] Verificar logs após deploy
- [ ] Confirmar que git foi instalado
- [ ] Confirmar que arquivos foram copiados

---

## 🔗 Referências

- `INSTALAR_GIT_E_COPIAR_ARQUIVOS.md` - Instalar git
- `RESOLVER_ARQUIVOS_DELETADOS_APOS_RESTART.md` - Persistir arquivos

---

## ✅ Resumo

**Erro**: `apk` tentando instalar `/tmp` e `cd` como pacotes.

**Solução**: Trocar `&&` por `;` no comando:

```bash
sh -c "apk add --no-cache git; cd /tmp; git clone ...; cp -r ...; rm -rf temp; cd /app; npm install && npm start"
```

**Pronto!** Use ponto e vírgula ao invés de &&! 🚀

