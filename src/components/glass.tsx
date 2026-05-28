import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export function GlassCard({
  className,
  children,
  strong,
  glow,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { strong?: boolean; glow?: "blue" | "red" | "none" }) {
  return (
    <div
      className={cn(
        strong ? "glass-strong" : "glass",
        "rounded-3xl p-5 animate-float-in",
        glow === "blue" && "glow-blue",
        glow === "red" && "glow-red animate-pulse-red",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function GlassButton({
  children,
  variant = "default",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "ghost" | "danger";
  children?: ReactNode;
}) {
  return (
    <button
      className={cn(
        "ios-bounce rounded-2xl px-5 py-3 font-medium tracking-tight",
        "backdrop-blur-xl border",
        variant === "default" && "glass text-foreground hover:bg-white/10",
        variant === "primary" &&
          "border-[color:var(--glow)]/40 bg-[color:var(--glow)]/15 text-white glow-blue hover:bg-[color:var(--glow)]/25",
        variant === "ghost" && "border-transparent bg-transparent hover:bg-white/5",
        variant === "danger" &&
          "border-red-500/40 bg-red-500/15 text-red-100 glow-red hover:bg-red-500/25",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
