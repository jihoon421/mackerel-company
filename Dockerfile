FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json tsconfig.base.json eslint.config.mjs ./
COPY apps ./apps
COPY packages ./packages
COPY scripts ./scripts
RUN npm ci
RUN npm run build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=build /app/apps/client/dist ./apps/client/dist
COPY --from=build /app/packages ./packages
RUN mkdir -p /app/data
EXPOSE 3000
CMD ["npm", "start"]
