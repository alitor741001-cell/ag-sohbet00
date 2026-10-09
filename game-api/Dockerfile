# --- Build aşaması: bağımlılıkları kurar -------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# package-lock.json yoksa ci başarısız olur; kurulum yine de tamamlanır.
RUN npm ci --omit=dev --no-audit --no-fund || npm install --omit=dev --no-audit --no-fund

# --- Çalışma aşaması ---------------------------------------------------------
FROM node:20-alpine
ENV NODE_ENV=production \
    PORT=8080
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

# Kök olmayan kullanıcı ile çalışır (node imajında hazır gelir).
USER node

EXPOSE 8080

# Cloud Run kendi sağlık kontrolünü yapar; bu satır yerel doğrulama içindir.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]