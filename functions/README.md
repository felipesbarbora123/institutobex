# Firebase Functions - Instituto Bex

Backend API hospedado no Firebase Functions com Cloud SQL (PostgreSQL).

## 📁 Estrutura

```
functions/
├── index.js              # Entry point da Function
├── config/
│   └── database.js       # Configuração do Cloud SQL
├── routes/               # Rotas da API
│   ├── auth.js
│   ├── courses.js
│   ├── purchases.js
│   └── ...
└── middleware/
    └── auth.js           # Middleware de autenticação
```

## 🚀 Deploy

```bash
# Instalar dependências
npm install

# Deploy
firebase deploy --only functions:api
```

## 🔧 Configuração

Veja `GUIA_DEPLOY_FIREBASE.md` na raiz do projeto para instruções completas.

## 📝 Variáveis de Ambiente

Configure no Firebase Console > Functions > Configuration ou use `env.example` como referência.

## 🔗 URL da API

Após o deploy:
```
https://us-central1-PROJECT_ID.cloudfunctions.net/api
```

