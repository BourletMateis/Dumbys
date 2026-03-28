FROM node:20-slim

WORKDIR /app

# Install Expo CLI globally + curl for Discord notifications
RUN npm install -g expo-cli@latest && \
    apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy the rest of the project
COPY . .

EXPOSE 8081 19000 19001 19002

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"]
