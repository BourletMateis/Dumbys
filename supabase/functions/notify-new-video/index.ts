/**
 * notify-new-video
 *
 * Triggered via Supabase Database Webhook on INSERT to the `videos` table.
 * Notifies all group members (excluding the uploader) that a new video was posted.
 *
 * Set up in Supabase Dashboard:
 *   Database → Webhooks → New webhook
 *   Table: videos | Event: INSERT
 *   URL: <project_url>/functions/v1/notify-new-video
 *   Headers: Authorization: Bearer <service_role_key>
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CHUNK_SIZE = 100;

interface VideoInsertPayload {
  type: "INSERT";
  table: string;
  record: {
    id: string;
    submitter_id: string;
    group_id: string | null;
    title: string | null;
  };
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: "default";
}

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const payload: VideoInsertPayload = await req.json();
    const video = payload.record;

    // Only notify for group videos (not standalone uploads)
    if (!video.group_id) {
      return respond({ skipped: "no group_id" });
    }

    // 1. Get uploader username
    const { data: uploader } = await supabase
      .from("users")
      .select("username")
      .eq("id", video.submitter_id)
      .single();

    const uploaderName = uploader?.username ?? "Quelqu'un";

    // 2. Get group name
    const { data: group } = await supabase
      .from("groups")
      .select("name")
      .eq("id", video.group_id)
      .single();

    const groupName = group?.name ?? "un groupe";

    // 3. Get all group members (excluding uploader)
    const { data: members } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", video.group_id)
      .neq("user_id", video.submitter_id);

    if (!members || members.length === 0) {
      return respond({ sent: 0, reason: "no other members" });
    }

    const memberIds = members.map((m: { user_id: string }) => m.user_id);

    // 4. Filter to users with tokens + new_video preference
    const { data: usersWithToken } = await supabase
      .from("users")
      .select("id, push_token")
      .in("id", memberIds)
      .not("push_token", "is", null)
      .eq("notifications_enabled", true);

    if (!usersWithToken || usersWithToken.length === 0) {
      return respond({ sent: 0, reason: "no tokens" });
    }

    const tokenUserIds = usersWithToken.map((u: { id: string }) => u.id);

    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("user_id")
      .in("user_id", tokenUserIds)
      .eq("new_video", true);

    const allowedSet = new Set((prefs ?? []).map((p: { user_id: string }) => p.user_id));
    const eligible = usersWithToken.filter(
      (u: { id: string }) => allowedSet.has(u.id),
    );

    if (eligible.length === 0) {
      return respond({ sent: 0, reason: "all opted out" });
    }

    // 5. Build and send messages
    const videoTitle = video.title ?? "une vidéo";
    const messages: ExpoPushMessage[] = eligible.map(
      (u: { push_token: string }) => ({
        to: u.push_token,
        title: `Nouveau post dans ${groupName} 🎬`,
        body: `${uploaderName} a partagé "${videoTitle}"`,
        sound: "default",
        data: {
          type: "new_video",
          videoId: video.id,
          groupId: video.group_id!,
        },
      }),
    );

    const results = await sendInChunks(messages);
    return respond({ sent: messages.length, results });
  } catch (err) {
    console.error("[notify-new-video]", err);
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
