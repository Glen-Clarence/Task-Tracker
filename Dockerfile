# ---- Build Stage ----
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Increase memory limit for Node.js build
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN npm run build

# ---- Run Stage ----
FROM node:18-alpine

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY package*.json ./
RUN npm install --legacy-peer-deps


EXPOSE 3000
CMD ["npm", "start"]
