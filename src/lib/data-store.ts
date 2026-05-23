import fs from "node:fs/promises";
import path from "node:path";
import { get, put } from "@vercel/blob";
import { blobCmdOptions, shouldPersistWithBlob } from "@/lib/blob-env";

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

const LOCAL_DATA_DIR = path.join(process.cwd(), "data");

function localPaths() {
  return {
    panaderias: path.join(LOCAL_DATA_DIR, "panaderias.json"),
    releasedDir: path.join(LOCAL_DATA_DIR, "released"),
    releasedMeta: path.join(LOCAL_DATA_DIR, "released", "meta.json"),
  };
}

async function streamToText(stream: ReadableStream<Uint8Array>): Promise<string> {
  return await new Response(stream).text();
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  return Buffer.from(await new Response(stream).arrayBuffer());
}

async function blobReadStream(pathname: string): Promise<ReadableStream<Uint8Array> | null> {
  try {
    const result = await get(pathname, {
      access: "private",
      ...blobCmdOptions(),
    });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return result.stream;
  } catch {
    return null;
  }
}

async function blobReadText(pathname: string): Promise<string | null> {
  const stream = await blobReadStream(pathname);
  if (!stream) return null;
  return streamToText(stream);
}

async function blobReadBytes(pathname: string): Promise<Buffer | null> {
  const stream = await blobReadStream(pathname);
  if (!stream) return null;
  return streamToBuffer(stream);
}

async function blobWrite(pathname: string, body: string | Buffer | Uint8Array) {
  await put(pathname, body, {
    access: "private",
    ...blobCmdOptions(),
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

function blobPersistenceError(cause: unknown): Error {
  const msg =
    process.env.VERCEL
      ? "No se pudieron guardar los datos en Vercel. Ve a Storage → Blob → Connect to Project (este proyecto), activa Production y haz Redeploy."
      : "No se pudo usar almacenamiento Blob.";
  const err = new Error(msg);
  if (cause instanceof Error) err.cause = cause;
  return err;
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function loadPanaderias(): Promise<PanaderiasStore | null> {
  if (shouldPersistWithBlob()) {
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

  if (shouldPersistWithBlob()) {
    try {
      await blobWrite(BLOB_PANADERIAS, json);
      return store;
    } catch (e) {
      throw blobPersistenceError(e);
    }
  }

  const paths = localPaths();
  await ensureDir(path.dirname(paths.panaderias));
  await fs.writeFile(paths.panaderias, json, "utf-8");
  return store;
}

export async function loadReleasedMeta(): Promise<ReleasedMeta | null> {
  if (shouldPersistWithBlob()) {
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

  if (shouldPersistWithBlob()) {
    try {
      await blobWrite(`data/released/${storageName}`, Buffer.from(bytes));
      await blobWrite(BLOB_RELEASED_META, JSON.stringify(meta));
      return meta;
    } catch (e) {
      throw blobPersistenceError(e);
    }
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
  if (shouldPersistWithBlob()) {
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
