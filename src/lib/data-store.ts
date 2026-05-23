import fs from "node:fs/promises";
import path from "node:path";

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

const DATA_DIR = path.join(process.cwd(), "data");
const PANADERIAS_JSON = path.join(DATA_DIR, "panaderias.json");
const RELEASED_DIR = path.join(DATA_DIR, "released");
const RELEASED_META = path.join(RELEASED_DIR, "meta.json");

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function loadPanaderias(): Promise<PanaderiasStore | null> {
  try {
    const raw = await fs.readFile(PANADERIAS_JSON, "utf-8");
    return JSON.parse(raw) as PanaderiasStore;
  } catch {
    return null;
  }
}

export async function savePanaderias(
  rows: Omit<PanaderiaRow, "id">[],
  sourceFilename: string | null = null,
): Promise<PanaderiasStore> {
  await ensureDir(DATA_DIR);
  const store: PanaderiasStore = {
    uploadedAt: new Date().toISOString(),
    sourceFilename,
    rows: rows.map((r, i) => ({ ...r, id: i + 1 })),
  };
  await fs.writeFile(PANADERIAS_JSON, JSON.stringify(store), "utf-8");
  return store;
}

export async function loadReleasedMeta(): Promise<ReleasedMeta | null> {
  try {
    const raw = await fs.readFile(RELEASED_META, "utf-8");
    return JSON.parse(raw) as ReleasedMeta;
  } catch {
    return null;
  }
}

export async function saveReleasedFile(
  filename: string,
  bytes: Uint8Array,
): Promise<ReleasedMeta> {
  await ensureDir(RELEASED_DIR);
  const storageName = `current${path.extname(filename) || ".bin"}`;
  const filePath = path.join(RELEASED_DIR, storageName);
  await fs.writeFile(filePath, bytes);
  const meta: ReleasedMeta = {
    filename,
    storageName,
    size_bytes: bytes.byteLength,
    uploaded_at: new Date().toISOString(),
  };
  await fs.writeFile(RELEASED_META, JSON.stringify(meta), "utf-8");
  return meta;
}

export async function readReleasedFile(): Promise<{ meta: ReleasedMeta; bytes: Buffer } | null> {
  const meta = await loadReleasedMeta();
  if (!meta) return null;
  try {
    const bytes = await fs.readFile(path.join(RELEASED_DIR, meta.storageName));
    return { meta, bytes };
  } catch {
    return null;
  }
}
