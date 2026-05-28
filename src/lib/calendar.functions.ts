import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type RawEvent = {
  title: string;
  country: string;
  date: string;
  impact: string;
  forecast?: string;
  previous?: string;
};

export type CalendarEvent = {
  title: string;
  country: string;
  impact: "Low" | "Medium" | "High";
  date: string;
  forecast: string | null;
  previous: string | null;
  bias: string; // human-readable possible direction
};

function inferBias(e: RawEvent): string {
  const f = parseFloat(e.forecast ?? "");
  const p = parseFloat(e.previous ?? "");
  const cur = e.country.toUpperCase();
  const t = (e.title || "").toLowerCase();
  const isInflation = /cpi|inflation|ppi/.test(t);
  const isJobs = /nfp|payroll|unemployment|jobless/.test(t);
  const isRate = /rate|fomc|interest/.test(t);

  if (!Number.isFinite(f) || !Number.isFinite(p)) {
    return `Watch ${cur} pairs for volatility around release.`;
  }
  const stronger = f > p;
  if (isRate)
    return stronger
      ? `Hawkish read → potential ${cur} strength. Look for BUYS on ${cur} pairs.`
      : `Dovish read → potential ${cur} weakness. Look for SELLS on ${cur} pairs.`;
  if (isInflation)
    return stronger
      ? `Higher inflation → ${cur} likely supported. Bias: BUY ${cur}.`
      : `Cooler inflation → ${cur} likely soft. Bias: SELL ${cur}.`;
  if (isJobs)
    return stronger
      ? `Strong jobs → ${cur} bullish bias. Look for BUYS.`
      : `Weak jobs → ${cur} bearish bias. Look for SELLS.`;
  return stronger
    ? `Beat expected → potential ${cur} strength.`
    : `Miss expected → potential ${cur} weakness.`;
}

export const getEconomicCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<{ events: CalendarEvent[]; ts: number }> => {
    try {
      const res = await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.json", {
        headers: { "User-Agent": "SFX-Calendar" },
      });
      if (!res.ok) return { events: [], ts: Date.now() };
      const raw = (await res.json()) as RawEvent[];
      const events: CalendarEvent[] = raw
        .filter((e) => e?.impact === "High" || e?.impact === "Medium")
        .slice(0, 60)
        .map((e) => ({
          title: e.title,
          country: e.country,
          impact: (e.impact as "Low" | "Medium" | "High") ?? "Medium",
          date: e.date,
          forecast: e.forecast ?? null,
          previous: e.previous ?? null,
          bias: inferBias(e),
        }));
      return { events, ts: Date.now() };
    } catch {
      return { events: [], ts: Date.now() };
    }
  });
