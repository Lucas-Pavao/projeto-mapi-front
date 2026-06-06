# Use uma imagem do Node.js
FROM node:20-slim

# Define a pasta de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante dos arquivos do projeto
COPY . .

# Expõe a porta que o seu front usa (Vite padrão é 5173)
EXPOSE 5173

# Comando para rodar em modo desenvolvimento
# O --host é necessário para o Vite aceitar conexões de fora do container
CMD ["npm", "run", "dev", "--", "--host"]
