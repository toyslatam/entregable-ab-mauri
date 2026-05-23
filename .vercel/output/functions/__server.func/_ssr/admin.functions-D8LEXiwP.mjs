import { T as TSS_SERVER_FUNCTION, a as createServerFn } from "./server-Csf-dmug.mjs";
import { s as savePanaderias, b as saveReleasedFile, a as loadReleasedMeta, l as loadPanaderias } from "./data-store-CHupUkjj.mjs";
import { C as CIUDAD_COLUMN, U as UNIQUE_ID_COLUMN } from "./columns-nsE7om6w.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { o as objectType, s as stringType, r as recordType, u as unknownType, a as arrayType, n as numberType } from "../_libs/zod.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:stream";
import "node:stream/promises";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/tanstack__react-router.mjs";
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
import "../_libs/throttleit.mjs";
var createServerRpc = (serverFnMeta, splitImportFn) => {
  const url = "/_serverFn/" + serverFnMeta.id;
  return Object.assign(splitImportFn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
function disorderSortKey(uniqueId) {
  let h = 2166136261;
  const s = uniqueId.trim().toLowerCase();
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
function scrambleUniqueIdDisplay(raw) {
  const s = raw.trim();
  if (!s) return "—";
  const parts = s.split(/[-_/\\s]+/).filter(Boolean);
  if (parts.length <= 1) {
    return s.split("").sort((a, b) => disorderSortKey(a + s).localeCompare(disorderSortKey(b + s))).join("");
  }
  const sorted = [...parts].sort(
    (a, b) => disorderSortKey(a + s).localeCompare(disorderSortKey(b + s))
  );
  return sorted.join("-");
}
function getRawUniqueId(data) {
  return String(data[UNIQUE_ID_COLUMN] ?? "").trim();
}
function matchesUniqueIdSearch(data, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return getRawUniqueId(data).toLowerCase().includes(q);
}
function sanitizeRowForPublic(row) {
  const data = {
    ...row.data
  };
  data[UNIQUE_ID_COLUMN] = scrambleUniqueIdDisplay(getRawUniqueId(data));
  return {
    ...row,
    data
  };
}
function checkPassword(pwd) {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected) throw new Error("ADMIN_PASSWORD no configurada");
  if (pwd !== expected) throw new Error("Contraseña incorrecta");
}
const adminLogin_createServerFn_handler = createServerRpc({
  id: "89f029f4fc21ed092423cd54f44fb61078423691288a3a89663a6e0973cd86ea",
  name: "adminLogin",
  filename: "src/lib/admin.functions.ts"
}, (opts) => adminLogin.__executeServer(opts));
const adminLogin = createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  password: stringType().min(1).max(200)
}).parse(d)).handler(adminLogin_createServerFn_handler, async ({
  data
}) => {
  checkPassword(data.password);
  return {
    ok: true
  };
});
const RowSchema = objectType({
  nombre: stringType().nullable(),
  foto_url: stringType().nullable(),
  data: recordType(stringType(), unknownType())
});
const uploadPanaderias_createServerFn_handler = createServerRpc({
  id: "c992795288aaa10f3709a622afc2f258eb87ee7f2d84edd6d22f6900f253db58",
  name: "uploadPanaderias",
  filename: "src/lib/admin.functions.ts"
}, (opts) => uploadPanaderias.__executeServer(opts));
const uploadPanaderias = createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  password: stringType().min(1).max(200),
  rows: arrayType(RowSchema).min(1).max(5e4),
  sourceFilename: stringType().max(255).optional()
}).parse(d)).handler(uploadPanaderias_createServerFn_handler, async ({
  data
}) => {
  checkPassword(data.password);
  const store = await savePanaderias(data.rows, data.sourceFilename ?? null);
  return {
    ok: true,
    inserted: store.rows.length,
    uploadedAt: store.uploadedAt
  };
});
const uploadReleasedFile_createServerFn_handler = createServerRpc({
  id: "ea473cd86d31ba70cbf229d2dc5fe0fc55abb5438b4ebec30465a40cbae1a1ad",
  name: "uploadReleasedFile",
  filename: "src/lib/admin.functions.ts"
}, (opts) => uploadReleasedFile.__executeServer(opts));
const uploadReleasedFile = createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  password: stringType().min(1).max(200),
  filename: stringType().min(1).max(255),
  contentBase64: stringType().min(1)
}).parse(d)).handler(uploadReleasedFile_createServerFn_handler, async ({
  data
}) => {
  checkPassword(data.password);
  const bytes = Uint8Array.from(atob(data.contentBase64), (c) => c.charCodeAt(0));
  await saveReleasedFile(data.filename, bytes);
  return {
    ok: true
  };
});
const getReleasedFileUrl_createServerFn_handler = createServerRpc({
  id: "511e27ecc29a96601c39bb2f1ff49c51ce0b33adf7e9b4f146058551e024caa4",
  name: "getReleasedFileUrl",
  filename: "src/lib/admin.functions.ts"
}, (opts) => getReleasedFileUrl.__executeServer(opts));
const getReleasedFileUrl = createServerFn({
  method: "GET"
}).handler(getReleasedFileUrl_createServerFn_handler, async () => {
  const meta = await loadReleasedMeta();
  if (!meta) return {
    file: null
  };
  return {
    file: {
      filename: meta.filename,
      uploaded_at: meta.uploaded_at,
      size_bytes: meta.size_bytes,
      url: "/api/released-download"
    }
  };
});
const getPanaderiasPage_createServerFn_handler = createServerRpc({
  id: "b7e94af2f4382ab807fb804946f8df2799372e5e1773ef6da2fb37e8ea5fa6d1",
  name: "getPanaderiasPage",
  filename: "src/lib/admin.functions.ts"
}, (opts) => getPanaderiasPage.__executeServer(opts));
const getPanaderiasPage = createServerFn({
  method: "GET"
}).inputValidator((d) => objectType({
  page: numberType().int().min(1).max(1e4).default(1),
  pageSize: numberType().int().min(1).max(100).default(15),
  searchId: stringType().max(200).optional(),
  ciudad: stringType().max(200).optional()
}).parse(d)).handler(getPanaderiasPage_createServerFn_handler, async ({
  data
}) => {
  const store = await loadPanaderias();
  if (!store?.rows.length) return {
    rows: [],
    total: 0
  };
  let filtered = store.rows;
  const idQ = data.searchId?.trim();
  if (idQ) {
    filtered = filtered.filter((r) => matchesUniqueIdSearch(r.data, idQ));
  }
  const ciudadQ = data.ciudad?.trim();
  if (ciudadQ) {
    const c = ciudadQ.toLowerCase();
    filtered = filtered.filter((r) => {
      const city = String(r.data?.[CIUDAD_COLUMN] ?? "").toLowerCase();
      return city === c;
    });
  }
  filtered = [...filtered].sort((a, b) => disorderSortKey(getRawUniqueId(a.data)).localeCompare(disorderSortKey(getRawUniqueId(b.data))));
  const total = filtered.length;
  const from = (data.page - 1) * data.pageSize;
  const rows = filtered.slice(from, from + data.pageSize).map(sanitizeRowForPublic);
  return {
    rows,
    total
  };
});
const getPanaderiasCiudades_createServerFn_handler = createServerRpc({
  id: "cc0d14e99a540c75843bbb8f2f0698728a16a9b2d523da5330fd858bd7ab2a73",
  name: "getPanaderiasCiudades",
  filename: "src/lib/admin.functions.ts"
}, (opts) => getPanaderiasCiudades.__executeServer(opts));
const getPanaderiasCiudades = createServerFn({
  method: "GET"
}).handler(getPanaderiasCiudades_createServerFn_handler, async () => {
  const store = await loadPanaderias();
  const cities = /* @__PURE__ */ new Set();
  for (const r of store?.rows ?? []) {
    const raw = r.data?.[CIUDAD_COLUMN];
    if (raw != null && String(raw).trim()) cities.add(String(raw).trim());
  }
  return {
    ciudades: [...cities].sort((a, b) => a.localeCompare(b, "es"))
  };
});
export {
  adminLogin_createServerFn_handler,
  getPanaderiasCiudades_createServerFn_handler,
  getPanaderiasPage_createServerFn_handler,
  getReleasedFileUrl_createServerFn_handler,
  uploadPanaderias_createServerFn_handler,
  uploadReleasedFile_createServerFn_handler
};
