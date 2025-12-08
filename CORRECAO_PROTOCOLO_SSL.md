# 🔧 Correção do Erro "Protocolo não compatível"

## 🎯 Problema

Ao acessar o site via HTTPS, ocorre o erro:
```
Protocolo não compatível
O cliente e o servidor não são compatíveis com uma versão do protocolo SSL comum ou com o pacote de criptografia.
```

## 🔍 Causa

O erro ocorre quando o cURL no PHP tenta usar SSL/TLS em uma conexão HTTP, ou quando há incompatibilidade entre as versões do protocolo.

## ✅ Solução Implementada

Foi atualizado o arquivo `api-proxy.php` com as seguintes correções:

1. **Forçar uso de HTTP puro** (sem SSL)
2. **Desabilitar negociação SSL/TLS** completamente
3. **Forçar HTTP/1.1** (evitar HTTP/2)
4. **Adicionar validação de URL** para garantir que seja HTTP
5. **Melhorar tratamento de erros** com logs detalhados

## 📋 Arquivos Atualizados

- `api-proxy.php` (raiz do projeto)
- `publicado/public_html/api-proxy.php` (pasta de publicação)

## 🚀 Como Aplicar a Correção

### Passo 1: Fazer Upload do Arquivo Atualizado

1. Fazer upload de `api-proxy.php` atualizado para a raiz de `public_html/` na Hostinger
2. Substituir o arquivo existente

### Passo 2: Verificar Permissões

Certifique-se de que o arquivo tem permissões corretas:
- Permissões: `644` ou `755`

### Passo 3: Testar

1. Acesse o site: `https://institutobex.com`
2. Abra o console do navegador (F12)
3. Tente fazer login
4. Verifique se não há mais erros

## 🔍 Diagnóstico

Se o erro persistir, verifique:

### 1. Verificar se o Backend está Acessível

Teste diretamente no navegador:
```
http://46.224.47.128:3001/health
```

Deve retornar uma resposta JSON com status.

### 2. Verificar Logs do PHP

No painel da Hostinger, verifique os logs de erro do PHP. O proxy agora registra erros detalhados.

### 3. Testar o Proxy Diretamente

Acesse no navegador:
```
https://institutobex.com/api-proxy.php
```

Deve retornar um erro JSON (esperado, pois precisa de parâmetros), mas não deve dar erro de protocolo SSL.

### 4. Verificar Versão do PHP

O proxy requer PHP 5.6+ com cURL habilitado. Verifique no painel da Hostinger.

## 🐛 Solução de Problemas

### Problema: Erro persiste após atualização

**Solução:**
1. Limpar cache do navegador (Ctrl+Shift+R)
2. Verificar se o arquivo foi realmente substituído
3. Verificar logs de erro do PHP no painel da Hostinger
4. Testar o backend diretamente para garantir que está funcionando

### Problema: Erro 500 no proxy

**Solução:**
1. Verificar se cURL está habilitado no PHP
2. Verificar se a URL do backend está correta
3. Verificar logs de erro do PHP
4. Testar conexão com o backend manualmente

### Problema: Timeout

**Solução:**
1. Verificar se o backend está rodando
2. Verificar se o firewall permite conexões do servidor da Hostinger
3. Aumentar timeout no `api-proxy.php` (linha 30)

## 📝 Configurações Importantes

### URL do Backend

A URL do backend está configurada na linha 19 do `api-proxy.php`:
```php
$BACKEND_BASE = 'http://46.224.47.128:3001';
```

Se o backend estiver em outro endereço, atualize esta linha.

### Timeout

O timeout está configurado para 30 segundos (linha 30). Se necessário, ajuste:
```php
curl_setopt($ch, CURLOPT_TIMEOUT, 60); // 60 segundos
```

## ✅ Checklist

- [ ] Fazer upload de `api-proxy.php` atualizado
- [ ] Verificar permissões do arquivo (644 ou 755)
- [ ] Limpar cache do navegador
- [ ] Testar acesso ao site
- [ ] Verificar console do navegador para erros
- [ ] Testar login
- [ ] Verificar logs do PHP se houver erros

## 🔗 Referências

- `SOLUCAO_SSL_MIXED_CONTENT.md` - Solução para Mixed Content
- `CORRECAO_INTERCEPTOR_SUPABASE.md` - Correção do interceptor

---

**Última atualização:** 05/12/2025
**Status:** ✅ Correção implementada

