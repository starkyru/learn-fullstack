# syntax=docker/dockerfile:1
# ARTIFACT — the exact output of `buildApiDockerfile()` (src/solution 01-dockerfile.ts).
# Documented by the module; the GATE does not build it. Regenerate, don't hand-edit.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://localhost:3000/healthz || exit 1
CMD ["node", "dist/main.js"]
