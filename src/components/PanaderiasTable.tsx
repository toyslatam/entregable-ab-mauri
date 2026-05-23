import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getPanaderiasPage, getPanaderiasCiudades } from "@/lib/admin.functions";
import { DISPLAY_COLUMNS, formatCell, photoUrlForCell } from "@/lib/columns";

const PAGE_SIZE = 15;
const COL_COUNT = DISPLAY_COLUMNS.length;

export function PanaderiasTable() {
  const [page, setPage] = useState(1);
  const [searchId, setSearchId] = useState("");
  const [debouncedId, setDebouncedId] = useState("");
  const [ciudad, setCiudad] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedId(searchId), 300);
    return () => clearTimeout(t);
  }, [searchId]);

  useEffect(() => setPage(1), [debouncedId, ciudad]);

  const fetchPage = useServerFn(getPanaderiasPage);
  const fetchCiudades = useServerFn(getPanaderiasCiudades);

  const ciudadesQ = useQuery({
    queryKey: ["pan-ciudades"],
    queryFn: () => fetchCiudades(),
  });

  const q = useQuery({
    queryKey: ["pan-page", page, debouncedId, ciudad],
    queryFn: () =>
      fetchPage({
        data: {
          page,
          pageSize: PAGE_SIZE,
          searchId: debouncedId || undefined,
          ciudad: ciudad || undefined,
        },
      }),
  });

  const total = q.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rows = q.data?.rows ?? [];
  const ciudades = ciudadesQ.data?.ciudades ?? [];

  return (
    <div className="no-copy">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <h2 className="text-2xl font-semibold tracking-tight">ENTREGABLE AB MAURI</h2>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Buscar por ID…"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="px-3 py-2 rounded-md border bg-card w-56 text-sm"
          />
          <select
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            className="px-3 py-2 rounded-md border bg-card text-sm min-w-[180px]"
          >
            <option value="">Todas las ciudades</option>
            {ciudades.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {q.isError && (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm mb-3">
          Error al cargar: {(q.error as Error).message}
        </div>
      )}

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-muted sticky top-0 z-10">
              <tr>
                {DISPLAY_COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    className={`text-left px-3 py-2 font-medium border-b whitespace-nowrap ${
                      c.sticky ? "sticky left-0 bg-muted z-20 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]" : ""
                    }`}
                    style={{ minWidth: c.width ?? 120 }}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {q.isLoading && (
                <tr>
                  <td colSpan={COL_COUNT} className="px-4 py-10 text-center text-muted-foreground">
                    Cargando…
                  </td>
                </tr>
              )}
              {!q.isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={COL_COUNT} className="px-4 py-10 text-center text-muted-foreground">
                    No hay registros. El administrador debe subir el archivo Excel.
                  </td>
                </tr>
              )}
              {rows.map((r) => {
                const data = (r.data ?? {}) as Record<string, unknown>;
                return (
                  <tr key={r.id} className="odd:bg-background even:bg-muted/30 align-top">
                    {DISPLAY_COLUMNS.map((c) => {
                      const stickyCell = c.sticky
                        ? "sticky left-0 bg-inherit z-[1] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] font-medium"
                        : "";
                      if (c.kind === "photo") {
                        const src = photoUrlForCell(data, c);
                        return (
                          <td key={c.key} className={`px-3 py-2 border-b ${stickyCell}`}>
                            {src ? (
                              <img
                                src={src}
                                alt={c.label}
                                referrerPolicy="no-referrer"
                                loading="lazy"
                                className="w-14 h-14 object-cover rounded-md border bg-muted"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                                }}
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-md border bg-muted" />
                            )}
                          </td>
                        );
                      }
                      return (
                        <td
                          key={c.key}
                          className={`px-3 py-2 border-b whitespace-nowrap ${stickyCell}`}
                        >
                          {formatCell(data, c)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm">
        <span className="text-muted-foreground">
          Página {page} de {pages} · {total} resultados
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-md border bg-card disabled:opacity-50"
          >
            «
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-md border bg-card disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
            className="px-3 py-1.5 rounded-md border bg-card disabled:opacity-50"
          >
            Siguiente
          </button>
          <button
            onClick={() => setPage(pages)}
            disabled={page >= pages}
            className="px-3 py-1.5 rounded-md border bg-card disabled:opacity-50"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
