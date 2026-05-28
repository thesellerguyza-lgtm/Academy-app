import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { GlassCard } from "@/components/glass";
import { useEffect, useState } from "react";
import { Activity, Sparkles, Bot, Lock, ChevronRight, TrendingUp, Plug, Shield, Calendar as CalIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import hero from "@/assets/hero-wallpaper.jpg";

export const Route = createFileRoute("/_app/")({ component: Dashboard });

function greetingFor(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 19) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const { profile, isAdmin, user } = useAuth();
  const [now, setNow] = useState(new Date());
  const [active, setActive] = useState<any>(null);
  const [conn, setConn] = useState<any>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    supabase.from("signals").select("*").eq("status", "active")
      .order("created_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setActive(data));
    if (user) {
      supabase.from("ea_connections").select("*").eq("user_id", user.id).maybeSingle()
        .then(({ data }) => setConn(data));
    }
  }, [user?.id]);

  const plan = profile?.plan ?? "none";
  const hasAny = plan !== "none";
  const hasPro = plan === "pro" || plan === "premium";
  const hasPremium = plan === "premium";

  const lastBeat = conn?.last_heartbeat ? new Date(conn.last_heartbeat).getTime() : 0;
  const online = lastBeat && Date.now() - lastBeat < 90_000;

  const cards = [
    { to: "/signals",  title: "Signals",          desc: "Live BUY / SELL setups",   Icon: Activity,  locked: !hasAny },
    { to: "/calendar", title: "Economic Calendar", desc: "Events + possible direction", Icon: CalIcon, locked: !hasAny },
    { to: "/scanner",  title: "AI Scanner",       desc: "Upload a chart, get a setup", Icon: Sparkles, locked: !hasPro },
    { to: "/ea",       title: "EA Dashboard",     desc: "Automated trading control", Icon: Bot,       locked: !hasPremium },
  ];

  return (
    <div className="max-w-2xl mx-auto pb-6">
      {/* Hero with wallpaper + gradient overlay */}
      <header className="relative overflow-hidden">
        <img src={hero} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-background" />
        <div className="relative px-5 pt-14 pb-10 animate-slide-down">
          <p className="text-sm text-white/80">
            {now.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
            {" · "}
            {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          </p>
          <h1 className="text-4xl tracking-tight font-display">
            {greetingFor(now.getHours())},{" "}
            <span className="text-white">{profile?.name || profile?.username}</span>
          </h1>
          <p className="text-white/70 text-sm">@{profile?.username} · plan: {plan}</p>
        </div>
      </header>

      <div className="px-5 space-y-6">
        {plan === "none" && (
          <Link to="/plans" className="block">
            <GlassCard strong className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Activate a plan to unlock features</div>
                <p className="text-xs text-muted-foreground">Pay via WhatsApp — admin activates your account.</p>
              </div>
              <ChevronRight className="h-5 w-5" />
            </GlassCard>
          </Link>
        )}

        {hasPremium && !online && (
          <Link to="/ea-bridge" className="block">
            <GlassCard strong className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Plug className="h-5 w-5" />
                <div>
                  <div className="font-semibold">Connect your MT5</div>
                  <p className="text-xs text-muted-foreground">Required for live PnL and auto-trading.</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5" />
            </GlassCard>
          </Link>
        )}

        {isAdmin && (
          <Link to="/admin" className="block">
            <GlassCard strong glow="blue" className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5" />
                <div>
                  <div className="font-semibold">Admin Console</div>
                  <p className="text-xs text-muted-foreground">Approve, upgrade, or revoke users.</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5" />
            </GlassCard>
          </Link>
        )}

        <div className="grid gap-4">
          {cards.map(({ to, title, desc, Icon, locked }, i) => (
            <Link
              key={to}
              to={locked ? "/plans" : to}
              style={{ animationDelay: `${i * 60}ms` }}
              className="block ios-bounce"
            >
              <GlassCard strong glow={locked ? "none" : "blue"} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl p-3 glass glow-blue"><Icon className="h-6 w-6" /></div>
                  <div>
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                      {title}
                      {locked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                    </h2>
                    <p className="text-xs text-muted-foreground">{locked ? "Locked — upgrade to access" : desc}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 opacity-60" />
              </GlassCard>
            </Link>
          ))}
        </div>

        {hasAny && (
          <GlassCard strong className="animate-pulse-red">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <h3 className="font-semibold">TP / SL Tracker</h3>
              </div>
              <span className="text-xs px-2 py-1 rounded-full border border-white/30">LIVE</span>
            </div>
            {active ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-2xl font-bold">{active.pair}</span>
                  <span className={active.direction === "BUY" ? "text-green-400" : "text-red-400"}>{active.direction}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <Pill label="Entry" value={active.entry} />
                  <Pill label="SL" value={active.stop_loss} />
                  <Pill label="TP" value={active.take_profit} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active signal. The system is scanning.</p>
            )}
          </GlassCard>
        )}
      </div>
    </div>
  );
}

function Pill({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="glass rounded-xl px-3 py-2 text-center">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
