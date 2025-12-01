FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY backend/package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código do backend
COPY backend/ ./

# Expor porta
EXPOSE 3001

# Comando para iniciar
CMD ["node", "server.js"]

