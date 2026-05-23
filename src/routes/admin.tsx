import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminLogin, adminLogout, adminSession } from "@/lib/admin.functions";
import { AdminPanel } from "@/components/AdminPanel";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Administración" }] }),
});

function AdminPage() {
  const [input, setInput] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSession = useServerFn(adminSession);
  const login = useServerFn(adminLogin);
  const logout = useServerFn(adminLogout);

  const session = useQuery({
    queryKey: ["admin-session"],
    queryFn: () => fetchSession(),
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login({ data: { password: input } });
      setInput("");
      await session.refetch();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onLogout() {
    await logout();
    await session.refetch();
  }

  if (session.isLoading) {
    return <p className="text-sm text-muted-foreground">Verificando sesión…</p>;
  }

  if (session.data?.authenticated) {
    return <AdminPanel onLogout={onLogout} />;
  }

  return (
    <div className="max-w-sm mx-auto">
      <div className="rounded-lg border bg-card p-6">
        <h1 className="text-xl font-semibold tracking-tight">Acceso administrador</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Solo quien conozca la clave puede entrar. La contraseña no se guarda en el navegador;
          se valida en el servidor.
        </p>
        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Contraseña"
            className="w-full px-3 py-2 rounded-md border bg-background text-sm"
          />
          {err && <p className="text-sm text-destructive">{err}</p>}
          <button
            type="submit"
            disabled={loading || !input}
            className="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Verificando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
