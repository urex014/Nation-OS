import { answerQuestion } from "../nigeria/chat.mjs";
import { advise } from "./advise.mjs";
import { aiConfigured } from "./model.mjs";

export async function answerChat(body, options = {}) {
  const useAi = Boolean(options.forceAi || options.generate || aiConfigured());
  if (!useAi) return answerQuestion(body);
  try {
    return await advise({
      message: body?.message,
      role: options.role,
      generate: options.generate,
    });
  } catch (error) {
    if (error?.status) throw error;
    console.error("AI advisor failed; using rule-based answers.");
    return answerQuestion(body);
  }
}
