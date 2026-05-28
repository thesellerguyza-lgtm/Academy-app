import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { GlassButton, GlassCard } from "@/components/glass";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/sfx-logo.png";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    nav({ to: "/" });
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-10 max-w-md mx-auto">
      <Link to="/" className="ios-bounce inline-flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="text-center mb-8 animate-float-in">
        <img src={logo} alt="SFX" className="mx-auto h-24 w-24 rounded-3xl mb-4 glow-blue" />
        <h1 className="text-3xl font-bold text-glow">Welcome back</h1>
        <p className="text-muted-foreground mt-1">Sign in to SIMPHIWEFXACADEMY</p>
      </div>

      <GlassCard strong className="space-y-4">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email">
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent outline-none py-2"
            />
          </Field>
          <Field label="Password">
            <div className="flex items-center">
              <input
                type={showPw ? "text" : "password"}
                required
                autoComplete="current-password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                className="flex-1 bg-transparent outline-none py-2"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="p-1 text-muted-foreground">
                {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </Field>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="accent-[color:var(--glow)]"
            />
            Remember me
          </label>

          <GlassButton type="submit" variant="primary" disabled={busy} className="w-full">
            {busy ? "Signing in…" : "Sign in"}
          </GlassButton>
        </form>
      </GlassCard>

      <p className="text-center text-sm text-muted-foreground mt-6">
        New here?{" "}
        <Link to="/register" className="text-[color:var(--glow)] underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
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
