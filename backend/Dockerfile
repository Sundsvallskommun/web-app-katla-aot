# Install dependencies only when needed
ARG NODE_VERSION=22.18.0
ARG YARN_VERSION=1.22.22
FROM node:${NODE_VERSION}-slim AS build-base
ARG YARN_VERSION
RUN test "$(yarn --version)" = "${YARN_VERSION}"

FROM build-base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
#RUN apk add --no-cache libc6-compat
RUN apt-get update
RUN apt-get install -y openssl
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# If using npm with a `package-lock.json` comment out above and use below instead
# COPY package.json package-lock.json ./
# RUN npm ci

# Rebuild the source code only when needed
FROM build-base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn build

# Production image, copy all the files and run next
FROM node:${NODE_VERSION}-slim AS runner
RUN apt-get update
RUN apt-get install -y openssl
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY --from=builder --chown=nodejs:nodejs /app/ ./

USER nodejs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "./dist/server.js"]
