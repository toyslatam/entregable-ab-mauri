import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  loadPanaderias,
  savePanaderias,
  loadReleasedMeta,
  saveReleasedFile,
} from "@/lib/data-store";
import {
  getCiudadFromRow,
  getUnidadCensalFromRow,
  UNIQUE_ID_COLUMN,
} from "@/lib/columns";
import type { PanaderiaRow } from "@/lib/data-store";
import {
  disorderSortKey,
  getRawUniqueId,
  matchesUniqueIdSearch,
  scrambleUniqueIdDisplay,
} from "@/lib/id-scramble";
import {
  assertAdminSession,
  checkAdminPassword,
  clearAdminSessionCookie,
  hasAdminSession,
  setAdminSessionCookie,
} from "@/lib/admin-session";
import { parsePanaderiasWorkbook } from "@/lib/excel-import";
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { get } from "@vercel/blob";
import {
  blobCmdOptions,
  blobStorageConfigured,
  getBlobReadWriteToken,
  requireBlobReadWriteToken,
} from "@/lib/blob-env";

async function readPrivateBlobUrl(url: string): Promise<ArrayBuffer> {
  const token = getBlobReadWriteToken();
  if (token) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error("No se pudo leer el archivo subido");
    return res.arrayBuffer();
  }
  const result = await get(url, { access: "private", ...blobCmdOptions() });
  if (!result || result.statusCode !== 200 || !result.stream) {
    throw new Error("No se pudo leer el archivo subido");
  }
  return new Response(result.stream).arrayBuffer();
}

function sanitizeRowForPublic(row: PanaderiaRow): PanaderiaRow {
  const data = { ...(row.data as Record<string, unknown>) };
  data[UNIQUE_ID_COLUMN] = scrambleUniqueIdDisplay(getRawUniqueId(data));
  return { ...row, data };
}

export const adminSession = createServerFn({ method: "GET" }).handler(async () => ({
  authenticated: hasAdminSession(),
}));

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ password: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    checkAdminPassword(data.password);
    setAdminSessionCookie();
    return { ok: true };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  clearAdminSessionCookie();
  return { ok: true };
});

/** Diagnóstico (solo admin): ¿el servidor ve el token de Blob? */
export const blobStorageStatus = createServerFn({ method: "GET" }).handler(async () => {
  assertAdminSession();
  const token = getBlobReadWriteToken();
  const storeId = process.env.BLOB_STORE_ID?.trim();
  return {
    configured: blobStorageConfigured(),
    onVercel: Boolean(process.env.VERCEL),
    vercelEnv: process.env.VERCEL_ENV ?? null,
    hasReadWriteToken: Boolean(token),
    hasBlobStoreId: Boolean(storeId),
    tokenLength: token?.length ?? 0,
  };
});

const BLOB_CONTENT_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/pdf",
];

/** Token para subir desde el navegador a Blob (usa la cookie de sesión admin) */
export const getBlobClientToken = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ pathname: z.string().min(1).max(500) }).parse(d),
  )
  .handler(async ({ data }) => {
    assertAdminSession();
    const rw = requireBlobReadWriteToken();
    const clientToken = await generateClientTokenFromReadWriteToken({
      pathname: data.pathname,
      access: "private",
      token: rw,
      maximumSizeInBytes: 20 * 1024 * 1024,
      allowedContentTypes: BLOB_CONTENT_TYPES,
      addRandomSuffix: true,
    });
    return { clientToken };
  });

/** Procesa un Excel ya subido a Vercel Blob (request pequeño, sin límite 4.5MB) */
export const processPanaderiasFromBlob = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        blobUrl: z.string().url(),
        sourceFilename: z.string().min(1).max(255),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    assertAdminSession();
    const buffer = await readPrivateBlobUrl(data.blobUrl);
    const { sheetName, rows } = parsePanaderiasWorkbook(buffer);
    if (!rows.length) throw new Error(`No se encontraron filas en "${sheetName}"`);
    const store = await savePanaderias(rows, data.sourceFilename);
    return {
      ok: true,
      inserted: store.rows.length,
      uploadedAt: store.uploadedAt,
      sheetName,
    };
  });

