#!/bin/bash

# Start Expo in background
npx expo start --tunnel &
EXPO_PID=$!

# Wait for ngrok tunnel URL
echo "Waiting for ngrok tunnel..."
TUNNEL_URL=""
for i in $(seq 1 60); do
  sleep 2
  TUNNEL_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | node -e "
    let d = '';
    process.stdin.on('data', c => d += c);
    process.stdin.on('end', () => {
      try {
        const tunnels = JSON.parse(d).tunnels;
        const t = tunnels && tunnels.find(t => t.proto === 'http');
        if (t) {
          const url = t.public_url.replace(/^http:\/\//, 'exp://');
          process.stdout.write(url);
        }
      } catch(e) {}
    });
  ")
  if [ -n "$TUNNEL_URL" ]; then
    echo "Tunnel URL found: $TUNNEL_URL"
    break
  fi
done

if [ -z "$TUNNEL_URL" ]; then
  echo "No tunnel URL found"
  wait $EXPO_PID
  exit 0
fi

# Pre-warm the bundle so the first connection doesn't timeout
echo "Pre-warming bundle (this may take a few minutes)..."
curl -s --max-time 300 "http://localhost:8081/node_modules/expo-router/entry.bundle?platform=ios&dev=true&minify=false" -o /dev/null || true
curl -s --max-time 300 "http://localhost:8081/node_modules/expo-router/entry.bundle?platform=android&dev=true&minify=false" -o /dev/null || true
echo "Bundle ready!"

if [ -n "$DISCORD_WEBHOOK_URL" ]; then
  ENCODED=$(node -e "process.stdout.write(encodeURIComponent('$TUNNEL_URL'))")
  QR_URL="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ENCODED}"
  curl -s -H "Content-Type: application/json" \
    -d "{\"embeds\":[{\"title\":\"📱 DumbAward — App dispo!\",\"description\":\"Scanne le QR pour ouvrir l'app :\",\"color\":4177791,\"image\":{\"url\":\"${QR_URL}\"},\"fields\":[{\"name\":\"URL Tunnel\",\"value\":\"\`${TUNNEL_URL}\`\"}],\"footer\":{\"text\":\"DumbAward CI/CD\"},\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}]}" \
    "$DISCORD_WEBHOOK_URL"
  echo "QR sent to Discord!"
fi

wait $EXPO_PID
