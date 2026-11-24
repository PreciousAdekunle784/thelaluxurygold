import "server-only";
import { ApiError, FinishReason, GoogleGenAI, ThinkingLevel } from "@google/genai";
import { getDb } from "@/lib/db/client";
import type { AskResult, NamingRequest } from "./ai-naming";

/**
 * Product-name suggestions through Google's Gemini API (official @google/genai SDK).
 * Used when GEMINI_API_KEY (or GOOGLE_API_KEY) is set. Model: GEMINI_MODEL, default gemini-3.8-flash.
 *
 * A popular model can be overloaded for a while, and older ones are retired for new keys. So:
 *   - a busy model (503 "high demand", 504 / no answer in time, 429 quota) is not retried: the next model is
 *     asked straight away, and the busy one is skipped for the next 15 minutes;
 *   - the model that last answered is asked first while the preferred one rests;
 *   - a model this key can't use (404 / retired) is not asked again by this server instance (that answer is quick);
 *   - further models come from Google's own list of models available to this key, best first.
 * Which models rest and which answered last is kept in the database (meta table), so it holds across server
 * instances and cold starts.
 */
export const geminiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
export const geminiModel = () => process.env.GEMINI_MODEL || "gemini-3.8-flash";

/** Overall time the admin may wait for one suggestion, across fallback models. */
const BUDGET_MS = 50_000;
/** At most this many different models per suggestion. */
const MAX_MODELS = 4;
/** Longest wait for one model before it counts as busy (a normal answer takes a few seconds). */
const MODEL_TIMEOUT_MS = 15_000;
/** How long a busy model is skipped. GEMINI_REST_MS is only for tests. */
const restMs = () => Number(process.env.GEMINI_REST_MS) || 15 * 60_000;

let client: GoogleGenAI | null = null;
const gemini = () =>
  (client ??= new GoogleGenAI({
    apiKey: geminiKey(),
    httpOptions: {
      timeout: MODEL_TIMEOUT_MS,
      // No retry on the same model: a busy model is skipped and the next one asked at once.
      retryOptions: { attempts: 1 },
      // GEMINI_BASE_URL is only for tests (a stand-in server); normally the SDK's own endpoint is used.
      ...(process.env.GEMINI_BASE_URL ? { baseUrl: process.env.GEMINI_BASE_URL } : {}),
    },
  }));

/** Shared between instances: which models rest (busy) until when, and the last one that answered. */
interface ModelState {
  resting: Record<string, number>;
  good?: string;
}
const STATE_KEY = "ai:gemini-models";
let memory: ModelState = { resting: {} };
/** Models this key can't use (404 / retired), for this instance. */
const unusable = new Set<string>();

async function loadState(): Promise<ModelState> {
  try {
    const db = await getDb();
    const row = await db.get<{ value: string }>("SELECT value FROM meta WHERE key = $1", [STATE_KEY]);
    if (row?.value) memory = { resting: {}, ...JSON.parse(row.value) };
  } catch (err) {
    console.error("[ai-naming] could not read the Gemini model state:", err instanceof Error ? err.message.slice(0, 160) : err);
  }
  const now = Date.now();
  memory.resting = Object.fromEntries(Object.entries(memory.resting).filter(([, until]) => until > now));
  return memory;
}

async function saveState(state: ModelState) {
  memory = state;
  try {
    const db = await getDb();
    await db.run("INSERT INTO meta (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [STATE_KEY, JSON.stringify(state)]);
  } catch (err) {
    console.error("[ai-naming] could not save the Gemini model state:", err instanceof Error ? err.message.slice(0, 160) : err);
  }
}

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

const isGone = (detail: string) => /Gemini 404\b|not found|not supported|unsupported model|no longer available/i.test(detail);
const isBusy = (detail: string) => /Gemini (5\d\d|429)\b|high demand|overloaded|unavailable|deadline|quota|resource.?exhausted/i.test(detail);

export async function askGemini(req: NamingRequest): Promise<AskResult> {
  const started = Date.now();
  const state = await loadState();
  const resting = { ...state.resting };
  let good = state.good;
  const usable = (m: string) => !unusable.has(m) && !resting[m];

  const tried = new Set<string>();
  let last: AskResult = { ok: false, kind: "error" };
  let discovered = false;
  // the preferred model, else the one that answered last time, then Google's "latest flash" alias, then the list
  let queue = [geminiModel(), ...(good ? [good] : []), "gemini-flash-latest"];
  let changed = false;
  try {
    while (tried.size < MAX_MODELS && Date.now() - started < BUDGET_MS) {
      let model = queue.find((m) => !tried.has(m) && usable(m));
      if (!model && !discovered) {
        discovered = true;
        queue = [...queue, ...(await availableModels())];
        model = queue.find((m) => !tried.has(m) && usable(m));
      }
      if (!model) break;
      tried.add(model);
      const res = await askModel(model, req);
      if (res.ok) {
        if (good !== model) {
          good = model;
          changed = true;
        }
        return res;
      }
      if (res.kind === "auth" || res.kind === "declined" || !res.detail) return res;
      last = res;
      if (isGone(res.detail)) {
        unusable.add(model); // retired or not offered to this key: not asked again
        if (good === model) {
          good = undefined;
          changed = true;
        }
        continue;
      }
      if (isBusy(res.detail)) {
        resting[model] = Date.now() + restMs(); // busy: skipped for a while, the next model is asked now
        changed = true;
        continue;
      }
      return res;
    }
    // Every model is resting or failed: one last try with the model that rests the shortest, rather than nothing.
    if (tried.size === 0) {
      const soonest = Object.entries(resting).filter(([m]) => !unusable.has(m)).sort((a, b) => a[1] - b[1])[0]?.[0];
      if (soonest) {
        const res = await askModel(soonest, req);
        if (res.ok) {
          delete resting[soonest];
          good = soonest;
          changed = true;
        }
        return res;
      }
    }
    return last.kind === "error" && last.detail && /Gemini 429\b/.test(last.detail) ? { ...last, kind: "busy" } : last;
  } finally {
    if (changed) await saveState({ resting, good });
  }
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
      return { ok: false, kind: "error", detail };
    }
    const detail = `Gemini, ${model}: ${short(err instanceof Error ? err.message : String(err))}`;
    console.error("[ai-naming] request failed", detail);
    // a timeout on our side counts as temporary trouble: the next model is tried
    return { ok: false, kind: "error", detail: /timed? ?out|abort/i.test(detail) ? `Gemini 504 (timeout), ${model}` : detail };
  }
}
