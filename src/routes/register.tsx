import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { GlassButton, GlassCard } from "@/components/glass";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({ component: Register });

const COUNTRIES = [
  { code: "+27", name: "South Africa" },
  { code: "+1", name: "USA" },
  { code: "+44", name: "UK" },
  { code: "+234", name: "Nigeria" },
  { code: "+254", name: "Kenya" },
  { code: "+91", name: "India" },
  { code: "+61", name: "Australia" },
  { code: "+971", name: "UAE" },
  { code: "+49", name: "Germany" },
  { code: "+33", name: "France" },
];

function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "", surname: "", username: "", phone: "",
    countryCode: "+27", email: "", password: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error("Password must be at least 8 characters");

    setBusy(true);
    // Check unique username first
    const { data: exists } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", form.username)
      .maybeSingle();
    if (exists) {
      setBusy(false);
      return toast.error("Username already taken");
    }

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          name: form.name,
          surname: form.surname,
          username: form.username,
          phone: form.phone,
          country_code: form.countryCode,
        },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — explore the app. Activate a plan to unlock features.");
    nav({ to: "/" });
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-10 max-w-md mx-auto">
      <Link to="/login" className="ios-bounce inline-flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to login
      </Link>

      <div className="text-center mb-6 animate-float-in">
        <h1 className="text-3xl font-bold text-glow">Create your account</h1>
        <p className="text-muted-foreground mt-1">Join SIMPHIWEFXACADEMY</p>
      </div>

      <GlassCard strong>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name"><input required value={form.name} onChange={upd("name")} className="w-full bg-transparent outline-none py-2" /></Field>
            <Field label="Surname"><input required value={form.surname} onChange={upd("surname")} className="w-full bg-transparent outline-none py-2" /></Field>
          </div>
          <Field label="Username">
            <input required value={form.username} onChange={upd("username")}
              pattern="[a-zA-Z0-9_]{3,20}" title="3–20 chars, letters/numbers/_"
              className="w-full bg-transparent outline-none py-2" />
          </Field>
          <div className="glass rounded-2xl px-3 py-1 flex items-center gap-2">
            <div className="flex-shrink-0">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground pt-1">Country</div>
              <select
                value={form.countryCode}
                onChange={upd("countryCode")}
                className="bg-transparent outline-none py-2 pr-2"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-background">
                    {c.code} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 border-l border-white/10 pl-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground pt-1">Phone</div>
              <input
                type="tel" required value={form.phone} onChange={upd("phone")}
                className="w-full bg-transparent outline-none py-2"
              />
            </div>
          </div>
          <Field label="Email">
            <input type="email" required value={form.email} onChange={upd("email")} className="w-full bg-transparent outline-none py-2" />
          </Field>
          <Field label="Password">
            <div className="flex items-center">
              <input
                type={showPw ? "text" : "password"} required value={form.password} onChange={upd("password")}
                className="flex-1 bg-transparent outline-none py-2"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="p-1 text-muted-foreground">
                {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </Field>

          <GlassButton type="submit" variant="primary" disabled={busy} className="w-full mt-2">
            {busy ? "Creating…" : "Create account"}
          </GlassButton>
        </form>
      </GlassCard>
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
