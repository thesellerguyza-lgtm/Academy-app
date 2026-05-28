import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Shield, Check, X, Trash2, Crown } from "lucide-react";
import { GlassButton, GlassCard } from "@/components/glass";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin")({ component: AdminPage });

type Row = {
  id: string;
  email: string;
  username: string;
  name: string | null;
  surname: string | null;
  plan: "none" | "lite" | "pro" | "premium";
  status: "pending" | "approved" | "blocked";
  created_at: string;
};

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "blocked">("all");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) nav({ to: "/" });
  }, [loading, isAdmin, nav]);

  const load = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id,email,username,name,surname,plan,status,created_at")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as Row[]);
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const update = async (id: string, patch: Partial<Row>, label: string) => {
    setBusy(id);
    const { error } = await supabase.from("profiles").update(patch as any).eq("id", id);
    setBusy(null);
    if (error) toast.error(error.message);
    else { toast.success(label); load(); }
  };

  const filtered = rows.filter((r) => filter === "all" ? true : r.status === filter);

  if (loading) return null;
  if (!isAdmin) return null;

  return (
    <div className="px-5 py-10 max-w-3xl mx-auto space-y-5">
      <Link to="/" className="ios-bounce inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      <header>
        <h1 className="text-3xl font-bold text-glow flex items-center gap-2">
          <Shield className="h-7 w-7" /> Admin
        </h1>
        <p className="text-muted-foreground text-sm">{rows.length} users · approve, upgrade, or revoke access</p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["all", "pending", "approved", "blocked"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`ios-bounce rounded-full px-4 py-2 text-xs capitalize whitespace-nowrap ${filter === f ? "glass-strong glow-blue text-white" : "glass text-muted-foreground"}`}
          >
            {f} {f !== "all" && `(${rows.filter((r) => r.status === f).length})`}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((r) => (
          <GlassCard key={r.id} strong>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold truncate">{r.name} {r.surname}</div>
                <div className="text-xs text-muted-foreground truncate">@{r.username} · {r.email}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Joined {new Date(r.created_at).toLocaleDateString()}</div>
              </div>
              <div className="flex flex-col gap-1 items-end shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                  r.status === "approved" ? "border-[color:var(--glow)]/40 text-[color:var(--glow)]" :
                  r.status === "pending"  ? "border-yellow-400/40 text-yellow-200" :
                                            "border-red-400/40 text-red-200"
                }`}>{r.status}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider glass">{r.plan}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              {r.status !== "approved" && (
                <GlassButton variant="primary" disabled={busy === r.id}
                  onClick={() => update(r.id, { status: "approved" }, "Approved")}
                  className="!py-2 text-sm flex items-center justify-center gap-1">
                  <Check className="h-4 w-4" /> Approve
                </GlassButton>
              )}
              {r.status === "approved" && (
                <GlassButton disabled={busy === r.id}
                  onClick={() => update(r.id, { status: "blocked", plan: "none" }, "Revoked")}
                  className="!py-2 text-sm flex items-center justify-center gap-1">
                  <X className="h-4 w-4" /> Revoke
                </GlassButton>
              )}
              <select
                value={r.plan}
                disabled={busy === r.id}
                onChange={(e) => update(r.id, { plan: e.target.value as any }, "Plan updated")}
                className="glass rounded-2xl px-3 py-2 text-sm bg-transparent outline-none"
              >
                <option value="none" className="bg-background">none</option>
                <option value="lite" className="bg-background">lite</option>
                <option value="pro" className="bg-background">pro</option>
                <option value="premium" className="bg-background">premium</option>
              </select>
              {r.status !== "blocked" && r.status !== "pending" && (
                <GlassButton variant="danger" disabled={busy === r.id}
                  onClick={() => update(r.id, { status: "blocked", plan: "none" }, "Blocked")}
                  className="!py-2 text-sm flex items-center justify-center gap-1 col-span-2">
                  <Trash2 className="h-4 w-4" /> Block & remove plan
                </GlassButton>
              )}
              {r.plan !== "premium" && r.status === "approved" && (
                <GlassButton disabled={busy === r.id}
                  onClick={() => update(r.id, { plan: "premium" }, "Upgraded to Premium")}
                  className="!py-2 text-sm flex items-center justify-center gap-1 col-span-2">
                  <Crown className="h-4 w-4" /> Upgrade to Premium
                </GlassButton>
              )}
            </div>
          </GlassCard>
        ))}
        {filtered.length === 0 && (
          <GlassCard strong className="text-center text-muted-foreground">No users match this filter.</GlassCard>
        )}
      </div>
    </div>
  );
}
