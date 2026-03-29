#!/bin/bash

# Start Expo in background
npx expo start --tunnel --max-workers 1 &
EXPO_PID=$!

# Wait for ngrok tunnel URL via ngrok API
echo "Waiting for tunnel..."
TUNNEL_URL=""
for i in $(seq 1 60); do
  sleep 2
  TUNNEL_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | node -e "
    let d = '';
    process.stdin.on('data', c => d += c);
    process.stdin.on('end', () => {
      try {
        const tunnels = JSON.parse(d).tunnels;
        const t = tunnels && (tunnels.find(t => t.proto === 'https') || tunnels.find(t => t.proto === 'http'));
        if (t) process.stdout.write(t.public_url.replace(/^https?:\/\//, 'exp://'));
      } catch(e) {}
    });
  ")
  if [ -n "$TUNNEL_URL" ]; then
    echo "Tunnel ready: $TUNNEL_URL"
    break
  fi
done

if [ -n "$TUNNEL_URL" ] && [ -n "$DISCORD_WEBHOOK_URL" ]; then
  ENCODED=$(node -e "process.stdout.write(encodeURIComponent('$TUNNEL_URL'))")
  QR_URL="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ENCODED}"
  TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  PAYLOAD=$(node -e "
    const payload = {
      embeds: [{
        title: 'DumbAward — App dispo!',
        description: 'Scanne le QR avec Expo Go (premiere ouverture ~30s) :',
        color: 4177791,
        image: { url: '$QR_URL' },
        fields: [{ name: 'URL', value: '\`$TUNNEL_URL\`' }],
        footer: { text: 'DumbAward CI/CD' },
        timestamp: '$TIMESTAMP'
      }]
    };
    process.stdout.write(JSON.stringify(payload));
  ")
  DISCORD_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    "$DISCORD_WEBHOOK_URL")
  echo "Discord response: $DISCORD_RESPONSE"
fi

wait $EXPO_PID
