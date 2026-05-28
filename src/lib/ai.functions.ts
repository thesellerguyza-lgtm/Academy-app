import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { EA_STRATEGY_PROMPT, PAIR_ANCHORS, SL_PERCENT } from "./ea-strategy";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

type GwMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | {
      role: "user";
      content: Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
    };

async function callGateway(model: string, messages: GwMessage[]) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages }),
  });
  if (res.status === 429) throw new Error("Rate limit reached — try again shortly.");
  if (res.status === 402) throw new Error("AI credits exhausted. Add funds in workspace settings.");
  if (!res.ok) throw new Error(`AI gateway error ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const content: string = json.choices?.[0]?.message?.content ?? "";
  return content;
}

function extractJson(text: string): any {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fence ? fence[1] : text).trim();
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("No JSON object in AI response");
  return JSON.parse(raw.slice(first, last + 1));
}

/* ---------- Signal generator (EA logic) ---------- */

export const generateEASignal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { pair: string }) =>
    z.object({ pair: z.string().min(3).max(16) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const anchor = PAIR_ANCHORS[data.pair] ?? { mid: 100, spread: 0.5, dp: 2 };
    // anchor the model around a realistic current price
    const drift = (Math.random() - 0.5) * anchor.spread * 6;
    const seedPrice = +(anchor.mid + drift).toFixed(anchor.dp);

    const recent = await supabase
      .from("signals")
      .select("direction")
      .eq("user_id", userId)
      .eq("pair", data.pair)
      .order("created_at", { ascending: false })
      .limit(3);

    const recentDirections = (recent.data ?? []).map((row: any) => row.direction);
    const lastSameDir =
      recentDirections.length >= 3 && recentDirections.every((dir: string) => dir === recentDirections[0])
        ? recentDirections[0]
        : null;

    const user = `Generate ONE fresh signal for ${data.pair} using the EA rules.
Current reference price ~ ${seedPrice} (anchor only — pick a realistic entry near this).
Use SL distance = ${SL_PERCENT}% of entry and TP at 1:3 RR.
${lastSameDir ? `The last 3 signals for ${data.pair} were all ${lastSameDir}. Only repeat that side if the current impulse and structure clearly support it; otherwise choose the opposite direction with stronger evidence.` : ""}
If the structure is unclear, return direction: NO TRADE and explain the reason in skip_reason.
Return STRICT JSON only:
{
  "pair": "${data.pair}",
  "direction": "BUY" | "SELL" | "NO TRADE",
  "entry": number | null,
  "stop_loss": number | null,
  "take_profit": number | null,
  "reasoning": "one sentence, reference impulse + 50% pullback + 1:3 RR",
  "skip_reason": "If NO TRADE, explain why. Otherwise empty string."
}`;

    const content = await callGateway("google/gemini-2.5-flash", [
      { role: "system", content: EA_STRATEGY_PROMPT },
      { role: "user", content: user },
    ]);
    const parsed = extractJson(content);

    const Schema = z.object({
      pair: z.string(),
      direction: z.enum(["BUY", "SELL", "NO TRADE"]),
      entry: z.number().positive().nullable(),
      stop_loss: z.number().positive().nullable(),
      take_profit: z.number().positive().nullable(),
      reasoning: z.string().min(5).max(400),
      skip_reason: z.string().max(400),
    }).superRefine((obj, ctx) => {
      if (obj.direction === "NO TRADE") {
        if (!obj.skip_reason?.trim()) {
          ctx.addIssue({ path: ["skip_reason"], code: z.ZodIssueCode.custom, message: "skip_reason is required for NO TRADE" });
        }
      } else {
        if (obj.entry == null) {
          ctx.addIssue({ path: ["entry"], code: z.ZodIssueCode.custom, message: "entry is required for BUY/SELL" });
        }
        if (obj.stop_loss == null) {
          ctx.addIssue({ path: ["stop_loss"], code: z.ZodIssueCode.custom, message: "stop_loss is required for BUY/SELL" });
        }
        if (obj.take_profit == null) {
          ctx.addIssue({ path: ["take_profit"], code: z.ZodIssueCode.custom, message: "take_profit is required for BUY/SELL" });
        }
      }
    });
    return Schema.parse(parsed);
  });

/* ---------- AI chart scanner (vision + EA logic) ---------- */

export const analyzeChartWithEA = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { imageDataUrl: string; note?: string }) =>
    z
      .object({
        imageDataUrl: z
          .string()
          .startsWith("data:image/")
          .max(8_000_000, "Image too large (max ~6MB)"),
        note: z.string().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const content = await callGateway("google/gemini-2.5-pro", [
      { role: "system", content: EA_STRATEGY_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyse this trading chart using the EA rules above.
${data.note ? `Trader note: ${data.note}\n` : ""}
Identify the latest impulse / imbalance candle, the 50% pullback entry, and project SL/TP at RR 1:3 (virtual SL = ${SL_PERCENT}% of price).
Return STRICT JSON only:
{
  "pair": string,        // best-guess from the chart, e.g. "XAU/USD" or "Unknown"
  "timeframe": string,   // e.g. "1H", "15m", "Unknown"
  "direction": "BUY" | "SELL" | "NO TRADE",
  "entry": string,       // explicit price or "Wait for 50% pullback into <zone>"
  "stop_loss": string,   // virtual SL description / price
  "take_profit": string, // RR 1:3 target description / price
  "confluence": string,  // impulse + imbalance + structure note
  "skip_reason": string  // empty unless direction == "NO TRADE" (e.g. NFP, no clean imbalance)
}`,
          },
          { type: "image_url", image_url: { url: data.imageDataUrl } },
        ],
      },
    ]);
    return extractJson(content);
  });
