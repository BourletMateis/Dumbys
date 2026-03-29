/**
 * notify-vote-reminder
 *
 * Scheduled every Saturday at 9:00 AM (via Supabase cron or pg_cron).
 * Sends a push notification to all users with vote_reminder enabled.
 *
 * Cron expression: 0 9 * * 6
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CHUNK_SIZE = 100; // Expo API max per request

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: "default";
}

Deno.serve(async (req) => {
  // Allow invocation from cron (no body) or authenticated POST
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    // 1. Users with push token + notifications enabled
    const { data: users, error: usersErr } = await supabase
      .from("users")
      .select("id, push_token")
      .not("push_token", "is", null)
      .eq("notifications_enabled", true);

    if (usersErr) throw usersErr;
    if (!users || users.length === 0) {
      return respond({ sent: 0, reason: "no eligible users" });
    }

    const userIds = users.map((u: { id: string }) => u.id);

    // 2. Filter to those who opted in to vote_reminder
    const { data: prefs, error: prefsErr } = await supabase
      .from("notification_preferences")
      .select("user_id")
      .in("user_id", userIds)
      .eq("vote_reminder", true);

    if (prefsErr) throw prefsErr;

    const allowedSet = new Set((prefs ?? []).map((p: { user_id: string }) => p.user_id));
    const eligible = users.filter(
      (u: { id: string; push_token: string }) => allowedSet.has(u.id),
    );

    if (eligible.length === 0) {
      return respond({ sent: 0, reason: "all opted out" });
    }

    // 3. Build messages and send in chunks
    const messages: ExpoPushMessage[] = eligible.map(
      (u: { push_token: string }) => ({
        to: u.push_token,
        title: "Phase de vote 🗳️",
        body: "Les vidéos de la semaine t'attendent ! Vote pour ton favori.",
        sound: "default",
        data: { type: "vote_reminder" },
      }),
    );

    const results = await sendInChunks(messages);
    return respond({ sent: messages.length, results });
  } catch (err) {
    console.error("[notify-vote-reminder]", err);
    return respond({ error: String(err) }, 500);
  }
});

async function sendInChunks(messages: ExpoPushMessage[]) {
  const chunks: ExpoPushMessage[][] = [];
  for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
    chunks.push(messages.slice(i, i + CHUNK_SIZE));
  }

  const results = await Promise.all(
    chunks.map((chunk) =>
      fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(chunk),
      }).then((r) => r.json()),
    ),
  );

  return results;
}

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
