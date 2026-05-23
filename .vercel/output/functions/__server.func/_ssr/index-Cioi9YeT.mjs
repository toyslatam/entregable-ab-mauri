import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { e as useServerFn, b as getPanaderiasPage, g as getPanaderiasCiudades } from "./admin.functions-CzXIiee9.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { D as DISPLAY_COLUMNS, p as photoUrlForCell, f as formatCell } from "./columns-nsE7om6w.mjs";
import "../_libs/seroval.mjs";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "./server-Csf-dmug.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:stream/promises";
import "../_libs/zod.mjs";
import "../_libs/tanstack__query-core.mjs";
const PAGE_SIZE = 15;
const COL_COUNT = DISPLAY_COLUMNS.length;
function PanaderiasTable() {
  const [page, setPage] = reactExports.useState(1);
  const [searchId, setSearchId] = reactExports.useState("");
  const [debouncedId, setDebouncedId] = reactExports.useState("");
  const [ciudad, setCiudad] = reactExports.useState("");
  reactExports.useEffect(() => {
    const t = setTimeout(() => setDebouncedId(searchId), 300);
    return () => clearTimeout(t);
  }, [searchId]);
  reactExports.useEffect(() => setPage(1), [debouncedId, ciudad]);
  const fetchPage = useServerFn(getPanaderiasPage);
  const fetchCiudades = useServerFn(getPanaderiasCiudades);
  const ciudadesQ = useQuery({
    queryKey: ["pan-ciudades"],
    queryFn: () => fetchCiudades()
  });
  const q = useQuery({
    queryKey: ["pan-page", page, debouncedId, ciudad],
    queryFn: () => fetchPage({
      data: {
        page,
        pageSize: PAGE_SIZE,
        searchId: debouncedId || void 0,
        ciudad: ciudad || void 0
      }
    })
  });
  const total = q.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rows = q.data?.rows ?? [];
  const ciudades = ciudadesQ.data?.ciudades ?? [];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "no-copy", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end justify-between gap-4 mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-semibold tracking-tight", children: "ENTREGABLE AB MAURI" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "search",
            placeholder: "Buscar por ID…",
            value: searchId,
            onChange: (e) => setSearchId(e.target.value),
            className: "px-3 py-2 rounded-md border bg-card w-56 text-sm"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            value: ciudad,
            onChange: (e) => setCiudad(e.target.value),
            className: "px-3 py-2 rounded-md border bg-card text-sm min-w-[180px]",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Todas las ciudades" }),
              ciudades.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: c, children: c }, c))
            ]
          }
        )
      ] })
    ] }),
    q.isError && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-md bg-destructive/10 text-destructive text-sm mb-3", children: [
      "Error al cargar: ",
      q.error.message
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border bg-card overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto overflow-y-auto max-h-[70vh]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm border-collapse", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted sticky top-0 z-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: DISPLAY_COLUMNS.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "th",
        {
          className: `text-left px-3 py-2 font-medium border-b whitespace-nowrap ${c.sticky ? "sticky left-0 bg-muted z-20 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]" : ""}`,
          style: { minWidth: c.width ?? 120 },
          children: c.label
        },
        c.key
      )) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
        q.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: COL_COUNT, className: "px-4 py-10 text-center text-muted-foreground", children: "Cargando…" }) }),
        !q.isLoading && rows.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: COL_COUNT, className: "px-4 py-10 text-center text-muted-foreground", children: "No hay registros. El administrador debe subir el archivo Excel." }) }),
        rows.map((r) => {
          const data = r.data ?? {};
          return /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "odd:bg-background even:bg-muted/30 align-top", children: DISPLAY_COLUMNS.map((c) => {
            const stickyCell = c.sticky ? "sticky left-0 bg-inherit z-[1] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] font-medium" : "";
            if (c.kind === "photo") {
              const src = photoUrlForCell(data, c);
              return /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `px-3 py-2 border-b ${stickyCell}`, children: src ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "img",
                {
                  src,
                  alt: c.label,
                  referrerPolicy: "no-referrer",
                  loading: "lazy",
                  className: "w-14 h-14 object-cover rounded-md border bg-muted",
                  onError: (e) => {
                    e.currentTarget.style.visibility = "hidden";
                  }
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-14 h-14 rounded-md border bg-muted" }) }, c.key);
            }
            return /* @__PURE__ */ jsxRuntimeExports.jsx(
              "td",
              {
                className: `px-3 py-2 border-b whitespace-nowrap ${stickyCell}`,
                children: formatCell(data, c)
              },
              c.key
            );
          }) }, r.id);
        })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mt-4 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
        "Página ",
        page,
        " de ",
        pages,
        " · ",
        total,
        " resultados"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setPage(1),
            disabled: page === 1,
            className: "px-3 py-1.5 rounded-md border bg-card disabled:opacity-50",
            children: "«"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setPage((p) => Math.max(1, p - 1)),
            disabled: page === 1,
            className: "px-3 py-1.5 rounded-md border bg-card disabled:opacity-50",
            children: "Anterior"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setPage((p) => Math.min(pages, p + 1)),
            disabled: page >= pages,
            className: "px-3 py-1.5 rounded-md border bg-card disabled:opacity-50",
            children: "Siguiente"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setPage(pages),
            disabled: page >= pages,
            className: "px-3 py-1.5 rounded-md border bg-card disabled:opacity-50",
            children: "»"
          }
        )
      ] })
    ] })
  ] });
}
function Index() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(PanaderiasTable, {}) });
}
export {
  Index as component
};
