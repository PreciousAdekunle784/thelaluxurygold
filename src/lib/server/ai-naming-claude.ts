import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { AskResult, NamingRequest } from "./ai-naming";

/** Product-name suggestions through Anthropic's Claude API. Used when ANTHROPIC_API_KEY is set and no Gemini key is. */
const MODEL = "claude-opus-5-5";

export const claudeConfigured = () => !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

let client: Anthropic | null = null;
const anthropic = () => (client ??= new Anthropic({ timeout: 60_000, maxRetries: 1 }));

export async function askClaude(req: NamingRequest): Promise<AskResult> {
  let message: Anthropic.Beta.BetaMessage;
  try {
    message = await anthropic().beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      // If a safety classifier declines, the API retries on Anthropic's recommended fallback model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: req.system, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: req.imageBase64 } },
            { type: "text", text: req.prompt },
          ],
        },
      ],
      output_config: { effort: "medium", format: { type: "json_schema", schema: req.schema } },
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
      console.error("[ai-naming] Claude API key rejected", err.status);
      return { ok: false, kind: "auth" };
    }
    if (err instanceof Anthropic.RateLimitError) return { ok: false, kind: "busy" };
    console.error("[ai-naming] Claude request failed", err instanceof Anthropic.APIError ? `${err.status} ${err.message}` : err);
    return { ok: false, kind: "error" };
  }
  if (message.stop_reason === "refusal" || message.stop_reason === "max_tokens") {
    console.error("[ai-naming] Claude gave no usable answer:", message.stop_reason);
    return { ok: false, kind: "declined" };
  }
  const text = message.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")?.text ?? "";
  return { ok: true, json: text };
}
