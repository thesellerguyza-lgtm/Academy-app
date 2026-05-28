import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Calendar as CalIcon, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { GlassButton, GlassCard } from "@/components/glass";
import { useServerFn } from "@tanstack/react-start";
import { getEconomicCalendar, type CalendarEvent } from "@/lib/calendar.functions";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app/calendar")({ component: CalendarPage });

function CalendarPage() {
  const { profile } = useAuth();
  const locked = !profile?.plan || profile.plan === "none";
  const fn = useServerFn(getEconomicCalendar);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (locked) { setLoading(false); return; }
    fn().then((r) => { setEvents(r.events); setLoading(false); });
  }, [locked, fn]);

  if (locked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <GlassCard strong className="text-center">
          <Lock className="h-8 w-8 mx-auto mb-2" />
          <h1 className="text-2xl font-bold">Economic Calendar locked</h1>
          <p className="text-muted-foreground mt-2">Activate a plan to access market events.</p>
          <Link to="/plans"><GlassButton variant="primary" className="mt-4">View plans</GlassButton></Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="px-5 py-10 max-w-2xl mx-auto space-y-5">
      <Link to="/" className="ios-bounce inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-2"><CalIcon className="h-7 w-7" /> Economic Calendar</h1>
        <p className="text-muted-foreground text-sm">High-impact events this week, with possible market direction.</p>
      </header>

      {loading && <GlassCard strong className="text-center text-muted-foreground">Loading events...</GlassCard>}
      {!loading && events.length === 0 && (
        <GlassCard strong className="text-center text-muted-foreground">No events available right now.</GlassCard>
      )}

      <div className="space-y-3">
        {events.map((e, i) => (
          <GlassCard key={i} strong>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <div className="font-semibold truncate">{e.title}</div>
                <div className="text-xs text-muted-foreground">
                  {e.country} · {new Date(e.date).toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase border ${e.impact === "High" ? "border-white text-white" : "border-white/40 text-muted-foreground"}`}>
                {e.impact}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
              <div className="glass rounded-xl px-2 py-1.5"><div className="text-[10px] uppercase text-muted-foreground">Forecast</div><div className="font-semibold">{e.forecast ?? "—"}</div></div>
              <div className="glass rounded-xl px-2 py-1.5"><div className="text-[10px] uppercase text-muted-foreground">Previous</div><div className="font-semibold">{e.previous ?? "—"}</div></div>
            </div>
            <p className="text-xs italic text-muted-foreground">{e.bias}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
