import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Copy, RefreshCw, Plug, CheckCircle2, AlertCircle } from "lucide-react";
import { GlassButton, GlassCard } from "@/components/glass";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/ea-bridge")({ component: EABridge });

function EABridge() {
  const { user } = useAuth();
  const [conn, setConn] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [genBusy, setGenBusy] = useState(false);

  const apiBase = typeof window !== "undefined" ? window.location.origin : "";

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("ea_connections").select("*").eq("user_id", user.id).maybeSingle();
    setConn(data);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  useEffect(() => {
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const copy = (txt: string, label: string) => {
    navigator.clipboard.writeText(txt);
    toast.success(`${label} copied`);
  };

  const generateToken = async () => {
    setGenBusy(true);
    const { data, error } = await supabase.rpc("rotate_ea_api_token");
    setGenBusy(false);
    if (error) return toast.error(error.message);
    setToken(data as string);
    toast.success("Token generated — copy it now");
    load();
  };

  const lastBeat = conn?.last_heartbeat ? new Date(conn.last_heartbeat).getTime() : 0;
  const online = lastBeat && Date.now() - lastBeat < 90_000;

  return (
    <div className="px-5 py-10 max-w-2xl mx-auto space-y-5">
      <Link to="/" className="ios-bounce inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      <header>
        <h1 className="text-3xl font-bold text-glow flex items-center gap-2">
          <Plug className="h-7 w-7" /> MT5 Bridge
        </h1>
        <p className="text-muted-foreground text-sm">Connect your MetaTrader 5 to SFX for live PnL & auto-trading.</p>
      </header>

      <GlassCard strong glow={online ? "blue" : "none"}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {online ? <CheckCircle2 className="h-5 w-5 text-[color:var(--glow)]" /> : <AlertCircle className="h-5 w-5 text-muted-foreground" />}
            <span className="font-semibold">{online ? "Connected" : "Not connected"}</span>
          </div>
          <GlassButton onClick={load} className="!py-2 !px-3"><RefreshCw className="h-4 w-4" /></GlassButton>
        </div>
        {conn && online && (
          <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
            <Stat label="Account" v={conn.mt5_login || "—"} />
            <Stat label="Broker" v={conn.broker || "—"} />
            <Stat label="Balance" v={conn.balance != null ? `${conn.balance} ${conn.account_currency ?? ""}` : "—"} />
            <Stat label="Equity" v={conn.equity != null ? `${conn.equity} ${conn.account_currency ?? ""}` : "—"} />
            <Stat label="Live PnL" v={conn.pnl != null ? `${conn.pnl} ${conn.account_currency ?? ""}` : "—"} />
            <Stat label="Open positions" v={Array.isArray(conn.open_positions) ? conn.open_positions.length : 0} />
          </div>
        )}
        <p className="text-[11px] text-muted-foreground mt-3">
          {conn?.last_heartbeat ? `Last heartbeat: ${new Date(conn.last_heartbeat).toLocaleString()}` : "Awaiting first heartbeat from your EA."}
        </p>
      </GlassCard>

      <GlassCard strong>
        <h3 className="font-semibold mb-3">Setup steps</h3>
        <ol className="space-y-3 text-sm">
          <li>
            <div className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1">1. Bridge URL</div>
            <div className="glass rounded-2xl px-3 py-2 flex items-center justify-between gap-2">
              <code className="text-xs break-all">{apiBase}/api/public/ea</code>
              <button onClick={() => copy(`${apiBase}/api/public/ea`, "URL")} className="ios-bounce text-[color:var(--glow)]">
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </li>
          <li>
            <div className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1">2. Your API token</div>
            <div className="glass rounded-2xl px-3 py-2 flex items-center justify-between gap-2">
              <code className="text-xs break-all">{token ?? "Tap Generate to create a token"}</code>
              {token && (
                <button onClick={() => copy(token, "Token")} className="ios-bounce">
                  <Copy className="h-4 w-4" />
                </button>
              )}
            </div>
            <GlassButton onClick={generateToken} disabled={genBusy} className="!py-2 mt-2 w-full text-sm">
              {genBusy ? "Generating…" : token ? "Rotate token" : "Generate token"}
            </GlassButton>
            <p className="text-[10px] text-muted-foreground mt-1">
              Shown once. Copy it now — we only store a hash on our servers.
            </p>
          </li>
          <li>
            <div className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1">3. In MT5</div>
            <p className="text-xs text-muted-foreground">
              Tools → Options → <span className="text-foreground">Expert Advisors</span> → enable <span className="text-foreground">"Allow WebRequest for"</span> and add the URL above. Attach the SFX EA to a chart and paste the URL + token into its inputs. The EA will heartbeat every ~15 s and execute any commands SFX queues.
            </p>
          </li>
        </ol>
        <Link to="/ea" className="block mt-4">
          <GlassButton variant="primary" className="w-full">Open EA Dashboard</GlassButton>
        </Link>
      </GlassCard>
    </div>
  );
}

function Stat({ label, v }: { label: string; v: any }) {
  return (
    <div className="glass rounded-2xl px-3 py-2">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="font-semibold truncate">{String(v)}</div>
    </div>
  );
}
