# frontend/Dockerfile
FROM node:18-alpine AS build

WORKDIR /app

# Копирование зависимостей
COPY frontend/package*.json ./
RUN npm ci

# Копирование исходного кода и сборка
COPY frontend/ ./
RUN npm run build

# Production сервер
FROM nginx:alpine

# Копирование сборки
COPY --from=build /app/build /usr/share/nginx/html

# Копирование конфигурации nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
