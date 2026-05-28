import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminLogin } from "@/lib/admin.functions";

type Props = {
  onSuccess: () => void | Promise<void>;
  title?: string;
  description?: string;
};

export function LoginForm({
  onSuccess,
  title = "Acceso al entregable",
  description = "Ingresa con tu correo y contraseña para ver la tabla y los datos.",
}: Props) {
  const [email, setEmail] = useState("");
  const [input, setInput] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const login = useServerFn(adminLogin);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login({ data: { email: email || undefined, password: input } });
      setEmail("");
      setInput("");
      await onSuccess();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <label className="block text-sm">
            <span className="font-medium text-muted-foreground">Correo</span>
            <input
              type="email"
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@empresa.com"
              className="mt-1 w-full px-3 py-2 rounded-md border bg-background text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-muted-foreground">Contraseña</span>
            <input
              type="password"
              autoComplete="current-password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border bg-background text-sm"
            />
          </label>
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
