import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminLogout, adminSession } from "@/lib/admin.functions";
import { AdminPanel } from "@/components/AdminPanel";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Administración" }] }),
});

function AdminPage() {
  const fetchSession = useServerFn(adminSession);
  const logout = useServerFn(adminLogout);

  const session = useQuery({
    queryKey: ["admin-session"],
    queryFn: () => fetchSession(),
  });

  async function onLogout() {
    await logout();
    await session.refetch();
  }

  if (session.isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }

  if (session.data?.user?.role !== "admin") {
    return (
      <div className="max-w-lg rounded-lg border bg-card p-6">
        <h1 className="text-xl font-semibold tracking-tight">Sin permisos de administrador</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Tu usuario puede consultar el entregable, pero no administrar cargas ni usuarios.
        </p>
      </div>
    );
  }

  return <AdminPanel onLogout={onLogout} />;
}
