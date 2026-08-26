# syntax=docker/dockerfile:1

FROM node:26-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm@11.24.0
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:26-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@11.24.0
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm exec prisma generate
RUN pnpm run build

FROM node:26-alpine AS runner
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