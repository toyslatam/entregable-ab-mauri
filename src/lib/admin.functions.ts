import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  loadPanaderias,
  savePanaderias,
  loadReleasedMeta,
  saveReleasedFile,
} from "@/lib/data-store";
import { CIUDAD_COLUMN, UNIQUE_ID_COLUMN } from "@/lib/columns";
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

const RowSchema = z.object({
  nombre: z.string().nullable(),
  foto_url: z.string().nullable(),
  data: z.record(z.string(), z.unknown()),
});

export const uploadPanaderias = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        rows: z.array(RowSchema).min(1).max(50000),
        sourceFilename: z.string().max(255).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    assertAdminSession();
    const store = await savePanaderias(data.rows, data.sourceFilename ?? null);
    return { ok: true, inserted: store.rows.length, uploadedAt: store.uploadedAt };
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
      filtered = filtered.filter((r) => {
        const city = String((r.data as Record<string, unknown>)?.[CIUDAD_COLUMN] ?? "").toLowerCase();
        return city === c;
      });
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
    const raw = (r.data as Record<string, unknown>)?.[CIUDAD_COLUMN];
    if (raw != null && String(raw).trim()) cities.add(String(raw).trim());
  }
  return {
    ciudades: [...cities].sort((a, b) => a.localeCompare(b, "es")),
  };
});
