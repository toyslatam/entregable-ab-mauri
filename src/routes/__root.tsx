import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Watermark } from "@/components/Watermark";
import { useContentProtection } from "@/hooks/use-content-protection";
import { useRouterState } from "@tanstack/react-router";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">Página no encontrada</p>
        <Link to="/" className="mt-6 inline-block px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm">Ir al inicio</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Algo salió mal</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ENTREGABLE AB MAURI" },
      { name: "description", content: "Entregable AB Mauri — consulta y descarga de datos." },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function NavBar() {
  return (
    <header className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="font-semibold tracking-tight">
          ENTREGABLE AB MAURI
        </Link>
        <nav className="flex gap-1 text-sm">
          <Link to="/" className="px-3 py-1.5 rounded-md hover:bg-muted [&.active]:bg-muted [&.active]:font-medium" activeOptions={{ exact: true }}>
            Tabla
          </Link>
          <Link to="/datos-liberados" className="px-3 py-1.5 rounded-md hover:bg-muted [&.active]:bg-muted [&.active]:font-medium">
            Datos liberados
          </Link>
        </nav>
      </div>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const protectContent = pathname !== "/admin";

  useContentProtection(protectContent);

  return (
    <QueryClientProvider client={queryClient}>
      <div className={`min-h-screen bg-background relative ${protectContent ? "no-copy protected-view" : ""}`}>
        {protectContent && <Watermark />}
        <NavBar />
        <main className="max-w-7xl mx-auto px-6 py-8 relative z-[1]">
          <Outlet />
        </main>
      </div>
    </QueryClientProvider>
  );
}
