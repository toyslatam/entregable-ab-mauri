import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useServerFn, u as uploadPanaderias, d as uploadReleasedFile, a as adminLogin } from "./admin.functions-CzXIiee9.mjs";
import { a as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { r as readSync, u as utils } from "../_libs/xlsx.mjs";
import { N as NAME_COLUMN, b as buildRowFromSheet } from "./columns-nsE7om6w.mjs";
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
const SHEET_CANDIDATES = ["Hoja1", "Panaderías", "Panaderia"];
function pickSheetName(names) {
  for (const c of SHEET_CANDIDATES) if (names.includes(c)) return c;
  const found = names.find((n) => n.toLowerCase().includes("panad"));
  return found ?? names[0];
}
function parsePanaderiasWorkbook(buffer) {
  const wb = readSync(buffer, { type: "array" });
  const sheetName = pickSheetName(wb.SheetNames);
  const ws = wb.Sheets[sheetName];
  const json = utils.sheet_to_json(ws, {
    defval: null,
    raw: false
  });
  const rows = json.filter(
    (r) => r && (r[NAME_COLUMN] || Object.values(r).some((v) => v != null && v !== ""))
  ).map(buildRowFromSheet);
  return { sheetName, rows };
}
function AdminPanel({ password, onLogout }) {
  const qc = useQueryClient();
  const uploadRows = useServerFn(uploadPanaderias);
  const uploadFile = useServerFn(uploadReleasedFile);
  const [parsing, setParsing] = reactExports.useState(false);
  const [uploadMsg, setUploadMsg] = reactExports.useState(null);
  const [uploadErr, setUploadErr] = reactExports.useState(null);
  const [releaseMsg, setReleaseMsg] = reactExports.useState(null);
  const [releaseErr, setReleaseErr] = reactExports.useState(null);
  async function handlePanaderiasFile(file) {
    setUploadErr(null);
    setUploadMsg(null);
    setParsing(true);
    try {
      const buf = await file.arrayBuffer();
      const { sheetName, rows } = parsePanaderiasWorkbook(buf);
      setUploadMsg(`Procesando ${rows.length} filas de "${sheetName}"…`);
      const res = await uploadRows({
        data: { password, rows, sourceFilename: file.name }
      });
      setUploadMsg(`✓ ${res.inserted} registros cargados. Puedes volver a subir otro archivo cuando quieras.`);
      qc.invalidateQueries({ queryKey: ["pan-page"] });
      qc.invalidateQueries({ queryKey: ["pan-ciudades"] });
    } catch (e) {
      setUploadErr(e.message);
      setUploadMsg(null);
    } finally {
      setParsing(false);
    }
  }
  async function handleReleasedFile(file) {
    setReleaseErr(null);
    setReleaseMsg(null);
    try {
      const buf = await file.arrayBuffer();
      let bin = "";
      const bytes = new Uint8Array(buf);
      const chunk = 32768;
      for (let i = 0; i < bytes.length; i += chunk) {
        bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
      }
      const b64 = btoa(bin);
      await uploadFile({
        data: { password, filename: file.name, contentBase64: b64 }
      });
      setReleaseMsg("✓ Archivo liberado disponible para descarga.");
      qc.invalidateQueries({ queryKey: ["released"] });
    } catch (e) {
      setReleaseErr(e.message);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-semibold tracking-tight", children: "Panel de administración" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: onLogout,
          className: "px-3 py-1.5 text-sm rounded-md border bg-card hover:bg-muted",
          children: "Cerrar sesión"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-lg border bg-card p-6 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: "1. Datos de panaderías" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
          "Sube un Excel con el mismo formato que",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "/ejemplo.xlsx", className: "text-primary underline", download: true, children: "ejemplo.xlsx" }),
          " ",
          "(hoja ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "px-1 rounded bg-muted", children: "Hoja1" }),
          ", mismas columnas). Cada carga reemplaza los datos anteriores en la tabla pública."
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "file",
          accept: ".xlsx,.xls",
          disabled: parsing,
          onChange: (e) => {
            const f = e.target.files?.[0];
            if (f) handlePanaderiasFile(f);
            e.target.value = "";
          },
          className: "block text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer"
        }
      ),
      parsing && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Procesando…" }),
      uploadMsg && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-foreground", children: uploadMsg }),
      uploadErr && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-destructive", children: uploadErr })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-lg border bg-card p-6 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: "2. Datos liberados (descargables)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: 'Archivo opcional para la sección "Datos liberados" (Excel, CSV o PDF).' })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "file",
          accept: ".xlsx,.xls,.csv,.pdf",
          onChange: (e) => {
            const f = e.target.files?.[0];
            if (f) handleReleasedFile(f);
            e.target.value = "";
          },
          className: "block text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer"
        }
      ),
      releaseMsg && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-foreground", children: releaseMsg }),
      releaseErr && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-destructive", children: releaseErr })
    ] })
  ] });
}
const STORAGE_KEY = "admin_pwd";
function AdminPage() {
  const [password, setPassword] = reactExports.useState(null);
  const [input, setInput] = reactExports.useState("");
  const [err, setErr] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(false);
  const login = useServerFn(adminLogin);
  reactExports.useEffect(() => {
    const stored = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
    if (stored) setPassword(stored);
  }, []);
  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login({
        data: {
          password: input
        }
      });
      sessionStorage.setItem(STORAGE_KEY, input);
      setPassword(input);
      setInput("");
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  }
  function logout() {
    sessionStorage.removeItem(STORAGE_KEY);
    setPassword(null);
  }
  if (password) return /* @__PURE__ */ jsxRuntimeExports.jsx(AdminPanel, { password, onLogout: logout });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-sm mx-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border bg-card p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold tracking-tight", children: "Acceso administrador" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Ingresa la clave para cargar el Excel y los datos liberados." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit, className: "mt-5 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "password", autoFocus: true, value: input, onChange: (e) => setInput(e.target.value), placeholder: "Contraseña", className: "w-full px-3 py-2 rounded-md border bg-background text-sm" }),
      err && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-destructive", children: err }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", disabled: loading || !input, className: "w-full px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50", children: loading ? "Verificando…" : "Entrar" })
    ] })
  ] }) });
}
export {
  AdminPage as component
};
