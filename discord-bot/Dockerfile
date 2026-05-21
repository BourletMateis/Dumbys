FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY tsconfig.json ./
COPY src ./src

RUN npm install -D typescript ts-node @types/node && \
    npx tsc && \
    npm uninstall typescript ts-node @types/node

CMD ["node", "dist/index.js"]