export const processReleasedFromBlob = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        blobUrl: z.string().url(),
        sourceFilename: z.string().min(1).max(255),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    assertAdminSession();
    const bytes = new Uint8Array(await readPrivateBlobUrl(data.blobUrl));
    await saveReleasedFile(data.sourceFilename, bytes);
    return { ok: true };
  });

/** Respaldo local: sube el .xlsx en el body (límite ~4.5 MB en Vercel) */
export const uploadPanaderiasExcel = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        contentBase64: z.string().min(1).max(6_500_000),
        sourceFilename: z.string().min(1).max(255),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    assertAdminSession();
    const buffer = Buffer.from(data.contentBase64, "base64");
    const { sheetName, rows } = parsePanaderiasWorkbook(
      buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    );
    if (!rows.length) throw new Error(`No se encontraron filas en "${sheetName}"`);
    const store = await savePanaderias(rows, data.sourceFilename);
    return {
      ok: true,
      inserted: store.rows.length,
      uploadedAt: store.uploadedAt,
      sheetName,
    };
  });

export const uploadReleasedFile = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        filename: z.string().min(1).max(255),
        contentBase64: z.string().min(1),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    assertAdminSession();
    const bytes = Uint8Array.from(atob(data.contentBase64), (c) => c.charCodeAt(0));
    await saveReleasedFile(data.filename, bytes);
    return { ok: true };
  });

export const getReleasedFileUrl = createServerFn({ method: "GET" }).handler(async () => {
  const meta = await loadReleasedMeta();
  if (!meta) return { file: null };
  return {
    file: {
      filename: meta.filename,
      uploaded_at: meta.uploaded_at,
      size_bytes: meta.size_bytes,
      url: "/api/released-download",
    },
  };
});

export const getPanaderiasPage = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        page: z.number().int().min(1).max(10000).default(1),
        pageSize: z.number().int().min(1).max(100).default(15),
        searchId: z.string().max(200).optional(),
        ciudad: z.string().max(200).optional(),
        unidadCensal: z.string().max(200).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const store = await loadPanaderias();
    if (!store?.rows.length) return { rows: [], total: 0 };

    let filtered = store.rows;
    const idQ = data.searchId?.trim();
    if (idQ) {
      filtered = filtered.filter((r) =>
        matchesUniqueIdSearch(r.data as Record<string, unknown>, idQ),
      );
    }
    const ciudadQ = data.ciudad?.trim();
    if (ciudadQ) {
      const c = ciudadQ.toLowerCase();
      filtered = filtered.filter(
        (r) => getCiudadFromRow(r.data as Record<string, unknown>).toLowerCase() === c,
      );
    }
    const unidadQ = data.unidadCensal?.trim();
    if (unidadQ) {
      const u = unidadQ.toLowerCase();
      filtered = filtered.filter(
        (r) => getUnidadCensalFromRow(r.data as Record<string, unknown>).toLowerCase() === u,
      );
    }

    filtered = [...filtered].sort((a, b) =>
      disorderSortKey(getRawUniqueId(a.data as Record<string, unknown>)).localeCompare(
        disorderSortKey(getRawUniqueId(b.data as Record<string, unknown>)),
      ),
    );

    const total = filtered.length;
    const from = (data.page - 1) * data.pageSize;
    const rows = filtered.slice(from, from + data.pageSize).map(sanitizeRowForPublic);
    return { rows, total };
  });

export const getPanaderiasCiudades = createServerFn({ method: "GET" }).handler(async () => {
  const store = await loadPanaderias();
  const cities = new Set<string>();
  for (const r of store?.rows ?? []) {
    const city = getCiudadFromRow(r.data as Record<string, unknown>);
    if (city) cities.add(city);
  }
  return {
    ciudades: [...cities].sort((a, b) => a.localeCompare(b, "es")),
  };
});

export const getPanaderiasUnidadesCensales = createServerFn({ method: "GET" }).handler(
  async () => {
    const store = await loadPanaderias();
    const set = new Set<string>();
    for (const r of store?.rows ?? []) {
      const v = getUnidadCensalFromRow(r.data as Record<string, unknown>);
      if (v) set.add(v);
    }
    return {
      unidades: [...set].sort((a, b) => a.localeCompare(b, "es", { numeric: true })),
    };
  },
);
