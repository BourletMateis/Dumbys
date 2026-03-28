#!/bin/bash

# Start Expo in background
npx expo start --tunnel &
EXPO_PID=$!

# Poll ngrok API (port 4040) for the tunnel URL
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
        const t = tunnels && tunnels[0];
        if (t) {
          const url = t.public_url.replace(/^https?:\/\//, 'exp://');
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

if [ -n "$TUNNEL_URL" ] && [ -n "$DISCORD_WEBHOOK_URL" ]; then
  ENCODED=$(node -e "process.stdout.write(encodeURIComponent('$TUNNEL_URL'))")
  QR_URL="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ENCODED}"
  curl -s -H "Content-Type: application/json" \
    -d "{\"embeds\":[{\"title\":\"📱 DumbAward — App dispo!\",\"description\":\"Scanne le QR pour ouvrir l'app :\",\"color\":4177791,\"image\":{\"url\":\"${QR_URL}\"},\"fields\":[{\"name\":\"URL Tunnel\",\"value\":\"\`${TUNNEL_URL}\`\"}],\"footer\":{\"text\":\"DumbAward CI/CD\"},\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}]}" \
    "$DISCORD_WEBHOOK_URL"
  echo "QR sent to Discord!"
else
  echo "No tunnel URL found or DISCORD_WEBHOOK_URL not set"
fi

# Keep container alive with Expo
wait $EXPO_PID
