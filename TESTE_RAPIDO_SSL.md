# ⚡ Teste Rápido - Diagnóstico SSL

## 🎯 Teste Rápido (5 minutos)

### 1. Verificar se Está Usando Cloudflare

**Acesse no navegador:**
```
https://dash.cloudflare.com
```

- ✅ **Se conseguir fazer login e ver o domínio:** Está usando Cloudflare
- ❌ **Se não tiver conta ou não ver o domínio:** Pode não estar usando Cloudflare

### 2. Verificar Nameservers

**No painel da Hostinger:**
1. Vá em **Domínios**
2. Clique no domínio `institutobex.com`
3. Veja os **Nameservers**

**Se forem:**
- `ns1.cloudflare.com`, `ns2.cloudflare.com` → **Está usando Cloudflare**
- `ns1.dns-parking.com`, `ns2.dns-parking.com` → **NÃO está usando Cloudflare**

### 3. Teste Rápido do Certificado

**Acesse:**
```
https://www.ssllabs.com/ssltest/analyze.html?d=institutobex.com
```

**Aguarde a análise e verifique:**
- **Grade:** Deve ser A ou A+
- **Protocolos:** Deve mostrar TLS 1.2 e TLS 1.3
- **Se a grade for baixa:** Problema no certificado

### 4. Limpar Cache e Testar

1. **Limpar cache do navegador:**
   - Chrome/Edge: `Ctrl+Shift+Delete` → Marcar "Imagens e arquivos em cache" → Limpar dados
   - Firefox: `Ctrl+Shift+Delete` → Marcar "Cache" → Limpar agora

2. **Testar em modo anônimo:**
   - Chrome/Edge: `Ctrl+Shift+N`
   - Firefox: `Ctrl+Shift+P`

3. **Acessar:** `https://institutobex.com`

### 5. Teste em Outro Navegador

- Se usar Chrome, teste Firefox
- Se usar Firefox, teste Chrome
- Se usar Edge, teste Chrome

## 🔧 Solução Rápida se Estiver Usando Cloudflare

1. **Acesse:** https://dash.cloudflare.com
2. **Selecione o domínio:** `institutobex.com`
3. **Vá em SSL/TLS:**
   - Mude **Encryption mode** para **"Full"**
   - Salve
4. **Vá em DNS → Records:**
   - Clique na **nuvem laranja** (Proxied) para desabilitar temporariamente
   - Aguarde 2-3 minutos
5. **Teste:** `https://institutobex.com`

## 🔧 Solução Rápida se NÃO Estiver Usando Cloudflare

1. **No painel da Hostinger:**
   - Vá em **SSL**
   - Clique em **Renovar** ou **Reinstalar** certificado
   - Aguarde 5-10 minutos

2. **Limpar cache do navegador** (passo 4 acima)

3. **Testar:** `https://institutobex.com`

## ⚠️ Se Nada Funcionar

1. **Teste em outro dispositivo** (celular, outro computador)
2. **Teste com outro navegador**
3. **Desabilite temporariamente:**
   - Firewall
   - Antivírus
   - Extensões do navegador

4. **Entre em contato com suporte da Hostinger** com:
   - Navegador e versão
   - Sistema operacional
   - Erro exato
   - Resultado do teste SSL Labs

---

**Tempo estimado:** 5-10 minutos
**Status:** ⚡ Teste rápido

