import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Crown, Sparkles, Zap, MessageCircle, Lock } from "lucide-react";
import { GlassCard } from "@/components/glass";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/plans")({ component: Plans });

const WHATSAPP = "27724655784";

const PLANS = [
  { id: "lite",    name: "Lite",    price: 300,  Icon: Zap,
    features: ["Signals (live + past)", "Economic calendar", "TP/SL tracker"], locked: ["AI Scanner", "EA Dashboard"] },
  { id: "pro",     name: "Pro",     price: 600,  Icon: Sparkles,
    features: ["Everything in Lite", "AI Chart Scanner"], locked: ["EA Dashboard"] },
  { id: "premium", name: "Premium", price: 1500, Icon: Crown,
    features: ["Everything in Pro", "Full EA Dashboard", "MT5 auto-trading bridge", "Priority support"], locked: [] },
] as const;

function buildWhatsAppUrl(plan: { name: string; price: number }, user: any, profile: any) {
  const msg =
    `Hi Simphiwe,\nI'm ${profile?.name ?? profile?.username ?? user?.email} (@${profile?.username ?? ""}).\n` +
    `I'd like to activate the ${plan.name} plan (R${plan.price}/month) on SFX.\n` +
    `My registered email: ${profile?.email ?? user?.email}\nReady to pay — please send me payment details.`;
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
}

function Plans() {
  const { user, profile } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);

  const logPending = async (plan: typeof PLANS[number]) => {
    if (!user) return;
    setBusy(plan.id);
    try {
      await supabase.from("subscriptions").insert({
        user_id: user.id, plan: plan.id, price_zar: plan.price, payment_status: "pending",
      });
      toast.success("Opening WhatsApp — admin will activate after payment");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not log request");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen px-5 py-10 max-w-2xl mx-auto pb-28">
      <Link to="/" className="ios-bounce inline-flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <header className="text-center mb-8 animate-float-in">
        <h1 className="text-3xl font-bold">Choose your plan</h1>
        <p className="text-muted-foreground mt-1">Pay via WhatsApp — admin activates within minutes.</p>
      </header>

      <div className="space-y-4">
        {PLANS.map((p, i) => (
          <GlassCard key={p.id} strong glow={p.id === "premium" ? "blue" : "none"} style={{ animationDelay: `${i * 70}ms` }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl p-3 glass"><p.Icon className="h-6 w-6" /></div>
                <div>
                  <h2 className="text-xl font-bold">{p.name}</h2>
                  <p className="text-muted-foreground text-sm">Monthly</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">R{p.price}</div>
                <div className="text-xs text-muted-foreground">/ month</div>
              </div>
            </div>
            <ul className="space-y-1.5 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4" /> {f}
                </li>
              ))}
              {p.locked.map((f) => (
                <li key={f} className="flex items-center gap-2 text-muted-foreground line-through">
                  <Lock className="h-3.5 w-3.5" /> {f}
                </li>
              ))}
            </ul>
            <a
              href={buildWhatsAppUrl(p, user, profile)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => logPending(p)}
              className="ios-bounce mt-4 w-full inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-medium tracking-tight border border-white/30 bg-white text-black hover:bg-white/90"
            >
              <MessageCircle className="h-4 w-4" />
              {busy === p.id ? "Opening WhatsApp..." : `Pay via WhatsApp — R${p.price}`}
            </a>
          </GlassCard>
        ))}
      </div>

      <p className="text-xs text-center text-muted-foreground mt-6">
        After payment, admin activates your plan and you get full access immediately.
      </p>
      <Link to="/" className="block text-center text-xs text-muted-foreground mt-3 underline">
        Browse the app
      </Link>
    </div>
  );
}
