/** Fast tool-calling Grok on the AI Gateway, checked against the live model list. */
export const DEFAULT_GATEWAY_MODEL = "spacexai/grok-4.20-non-reasoning";
/** Same family on the direct xAI API, which does not use the gateway prefix. */
export const DEFAULT_XAI_MODEL = "grok-4.20-non-reasoning";

/**
 * On Vercel the OIDC token arrives as the x-vercel-oidc-token request header.
 * Treat every Vercel run as worth trying. The token itself is passed per request.
 */
export function gatewayReady() {
  return Boolean(
    process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL === "1",
  );
}

export function aiConfigured() {
  return gatewayReady() || Boolean(process.env.XAI_API_KEY);
}

export function gatewayModelId() {
  return process.env.AI_MODEL || DEFAULT_GATEWAY_MODEL;
}

/** The id Nation AI will call. A direct xAI key wins over the gateway. */
export function activeModelId() {
  if (process.env.XAI_API_KEY) return process.env.XAI_MODEL || DEFAULT_XAI_MODEL;
  if (gatewayReady()) return gatewayModelId();
  return process.env.XAI_MODEL || DEFAULT_XAI_MODEL;
}

/**
 * A request OIDC token is enough. AI_GATEWAY_API_KEY is optional.
 * The token is sent as the bearer credential and as x-vercel-oidc-token.
 */
export function gatewaySettings({ oidcToken } = {}) {
  const token = typeof oidcToken === "string" ? oidcToken.trim() : "";
  const apiKey = process.env.AI_GATEWAY_API_KEY || token || undefined;
  const headers = token ? { "x-vercel-oidc-token": token } : undefined;
  return { apiKey, headers };
}

/**
 * A set XAI_API_KEY calls api.x.ai directly (XAI_MODEL, or grok-4.20-non-reasoning).
 * The gateway is used only when that key is absent. Gateway calls still forward
 * the request OIDC token, VERCEL_OIDC_TOKEN, or AI_GATEWAY_API_KEY.
 */
export async function resolveModel(options = {}) {
  if (process.env.XAI_API_KEY) {
    const { createXai } = await import("@ai-sdk/xai");
    const id = process.env.XAI_MODEL || DEFAULT_XAI_MODEL;
    return createXai({ apiKey: process.env.XAI_API_KEY })(id);
  }
  if (gatewayReady()) {
    const { createGateway } = await import("ai");
    return createGateway(gatewaySettings(options))(gatewayModelId());
  }
  return null;
}
