import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, LogOut } from "lucide-react";
import { GlassButton, GlassCard } from "@/components/glass";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/account")({ component: Account });

const BROKERS = [
  "Accumarkets","FBK Markets","IC Markets","Maono Global Markets","JP Markets",
  "Just Markets","Profin Wealth","Razor Markets","Trade245","RCG Markets",
  "Space Markets","XM Global","Exness Technologies LTD",
];

function Account() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [username, setUsername] = useState("");
  const [mt5Broker, setMt5Broker] = useState("");
  const [mt5Login, setMt5Login] = useState("");
  const [mt5Server, setMt5Server] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username);
    setMt5Broker((profile as any).mt5_broker ?? "");
    setMt5Login((profile as any).mt5_login ?? "");
    setMt5Server((profile as any).mt5_server ?? "");
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      username,
      mt5_broker: mt5Broker || null,
      mt5_login: mt5Login || null,
      mt5_server: mt5Server || null,
    }).eq("id", user.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Saved"); refreshProfile(); }
  };

  return (
    <div className="px-5 py-10 max-w-2xl mx-auto space-y-5">
      <Link to="/" className="ios-bounce inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      <header>
        <h1 className="text-3xl font-bold">Account</h1>
        <p className="text-muted-foreground text-sm">{profile?.email}</p>
        <p className="text-xs mt-1 uppercase tracking-widest">Plan: {profile?.plan}</p>
      </header>

      <GlassCard strong>
        <h3 className="font-semibold mb-3">Profile</h3>
        <Field label="Username">
          <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-transparent outline-none py-2" />
        </Field>
      </GlassCard>

      <GlassCard strong>
        <h3 className="font-semibold mb-1">MT5 account</h3>
        <p className="text-[11px] text-muted-foreground mb-3">
          Used to label your bridge. Login + EA happen on your own device — your MT5 password is never sent here.
        </p>
        <div className="space-y-3">
          <Field label="Broker">
            <select value={mt5Broker} onChange={(e) => setMt5Broker(e.target.value)} className="w-full bg-transparent outline-none py-2">
              <option value="" className="bg-background">Select broker</option>
              {BROKERS.map((b) => <option key={b} value={b} className="bg-background">{b}</option>)}
            </select>
          </Field>
          <Field label="MT5 Login"><input value={mt5Login} onChange={(e) => setMt5Login(e.target.value)} className="w-full bg-transparent outline-none py-2" /></Field>
          <Field label="MT5 Server"><input value={mt5Server} onChange={(e) => setMt5Server(e.target.value)} className="w-full bg-transparent outline-none py-2" /></Field>
        </div>
      </GlassCard>

      <GlassButton variant="primary" className="w-full" onClick={save} disabled={busy}>
        {busy ? "Saving..." : "Save changes"}
      </GlassButton>

      <GlassButton variant="danger" className="w-full flex items-center justify-center gap-2" onClick={signOut}>
        <LogOut className="h-4 w-4" /> Sign out
      </GlassButton>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl px-4 py-1">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground pt-1">{label}</div>
      {children}
    </div>
  );
}
