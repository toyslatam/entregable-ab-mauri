import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getReleasedFileUrl } from "@/lib/admin.functions";

export const Route = createFileRoute("/datos-liberados")({
  component: ReleasedPage,
  head: () => ({ meta: [{ title: "Datos liberados" }] }),
});

function ReleasedPage() {
  const fetchUrl = useServerFn(getReleasedFileUrl);
  const q = useQuery({ queryKey: ["released"], queryFn: () => fetchUrl() });

  const file = q.data?.file;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Datos liberados</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Descarga el archivo publicado por el administrador.
      </p>

      <div className="mt-6 rounded-lg border bg-card p-6">
        {q.isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
        {q.isError && (
          <p className="text-sm text-destructive">Error: {(q.error as Error).message}</p>
        )}
        {!q.isLoading && !file && (
          <p className="text-sm text-muted-foreground">
            Aún no hay archivo publicado. Vuelve más tarde.
          </p>
        )}
        {file && (
          <div className="space-y-3">
            <div>
              <p className="font-medium">{file.filename}</p>
              <p className="text-xs text-muted-foreground">
                Publicado el {new Date(file.uploaded_at).toLocaleString("es-CO")}
                {file.size_bytes ? ` · ${(file.size_bytes / 1024).toFixed(1)} KB` : ""}
              </p>
            </div>
            <a
              href={file.url}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
            >
              ⬇ Descargar archivo
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
