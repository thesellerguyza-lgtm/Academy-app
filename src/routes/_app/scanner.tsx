import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Upload, Sparkles, Loader2 } from "lucide-react";
import { GlassButton, GlassCard } from "@/components/glass";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { analyzeChartWithEA } from "@/lib/ai.functions";

export const Route = createFileRoute("/_app/scanner")({ component: Scanner });

const STEPS = [
  "Reading chart structure…",
  "Detecting impulse / imbalance…",
  "Mapping 50% pullback entry…",
  "Projecting virtual SL & 1:3 TP…",
  "Composing EA-grade setup…",
];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function Scanner() {
  const { profile } = useAuth();
  const locked = !(profile?.plan === "pro" || profile?.plan === "premium");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [show, setShow] = useState(true);
  const analyzeFn = useServerFn(analyzeChartWithEA);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 6 * 1024 * 1024) return toast.error("Image too large (max 6MB)");
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const analyze = async () => {
    if (!file) return toast.error("Upload a chart first");
    setBusy(true); setStep(0); setResult(null);
    const tick = setInterval(() => setStep((s) => (s < STEPS.length ? s + 1 : s)), 700);
    try {
      const dataUrl = await fileToDataUrl(file);
      const r = await analyzeFn({ data: { imageDataUrl: dataUrl } });
      setStep(STEPS.length);
      setResult(r);
      setShow(true);
      toast.success("Analysis complete");
    } catch (e: any) {
      toast.error(e.message ?? "Analysis failed");
    } finally {
      clearInterval(tick);
      setBusy(false);
    }
  };

  if (locked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <GlassCard strong className="text-center">
          <h1 className="text-2xl font-bold text-glow">AI Scanner is locked</h1>
          <p className="text-muted-foreground mt-2">Upgrade to Pro or Premium to unlock chart analysis.</p>
          <Link to="/plans"><GlassButton variant="primary" className="mt-4">Upgrade plan</GlassButton></Link>
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
        <h1 className="text-3xl font-bold text-glow">AI Chart Scanner</h1>
        <p className="text-muted-foreground text-sm">Upload a screenshot — get a setup.</p>
      </header>

      <GlassCard strong>
        <label className="block">
          <input type="file" accept="image/*" onChange={pick} className="hidden" />
          <div className="rounded-2xl border-2 border-dashed border-[color:var(--glow)]/30 p-10 text-center ios-bounce hover:bg-white/5 cursor-pointer">
            {preview ? (
              <img src={preview} alt="chart" className="mx-auto max-h-64 rounded-xl" />
            ) : (
              <>
                <Upload className="h-10 w-10 mx-auto mb-2 text-[color:var(--glow)]" />
                <p className="font-medium">Tap to upload chart</p>
                <p className="text-xs text-muted-foreground">PNG / JPG</p>
              </>
            )}
          </div>
        </label>

        <GlassButton variant="primary" className="w-full mt-4" disabled={busy || !file} onClick={analyze}>
          {busy ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</span> : <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4" /> Analyze chart</span>}
        </GlassButton>

        {busy && (
          <div className="mt-4 space-y-1">
            {STEPS.map((s, i) => (
              <div key={s} className={`text-xs flex items-center gap-2 ${i < step ? "text-[color:var(--glow)]" : "text-muted-foreground"}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" /> {s}
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {result && (
        <GlassCard strong glow="blue" className="animate-float-in">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Analysis result</h2>
            <button onClick={() => setShow(!show)} className="text-xs text-[color:var(--glow)] ios-bounce">
              {show ? "Hide" : "View"} result
            </button>
          </div>
          {show && (
            <div className="space-y-2 text-sm">
              <Row k="Pair" v={result.pair ?? "Unknown"} />
              <Row k="Timeframe" v={result.timeframe ?? "Unknown"} />
              <Row k="Direction" v={result.direction ?? "—"} />
              <Row k="Entry" v={result.entry ?? "—"} />
              <Row k="Stop Loss" v={result.stop_loss ?? "—"} />
              <Row k="Take Profit (1:3)" v={result.take_profit ?? "—"} />
              <Row k="Confluence" v={result.confluence ?? "—"} />
              {result.skip_reason ? <Row k="Skip reason" v={result.skip_reason} /> : null}
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 py-2 border-b border-white/5 last:border-0">
      <span className="text-muted-foreground text-xs uppercase tracking-wider">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}
