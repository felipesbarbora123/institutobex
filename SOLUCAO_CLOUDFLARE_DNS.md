# 🔧 Solução para Erro Cloudflare DNS (Error 1001)

## 🎯 Problema Identificado

O erro **Error 1001 - DNS resolution error** indica que:
1. O domínio está usando **Cloudflare** como proxy/CDN
2. O Cloudflare não consegue resolver o DNS corretamente
3. O erro SSL pode estar relacionado ao Cloudflare, não ao servidor da Hostinger

## ✅ Solução Passo a Passo

### Passo 1: Verificar Configurações do Cloudflare

1. **Acesse o painel do Cloudflare:**
   - Vá para: https://dash.cloudflare.com
   - Faça login na sua conta
   - Selecione o domínio `institutobex.com`

2. **Verificar Status do DNS:**
   - Vá em **DNS** → **Records**
   - Verifique se há registros A ou CNAME apontando para o servidor da Hostinger
   - O registro deve apontar para o IP do servidor da Hostinger (não para Cloudflare)

### Passo 2: Verificar Configurações SSL/TLS

1. **No painel do Cloudflare, vá em SSL/TLS:**
   - **Encryption mode:** Deve estar em **"Full"** ou **"Full (strict)"**
   - **⚠️ IMPORTANTE:** Se estiver em **"Flexible"**, isso pode causar problemas
   - **Minimum TLS Version:** Deve ser **TLS 1.2** ou superior

2. **Configurações recomendadas:**
   ```
   Encryption mode: Full (strict)
   Minimum TLS Version: 1.2
   TLS 1.3: Enabled
   Automatic HTTPS Rewrites: Enabled
   Always Use HTTPS: Enabled (opcional)
   ```

### Passo 3: Verificar DNS Records

1. **No Cloudflare, vá em DNS → Records:**
   - Deve haver um registro **A** ou **CNAME** para o domínio
   - **Registro A:** Deve apontar para o IP do servidor da Hostinger
   - **Registro CNAME:** Deve apontar para o domínio da Hostinger (ex: `institutobex.com.cpanel.hostinger.com`)

2. **Exemplo de configuração correta:**
   ```
   Type: A
   Name: @ (ou institutobex.com)
   Content: [IP_DO_SERVIDOR_HOSTINGER]
   Proxy status: Proxied (laranja) ou DNS only (cinza)
   TTL: Auto
   ```

### Passo 4: Desabilitar Proxy do Cloudflare Temporariamente

Para testar se o problema é do Cloudflare:

1. **No Cloudflare, vá em DNS → Records**
2. **Encontre o registro do domínio**
3. **Clique no ícone de nuvem laranja** (Proxied) para desabilitar o proxy
4. **Aguarde alguns minutos** para propagação
5. **Teste o acesso:** `http://institutobex.com` e `https://institutobex.com`

**Se funcionar sem proxy:**
- O problema está nas configurações do Cloudflare
- Continue com os passos abaixo

**Se não funcionar sem proxy:**
- O problema pode estar no DNS ou no servidor da Hostinger
- Verifique as configurações DNS na Hostinger

### Passo 5: Verificar DNS na Hostinger

1. **No painel da Hostinger, vá em Domínios:**
   - Verifique se o domínio está configurado corretamente
   - Verifique os nameservers (devem apontar para Cloudflare se estiver usando)

2. **Nameservers do Cloudflare:**
   - Se estiver usando Cloudflare, os nameservers devem ser do Cloudflare
   - Exemplo: `ns1.cloudflare.com`, `ns2.cloudflare.com`
   - Você encontra os nameservers no painel do Cloudflare em **Overview**

### Passo 6: Verificar Certificado SSL no Cloudflare

1. **No Cloudflare, vá em SSL/TLS → Overview:**
   - Verifique o status do certificado
   - Deve mostrar **"Active Certificate"** ou similar

