# syntax=docker/dockerfile:1
FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS build
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build:production

FROM dependencies AS production-dependencies
RUN npm prune --omit=dev && npm cache clean --force

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3001
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node src/db/migrations ./migrations
USER node
EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/readyz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node","scripts/start.cjs"]
