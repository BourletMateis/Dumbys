#!/bin/bash
set -e

# Discord bot config - loaded from .env or set here
DISCORD_BOT_TOKEN="${DISCORD_BOT_TOKEN:-TON_BOT_TOKEN_ICI}"
DISCORD_CHANNEL_ID="${DISCORD_CHANNEL_ID:-TON_CHANNEL_ID_ICI}"

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

DISCORD_API="https://discord.com/api/v10"
AUTH_HEADER="Bot ${DISCORD_BOT_TOKEN}"

if [ -z "$TUNNEL_URL" ]; then
  echo "No tunnel URL found, sending fallback Discord message..."
  curl -s \
    -H "Authorization: ${AUTH_HEADER}" \
    -H "Content-Type: application/json" \
    -d '{"embeds":[{"title":"DumbAward redémarré","description":"Container up mais URL tunnel non trouvée. Vérifie les logs.","color":16744448}]}' \
    "${DISCORD_API}/channels/${DISCORD_CHANNEL_ID}/messages"
  exit 0
fi

QR_IMAGE_URL="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=$(python3 -c "import urllib.parse; print(urllib.parse.quote('${TUNNEL_URL}'))")"

DEPLOY_RESPONSE=$(curl -s \
  -H "Authorization: ${AUTH_HEADER}" \
  -H "Content-Type: application/json" \
  -d "{
    \"content\": \"<@&1487480710615924746>\",
    \"embeds\": [{
      \"title\": \"\ud83d\ude80 Nouvelle version disponible !\",
      \"description\": \"**Une mise \u00e0 jour fra\u00eeche vient d\u2019arriver !** \u2728\\n\\nScanne le QR code ci-dessous avec **Expo Go** pour tester la derni\u00e8re version.\\n\\n\u23f3 *Premi\u00e8re ouverture ~30s*\",
      \"color\": 16723325,
      \"image\": {\"url\": \"${QR_IMAGE_URL}\"},
      \"fields\": [{\"name\": \"\ud83d\udcf1 Lien direct\", \"value\": \"\`${TUNNEL_URL}\`\"}],
      \"footer\": {\"text\": \"\ud83d\udee0\ufe0f Dumbys CI/CD \u2022 D\u00e9ploy\u00e9 automatiquement\"},
      \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }]
  }" \
  "${DISCORD_API}/channels/${DISCORD_CHANNEL_ID}/messages")

echo "Deploy message sent to Discord!"
echo "Response: $DEPLOY_RESPONSE"
