FROM node:20-slim

WORKDIR /app

# This image intentionally contains the API only. The Vite frontend is deployed separately.
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps \
  && npm install --global tsx@4.21.0 \
  && npm cache clean --force

COPY server ./server
COPY drizzle.config.ts ./drizzle.config.ts

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["tsx", "server/index.ts"]
