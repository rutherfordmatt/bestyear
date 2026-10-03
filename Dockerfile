# Year Well Built — one container: the static Astro build, served by the
# same Hono process that handles /send.

# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app

# PUBLIC_* values are baked into the static build, so they must be present
# here, not just at runtime. Set these as build arguments in Coolify.
ARG PUBLIC_UMAMI_SITE_ID=""
ARG PUBLIC_UMAMI_SCRIPT_URL="https://analytics.stff.me/script.js"
ARG PUBLIC_BOOKING_URL="https://mattrutherfordcoaching.com/?source=ywb"
ARG PUBLIC_VALUES_FINDER_URL="https://thevaluesfinder.com"
ARG PUBLIC_SITE_URL="https://yearwellbuilt.com"
ENV PUBLIC_UMAMI_SITE_ID=$PUBLIC_UMAMI_SITE_ID \
    PUBLIC_UMAMI_SCRIPT_URL=$PUBLIC_UMAMI_SCRIPT_URL \
    PUBLIC_BOOKING_URL=$PUBLIC_BOOKING_URL \
    PUBLIC_VALUES_FINDER_URL=$PUBLIC_VALUES_FINDER_URL \
    PUBLIC_SITE_URL=$PUBLIC_SITE_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Only the production dependencies the server actually needs.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY server ./server

# Don't run as root.
USER node

EXPOSE 3000
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/index.js"]
