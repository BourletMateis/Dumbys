/**
 * notify-podium
 *
 * Scheduled every Monday at 10:00 AM (via Supabase cron or pg_cron).
 * For each group, fetches last week's podium and notifies members.
 *
 * Cron expression: 0 10 * * 1
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CHUNK_SIZE = 100;

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: "default";
}

/** Returns ISO week number and year for the previous week */
function getPrevWeek(): { week: number; year: number } {
  const now = new Date();
  // Go back 7 days to get previous week
  const prev = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const d = new Date(Date.UTC(prev.getFullYear(), prev.getMonth(), prev.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { week, year: d.getUTCFullYear() };
}

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { week, year } = getPrevWeek();

    // 1. Get all groups that had podium entries last week
    const { data: podiumEntries, error: podiumErr } = await supabase
      .from("weekly_podium")
      .select("group_id, rank, user_id")
      .eq("week_number", week)
      .eq("year", year)
      .eq("rank", 1); // Only first-place for brevity

    if (podiumErr) throw podiumErr;
    if (!podiumEntries || podiumEntries.length === 0) {
      return respond({ sent: 0, reason: "no podium results" });
    }

    // Group → winner username
    const winnerUserIds = [...new Set(podiumEntries.map((e: { user_id: string }) => e.user_id))];
    const { data: winners } = await supabase
      .from("users")
      .select("id, username")
      .in("id", winnerUserIds);

    const winnerMap = new Map(
      (winners ?? []).map((u: { id: string; username: string }) => [u.id, u.username]),
    );

    const groupIds = [...new Set(podiumEntries.map((e: { group_id: string }) => e.group_id))];

    // 2. Get group names
    const { data: groups } = await supabase
      .from("groups")
      .select("id, name")
      .in("id", groupIds);

    const groupMap = new Map(
      (groups ?? []).map((g: { id: string; name: string }) => [g.id, g.name]),
    );

    // 3. Get group members with push tokens + podium_result preference
    const { data: members } = await supabase
      .from("group_members")
      .select("user_id, group_id")
      .in("group_id", groupIds);

    const memberUserIds = [...new Set((members ?? []).map((m: { user_id: string }) => m.user_id))];

    const { data: usersWithToken } = await supabase
      .from("users")
      .select("id, push_token")
      .in("id", memberUserIds)
      .not("push_token", "is", null)
      .eq("notifications_enabled", true);

    if (!usersWithToken || usersWithToken.length === 0) {
      return respond({ sent: 0, reason: "no users with tokens" });
    }

    const tokenUserIds = usersWithToken.map((u: { id: string }) => u.id);

    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("user_id")
      .in("user_id", tokenUserIds)
      .eq("podium_result", true);

    const allowedSet = new Set((prefs ?? []).map((p: { user_id: string }) => p.user_id));
    const tokenMap = new Map(
      (usersWithToken ?? []).map((u: { id: string; push_token: string }) => [u.id, u.push_token]),
    );

    // 4. Build per-group notifications
    const messages: ExpoPushMessage[] = [];
    const groupEntryMap = new Map<string, string>(); // groupId → winnerUsername

    for (const entry of podiumEntries) {
      groupEntryMap.set(entry.group_id, winnerMap.get(entry.user_id) ?? "Quelqu'un");
    }

    for (const member of members ?? []) {
      if (!allowedSet.has(member.user_id)) continue;
      const token = tokenMap.get(member.user_id);
      if (!token) continue;

      const groupName = groupMap.get(member.group_id) ?? "ton groupe";
      const winner = groupEntryMap.get(member.group_id) ?? "?";

      messages.push({
        to: token,
        title: "Podium de la semaine 🏆",
        body: `${winner} a remporté la semaine dans ${groupName} !`,
        sound: "default",
        data: { type: "podium", groupId: member.group_id },
      });
    }

    if (messages.length === 0) {
      return respond({ sent: 0, reason: "no messages to send" });
    }

    const results = await sendInChunks(messages);
    return respond({ sent: messages.length, results });
  } catch (err) {
    console.error("[notify-podium]", err);
    return respond({ error: String(err) }, 500);
  }
});

async function sendInChunks(messages: ExpoPushMessage[]) {
  const chunks: ExpoPushMessage[][] = [];
  for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
    chunks.push(messages.slice(i, i + CHUNK_SIZE));
  }
  return Promise.all(
    chunks.map((chunk) =>
      fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(chunk),
      }).then((r) => r.json()),
    ),
  );
}

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
