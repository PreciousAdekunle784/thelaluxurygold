import "server-only";
import { ApiError, FinishReason, GoogleGenAI, ThinkingLevel } from "@google/genai";
import type { AskResult, NamingRequest } from "./ai-naming";

/**
 * Product-name suggestions through Google's Gemini API (official @google/genai SDK).
 * Used when GEMINI_API_KEY (or GOOGLE_API_KEY) is set. Model: GEMINI_MODEL, default gemini-3.8-flash.
 *
 * Gemini models come and go (older ones are retired for new keys) and a popular one can be overloaded for a
 * while, so if the preferred model can't answer, the next models are taken from Google's own list of models
 * available to this key, best first.
 */
export const geminiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
export const geminiModel = () => process.env.GEMINI_MODEL || "gemini-3.8-flash";

/** Overall time the admin may wait for one suggestion, across retries and fallback models. */
const BUDGET_MS = 55_000;
/** At most this many different models per suggestion. */
const MAX_MODELS = 4;

let client: GoogleGenAI | null = null;
const gemini = () =>
  (client ??= new GoogleGenAI({
    apiKey: geminiKey(),
    httpOptions: {
      timeout: 25_000,
      // One quick retry when a model is busy (Google: "spikes in demand are usually temporary").
      retryOptions: { attempts: 2, initialDelay: 1, maxDelay: 3, httpStatusCodes: [429, 503] },
      // GEMINI_BASE_URL is only for tests (a stand-in server); normally the SDK's own endpoint is used.
      ...(process.env.GEMINI_BASE_URL ? { baseUrl: process.env.GEMINI_BASE_URL } : {}),
    },
  }));

// Models this key can't use at all (404 / retired / not supported) are skipped from then on. A busy model
// (or a temporary server error) is only skipped for that one request, so it is used again once it recovers.
const unusable = new Set<string>();
let listed: { at: number; models: string[] } | null = null;

/** Gemini text models this key can call with generateContent, best first (from Google's model list, cached for an hour). */
async function availableModels(): Promise<string[]> {
  if (listed && Date.now() - listed.at < 3_600_000) return listed.models;
  const names: string[] = [];
  try {
    const pager = await gemini().models.list();
    for await (const m of pager) {
      const name = (m.name ?? "").replace(/^models\//, "");
      if (!/^gemini-/.test(name) || !m.supportedActions?.includes("generateContent")) continue;
      if (/embed|image|tts|audio|live|aqa|robotics|computer|native|veo|imagen|learnlm|nano|thinking-exp/i.test(name)) continue;
      names.push(name);
    }
  } catch (err) {
    console.error("[ai-naming] could not list Gemini models:", err instanceof Error ? err.message.slice(0, 160) : err);
  }
  const version = (n: string) => Number(/gemini-(\d+(?:\.\d+)?)/.exec(n)?.[1] ?? 0);
  // stable before preview; flash, then flash-lite, then pro; newest version first
  const rank = (n: string) => (/preview|exp/.test(n) ? 10 : 0) + (/flash-lite/.test(n) ? 2 : /flash/.test(n) ? 0 : /pro/.test(n) ? 4 : 6);
  names.sort((a, b) => rank(a) - rank(b) || version(b) - version(a) || a.localeCompare(b));
  listed = { at: Date.now(), models: names };
  return names;
}

const short = (m: string) =>
  m.replace(/AIza[0-9A-Za-z_-]{20,}/g, "[key]").replace(/\s+/g, " ").replace(/^\{.*"message":\s*"([^"]+)".*$/, "$1").slice(0, 140);

export async function askGemini(req: NamingRequest): Promise<AskResult> {
  const started = Date.now();
  const tried = new Set<string>();
  let last: AskResult = { ok: false, kind: "error" };
  let discovered = false;
  let queue = [geminiModel(), "gemini-flash-latest"].filter((m) => !unusable.has(m));
  while (tried.size < MAX_MODELS && Date.now() - started < BUDGET_MS) {
    let model = queue.find((m) => !tried.has(m));
    if (!model && !discovered) {
      discovered = true;
      queue = [...queue, ...(await availableModels()).filter((m) => !unusable.has(m))];
      model = queue.find((m) => !tried.has(m));
    }
    if (!model) break;
    tried.add(model);
    const res = await askModel(model, req);
    if (res.ok || res.kind !== "error" || !res.detail) return res;
    last = res;
    if (/Gemini 404\b|not found|not supported|unsupported model|no longer available/i.test(res.detail)) {
      unusable.add(model); // retired or not offered to this key: never try it again
      continue;
    }
    // temporary trouble on Google's side (5xx such as 503 "high demand" or 504 "deadline expired"): next model
    if (/Gemini 5\d\d\b|high demand|overloaded|unavailable|deadline/i.test(res.detail)) continue;
    return res;
  }
  return last;
}

async function askModel(model: string, req: NamingRequest): Promise<AskResult> {
  try {
    const res = await gemini().models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [{ inlineData: { mimeType: "image/jpeg", data: req.imageBase64 } }, { text: req.prompt }],
        },
      ],
      config: {
        systemInstruction: req.system,
        responseMimeType: "application/json",
        responseJsonSchema: req.schema,
        // Naming one piece is a short task: little thinking keeps the answer quick (and within Google's deadlines).
        ...(/^gemini-3/.test(model) ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
      },
    });
    const reason = res.candidates?.[0]?.finishReason;
    if (res.promptFeedback?.blockReason || reason === FinishReason.SAFETY || reason === FinishReason.PROHIBITED_CONTENT || reason === FinishReason.BLOCKLIST) {
      console.error("[ai-naming] Gemini declined:", res.promptFeedback?.blockReason ?? reason);
      return { ok: false, kind: "declined" };
    }
    const text = res.text;
    if (!text) {
      console.error("[ai-naming] Gemini returned no text:", reason);
      return { ok: false, kind: "declined" };
    }
    return { ok: true, json: text };
  } catch (err) {
    if (err instanceof ApiError) {
      const detail = `Gemini ${err.status}, ${model}: ${short(err.message)}`;
      console.error("[ai-naming]", detail);
      // An invalid key comes back as 400 API_KEY_INVALID; 401/403 are missing or restricted keys.
      if (err.status === 401 || err.status === 403 || (err.status === 400 && /api[_ ]key/i.test(err.message))) return { ok: false, kind: "auth", detail };
      if (err.status === 429) return { ok: false, kind: "busy", detail };
      return { ok: false, kind: "error", detail };
    }
    const detail = `Gemini, ${model}: ${short(err instanceof Error ? err.message : String(err))}`;
    console.error("[ai-naming] request failed", detail);
    // a timeout on our side counts as temporary trouble: the next model is tried
    return { ok: false, kind: "error", detail: /timed? ?out|abort/i.test(detail) ? `Gemini 504 (timeout), ${model}` : detail };
  }
}
