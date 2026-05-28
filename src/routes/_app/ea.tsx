import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ChangeEvent } from "react";
import { ArrowLeft, Play, Square, Bot, Plug, Activity } from "lucide-react";
import { GlassButton, GlassCard } from "@/components/glass";
import { useAuth } from "@/lib/auth-context";
import { useServerFn } from "@tanstack/react-start";
import { enqueueEACommand } from "@/lib/ea.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/ea")({ component: EADashboard });

type MtTrade = {
  id: string;
  pair: string;
  direction: "BUY" | "SELL";
  status?: string;
  pnl?: number | null;
  lots?: number | string | null;
};

const EA_HIGHLIGHTS = [
  "Impulse / imbalance 50% pullback entries",
  "Market orders only — virtual SL, no SL order on broker",
  "Fixed risk-reward of 1:3",
  "Fixed lot sizing, max 2 trades per symbol",
  "One symbol at a time, no hedging, NFP-aware",
  "Auto-switch to scalping after 70% drawdown",
];

function EADashboard() {
  const { profile, user } = useAuth();
  const locked = profile?.plan !== "premium";
  const [conn, setConn] = useState<Record<string, any> | null>(null);
  const [trades, setTrades] = useState<MtTrade[]>([]);
  const [running, setRunning] = useState(false);
  const [tradeSymbol, setTradeSymbol] = useState("EURUSD");
  const [tradeDirection, setTradeDirection] = useState<"BUY" | "SELL">("BUY");
  const [tradeLots, setTradeLots] = useState("0.10");
  const [tradeStopLoss, setTradeStopLoss] = useState(0);
  const [tradeTakeProfit, setTradeTakeProfit] = useState(0);
  const [closeTicket, setCloseTicket] = useState("");
  const [tradeBusy, setTradeBusy] = useState(false);
  const enqueue = useServerFn(enqueueEACommand);

  const refresh = async () => {
    if (!user) return;
    const [{ data: c }, { data: t }] = await Promise.all([
      supabase.from("ea_connections").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("ea_trades").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);
    setConn(c);
    setTrades(t ?? []);
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user?.id]);
  useEffect(() => { const t = setInterval(refresh, 6000); return () => clearInterval(t); /* eslint-disable-next-line */ }, [user?.id]);

  if (locked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <GlassCard strong className="text-center">
          <h1 className="text-2xl font-bold">EA Dashboard is locked</h1>
          <p className="text-muted-foreground mt-2">Upgrade to Premium to unlock automated trading.</p>
          <Link to="/plans"><GlassButton variant="primary" className="mt-4">Go Premium</GlassButton></Link>
        </GlassCard>
      </div>
    );
  }

  const lastBeat = conn?.last_heartbeat ? new Date(conn.last_heartbeat).getTime() : 0;
  const online = lastBeat && Date.now() - lastBeat < 90_000;

  const send = async (type: "start" | "stop" | "close_all") => {
    if (!online) return toast.error("Connect your MT5 bridge first");
    try {
      await enqueue({ data: { type } });
      if (type === "start") { setRunning(true); toast.success("EA started — trades will open on your MT5"); }
      if (type === "stop")  { setRunning(false); toast("EA stopped"); }
      if (type === "close_all") toast.success("Close-all queued");
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  const openPnL = trades.filter((t) => t.status === "open").reduce((sum: number, t) => sum + (Number(t.pnl) || 0), 0);
  const closedPnL = trades.filter((t) => t.status !== "open").reduce((sum: number, t) => sum + (Number(t.pnl) || 0), 0);

  return (
    <div className="px-5 py-10 max-w-2xl mx-auto space-y-5">
      <Link to="/" className="ios-bounce inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      {!online && (
        <GlassCard strong>
          <div className="flex items-center gap-3">
            <Plug className="h-6 w-6" />
            <div className="flex-1">
              <div className="font-semibold">MT5 not connected</div>
              <p className="text-xs text-muted-foreground">Set up the bridge before starting the EA.</p>
            </div>
            <Link to="/ea-bridge"><GlassButton variant="primary" className="py-2!">Connect</GlassButton></Link>
          </div>
        </GlassCard>
      )}

      <GlassCard strong className="text-center">
        <div className="mx-auto h-20 w-20 rounded-3xl glass grid place-items-center mb-3">
          <Bot className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold">SFX EA</h1>
        <p className="text-muted-foreground text-sm">
          {online ? (running ? "Engine running" : "Bridge online · engine idle") : "Bridge offline"}
        </p>
        {online && conn && (
          <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
            <Mini label="Account" v={conn.mt5_login ? `${conn.mt5_login}` : "—"} />
            <Mini label="Broker" v={conn.broker ?? "—"} />
            <Mini label="Balance" v={conn.balance != null ? `${conn.balance} ${conn.account_currency ?? ""}` : "—"} />
            <Mini label="Equity" v={conn.equity != null ? `${conn.equity} ${conn.account_currency ?? ""}` : "—"} />
            <Mini label="Free margin" v={conn.free_margin != null ? `${conn.free_margin}` : "—"} />
            <Mini label="Running PnL" v={conn.pnl != null ? `${conn.pnl} ${conn.account_currency ?? ""}` : "—"} />
          </div>
        )}
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        <GlassButton variant="primary" className="py-5! flex items-center justify-center gap-2" onClick={() => send("start")}>
          <Play className="h-5 w-5" /> Start
        </GlassButton>
        <GlassButton variant="danger" className="py-5! flex items-center justify-center gap-2" onClick={() => send("stop")}>
          <Square className="h-5 w-5" /> Stop
        </GlassButton>
        <GlassButton className="py-5! flex items-center justify-center gap-2 col-span-2" onClick={() => send("close_all")}>
          <Activity className="h-5 w-5" /> Close all trades
        </GlassButton>
      </div>

      <GlassCard strong>
        <h3 className="font-semibold mb-3">Manual MT5 trade</h3>
        <p className="text-[11px] text-muted-foreground mb-4">
          Open or close MT5 trades directly from the app. The bridge will execute queued commands when it next heartbeats.
        </p>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="glass rounded-2xl px-3 py-3">
              <label className="text-[10px] uppercase text-muted-foreground">Symbol</label>
              <input
                value={tradeSymbol}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTradeSymbol(e.target.value.toUpperCase())}
                className="w-full bg-transparent outline-none py-2 text-sm"
              />
            </div>
            <div className="glass rounded-2xl px-3 py-3">
              <label className="text-[10px] uppercase text-muted-foreground">Direction</label>
              <select
                value={tradeDirection}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setTradeDirection(e.target.value as "BUY" | "SELL")}
                className="w-full bg-transparent outline-none py-2 text-sm"
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="glass rounded-2xl px-3 py-3">
              <label className="text-[10px] uppercase text-muted-foreground">Lots</label>
              <input
                value={tradeLots}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTradeLots(e.target.value)}
                type="number"
                step="0.01"
                min="0.01"
                className="w-full bg-transparent outline-none py-2 text-sm"
              />
            </div>
            <div className="glass rounded-2xl px-3 py-3">
              <label className="text-[10px] uppercase text-muted-foreground">Stop loss</label>
              <input
                value={tradeStopLoss}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTradeStopLoss(Number(e.target.value))}
                type="number"
                step="0.0001"
                className="w-full bg-transparent outline-none py-2 text-sm"
              />
            </div>
            <div className="glass rounded-2xl px-3 py-3">
              <label className="text-[10px] uppercase text-muted-foreground">Take profit</label>
              <input
                value={tradeTakeProfit}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTradeTakeProfit(Number(e.target.value))}
                type="number"
                step="0.0001"
                className="w-full bg-transparent outline-none py-2 text-sm"
              />
            </div>
          </div>
          <GlassButton
            variant="primary"
            className="w-full"
            onClick={async () => {
              if (!online) return toast.error("Connect your MT5 bridge first");
              if (!tradeSymbol) return toast.error("Enter a symbol");
              setTradeBusy(true);
              try {
                await enqueue({ data: {
                  type: "open_trade",
                  payload: {
                    pair: tradeSymbol,
                    direction: tradeDirection,
                    lots: Number(tradeLots) || 0,
                    stop_loss: tradeStopLoss || undefined,
                    take_profit: tradeTakeProfit || undefined,
                  },
                } });
                toast.success("Trade queued for execution");
                setTradeSymbol("");
                setTradeLots("0.10");
                setTradeStopLoss(0);
                setTradeTakeProfit(0);
                refresh();
              } catch (e: any) {
                toast.error(e.message ?? "Failed to queue trade");
              } finally {
                setTradeBusy(false);
              }
            }}
            disabled={tradeBusy}
          >
            {tradeBusy ? "Queuing trade..." : "Open trade"}
          </GlassButton>

          <div className="border-t border-white/10 pt-4">
            <h4 className="font-semibold mb-3">Close MT5 trade</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="glass rounded-2xl px-3 py-3 col-span-2">
                <label className="text-[10px] uppercase text-muted-foreground">Trade ticket</label>
                <input
                value={closeTicket}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setCloseTicket(e.target.value)}
                className="w-full bg-transparent outline-none py-2 text-sm"
              />
              </div>
              <GlassButton
                className="py-4!"
                onClick={async () => {
                  if (!online) return toast.error("Connect your MT5 bridge first");
                  if (!closeTicket) return toast.error("Enter ticket number");
                  setTradeBusy(true);
                  try {
                    await enqueue({ data: { type: "close_trade", payload: { ticket: closeTicket } } });
                    toast.success("Close trade queued");
                    setCloseTicket("");
                    refresh();
                  } catch (e: any) {
                    toast.error(e.message ?? "Failed to queue close request");
                  } finally {
                    setTradeBusy(false);
                  }
                }}
                disabled={tradeBusy}
              >
                Close trade
              </GlassButton>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        <GlassCard strong className="text-center">
          <div className="text-[10px] uppercase text-muted-foreground">Open PnL</div>
          <div className={`text-xl font-bold ${openPnL >= 0 ? "text-green-400" : "text-red-400"}`}>{openPnL.toFixed(2)}</div>
        </GlassCard>
        <GlassCard strong className="text-center">
          <div className="text-[10px] uppercase text-muted-foreground">Closed profit</div>
          <div className={`text-xl font-bold ${closedPnL >= 0 ? "text-green-400" : "text-red-400"}`}>{closedPnL.toFixed(2)}</div>
        </GlassCard>
      </div>

      <GlassCard strong>
        <h3 className="font-semibold mb-3">Trade history</h3>
        {trades.length === 0 ? (
          <p className="text-xs text-muted-foreground">No trades reported yet.</p>
        ) : (
          <div className="space-y-2">
            {trades.map((t) => (
              <div key={t.id} className="glass rounded-2xl px-3 py-2 flex items-center justify-between text-sm">
                <div>
                  <div className="font-semibold">{t.pair} <span className={`text-[10px] ml-1 px-1.5 py-0.5 rounded ${t.direction === "BUY" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>{t.direction}</span></div>
                  <div className="text-[10px] text-muted-foreground">{t.lots ?? "—"} lots · {t.status}</div>
                </div>
                <div className={`text-right text-xs ${(t.pnl ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {t.pnl != null ? (t.pnl >= 0 ? "+" : "") + t.pnl : "—"}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard strong>
        <h3 className="font-bold mb-2">Engine logic</h3>
        <ul className="space-y-1.5 text-sm">
          {EA_HIGHLIGHTS.map((h) => (
            <li key={h} className="flex gap-2">
              <span>·</span>
              <span className="text-muted-foreground">{h}</span>
            </li>
          ))}
        </ul>
        <p className="text-[10px] text-muted-foreground mt-3">
          Strategy runs server-side and executes on your MT5 via the secure bridge.
        </p>
      </GlassCard>
    </div>
  );
}

function Mini({ label, v }: { label: string; v: string }) {
  return (
    <div className="glass rounded-xl px-2 py-2">
      <div className="text-[9px] uppercase text-muted-foreground">{label}</div>
      <div className="font-semibold truncate">{v}</div>
    </div>
  );
}
