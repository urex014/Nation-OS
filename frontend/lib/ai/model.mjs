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

/** The id the advisor will actually call. The gateway wins over a direct xAI key. */
export function activeModelId() {
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
 * Gateway calls use the request token, VERCEL_OIDC_TOKEN, or AI_GATEWAY_API_KEY.
 * A direct xAI key is only used when the gateway is not configured.
 */
export async function resolveModel(options = {}) {
  if (gatewayReady()) {
    const { createGateway } = await import("ai");
    return createGateway(gatewaySettings(options))(gatewayModelId());
  }
  if (!process.env.XAI_API_KEY) return null;
  const { createXai } = await import("@ai-sdk/xai");
  const id = process.env.XAI_MODEL || DEFAULT_XAI_MODEL;
  return createXai({ apiKey: process.env.XAI_API_KEY })(id);
}
