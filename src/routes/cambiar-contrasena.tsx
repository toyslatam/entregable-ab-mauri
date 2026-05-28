import { createFileRoute, Navigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminSession, changeOwnPassword } from "@/lib/admin.functions";

export const Route = createFileRoute("/cambiar-contrasena")({
  component: ChangePasswordPage,
  head: () => ({ meta: [{ title: "Cambiar contraseña" }] }),
});

function ChangePasswordPage() {
  const router = useRouter();
  const fetchSession = useServerFn(adminSession);
  const changePassword = useServerFn(changeOwnPassword);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const session = useQuery({
    queryKey: ["admin-session"],
    queryFn: () => fetchSession(),
  });

  if (session.isLoading) {
    return <p className="text-sm text-muted-foreground text-center py-20">Verificando sesión…</p>;
  }

  if (!session.data?.authenticated) {
    return <Navigate to="/login" search={{ redirect: "/cambiar-contrasena" }} />;
  }

  if (!session.data.user?.mustChangePassword) {
    return <Navigate to="/" />;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) {
      setErr("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setErr("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await changePassword({ data: { newPassword: password } });
      await session.refetch();
      await router.navigate({ to: "/" });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">Cambia tu contraseña</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Por seguridad, debes crear una contraseña propia antes de ingresar.
        </p>
        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <label className="block text-sm">
            <span className="font-medium text-muted-foreground">Nueva contraseña</span>
            <input
              type="password"
              autoFocus
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border bg-background text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-muted-foreground">Confirmar contraseña</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border bg-background text-sm"
            />
          </label>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <button
            type="submit"
            disabled={loading || !password || !confirm}
            className="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Guardando…" : "Guardar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}

