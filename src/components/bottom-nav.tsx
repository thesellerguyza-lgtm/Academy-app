import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Activity, Sparkles, Bot, User, Plug, Calendar as CalIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export function BottomNav() {
  const path = useRouterState({ select: (s: any) => s.location.pathname });
  const { profile } = useAuth();
  const isPremium = profile?.plan === "premium";

  const tabs = [
    { to: "/", label: "Home", Icon: Home },
    { to: "/signals", label: "Signals", Icon: Activity },
    { to: "/calendar", label: "Events", Icon: CalIcon },
    { to: "/scanner", label: "Scanner", Icon: Sparkles },
    isPremium
      ? { to: "/ea-bridge", label: "Bridge", Icon: Plug }
      : { to: "/ea", label: "EA", Icon: Bot },
    { to: "/account", label: "Account", Icon: User },
  ] as const;

  return (
    <nav className="fixed bottom-3 left-1/2 z-40 -translate-x-1/2">
      <div className="bg-black rounded-full px-2 py-2 flex gap-1">
        {tabs.map(({ to, label, Icon }) => {
          const active = path === to || (to !== "/" && path.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "ios-bounce flex flex-col items-center justify-center rounded-full px-3 py-2 text-[10px] font-medium",
                active
                  ? "bg-white/15 text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
