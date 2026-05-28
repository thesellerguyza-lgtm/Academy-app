import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// TwelveData symbol mapping
const TD: Record<string, string> = {
  "EUR/USD": "EUR/USD",
  "USD/JPY": "USD/JPY",
  "GBP/USD": "GBP/USD",
  "NZD/USD": "NZD/USD",
  "AUD/USD": "AUD/USD",
  "USD/CAD": "USD/CAD",
  "USD/CHF": "USD/CHF",
  "XAU/USD": "XAU/USD",
  "BTC/USD": "BTC/USD",
  "ETH/USD": "ETH/USD",
  "DJI": "DJI",
  "SPX": "SPX",
  "NDX": "NDX",
};

// Free-tier key shared in chat — rotate via Settings if abuse becomes an issue.
const TD_KEY = () =>
  process.env.TWELVEDATA_API_KEY || "8a290d7ae4b342df9f1712a7ab294e9c";

async function fetchOne(pair: string) {
  const sym = TD[pair];
  if (!sym) return { pair, price: null as number | null };
  const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(sym)}&apikey=${TD_KEY()}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "SFX-Live" } });
    if (!res.ok) return { pair, price: null };
    const j = await res.json();
    if (j?.status === "error") return { pair, price: null, error: j?.message };
    const price = j?.close ? Number(j.close) : null;
    const prev = j?.previous_close ? Number(j.previous_close) : null;
    return {
      pair,
      price: Number.isFinite(price) ? price : null,
      previous_close: prev,
      change_pct: prev && price ? +(((price - prev) / prev) * 100).toFixed(3) : 0,
      currency: j?.currency_quote ?? null,
      ts: Date.now(),
    };
  } catch {
    return { pair, price: null };
  }
}

export const getLivePrice = createServerFn({ method: "POST" })
  .inputValidator((d: { pair: string }) =>
    z.object({ pair: z.string().min(2).max(16) }).parse(d),
  )
  .handler(async ({ data }) => fetchOne(data.pair));

export const getLivePrices = createServerFn({ method: "POST" })
  .inputValidator((d: { pairs: string[] }) =>
    z.object({ pairs: z.array(z.string().min(2).max(16)).min(1).max(20) }).parse(d),
  )
  .handler(async ({ data }) => {
    const out = await Promise.all(data.pairs.map(fetchOne));
    return { ts: Date.now(), quotes: out };
  });
