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
  # Extract webhook ID and token from URL
  WEBHOOK_ID=$(echo "$DISCORD_WEBHOOK_URL" | sed 's|.*/webhooks/\([^/]*\)/.*|\1|')
  WEBHOOK_TOKEN=$(echo "$DISCORD_WEBHOOK_URL" | sed 's|.*/webhooks/[^/]*/||')

  # Delete ALL previous messages sent by this webhook
  MSG_ID_FILE="/data/discord_last_msg_id"
  # First delete the saved message ID if it exists
  if [ -f "$MSG_ID_FILE" ]; then
    PREV_ID=$(cat "$MSG_ID_FILE")
    curl -s -X DELETE "https://discord.com/api/webhooks/${WEBHOOK_ID}/${WEBHOOK_TOKEN}/messages/${PREV_ID}"
    echo "Deleted saved message: $PREV_ID"
  fi
  # Then fetch and delete any remaining webhook messages
  REMAINING_IDS=$(curl -s "https://discord.com/api/webhooks/${WEBHOOK_ID}/${WEBHOOK_TOKEN}/messages?limit=50" | node -e "
    let d = '';
    process.stdin.on('data', c => d += c);
    process.stdin.on('end', () => {
      try {
        const msgs = JSON.parse(d);
        if (Array.isArray(msgs)) process.stdout.write(msgs.map(m => m.id).join(' '));
      } catch(e) {}
    });
  ")
  for MID in $REMAINING_IDS; do
    curl -s -X DELETE "https://discord.com/api/webhooks/${WEBHOOK_ID}/${WEBHOOK_TOKEN}/messages/${MID}"
    echo "Deleted leftover message: $MID"
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

  # Send with ?wait=true to get the message ID back
  DISCORD_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    "${DISCORD_WEBHOOK_URL}?wait=true")
  echo "Discord response: $DISCORD_RESPONSE"

  # Save new message ID for next run
  NEW_MSG_ID=$(echo "$DISCORD_RESPONSE" | node -e "
    let d = '';
    process.stdin.on('data', c => d += c);
    process.stdin.on('end', () => {
      try { const j = JSON.parse(d.split('\n')[0]); if (j.id) process.stdout.write(j.id); } catch(e) {}
    });
  ")
  if [ -n "$NEW_MSG_ID" ]; then
    mkdir -p /data
    echo "$NEW_MSG_ID" > "$MSG_ID_FILE"
    echo "Saved message ID: $NEW_MSG_ID"
  fi
fi

wait $EXPO_PID
