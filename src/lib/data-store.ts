import fs from "node:fs/promises";
import path from "node:path";
import { head, put } from "@vercel/blob";
import { getBlobReadWriteToken } from "@/lib/blob-env";

export type PanaderiaRow = {
  id: number;
  nombre: string | null;
  foto_url: string | null;
  data: Record<string, unknown>;
};

export type PanaderiasStore = {
  uploadedAt: string;
  sourceFilename: string | null;
  rows: PanaderiaRow[];
};

export type ReleasedMeta = {
  filename: string;
  storageName: string;
  size_bytes: number;
  uploaded_at: string;
};

const BLOB_PANADERIAS = "data/panaderias.json";
const BLOB_RELEASED_META = "data/released/meta.json";

function localDataDir() {
  if (process.env.VERCEL) {
    return path.join("/tmp", "ab-mauri-data");
  }
  return path.join(process.cwd(), "data");
}

function localPaths() {
  const dir = localDataDir();
  return {
    panaderias: path.join(dir, "panaderias.json"),
    releasedDir: path.join(dir, "released"),
    releasedMeta: path.join(dir, "released", "meta.json"),
  };
}

function blobToken() {
  return getBlobReadWriteToken();
}

function useBlobStorage() {
  return Boolean(blobToken());
}

async function blobFetch(pathname: string): Promise<Response | null> {
  const token = blobToken();
  if (!token) return null;
  try {
    const meta = await head(pathname, { token });
    const res = await fetch(meta.url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

async function blobReadText(pathname: string): Promise<string | null> {
  const res = await blobFetch(pathname);
  if (!res) return null;
  return await res.text();
}

async function blobReadBytes(pathname: string): Promise<Buffer | null> {
  const res = await blobFetch(pathname);
  if (!res) return null;
  return Buffer.from(await res.arrayBuffer());
}

async function blobWrite(pathname: string, body: string | Buffer | Uint8Array) {
  const token = blobToken()!;
  await put(pathname, body, {
    access: "private",
    token,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function loadPanaderias(): Promise<PanaderiasStore | null> {
  if (useBlobStorage()) {
    const raw = await blobReadText(BLOB_PANADERIAS);
    if (!raw) return null;
    return JSON.parse(raw) as PanaderiasStore;
  }
  try {
    const raw = await fs.readFile(localPaths().panaderias, "utf-8");
    return JSON.parse(raw) as PanaderiasStore;
  } catch {
    return null;
  }
}

export async function savePanaderias(
  rows: Omit<PanaderiaRow, "id">[],
  sourceFilename: string | null = null,
): Promise<PanaderiasStore> {
  const store: PanaderiasStore = {
    uploadedAt: new Date().toISOString(),
    sourceFilename,
    rows: rows.map((r, i) => ({ ...r, id: i + 1 })),
  };
  const json = JSON.stringify(store);
  if (useBlobStorage()) {
    await blobWrite(BLOB_PANADERIAS, json);
    return store;
  }
  const paths = localPaths();
  await ensureDir(path.dirname(paths.panaderias));
  await fs.writeFile(paths.panaderias, json, "utf-8");
  return store;
}

export async function loadReleasedMeta(): Promise<ReleasedMeta | null> {
  if (useBlobStorage()) {
    const raw = await blobReadText(BLOB_RELEASED_META);
    if (!raw) return null;
    return JSON.parse(raw) as ReleasedMeta;
  }
  try {
    const raw = await fs.readFile(localPaths().releasedMeta, "utf-8");
    return JSON.parse(raw) as ReleasedMeta;
  } catch {
    return null;
  }
}

export async function saveReleasedFile(
  filename: string,
  bytes: Uint8Array,
): Promise<ReleasedMeta> {
  const storageName = `current${path.extname(filename) || ".bin"}`;
  const meta: ReleasedMeta = {
    filename,
    storageName,
    size_bytes: bytes.byteLength,
    uploaded_at: new Date().toISOString(),
  };
  if (useBlobStorage()) {
    await blobWrite(`data/released/${storageName}`, Buffer.from(bytes));
    await blobWrite(BLOB_RELEASED_META, JSON.stringify(meta));
    return meta;
  }
  const paths = localPaths();
  await ensureDir(paths.releasedDir);
  await fs.writeFile(path.join(paths.releasedDir, storageName), bytes);
  await fs.writeFile(paths.releasedMeta, JSON.stringify(meta), "utf-8");
  return meta;
}

export async function readReleasedFile(): Promise<{ meta: ReleasedMeta; bytes: Buffer } | null> {
  const meta = await loadReleasedMeta();
  if (!meta) return null;
  if (useBlobStorage()) {
    const bytes = await blobReadBytes(`data/released/${meta.storageName}`);
    if (!bytes) return null;
    return { meta, bytes };
  }
  try {
    const bytes = await fs.readFile(path.join(localPaths().releasedDir, meta.storageName));
    return { meta, bytes };
  } catch {
    return null;
  }
}
