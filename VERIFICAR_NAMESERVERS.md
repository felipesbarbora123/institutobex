# 🔍 Como Verificar Nameservers

## 🎯 Objetivo

Verificar se o domínio está usando Cloudflare ou Hostinger.

## 📋 Passo a Passo

### Método 1: No Painel da Hostinger

1. **Acesse o painel da Hostinger (hPanel)**
2. **Vá em "Domínios"** (menu lateral)
3. **Clique no domínio:** `institutobex.com`
4. **Procure por:**
   - **"Nameservers"**
   - **"DNS"**
   - **"Configurações DNS"**
   - **"Gerenciar DNS"**

5. **Veja os nameservers listados**

**Exemplos:**

**Se forem do Cloudflare:**
```
ns1.cloudflare.com
ns2.cloudflare.com
```

**Se forem da Hostinger:**
```
ns1.dns-parking.com
ns2.dns-parking.com
```

**Ou outros da Hostinger:**
```
ns1.hostinger.com
ns2.hostinger.com
```

### Método 2: Via Comando (Windows)

1. **Abra PowerShell** (como Administrador)
2. **Execute:**
   ```powershell
   nslookup -type=NS institutobex.com
   ```
3. **Veja a resposta** - mostrará os nameservers

### Método 3: Via Site Online

1. **Acesse:**
   ```
   https://www.whatsmydns.net/#NS/institutobex.com
   ```
2. **Aguarde a verificação**
3. **Veja os nameservers** mostrados no mapa

### Método 4: Via Site Online (Alternativo)

1. **Acesse:**
   ```
   https://mxtoolbox.com/SuperTool.aspx?action=ns%3ainstitutobex.com
   ```
2. **Veja os nameservers** na resposta

## ✅ O Que Fazer Com o Resultado

### Se os Nameservers Forem do Cloudflare:

**Opção 1: Alterar na Hostinger**
1. No painel da Hostinger, altere os nameservers para os da Hostinger
2. Aguarde propagação (1-24 horas)

**Opção 2: Contatar Suporte**
1. Entre em contato com suporte da Hostinger
2. Peça para alterar nameservers para Hostinger

### Se os Nameservers Forem da Hostinger:

O problema pode ser outro. Verifique:
1. Configurações SSL na Hostinger
2. Certificado SSL (renovar se necessário)
3. Cache do navegador
4. Firewall/Antivírus

## 📝 Anotar Informações

Anote:
- **Nameservers atuais:** _______________
- **São do Cloudflare?** Sim / Não
- **São da Hostinger?** Sim / Não

---

**Última atualização:** 07/12/2025

