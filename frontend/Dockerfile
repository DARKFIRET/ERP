FROM node:22-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Serve with Caddy
FROM caddy:2-alpine
COPY --from=builder /app/dist /srv
RUN printf ':80 {\n\troot * /srv\n\ttry_files {path} /index.html\n\tfile_server\n}\n' > /etc/caddy/Caddyfile

EXPOSE 80
