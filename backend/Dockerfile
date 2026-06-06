FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# Install tsx to run TypeScript directly
RUN npm install tsx

COPY . .

EXPOSE 3000

CMD ["node", "--import", "tsx", "src/index.ts"]
