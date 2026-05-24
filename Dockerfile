# Base image definition
FROM node:20-alpine

# Definir diretório de trabalho no container
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências de produção para leveza e segurança
RUN npm ci --only=production

# Copiar o restante dos arquivos do projeto
COPY . .

# Garantir que a aplicação use um usuário não-root (segurança)
USER node

# Expor a porta que a aplicação Express utiliza (3000)
EXPOSE 3000

# Definir variáveis de ambiente padrão
ENV PORT=3000
ENV NODE_ENV=production

# Comando para iniciar o servidor
CMD ["node", "server.js"]
