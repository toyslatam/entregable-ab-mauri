import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminLogin } from "@/lib/admin.functions";
import { AdminPanel } from "@/components/AdminPanel";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Administración" }] }),
});

const STORAGE_KEY = "admin_pwd";

function AdminPage() {
  const [password, setPassword] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const login = useServerFn(adminLogin);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
    if (stored) setPassword(stored);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login({ data: { password: input } });
      sessionStorage.setItem(STORAGE_KEY, input);
      setPassword(input);
      setInput("");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    sessionStorage.removeItem(STORAGE_KEY);
    setPassword(null);
  }

  if (password) return <AdminPanel password={password} onLogout={logout} />;

  return (
    <div className="max-w-sm mx-auto">
      <div className="rounded-lg border bg-card p-6">
        <h1 className="text-xl font-semibold tracking-tight">Acceso administrador</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ingresa la clave para cargar el Excel y los datos liberados.
        </p>
        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <input
            type="password"
            autoFocus
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
