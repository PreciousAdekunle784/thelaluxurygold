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

/** Models to try, in order: GEMINI_MODEL (or the default), then Google's current Flash models. */
const FALLBACK_MODELS = ["gemini-flash-latest", "gemini-2.5-flash"];
let workingModel: string | null = null; // remembered once a model answers

const short = (m: string) =>
  m.replace(/AIza[0-9A-Za-z_-]{20,}/g, "[key]").replace(/\s+/g, " ").replace(/^\{.*"message":\s*"([^"]+)".*$/, "$1").slice(0, 140);

export async function askGemini(req: NamingRequest): Promise<AskResult> {
  const candidates = [...new Set([workingModel, geminiModel(), ...FALLBACK_MODELS].filter((m): m is string => !!m))];
  let last: AskResult = { ok: false, kind: "error" };
  for (const model of candidates) {
    const res = await askModel(model, req);
    // A model this key can't use (not found / not supported): try the next one.
    if (!res.ok && res.kind === "error" && res.detail && /\b404\b|not found|not supported|unsupported model/i.test(res.detail)) {
      last = res;
      continue;
    }
    if (res.ok) workingModel = model;
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
