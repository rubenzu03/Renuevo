# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma CLI for keeping the database in sync at container startup
RUN mkdir --parents /opt/prisma \
  && echo '{"name":"renuevo-migrate","private":true,"type":"module"}' > /opt/prisma/package.json \
  && cd /opt/prisma && npm install --omit=optional prisma@7.9.1 dotenv@17.4.2
COPY --from=builder /app/prisma /opt/prisma/prisma
COPY --from=builder /app/prisma.config.ts /opt/prisma/prisma.config.ts
RUN chown -R nextjs:nodejs /opt

USER nextjs
EXPOSE 3000

CMD ["sh", "-c", "cd /opt/prisma && npx prisma migrate deploy && cd /app && node server.js"]