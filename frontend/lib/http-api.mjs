/** Request boundary shared by Next route handlers. Origin checks and process-local throttling do not replace user authentication. */
import { createAIService } from "./ai-service.mjs";
const response = (status, value) =>
  Response.json(value, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
export function createAnalystAPI(service = createAIService()) {
  let active = false,
    requests = [];
  function permitted(request) {
    const origin = request.headers.get("origin");
    return !origin || origin === new URL(request.url).origin;
  }
  return {
    async status(request) {
      if (!permitted(request))
        return response(403, { error: "Cross-origin requests are not accepted." });
      return response(200, await service.status());
    },
    async analyze(request) {
      if (!permitted(request))
        return response(403, { error: "Cross-origin requests are not accepted." });
      if (!request.headers.get("content-type")?.startsWith("application/json"))
        return response(415, { error: "Send application/json." });
      if (Number(request.headers.get("content-length")) > 12000)
        return response(413, { error: "Request too large." });
      let input;
      try {
        const reader = request.body?.getReader();
        let size = 0;
        const chunks = [];
        if (reader)
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > 12000) {
              await reader.cancel();
              return response(413, { error: "Request too large." });
            }
            chunks.push(value);
          }
        const bytes = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) {
          bytes.set(chunk, offset);
          offset += chunk.length;
        }
        input = JSON.parse(new TextDecoder().decode(bytes));
      } catch {
        return response(400, { error: "Invalid JSON." });
      }
      if (!input || typeof input !== "object" || Array.isArray(input))
        return response(400, { error: "Invalid analysis request." });
      const now = Date.now();
      requests = requests.filter((t) => now - t < 60000);
      if (active || requests.length >= 20)
        return response(429, {
          error: "An analysis is running or the local rate limit was reached. Try again shortly.",
        });
      requests.push(now);
      active = true;
      try {
        return response(200, await service.analyze(input));
      } catch (error) {
        return response(error.status || 500, {
          error: error.status ? error.message : "Unable to complete the analysis.",
        });
      } finally {
        active = false;
      }
    },
  };
}
// Shared inside one Node process only; use a distributed limiter after multi-instance deployment.
const symbol = Symbol.for("nationos.analyst-api");
export function getAnalystAPI() {
  return globalThis[symbol] || (globalThis[symbol] = createAnalystAPI());
}
