/** Native Next Request/Response boundary. The local workspace has no account or role system. */
import { acceptsOrigin } from "./origin.mjs";
export function api(handler) {
  return async (...args) => {
    try {
      return Response.json(await handler(...args), {
        headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
      });
    } catch (error) {
      return Response.json(
        { error: error.status ? error.message : "The request could not be completed." },
        { status: error.status || 500 },
      );
    }
  };
}
export async function readJson(request) {
  const fail = (message, status) => {
    throw Object.assign(Error(message), { status });
  };
  if (!acceptsOrigin(request)) fail("Cross-origin writes are not accepted.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    fail("Send application/json.", 415);
  const reader = request.body?.getReader();
  if (!reader) fail("Send a JSON body.", 400);
  const chunks = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16000) {
      await reader.cancel();
      fail("Request exceeds 16 KB.", 413);
    }
    chunks.push(value);
  }
  try {
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    const input = JSON.parse(new TextDecoder().decode(bytes));
    if (!input || typeof input !== "object" || Array.isArray(input))
      fail("Send a JSON object.", 400);
    return input;
  } catch {
    fail("Invalid JSON object.", 400);
  }
}
