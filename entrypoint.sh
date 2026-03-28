#!/bin/bash
SENT_FLAG="/tmp/discord_sent"
rm -f "$SENT_FLAG"

npx expo start --tunnel 2>&1 | while IFS= read -r line; do
  echo "$line"
  if [ ! -f "$SENT_FLAG" ]; then
    TUNNEL_URL=$(echo "$line" | grep -oE 'exp(\+[a-zA-Z0-9]+)?://[^ ]+' | head -1)
    if [ -n "$TUNNEL_URL" ] && [ -n "$DISCORD_WEBHOOK_URL" ]; then
      touch "$SENT_FLAG"
      ENCODED=$(node -e "process.stdout.write(encodeURIComponent('$TUNNEL_URL'))")
      QR_URL="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ENCODED}"
      curl -s -H "Content-Type: application/json" \
        -d "{\"embeds\":[{\"title\":\"📱 DumbAward — App dispo!\",\"description\":\"Scanne le QR pour ouvrir l'app :\",\"color\":4177791,\"image\":{\"url\":\"${QR_URL}\"},\"fields\":[{\"name\":\"URL Tunnel\",\"value\":\"\`${TUNNEL_URL}\`\"}],\"footer\":{\"text\":\"DumbAward CI/CD\"},\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}]}" \
        "$DISCORD_WEBHOOK_URL" &
    fi
  fi
done
