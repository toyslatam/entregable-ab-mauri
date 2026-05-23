import { Q as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { Q as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { b as createRouter, a as createRootRouteWithContext, u as useRouter, L as Link, d as useRouterState, O as Outlet, H as HeadContent, S as Scripts, c as createFileRoute, l as lazyRouteComponent } from "../_libs/tanstack__react-router.mjs";
import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { r as readReleasedFile } from "./data-store-CHupUkjj.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "node:fs/promises";
import "node:path";
import "../_libs/vercel__blob.mjs";
import "../_libs/is-node-process.mjs";
import "../_libs/is-buffer.mjs";
import "../_libs/async-retry.mjs";
import "../_libs/retry.mjs";
import "../_libs/undici.mjs";
import "node:assert";
import "node:net";
import "node:buffer";
import "node:util";
import "node:querystring";
import "node:events";
import "node:diagnostics_channel";
import "node:tls";
import "node:zlib";
import "node:perf_hooks";
import "node:util/types";
import "node:worker_threads";
import "node:url";
import "node:console";
import "node:dns";
import "string_decoder";
import "node:http";
import "node:async_hooks";
import "../_libs/throttleit.mjs";
const appCss = "/assets/styles-mrVnJoKg.css";
const LABEL = "PROPIEDAD DE STRATEGEE";
function Watermark() {
  const tiles = Array.from({ length: 48 }, (_, i) => i);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "watermark-layer", "aria-hidden": true, children: tiles.map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "watermark-tile", children: LABEL }, i)) });
}
function useContentProtection(enabled = true) {
  reactExports.useEffect(() => {
    if (!enabled || typeof document === "undefined") return;
    const block = (e) => e.preventDefault();
    const onKeyDown = (e) => {
      const key = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if (mod && ["c", "x", "a", "s", "p", "u"].includes(key)) {
        e.preventDefault();
      }
      if (e.key === "PrintScreen") {
        e.preventDefault();
      }
    };
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("contextmenu", block);
    document.addEventListener("selectstart", block);
    document.addEventListener("dragstart", block);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("selectstart", block);
      document.removeEventListener("dragstart", block);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled]);
}
function NotFoundComponent() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-7xl font-bold", children: "404" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Página no encontrada" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "mt-6 inline-block px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm", children: "Ir al inicio" })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  const router = useRouter();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold", children: "Algo salió mal" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: error.message }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => {
          router.invalidate();
          reset();
        },
        className: "mt-6 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm",
        children: "Reintentar"
      }
    )
  ] }) });
}
const Route$4 = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ENTREGABLE AB MAURI" },
      { name: "description", content: "Entregable AB Mauri — consulta y descarga de datos." }
    ],
    links: [{ rel: "stylesheet", href: appCss }]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "es", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("head", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
function NavBar() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "border-b bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto px-6 py-3 flex items-center justify-between", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "font-semibold tracking-tight", children: "ENTREGABLE AB MAURI" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "flex gap-1 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "px-3 py-1.5 rounded-md hover:bg-muted [&.active]:bg-muted [&.active]:font-medium", activeOptions: { exact: true }, children: "Tabla" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/datos-liberados", className: "px-3 py-1.5 rounded-md hover:bg-muted [&.active]:bg-muted [&.active]:font-medium", children: "Datos liberados" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/admin", className: "px-3 py-1.5 rounded-md hover:bg-muted [&.active]:bg-muted [&.active]:font-medium", children: "Admin" })
    ] })
  ] }) });
}
function RootComponent() {
  const { queryClient } = Route$4.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const protectContent = pathname !== "/admin";
  useContentProtection(protectContent);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `min-h-screen bg-background relative ${protectContent ? "no-copy protected-view" : ""}`, children: [
    protectContent && /* @__PURE__ */ jsxRuntimeExports.jsx(Watermark, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(NavBar, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "max-w-7xl mx-auto px-6 py-8 relative z-[1]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) })
  ] }) });
}
const $$splitComponentImporter$2 = () => import("./datos-liberados-DRRsk041.mjs");
const Route$3 = createFileRoute("/datos-liberados")({
  component: lazyRouteComponent($$splitComponentImporter$2, "component"),
  head: () => ({
    meta: [{
      title: "Datos liberados"
    }]
  })
});
const $$splitComponentImporter$1 = () => import("./admin-Day0EFLm.mjs");
const Route$2 = createFileRoute("/admin")({
  component: lazyRouteComponent($$splitComponentImporter$1, "component"),
  head: () => ({
    meta: [{
      title: "Administración"
    }]
  })
});
const $$splitComponentImporter = () => import("./index-Cioi9YeT.mjs");
const Route$1 = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter, "component"),
  head: () => ({
    meta: [{
      title: "ENTREGABLE AB MAURI"
    }, {
      name: "description",
      content: "Consulta de datos por ID y ciudad."
    }]
  })
});
const MIME = {
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel",
  ".csv": "text/csv",
  ".pdf": "application/pdf"
};
const Route = createFileRoute("/api/released-download")({
  server: {
    handlers: {
      GET: async () => {
        const file = await readReleasedFile();
        if (!file) {
          return new Response("No hay archivo publicado", { status: 404 });
        }
        const ext = file.meta.filename.includes(".") ? file.meta.filename.slice(file.meta.filename.lastIndexOf(".")) : "";
        const type = MIME[ext.toLowerCase()] ?? "application/octet-stream";
        return new Response(file.bytes, {
          headers: {
            "Content-Type": type,
            "Content-Disposition": `attachment; filename="${file.meta.filename}"`
          }
        });
      }
    }
  }
});
const DatosLiberadosRoute = Route$3.update({
  id: "/datos-liberados",
  path: "/datos-liberados",
  getParentRoute: () => Route$4
});
const AdminRoute = Route$2.update({
  id: "/admin",
  path: "/admin",
  getParentRoute: () => Route$4
});
const IndexRoute = Route$1.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$4
});
const ApiReleasedDownloadRoute = Route.update({
  id: "/api/released-download",
  path: "/api/released-download",
  getParentRoute: () => Route$4
});
const rootRouteChildren = {
  IndexRoute,
  AdminRoute,
  DatosLiberadosRoute,
  ApiReleasedDownloadRoute
};
const routeTree = Route$4._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router;
};
export {
  getRouter
};
