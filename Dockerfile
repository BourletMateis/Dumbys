FROM node:20-slim

WORKDIR /app

# Install curl only (expo-cli global not needed, npx expo suffit)
RUN apt-get update && apt-get install -y curl --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps --no-audit --no-fund \
    && npm cache clean --force

# Copy the rest of the project
COPY . .

EXPOSE 8081 19000 19001 19002

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Limit Node heap to avoid OOM
ENV NODE_OPTIONS=--max-old-space-size=768

CMD ["/entrypoint.sh"]
