FROM node:22.23.1-bookworm-slim AS build
WORKDIR /app

# npm 10.9.8 can intermittently crash in Docker with
# "Exit handler never called". Pin the installer used for the build,
# reduce registry concurrency, and retry once after clearing the cache.
ENV NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_MAXSOCKETS=5

RUN npm install --global npm@10.9.2 && npm --version

# Copy manifests first so dependency installation remains cacheable.
COPY package.json package-lock.json tsconfig.base.json eslint.config.mjs ./
COPY apps/client/package.json ./apps/client/package.json
COPY apps/server/package.json ./apps/server/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/content/package.json ./packages/content/package.json
COPY packages/simulation/package.json ./packages/simulation/package.json

RUN set -eux; \
    npm ci --no-audit --no-fund --prefer-online || \
    (rm -rf node_modules /root/.npm/_cacache && \
     npm ci --no-audit --no-fund --prefer-online)

COPY apps ./apps
COPY packages ./packages
COPY scripts ./scripts
RUN npm run build
RUN npm prune --omit=dev --no-audit --no-fund

FROM node:22.23.1-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=build /app/apps/client/dist ./apps/client/dist
COPY --from=build /app/packages ./packages
RUN mkdir -p /app/data
EXPOSE 3000
CMD ["node", "apps/server/dist/index.js"]