2. **Se não houver certificado ativo:**
   - Vá em **SSL/TLS → Edge Certificates**
   - Certifique-se de que **"Always Use HTTPS"** está configurado
   - O Cloudflare deve gerar um certificado automaticamente

## 🔍 Diagnóstico Detalhado

### Verificar DNS Propagation

1. Acesse: https://www.whatsmydns.net/#A/institutobex.com
2. Verifique se o DNS está propagado globalmente
3. Se houver inconsistências, aguarde até 24h para propagação completa

### Verificar SSL do Cloudflare

1. Acesse: https://www.ssllabs.com/ssltest/analyze.html?d=institutobex.com
2. Verifique:
   - **Grade** (deve ser A ou A+)
   - **Issuer** (deve ser Cloudflare)
   - **Protocolos suportados** (TLS 1.2, TLS 1.3)

### Verificar Configurações de Rede

1. **No Cloudflare, vá em Network:**
   - **HTTP/2:** Enabled
   - **HTTP/3 (with QUIC):** Enabled (opcional)
   - **0-RTT Connection Resumption:** Enabled (opcional)
   - **IPv6 Compatibility:** Enabled (opcional)

## 🐛 Solução de Problemas

### Problema: DNS não resolve

**Solução:**
1. Verificar se os nameservers estão corretos
2. Aguardar propagação DNS (pode levar até 24h)
3. Limpar cache DNS local: `ipconfig /flushdns` (Windows) ou `sudo dscacheutil -flushcache` (Mac)

### Problema: SSL não funciona mesmo com Cloudflare

**Solução:**
1. Verificar se o modo SSL está em "Full" ou "Full (strict)"
2. Verificar se há certificado SSL no servidor da Hostinger
3. Se usar "Full (strict)", o servidor da Hostinger precisa ter SSL válido
4. Se usar "Full", o Cloudflare aceita SSL autoassinado do servidor

### Problema: Site não carrega mesmo sem proxy

**Solução:**
1. Verificar se o IP do servidor está correto no registro DNS
2. Verificar se o servidor da Hostinger está acessível
3. Verificar firewall do servidor
4. Contatar suporte da Hostinger

## ✅ Configuração Recomendada

### Para Produção com Cloudflare:

1. **DNS:**
   - Registro A apontando para IP do servidor Hostinger
   - Proxy habilitado (nuvem laranja)

2. **SSL/TLS:**
   - Encryption mode: **Full (strict)** (se Hostinger tiver SSL) ou **Full** (se não tiver)
   - Minimum TLS Version: **1.2**
   - TLS 1.3: **Enabled**
   - Automatic HTTPS Rewrites: **Enabled**
   - Always Use HTTPS: **Enabled**

3. **Network:**
   - HTTP/2: **Enabled**
   - HTTP/3: **Enabled** (opcional)

4. **Speed:**
   - Auto Minify: **Enabled** (CSS, HTML, JavaScript)
   - Brotli: **Enabled**

## 📋 Checklist

- [ ] Verificar registros DNS no Cloudflare
- [ ] Verificar nameservers (devem ser do Cloudflare)
- [ ] Verificar modo SSL/TLS (Full ou Full strict)
- [ ] Verificar certificado SSL ativo
- [ ] Desabilitar proxy temporariamente para testar
- [ ] Verificar propagação DNS
- [ ] Testar acesso via HTTP e HTTPS
- [ ] Verificar SSL Labs para grade do certificado
- [ ] Configurar Always Use HTTPS
- [ ] Habilitar HTTP/2 e HTTP/3

## 🎯 Próximos Passos

1. **IMEDIATO:** Acessar painel do Cloudflare e verificar configurações
2. **Verificar DNS:** Confirmar que registros estão corretos
3. **Verificar SSL:** Configurar modo "Full" ou "Full (strict)"
4. **Testar:** Desabilitar proxy temporariamente para diagnosticar
5. **Aguardar:** Propagação DNS pode levar até 24h

---

**Última atualização:** 07/12/2025
**Status:** 🔍 Diagnóstico Cloudflare

