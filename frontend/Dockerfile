# Author: Lucas Mohler
# Multi-stage build: compiles the React app with Vite, then serves the
# static output with nginx (which also reverse-proxies /api/ to the backend).
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
