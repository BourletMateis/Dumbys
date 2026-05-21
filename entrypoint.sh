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

if [ -n "$TUNNEL_URL" ] && [ -n "$DISCORD_BOT_TOKEN" ] && [ -n "$DISCORD_CHANNEL_ID" ]; then
  DISCORD_API="https://discord.com/api/v10"
  AUTH_HEADER="Bot ${DISCORD_BOT_TOKEN}"

  # Delete ALL previous bot messages in the channel
  echo "Cleaning up previous bot messages..."
  BOT_USER_ID=$(curl -s -H "Authorization: ${AUTH_HEADER}" "${DISCORD_API}/users/@me" | node -e "
    let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{try{process.stdout.write(JSON.parse(d).id)}catch(e){}});
  ")
  MESSAGES=$(curl -s -H "Authorization: ${AUTH_HEADER}" "${DISCORD_API}/channels/${DISCORD_CHANNEL_ID}/messages?limit=100")
  echo "$MESSAGES" | node -e "
    let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
      try {
        const msgs = JSON.parse(d);
        msgs.forEach(m => console.log(m.id));
      } catch(e) {}
    });
  " | while IFS= read -r MSG_ID; do
    [ -z "$MSG_ID" ] && continue
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
      -H "Authorization: ${AUTH_HEADER}" \
      "${DISCORD_API}/channels/${DISCORD_CHANNEL_ID}/messages/${MSG_ID}")
    echo "Deleted message ${MSG_ID}: HTTP ${HTTP_CODE}"
    sleep 0.5
  done

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

  # Send message via bot
  DISCORD_RESPONSE=$(curl -s \
    -H "Authorization: ${AUTH_HEADER}" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    "${DISCORD_API}/channels/${DISCORD_CHANNEL_ID}/messages")
  echo "Discord response: $DISCORD_RESPONSE"
fi

wait $EXPO_PID
