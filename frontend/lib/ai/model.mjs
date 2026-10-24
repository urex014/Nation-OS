/** Fast tool-calling Grok on the AI Gateway, checked against the live model list. */
export const DEFAULT_GATEWAY_MODEL = "spacexai/grok-4.20-non-reasoning";
/** Same family on the direct xAI API, which does not use the gateway prefix. */
export const DEFAULT_XAI_MODEL = "grok-4.20-non-reasoning";

export function gatewayReady() {
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN);
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
 * Gateway string models use OIDC on Vercel or AI_GATEWAY_API_KEY locally.
 * A direct xAI key is only used when the gateway is not configured.
 */
export async function resolveModel() {
  if (gatewayReady()) return gatewayModelId();
  if (!process.env.XAI_API_KEY) return null;
  const { createXai } = await import("@ai-sdk/xai");
  const id = process.env.XAI_MODEL || DEFAULT_XAI_MODEL;
  return createXai({ apiKey: process.env.XAI_API_KEY })(id);
}
