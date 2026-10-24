// The server validates inputs and recomputes authoritative results.
export async function request(path, body, method = "POST") {
  const response = await fetch(`/api/${path}`, {
    method: body === undefined ? "GET" : method,
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.error || "Request failed.");
  return data;
}
