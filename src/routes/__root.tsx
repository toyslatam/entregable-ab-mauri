import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  Navigate,
  useRouterState,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

import appCss from "../styles.css?url";
import { Watermark } from "@/components/Watermark";
import { useContentProtection } from "@/hooks/use-content-protection";
import { adminLogout, adminSession } from "@/lib/admin.functions";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">Página no encontrada</p>
        <Link to="/" className="mt-6 inline-block px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm">
          Ir al inicio
        </Link>
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
          onClick={() => {
            router.invalidate();
            reset();
          }}
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
      { name: "robots", content: "noindex, nofollow" },
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

function NavBar({ onLogout }: { onLogout: () => void | Promise<void> }) {
  return (
    <header className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="font-semibold tracking-tight shrink-0">
          ENTREGABLE AB MAURI
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          <Link
            to="/"
            className="px-3 py-1.5 rounded-md hover:bg-muted [&.active]:bg-muted [&.active]:font-medium"
            activeOptions={{ exact: true }}
          >
            Tabla
          </Link>
          <Link
            to="/datos-liberados"
            className="px-3 py-1.5 rounded-md hover:bg-muted [&.active]:bg-muted [&.active]:font-medium"
          >
            Datos liberados
          </Link>
          <Link
            to="/admin"
            className="px-3 py-1.5 rounded-md hover:bg-muted [&.active]:bg-muted [&.active]:font-medium"
          >
            Administración
          </Link>
          <button
            type="button"
            onClick={() => void onLogout()}
            className="px-3 py-1.5 rounded-md hover:bg-muted text-muted-foreground"
          >
            Cerrar sesión
          </button>
        </nav>
      </div>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate />
    </QueryClientProvider>
  );
}

function AuthGate() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLogin = pathname === "/login";

  const fetchSession = useServerFn(adminSession);
  const logout = useServerFn(adminLogout);

  const session = useQuery({
    queryKey: ["admin-session"],
    queryFn: () => fetchSession(),
  });

  useContentProtection(!isLogin && Boolean(session.data?.authenticated));

  async function onLogout() {
    await logout();
    await session.refetch();
    window.location.href = "/login";
  }

  if (session.isLoading && !isLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Verificando sesión…
      </div>
    );
  }

  const authenticated = Boolean(session.data?.authenticated);

  if (!authenticated && !isLogin) {
    return <Navigate to="/login" search={{ redirect: pathname }} />;
  }

  if (isLogin) {
    return (
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative no-copy protected-view">
      <Watermark />
      <NavBar onLogout={onLogout} />
      <main className="max-w-7xl mx-auto px-6 py-8 relative z-[1]">
        <Outlet />
      </main>
    </div>
  );
}
