/**
 * Cloudflare R2 storage client.
 * Uploads files via the Cloudflare Worker and constructs public URLs.
 *
 * Uses React Native's FormData format ({ uri, name, type }) instead of
 * the Web File API which isn't available in RN.
 */

const WORKER_URL = (process.env.EXPO_PUBLIC_STORAGE_WORKER_URL ?? "").replace(/\/$/, "");
const AUTH_SECRET = process.env.EXPO_PUBLIC_STORAGE_AUTH_SECRET!;

/**
 * Upload a file to R2 via the Worker.
 * @param key - Storage path (e.g. "videos/userId/groupId/123.mp4")
 * @param uri - Local file URI (file:// or content://)
 * @param contentType - MIME type
 * @returns Public URL of the uploaded file
 */
export async function uploadFile(
  key: string,
  uri: string,
  contentType: string,
): Promise<string> {
  const fileName = key.split("/").pop()!;

  const formData = new FormData();
  // React Native FormData accepts { uri, name, type } objects
  formData.append("file", {
    uri,
    name: fileName,
    type: contentType,
  } as any);
  formData.append("key", key);

  const response = await fetch(`${WORKER_URL}/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AUTH_SECRET}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Upload failed" }));
    throw new Error((error as any).error ?? "Upload failed");
  }

  const data = (await response.json()) as { url: string; key: string };
  return data.url;
}

/**
 * Delete one or more files from R2.
 */
export async function deleteFiles(keys: string[]): Promise<void> {
  if (keys.length === 0) return;

  const response = await fetch(`${WORKER_URL}/delete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AUTH_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ keys }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Delete failed" }));
    throw new Error((error as any).error ?? "Delete failed");
  }
}

/**
 * Get the public URL for a stored file.
 */
export function getPublicUrl(key: string): string {
  return `${WORKER_URL}/${key}`;
}
