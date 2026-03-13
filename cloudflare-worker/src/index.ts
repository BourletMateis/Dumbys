/**
 * DumbAward Storage Worker
 *
 * Handles file uploads and deletions on Cloudflare R2.
 * Endpoints:
 *   POST /upload   - Upload a file (multipart/form-data with "file" and "key" fields)
 *   POST /delete   - Delete a file (JSON body with "key")
 *
 * Auth: Bearer token must match AUTH_SECRET.
 * Files are served publicly via R2 custom domain / public access.
 */

interface Env {
  BUCKET: R2Bucket;
  AUTH_SECRET: string;
  ALLOWED_ORIGIN: string;
}

function corsHeaders(env: Env): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function unauthorized(env: Env): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json", ...corsHeaders(env) },
  });
}

function checkAuth(request: Request, env: Env): boolean {
  const auth = request.headers.get("Authorization");
  if (!auth) return false;
  const token = auth.replace("Bearer ", "");
  return token === env.AUTH_SECRET;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(env),
      });
    }

    const url = new URL(request.url);

    // GET/HEAD /:key - serve file publicly (with Range request support for iOS video)
    if ((request.method === "GET" || request.method === "HEAD") && url.pathname.length > 1) {
      const key = url.pathname.slice(1); // remove leading /

      const rangeHeader = request.headers.get("Range");

      // If Range header present, do a range GET from R2
      if (rangeHeader && request.method === "GET") {
        // First get object metadata via HEAD-like call
        const head = await env.BUCKET.head(key);
        if (!head) {
          return new Response("Not Found", { status: 404 });
        }

        const totalSize = head.size;

        // Parse "bytes=START-END"
        const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
        if (!match) {
          return new Response("Invalid Range", { status: 416 });
        }

        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : totalSize - 1;

        const object = await env.BUCKET.get(key, {
          range: { offset: start, length: end - start + 1 },
        });
        if (!object) {
          return new Response("Not Found", { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
        headers.set("Accept-Ranges", "bytes");
        headers.set("Content-Range", `bytes ${start}-${end}/${totalSize}`);
        headers.set("Content-Length", (end - start + 1).toString());

        return new Response(object.body, { status: 206, headers });
      }

      // Non-range GET or HEAD
      const object = await env.BUCKET.get(key);
      if (!object) {
        return new Response("Not Found", { status: 404 });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      headers.set("etag", object.httpEtag);
      headers.set("Accept-Ranges", "bytes");
      headers.set("Content-Length", object.size.toString());

      if (request.method === "HEAD") {
        return new Response(null, { headers });
      }

      return new Response(object.body, { headers });
    }

    // Auth required for upload/delete
    if (!checkAuth(request, env)) {
      return unauthorized(env);
    }

    // POST /upload - multipart upload
    if (request.method === "POST" && url.pathname === "/upload") {
      try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const key = formData.get("key") as string | null;

        if (!file || !key) {
          return new Response(
            JSON.stringify({ error: "Missing 'file' or 'key' field" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders(env) },
            },
          );
        }

        await env.BUCKET.put(key, file.stream(), {
          httpMetadata: {
            contentType: file.type || "application/octet-stream",
          },
        });

        // Construct the public URL
        // Uses the worker URL itself as CDN
        const publicUrl = `${url.origin}/${key}`;

        return new Response(
          JSON.stringify({ url: publicUrl, key }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders(env) },
          },
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ error: err.message }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders(env) },
          },
        );
      }
    }

    // POST /delete - delete file
    if (request.method === "POST" && url.pathname === "/delete") {
      try {
        const body = (await request.json()) as { key?: string; keys?: string[] };
        const keys = body.keys ?? (body.key ? [body.key] : []);

        if (keys.length === 0) {
          return new Response(
            JSON.stringify({ error: "Missing 'key' or 'keys'" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders(env) },
            },
          );
        }

        await env.BUCKET.delete(keys);

        return new Response(
          JSON.stringify({ deleted: keys }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders(env) },
          },
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ error: err.message }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders(env) },
          },
        );
      }
    }

    return new Response("Not Found", {
      status: 404,
      headers: corsHeaders(env),
    });
  },
};
