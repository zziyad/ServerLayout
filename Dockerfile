FROM node:20-alpine

RUN apk add --no-cache curl tini

WORKDIR /usr/server

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY .applications ./
COPY main.js ./
COPY src ./src
COPY lib ./lib
COPY application ./application

RUN mkdir -p /usr/server/log /usr/server/uploads \
  && chown -R node:node /usr/server

USER node

ENV NODE_ENV=production
EXPOSE 8010

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=5 \
  CMD curl -sf -X POST http://127.0.0.1:8010/api \
    -H 'content-type: application/json' \
    -H 'x-requested-with: XMLHttpRequest' \
    -d '{"type":"call","id":"health","method":"health","args":{}}' \
    >/dev/null || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "main.js"]
