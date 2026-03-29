#!/bin/bash
set -e

DISCORD_WEBHOOK_URL="TON_WEBHOOK_DISCORD_ICI"

echo "Pulling latest image..."
docker compose pull

echo "Restarting container..."
docker compose down
docker compose up -d

echo "Waiting for Expo tunnel URL (max 120s)..."
TUNNEL_URL=""
for i in $(seq 1 60); do
  sleep 2
  LOGS=$(docker compose logs --tail=50 app 2>&1)
  TUNNEL_URL=$(echo "$LOGS" | grep -oP 'exp://[^\s]+' | tail -1)
  if [ -n "$TUNNEL_URL" ]; then
    echo "Tunnel URL found: $TUNNEL_URL"
    break
  fi
done

if [ -z "$TUNNEL_URL" ]; then
  echo "No tunnel URL found, sending fallback Discord message..."
  curl -s -H "Content-Type: application/json" \
    -d '{"embeds":[{"title":"🚀 DumbAward redémarré","description":"Container up mais URL tunnel non trouvée. Vérifie les logs.","color":16744448}]}' \
    "$DISCORD_WEBHOOK_URL"
  exit 0
fi

QR_IMAGE_URL="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=$(python3 -c "import urllib.parse; print(urllib.parse.quote('${TUNNEL_URL}'))")"

DEPLOY_RESPONSE=$(curl -s -H "Content-Type: application/json" \
  -d "{
    \"embeds\": [{
      \"title\": \"📱 DumbAward — Nouvelle build!\",
      \"description\": \"Scanne le QR pour ouvrir l'app :\",
      \"color\": 4177791,
      \"image\": {\"url\": \"${QR_IMAGE_URL}\"},
      \"fields\": [{\"name\": \"URL Tunnel\", \"value\": \"\`${TUNNEL_URL}\`\"}],
      \"footer\": {\"text\": \"DumbAward CI/CD\"},
      \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }]
  }" \
  "${DISCORD_WEBHOOK_URL}?wait=true")

# Save message ID so entrypoint.sh can clean it up next run
DEPLOY_MSG_ID=$(echo "$DEPLOY_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
if [ -n "$DEPLOY_MSG_ID" ]; then
  mkdir -p /data
  echo "$DEPLOY_MSG_ID" >> /data/discord_msg_ids
  echo "Saved deploy message ID: $DEPLOY_MSG_ID"
fi

echo "QR code sent to Discord!"
