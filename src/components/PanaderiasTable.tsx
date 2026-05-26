import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  getPanaderiasPage,
  getPanaderiasCiudades,
  getPanaderiasUnidadesCensales,
} from "@/lib/admin.functions";
import {
  DISPLAY_COLUMNS,
  formatCell,
  photoLargeUrlForCell,
  photoUrlForCell,
} from "@/lib/columns";

const PAGE_SIZE = 15;
const COL_COUNT = DISPLAY_COLUMNS.length;

type LightboxImage = { src: string; alt: string };

export function PanaderiasTable() {
  const [page, setPage] = useState(1);
  const [searchId, setSearchId] = useState("");
  const [debouncedId, setDebouncedId] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [unidadCensal, setUnidadCensal] = useState("");
  const [lightbox, setLightbox] = useState<LightboxImage | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedId(searchId), 300);
    return () => clearTimeout(t);
  }, [searchId]);

  useEffect(() => setPage(1), [debouncedId, ciudad, unidadCensal]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lightbox]);

  const fetchPage = useServerFn(getPanaderiasPage);
  const fetchCiudades = useServerFn(getPanaderiasCiudades);
  const fetchUnidades = useServerFn(getPanaderiasUnidadesCensales);

  const ciudadesQ = useQuery({
    queryKey: ["pan-ciudades"],
    queryFn: () => fetchCiudades(),
  });

  const unidadesQ = useQuery({
    queryKey: ["pan-unidades-censales"],
    queryFn: () => fetchUnidades(),
  });

  const q = useQuery({
    queryKey: ["pan-page", page, debouncedId, ciudad, unidadCensal],
    queryFn: () =>
      fetchPage({
        data: {
          page,
          pageSize: PAGE_SIZE,
          searchId: debouncedId || undefined,
          ciudad: ciudad || undefined,
          unidadCensal: unidadCensal || undefined,
        },
      }),
  });

  const total = q.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rows = q.data?.rows ?? [];
  const ciudades = ciudadesQ.data?.ciudades ?? [];
  const unidades = unidadesQ.data?.unidades ?? [];

  return (
    <div className="no-copy">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <h2 className="text-2xl font-semibold tracking-tight">ENTREGABLE AB MAURI</h2>
        <div className="allow-interaction flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-muted-foreground">Buscar por ID</span>
            <input
              type="search"
              placeholder="Unique ID…"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="px-3 py-2 rounded-md border bg-card w-56"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-muted-foreground">Ciudad</span>
            <select
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              disabled={ciudadesQ.isLoading}
              className="px-3 py-2 rounded-md border bg-card min-w-[180px] disabled:opacity-60"
            >
              <option value="">
                {ciudadesQ.isLoading ? "Cargando…" : "Todas las ciudades"}
              </option>
              {ciudades.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-muted-foreground">Unidad Censal</span>
            <select
              value={unidadCensal}
              onChange={(e) => setUnidadCensal(e.target.value)}
              disabled={unidadesQ.isLoading}
              className="px-3 py-2 rounded-md border bg-card min-w-[180px] disabled:opacity-60"
            >
              <option value="">
                {unidadesQ.isLoading ? "Cargando…" : "Todas las unidades"}
              </option>
              {unidades.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
          {(ciudad || unidadCensal) && (
            <button
              type="button"
              onClick={() => {
                setCiudad("");
                setUnidadCensal("");
              }}
              className="px-3 py-2 text-sm rounded-md border bg-card hover:bg-muted self-end"
            >
              Limpiar filtros
            </button>
          )}
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
                    No hay registros que coincidan con los filtros.
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
                        const large = photoLargeUrlForCell(data, c) ?? src;
                        return (
                          <td key={c.key} className={`px-3 py-2 border-b ${stickyCell}`}>
                            {src ? (
                              <button
                                type="button"
                                onClick={() =>
                                  large && setLightbox({ src: large, alt: c.label })
                                }
                                className="allow-interaction block group focus:outline-none focus:ring-2 focus:ring-primary rounded-md"
                                aria-label={`Ampliar ${c.label}`}
                                title="Clic para ampliar"
                              >
                                <img
                                  src={src}
                                  alt={c.label}
                                  referrerPolicy="no-referrer"
                                  loading="lazy"
                                  className="w-14 h-14 object-cover rounded-md border bg-muted transition group-hover:opacity-80 group-hover:ring-2 group-hover:ring-primary cursor-zoom-in"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                                  }}
                                />
                              </button>
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

      {lightbox && (
        <div
          className="allow-interaction fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.alt}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(null);
            }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl leading-none flex items-center justify-center"
            aria-label="Cerrar"
          >
            ×
          </button>
          <img
            src={lightbox.src}
            alt={lightbox.alt}
            referrerPolicy="no-referrer"
            onClick={(e) => e.stopPropagation()}
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-md shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
