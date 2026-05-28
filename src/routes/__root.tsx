import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth-context";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-strong rounded-3xl p-10 text-center max-w-md">
        <h1 className="text-7xl font-bold text-glow">404</h1>
        <p className="mt-3 text-muted-foreground">This page drifted into the void.</p>
        <Link to="/" className="inline-block mt-6 rounded-2xl px-5 py-3 glass glow-blue">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-strong rounded-3xl p-8 text-center max-w-md">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-5 rounded-2xl px-5 py-3 glass glow-blue"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" },
      { title: "SIMPHIWEFXACADEMY — AI Forex Signals" },
      { name: "description", content: "SFX — AI-powered forex signals, chart scanner & EA dashboard." },
      { name: "theme-color", content: "#050810" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "SFX" },
      { property: "og:title", content: "SIMPHIWEFXACADEMY — AI Forex Signals" },
      { name: "twitter:title", content: "SIMPHIWEFXACADEMY — AI Forex Signals" },
      { property: "og:description", content: "SFX — AI-powered forex signals, chart scanner & EA dashboard." },
      { name: "twitter:description", content: "SFX — AI-powered forex signals, chart scanner & EA dashboard." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/25b6ecb9-4352-46eb-9649-dd27756ece6a/id-preview-359490ec--6d099d0b-42a4-48be-a2ec-f78e27fc34ab.lovable.app-1779377786371.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/25b6ecb9-4352-46eb-9649-dd27756ece6a/id-preview-359490ec--6d099d0b-42a4-48be-a2ec-f78e27fc34ab.lovable.app-1779377786371.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      { rel: "icon", href: "/icon-512.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster theme="dark" position="top-center" toastOptions={{ className: "glass-strong rounded-2xl" }} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
