FROM node:24-alpine

WORKDIR /app
RUN echo -e "update-notifier=false\nloglevel=error\nnode-linker=hoisted" > ~/.npmrc
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN npx pnpm install  --frozen-lockfile
COPY . .
RUN npx pnpm build
RUN npx pnpm prune --prod
CMD ["node", "--no-warnings", "--no-deprecation", "--experimental-specifier-resolution=node", "--enable-source-maps", "dist/index.js"]
