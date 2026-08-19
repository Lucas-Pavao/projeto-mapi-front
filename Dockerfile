# Estágio 1: build do bundle estático de produção com Vite.
# VITE_MAP_STYLE_* são embutidas no JS em tempo de BUILD (Vite não lê import.meta.env em
# runtime) — por isso entram como build arg, não como env do container. VITE_API_URL não é mais
# necessária: a API é acessada via caminho relativo (/api/...), proxeado pro backend pelo nginx
# (ver nginx.conf) — front e API são "same-origin" do ponto de vista do navegador, o que é
# exigido pelo cookie httpOnly de sessão.
FROM node:20-slim AS build
WORKDIR /app

ARG VITE_MAP_STYLE_LIGHT
ARG VITE_MAP_STYLE_DARK
ENV VITE_MAP_STYLE_LIGHT=${VITE_MAP_STYLE_LIGHT} \
    VITE_MAP_STYLE_DARK=${VITE_MAP_STYLE_DARK}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Estágio 2: serve o build estático via nginx — sem Node, sem dev server, sem HMR exposto.
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
