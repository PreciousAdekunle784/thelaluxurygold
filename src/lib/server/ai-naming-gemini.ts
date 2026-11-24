import "server-only";
import { ApiError, FinishReason, GoogleGenAI } from "@google/genai";
import type { AskResult, NamingRequest } from "./ai-naming";

/**
 * Product-name suggestions through Google's Gemini API (official @google/genai SDK).
 * Used when GEMINI_API_KEY (or GOOGLE_API_KEY) is set. Model: GEMINI_MODEL, default gemini-3.8-flash.
 */
export const geminiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
export const geminiModel = () => process.env.GEMINI_MODEL || "gemini-3.8-flash";

let client: GoogleGenAI | null = null;
const gemini = () =>
  (client ??= new GoogleGenAI({
    apiKey: geminiKey(),
    // GEMINI_BASE_URL is only for tests (a stand-in server); normally the SDK's own endpoint is used.
    httpOptions: { timeout: 60_000, ...(process.env.GEMINI_BASE_URL ? { baseUrl: process.env.GEMINI_BASE_URL } : {}) },
  }));

/** Models to try, in order: GEMINI_MODEL (or the default), then Google's current Flash models (used when one is unavailable or busy). */
const FALLBACK_MODELS = ["gemini-flash-latest", "gemini-2.5-flash"];
// Models this key can't use at all (404 / not supported) are skipped from then on. A busy model (503) is
// (or a temporary server error) is only skipped for that one request, so the preferred model is used again as soon as it recovers.
const unusable = new Set<string>();

const short = (m: string) =>
  m.replace(/AIza[0-9A-Za-z_-]{20,}/g, "[key]").replace(/\s+/g, " ").replace(/^\{.*"message":\s*"([^"]+)".*$/, "$1").slice(0, 140);

export async function askGemini(req: NamingRequest): Promise<AskResult> {
  const all = [...new Set([geminiModel(), ...FALLBACK_MODELS])];
  const candidates = all.filter((m) => !unusable.has(m));
  if (!candidates.length) candidates.push(...all); // never end up with nothing to try
  let last: AskResult = { ok: false, kind: "error" };
  for (const model of candidates) {
    const res = await askModel(model, req);
    // A model this key can't use (not found / not supported) or one that is overloaded right now
    // (503 "high demand"): try the next one.
    if (!res.ok && res.kind === "error" && res.detail) {
      if (/Gemini 404\b|not found|not supported|unsupported model/i.test(res.detail)) {
        unusable.add(model);
        last = res;
        continue;
      }
      // temporary trouble on Google's side (5xx such as 503 "high demand" or 504 "deadline expired")
      if (/Gemini 5\d\d\b|high demand|overloaded|unavailable|deadline/i.test(res.detail)) {
        last = res;
        continue;
      }
    }
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
    return { ok: false, kind: "error", detail };
  }
}
