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

  return <AdminPanel onLogout={onLogout} />;
}
