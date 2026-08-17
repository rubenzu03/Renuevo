# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.21.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.21.0 --activate
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm exec prisma generate
RUN pnpm build

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
RUN corepack enable && corepack prepare pnpm@11.21.0 --activate \
  && mkdir --parents /opt/prisma \
  && echo '{"name":"renuevo-migrate","private":true,"type":"module"}' > /opt/prisma/package.json
COPY --from=builder /app/pnpm-workspace.yaml /opt/pnpm-workspace.yaml
RUN cd /opt/prisma && pnpm add prisma@7.9.1 dotenv@17.4.2
COPY --from=builder /app/prisma /opt/prisma/prisma
COPY --from=builder /app/prisma.config.ts /opt/prisma/prisma.config.ts
RUN chown -R nextjs:nodejs /opt

USER nextjs
EXPOSE 3000

CMD ["sh", "-c", "cd /opt/prisma && pnpm exec prisma migrate deploy && cd /app && node server.js"]