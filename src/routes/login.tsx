import { createFileRoute, Navigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { LoginForm } from "@/components/LoginForm";
import { adminSession } from "@/lib/admin.functions";

type LoginSearch = {
  redirect?: string;
};

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): LoginSearch => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  component: LoginPage,
  head: () => ({ meta: [{ title: "Iniciar sesión" }] }),
});

function LoginPage() {
  const router = useRouter();
  const { redirect } = Route.useSearch();
  const fetchSession = useServerFn(adminSession);

  const session = useQuery({
    queryKey: ["admin-session"],
    queryFn: () => fetchSession(),
  });

  if (session.isLoading) {
    return (
      <p className="text-sm text-muted-foreground text-center py-20">Verificando sesión…</p>
    );
  }

  if (session.data?.authenticated) {
    if (session.data.user?.mustChangePassword) {
      return <Navigate to="/cambiar-contrasena" />;
    }
    const to = redirect && redirect.startsWith("/") && !redirect.startsWith("/login")
      ? redirect
      : "/";
    return <Navigate to={to} />;
  }

  return (
    <LoginForm
      onSuccess={async () => {
        const next = await session.refetch();
        if (next.data?.user?.mustChangePassword) {
          await router.navigate({ to: "/cambiar-contrasena" });
          return;
        }
        const to = redirect && redirect.startsWith("/") && !redirect.startsWith("/login")
          ? redirect
          : "/";
        await router.navigate({ to });
      }}
    />
  );
}
