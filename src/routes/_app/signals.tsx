import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, TrendingUp, TrendingDown, Loader2, Zap, Lock } from "lucide-react";
import { GlassCard, GlassButton } from "@/components/glass";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { generateEASignal } from "@/lib/ai.functions";
import { getLivePrice } from "@/lib/market.functions";
import { enqueueEACommand } from "@/lib/ea.functions";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app/signals")({ component: Signals });

const PAIRS = ["USD/JPY", "EUR/USD", "GBP/USD", "XAU/USD", "BTC/USD", "NZD/USD", "DJI"];

function Signals() {
  const { profile, isAdmin } = useAuth();
  const locked = !profile?.plan || profile.plan === "none";

  const [signals, setSignals] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [pair, setPair] = useState(PAIRS[0]);
  const [live, setLive] = useState<Record<string, number | null>>({});
  const genFn = useServerFn(generateEASignal);
  const priceFn = useServerFn(getLivePrice);
  const enqueue = useServerFn(enqueueEACommand);

  const load = async () => {
    const { data } = await supabase
      .from("signals").select("*").order("created_at", { ascending: false }).limit(50);
    setSignals(data ?? []);
  };

  useEffect(() => { if (!locked) load(); }, [locked]);

  useEffect(() => {
    if (locked) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const r = await priceFn({ data: { pair } });
        if (!cancelled) setLive((m) => ({ ...m, [pair]: r.price ?? null }));
      } catch { /* ignore */ }
    };
    tick();
    const t = setInterval(tick, 20_000);
    return () => { cancelled = true; clearInterval(t); };
  }, [pair, priceFn, locked]);

  if (locked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <GlassCard strong className="text-center">
          <Lock className="h-8 w-8 mx-auto mb-2" />
          <h1 className="text-2xl font-bold">Signals locked</h1>
          <p className="text-muted-foreground mt-2">Signals are included from the R300 Lite plan upward.</p>
          <Link to="/plans"><GlassButton variant="primary" className="mt-4">View plans</GlassButton></Link>
        </GlassCard>
      </div>
    );
  }

  const generate = async () => {
    setBusy(true);
    try {
      const s = await genFn({ data: { pair } });
      if (s.direction === "NO TRADE") {
        toast(`No trade signal: ${s.skip_reason || s.reasoning || "unclear setup"}`);
        return;
      }
      const { error } = await supabase.from("signals").insert({
        pair: s.pair, direction: s.direction,
        entry: s.entry, stop_loss: s.stop_loss, take_profit: s.take_profit,
        reasoning: s.reasoning,
      });
      if (error) throw error;
      toast.success("Signal generated");
      load();
    } catch (e: any) { toast.error(e.message ?? "Failed to generate signal"); }
    finally { setBusy(false); }
  };

  const execute = async (s: any) => {
    if (profile?.plan !== "premium") return toast.error("Auto-execute is a Premium feature");
    try {
      await enqueue({
        data: {
          type: "open_trade",
          payload: { pair: s.pair, direction: s.direction, entry: s.entry, sl: s.stop_loss, tp: s.take_profit, signal_id: s.id },
        },
      });
      toast.success(`Queued ${s.direction} ${s.pair} for your MT5`);
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  const liveSigs = signals.filter((s) => s.status === "active");
  const pastSigs = signals.filter((s) => s.status !== "active");

  return (
    <div className="px-5 py-10 max-w-2xl mx-auto space-y-5">
      <Link to="/" className="ios-bounce inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Signals</h1>
          <p className="text-muted-foreground text-sm">Strict EA setups with balanced BUY/SELL bias · live quotes via TwelveData</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <select value={pair} onChange={(e) => setPair(e.target.value)} disabled={busy}
              className="glass rounded-2xl px-3 py-2 text-sm bg-transparent outline-none">
              {PAIRS.map((p) => (<option key={p} value={p} className="bg-background">{p}</option>))}
            </select>
            <GlassButton variant="primary" onClick={generate} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate"}
            </GlassButton>
          </div>
        )}
      </div>

      <GlassCard strong className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Live · {pair}</div>
          <div className="text-2xl font-bold">{live[pair] != null ? live[pair] : "—"}</div>
        </div>
        <div className="text-[10px] text-muted-foreground">refreshes every 20s</div>
      </GlassCard>

      <section>
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-2">Live signals</h2>
        {liveSigs.length === 0 ? (
          <GlassCard strong className="text-center text-muted-foreground">No active signals right now.</GlassCard>
        ) : (
          <div className="space-y-3">
            {liveSigs.map((s, i) => (
              <SignalCard key={s.id} s={s} i={i} onExecute={execute} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-2">Past signals</h2>
        {pastSigs.length === 0 ? (
          <GlassCard strong className="text-center text-muted-foreground">No closed signals yet.</GlassCard>
        ) : (
          <div className="space-y-3">
            {pastSigs.map((s, i) => (<SignalCard key={s.id} s={s} i={i} past />))}
          </div>
        )}
      </section>
    </div>
  );
}

function SignalCard({ s, i, past, onExecute }: { s: any; i: number; past?: boolean; onExecute?: (s: any) => void }) {
  const tp = s.status === "tp_hit";
  const sl = s.status === "sl_hit";
  const accent = tp ? "border-green-500/60" : sl ? "border-red-500/60" : "border-white/20";
  return (
    <GlassCard strong className={`border ${accent}`} style={{ animationDelay: `${i * 50}ms` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {s.direction === "BUY" ? <TrendingUp className="h-5 w-5 text-green-400" /> : <TrendingDown className="h-5 w-5 text-red-400" />}
          <span className="text-lg font-bold">{s.pair}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${s.direction === "BUY" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
            {s.direction}
          </span>
        </div>
        <StatusBadge status={s.status} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <Stat label="Entry" v={s.entry} />
        <Stat label="SL" v={s.stop_loss} />
        <Stat label="TP" v={s.take_profit} />
      </div>
      {s.reasoning && <p className="text-xs text-muted-foreground mt-3 italic">{s.reasoning}</p>}
      <div className="flex items-center justify-between mt-3">
        <p className="text-[10px] text-muted-foreground">
          {past && s.closed_at ? `Closed ${new Date(s.closed_at).toLocaleString()}` : new Date(s.created_at).toLocaleString()}
        </p>
        {!past && onExecute && (
          <button onClick={() => onExecute(s)}
            className="ios-bounce text-xs px-3 py-1.5 rounded-full glass inline-flex items-center gap-1">
            <Zap className="h-3 w-3" /> Execute on MT5
          </button>
        )}
      </div>
    </GlassCard>
  );
}

function Stat({ label, v }: { label: string; v: number }) {
  return (
    <div className="glass rounded-xl px-3 py-2 text-center">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="font-semibold">{v}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:    "border-white/40 text-white",
    tp_hit:    "border-green-500 text-green-400 bg-green-500/10",
    sl_hit:    "border-red-500 text-red-400 bg-red-500/10",
    cancelled: "border-white/20 text-muted-foreground",
  };
  const label = status === "tp_hit" ? "TP HIT" : status === "sl_hit" ? "SL HIT" : status.toUpperCase();
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${map[status] ?? ""}`}>{label}</span>;
}
