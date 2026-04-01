/**
 * Admin Edge Function — approve or reject a public group request.
 *
 * POST /functions/v1/admin-group-approval
 * Headers:
 *   Authorization: Bearer <ADMIN_SECRET>
 * Body:
 *   { groupId: string, action: "approve" | "reject", message?: string }
 *
 * The trigger on groups.status automatically sets is_public = true on approve.
 * A push notification is sent to the group owner.
 *
 * Deploy:
 *   supabase functions deploy admin-group-approval --no-verify-jwt
 * Secret:
 *   supabase secrets set ADMIN_SECRET=your_secret_here
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ADMIN_SECRET  = Deno.env.get("ADMIN_SECRET")!;
const SUPABASE_URL  = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // Auth check
  const auth = req.headers.get("Authorization") ?? "";
  if (auth !== `Bearer ${ADMIN_SECRET}`) {
    return json({ error: "Unauthorized" }, 401);
  }

  let body: { groupId: string; action: "approve" | "reject"; message?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { groupId, action, message } = body;
  if (!groupId || !["approve", "reject"].includes(action)) {
    return json({ error: "Missing groupId or invalid action" }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // Fetch group + owner info
  const { data: group, error: fetchErr } = await supabase
    .from("groups")
    .select("id, name, owner_id, status")
    .eq("id", groupId)
    .single();

  if (fetchErr || !group) {
    return json({ error: "Group not found" }, 404);
  }

  if (group.status !== "pending_public") {
    return json({ error: `Group status is '${group.status}', expected 'pending_public'` }, 409);
  }

  const newStatus = action === "approve" ? "approved_public" : "rejected_public";

  // Update status — trigger handles is_public automatically
  const { error: updateErr } = await supabase
    .from("groups")
    .update({ status: newStatus })
    .eq("id", groupId);

  if (updateErr) {
    return json({ error: updateErr.message }, 500);
  }

  // Send push notification to owner
  const { data: profile } = await supabase
    .from("users")
    .select("expo_push_token")
    .eq("id", group.owner_id)
    .single();

  if (profile?.expo_push_token) {
    const notifBody = action === "approve"
      ? `🎉 Ton groupe "${group.name}" est maintenant public !`
      : `Ton groupe "${group.name}" n'a pas été approuvé en public.${message ? ` (${message})` : ""}`;

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: profile.expo_push_token,
        title: action === "approve" ? "Groupe approuvé ✓" : "Demande de groupe public",
        body: notifBody,
        data: { groupId },
      }),
    });
  }

  return json({ success: true, status: newStatus });
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
