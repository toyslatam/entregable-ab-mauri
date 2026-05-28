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
    const to = redirect && redirect.startsWith("/") && !redirect.startsWith("/login")
      ? redirect
      : "/";
    return <Navigate to={to} />;
  }

  return (
    <LoginForm
      onSuccess={async () => {
        await session.refetch();
        const to = redirect && redirect.startsWith("/") && !redirect.startsWith("/login")
          ? redirect
          : "/";
        await router.navigate({ to });
      }}
    />
  );
}
