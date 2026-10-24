import { api, readJson } from "../../../lib/nigeria/http.mjs";
import { answerQuestion } from "../../../lib/nigeria/chat.mjs";
export const runtime = "nodejs";
// Only structured observations and validated calculations feed responses.
export const POST = api(async (request) => answerQuestion(await readJson(request)));
