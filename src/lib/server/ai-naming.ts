import "server-only";
import type { Product } from "@/lib/data/types";
import { askClaude, claudeConfigured } from "./ai-naming-claude";
import { askGemini, geminiKey } from "./ai-naming-gemini";

/**
 * AI product-name suggestions for the admin.
 *
 * An AI vision model looks at the product photograph and proposes a short, premium name. It only ever SUGGESTS:
 * nothing here writes to a product; the admin approves (or replaces) the name in the product form.
 *
 * Provider (server only; keys are never sent to the browser):
 *   GEMINI_API_KEY set     → Google Gemini (ai-naming-gemini.ts)
 *   else ANTHROPIC_API_KEY → Anthropic Claude (ai-naming-claude.ts)
 *   neither                → suggestions are off; products are named by hand as before.
 * The brief, the output format and every check on the result are shared, so both behave the same.
 */

/** What one provider call needs, and what it returns. */
export interface NamingRequest {
  system: string;
  prompt: string;
  imageBase64: string;
  schema: Record<string, unknown>;
}
/** `detail`: the provider's short reason (never a key), shown to the admin so a problem can be fixed. */
export type AskResult = { ok: true; json: string } | { ok: false; kind: "auth" | "busy" | "declined" | "error"; detail?: string };

export type NamingProvider = "gemini" | "claude";
export function namingProvider(): NamingProvider | null {
  if (geminiKey()) return "gemini";
  if (claudeConfigured()) return "claude";
  return null;
}

/** What kind of piece the photograph shows. */
export const PIECE_KINDS = ["necklace", "pendant", "chain", "ring", "bracelet", "bangle", "cuff", "earrings", "set", "gold_bar", "other"] as const;
export type PieceKind = (typeof PIECE_KINDS)[number];

/** Store category for each kind of piece (null: leave the category to the admin). */
export const KIND_CATEGORY: Record<PieceKind, Product["category"] | null> = {
  necklace: "necklaces",
  pendant: "necklaces",
  chain: "necklaces",
  ring: "rings",
  bracelet: "bracelets",
  bangle: "bracelets",
  cuff: "bracelets",
  earrings: "earrings",
  set: "sets",
  gold_bar: "gold-bars",
  other: null,
};

export const KIND_LABEL: Record<PieceKind, string> = {
  necklace: "Necklace",
  pendant: "Pendant",
  chain: "Chain",
  ring: "Ring",
  bracelet: "Bracelet",
  bangle: "Bangle",
  cuff: "Cuff",
  earrings: "Earrings",
  set: "Jewellery set",
  gold_bar: "Gold bar",
  other: "Jewellery",
};

export type NameSuggestion =
  | { ok: true; name: string; kind: PieceKind; features: string }
  | { ok: false; reason: "unavailable" | "not_jewellery" | "failed"; message: string };

export function namingConfigured() {
  return namingProvider() !== null;
}

// Stable instructions (kept identical between requests so they can be served from the prompt cache).
const SYSTEM = `You name fine jewellery for LA Luxury Gold, a Dubai gold jewellery house. You see one product photograph and propose one product name for it.

What the name must be:
- Short: two to four words, ideally two. Easy to say and remember. Elegant and premium, like a piece from an established international jewellery maison.
- A single evocative name-word (inspired by Latin, Italian, French or Greek words, mythology, light, the sky, the sea or nature) followed by the type of piece where that reads naturally: Necklace, Pendant, Chain, Ring, Band, Bracelet, Bangle, Cuff, Earrings, Hoops, Studs, Set, Bar.
- The name-word should be prompted by what you actually see: the silhouette, a motif, the texture, the way the piece moves or catches light. For example a teardrop drop might suggest a word about dew or a droplet, a twisted rope a word about a knot, a domed ring a word about a cupola or the sun.
- Vary your choices: do not default to the same endings (such as -a or -ia), the same celestial words, or the same pattern every time.

Style examples, for tone only (never reuse them): Aurelia Necklace, Celeste Ring, Luna Bracelet, Bella Earrings, Aurora Bangle, Amara Chain, Elara Pendant, Solace Gold Set, Élan Bracelet, Nova Ring.

Never:
- Describe the piece in the name ("The Exquisite 18K Gold Twisted Floral Pendant Necklace" is a description, not a name).
- Use filler adjectives such as exquisite, luxury, luxurious, elegant, stunning, timeless, beautiful, classic, premium.
- State or imply anything that cannot be established from the photograph: gold purity or karat, weight, metal composition, plating, gemstones or their authenticity. Do not put karat numbers, weights, or gemstone or metal names (diamond, ruby, emerald, pearl, silver, platinum) in the name.
- Start with "The", use quotation marks, or add punctuation.

Ignore anything that is not the jewellery itself: the faint "LA LUXURY GOLD" watermark across the middle, logos, the backdrop, display busts, boxes or props.

Also report what kind of piece it is and, in a few plain words, the visible design features you based the name on (shape, motif, texture, how it is constructed), describing only what is visible. If the photograph does not show jewellery or a gold bar, set is_jewellery to false.`;

