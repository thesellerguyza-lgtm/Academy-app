import { createFileRoute, Link, Outlet, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/bottom-nav";
import logo from "@/assets/sfx-logo.png";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading, profile } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-2 border-[color:var(--glow)]/40 border-t-[color:var(--glow)] animate-spin" />
      </div>
    );
  }

  if (!user) {
    // soft redirect via Link click; useEffect would also work
    if (typeof window !== "undefined") router.navigate({ to: "/login" });
    return null;
  }

  if (profile?.status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass-strong rounded-3xl p-8 max-w-md text-center animate-float-in">
          <img src={logo} alt="SFX" className="mx-auto h-20 w-20 rounded-2xl mb-4" />
          <h1 className="text-2xl font-bold text-glow">Awaiting approval</h1>
          <p className="mt-3 text-muted-foreground">
            Your account is pending admin review. You'll be notified once approved.
          </p>
          <Link to="/plans" className="mt-6 inline-block rounded-2xl px-5 py-3 glass glow-blue">
            View / Choose plan
          </Link>
        </div>
      </div>
    );
  }

  if (profile?.status === "blocked") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass-strong rounded-3xl p-8 max-w-md text-center glow-red">
          <h1 className="text-2xl font-bold">Account blocked</h1>
          <p className="mt-3 text-muted-foreground">Contact support for assistance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      <Outlet />
      <BottomNav />
    </div>
  );
}
