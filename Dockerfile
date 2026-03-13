FROM node:20-slim

WORKDIR /app

# Install Expo CLI globally
RUN npm install -g expo-cli@latest

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy the rest of the project
COPY . .

EXPOSE 8081 19000 19001 19002

CMD ["npx", "expo", "start", "--tunnel"]
