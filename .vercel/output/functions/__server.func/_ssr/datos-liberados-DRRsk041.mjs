import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useServerFn, c as getReleasedFileUrl } from "./admin.functions-CzXIiee9.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
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
function ReleasedPage() {
  const fetchUrl = useServerFn(getReleasedFileUrl);
  const q = useQuery({
    queryKey: ["released"],
    queryFn: () => fetchUrl()
  });
  const file = q.data?.file;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Datos liberados" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Descarga el archivo publicado por el administrador." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 rounded-lg border bg-card p-6", children: [
      q.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Cargando…" }),
      q.isError && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-destructive", children: [
        "Error: ",
        q.error.message
      ] }),
      !q.isLoading && !file && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Aún no hay archivo publicado. Vuelve más tarde." }),
      file && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: file.filename }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
            "Publicado el ",
            new Date(file.uploaded_at).toLocaleString("es-CO"),
            file.size_bytes ? ` · ${(file.size_bytes / 1024).toFixed(1)} KB` : ""
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: file.url, className: "inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium", children: "⬇ Descargar archivo" })
      ] })
    ] })
  ] });
}
export {
  ReleasedPage as component
};