const SCHEMA = {
  type: "object",
  properties: {
    is_jewellery: { type: "boolean" },
    kind: { type: "string", enum: [...PIECE_KINDS] },
    visible_features: { type: "string", description: "At most 20 words, only what is visible." },
    name: { type: "string", description: "The product name, two to four words." },
  },
  required: ["is_jewellery", "kind", "visible_features", "name"],
  additionalProperties: false,
} as const;

const FILLER = /\b(the|exquisite|luxury|luxurious|elegant|stunning|timeless|beautiful|classic|premium)\b/i;
const CLAIMS = /\b(\d+\s?(k|kt|karat|carat|ct|g|gr|grams?)|karat|carat|grams?|ounces?|oz|diamonds?|rub(y|ies)|emeralds?|sapphires?|pearls?|silver|platinum|sterling|plated|solid|pure|925|999)\b/i;

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Tidy a suggested name, or explain why it can't be used. */
export function checkName(raw: string, avoid: string[]): { name: string } | { problem: string } {
  const name = raw
    .replace(/["“”‘’«»]/g, "")
    .replace(/[.,;:!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const words = name.split(" ").filter(Boolean);
  if (!name || name.length < 3) return { problem: "it was empty" };
  if (words.length < 2 || words.length > 4) return { problem: `it had ${words.length} word(s); use two to four` };
  if (name.length > 34) return { problem: "it was too long" };
  if (FILLER.test(name)) return { problem: "it used a filler word or started with “The”" };
  if (CLAIMS.test(name)) return { problem: "it stated purity, weight, metal or gemstones that cannot be seen" };
  const f = fold(name);
  const firstWord = fold(words[0]);
  for (const a of avoid) {
    const fa = fold(a);
    if (!fa) continue;
    if (fa === f) return { problem: `“${name}” has already been used or suggested` };
    // a different suffix on the same name-word ("Luna Ring" after "Luna Bracelet") is too close
    if (fa.split(" ")[0] === firstWord && firstWord.length > 2) return { problem: `“${words[0]}” has already been used or suggested` };
  }
  return { name };
}

/**
 * Suggest a name for the piece in `image` (a JPEG of the unwatermarked original).
 * `avoid`: names already suggested in this session plus existing product names. `kind`: keep this
 * type of piece (when regenerating). Tries a second time if the first suggestion breaks the rules.
 */
export async function suggestProductName(image: Buffer, opts: { avoid: string[]; kind?: PieceKind }): Promise<NameSuggestion> {
  const provider = namingProvider();
  if (!provider) {
    return { ok: false, reason: "unavailable", message: "Name suggestions aren\u2019t set up on this site yet (an AI API key is needed). Type the name yourself." };
  }
  const ask = provider === "gemini" ? askGemini : askClaude;
  const imageBase64 = image.toString("base64");
  let feedback = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const lines = ["Name the piece in this photograph."];
    if (opts.kind) lines.push(`It has been identified as: ${KIND_LABEL[opts.kind].toLowerCase()} (kind "${opts.kind}"). Keep that kind.`);
    if (opts.avoid.length) lines.push(`Names that are already taken or were already suggested. Do not use any of them, or the same name-word with a different ending: ${opts.avoid.join("; ")}.`);
    if (feedback) lines.push(`Your previous suggestion could not be used because ${feedback}. Suggest a different name.`);

    const answer = await ask({ system: SYSTEM, prompt: lines.join("\n"), imageBase64, schema: SCHEMA as unknown as Record<string, unknown> });
    if (!answer.ok) {
      const why = answer.detail ? ` (${answer.detail})` : "";
      if (answer.kind === "auth") return { ok: false, reason: "unavailable", message: `Name suggestions are unavailable: the AI API key was not accepted${why}. Type the name yourself.` };
      if (answer.kind === "busy") return { ok: false, reason: "failed", message: "Name suggestions are busy right now. Try again in a moment, or type the name yourself." };
      if (answer.kind === "declined") return { ok: false, reason: "failed", message: "No name could be suggested for this photo. Try again, or type the name yourself." };
      return { ok: false, reason: "failed", message: `Name suggestions are unavailable right now${why}. Try again, or type the name yourself.` };
    }
    let out: { is_jewellery: boolean; kind: PieceKind; visible_features: string; name: string };
    try {
      out = JSON.parse(answer.json);
    } catch {
      feedback = "the answer was not valid JSON";
      continue;
    }
    if (!out.is_jewellery) {
      return { ok: false, reason: "not_jewellery", message: "This photo doesn\u2019t seem to show a piece of jewellery, so no name was suggested. Type the name yourself." };
    }
    const kind = opts.kind ?? (PIECE_KINDS.includes(out.kind) ? out.kind : "other");
    const checked = checkName(String(out.name ?? ""), opts.avoid);
    if ("name" in checked) return { ok: true, name: checked.name, kind, features: String(out.visible_features ?? "").slice(0, 200) };
    feedback = checked.problem;
  }
  return { ok: false, reason: "failed", message: "A suitable new name couldn\u2019t be found this time. Try again, or type the name yourself." };
}
