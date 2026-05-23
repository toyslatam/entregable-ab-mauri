import fs from "node:fs/promises";
import path from "node:path";
import { h as head, p as put } from "../_libs/vercel__blob.mjs";
const BLOB_PANADERIAS = "data/panaderias.json";
const BLOB_RELEASED_META = "data/released/meta.json";
const DATA_DIR = path.join(process.cwd(), "data");
const PANADERIAS_JSON = path.join(DATA_DIR, "panaderias.json");
const RELEASED_DIR = path.join(DATA_DIR, "released");
const RELEASED_META = path.join(RELEASED_DIR, "meta.json");
function blobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN;
}
function useBlobStorage() {
  return Boolean(blobToken());
}
async function blobFetch(pathname) {
  const token = blobToken();
  if (!token) return null;
  try {
    const meta = await head(pathname, { token });
    const res = await fetch(meta.url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.ok ? res : null;
  } catch {
    return null;
  }
}
async function blobReadText(pathname) {
  const res = await blobFetch(pathname);
  if (!res) return null;
  return await res.text();
}
async function blobReadBytes(pathname) {
  const res = await blobFetch(pathname);
  if (!res) return null;
  return Buffer.from(await res.arrayBuffer());
}
async function blobWrite(pathname, body) {
  const token = blobToken();
  await put(pathname, body, {
    access: "private",
    token,
    addRandomSuffix: false,
    allowOverwrite: true
  });
}
async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}
async function loadPanaderias() {
  if (useBlobStorage()) {
    const raw = await blobReadText(BLOB_PANADERIAS);
    if (!raw) return null;
    return JSON.parse(raw);
  }
  try {
    const raw = await fs.readFile(PANADERIAS_JSON, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
async function savePanaderias(rows, sourceFilename = null) {
  const store = {
    uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
    sourceFilename,
    rows: rows.map((r, i) => ({ ...r, id: i + 1 }))
  };
  const json = JSON.stringify(store);
  if (useBlobStorage()) {
    await blobWrite(BLOB_PANADERIAS, json);
    return store;
  }
  await ensureDir(DATA_DIR);
  await fs.writeFile(PANADERIAS_JSON, json, "utf-8");
  return store;
}
async function loadReleasedMeta() {
  if (useBlobStorage()) {
    const raw = await blobReadText(BLOB_RELEASED_META);
    if (!raw) return null;
    return JSON.parse(raw);
  }
  try {
    const raw = await fs.readFile(RELEASED_META, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
async function saveReleasedFile(filename, bytes) {
  const storageName = `current${path.extname(filename) || ".bin"}`;
  const meta = {
    filename,
    storageName,
    size_bytes: bytes.byteLength,
    uploaded_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (useBlobStorage()) {
    await blobWrite(`data/released/${storageName}`, Buffer.from(bytes));
    await blobWrite(BLOB_RELEASED_META, JSON.stringify(meta));
    return meta;
  }
  await ensureDir(RELEASED_DIR);
  await fs.writeFile(path.join(RELEASED_DIR, storageName), bytes);
  await fs.writeFile(RELEASED_META, JSON.stringify(meta), "utf-8");
  return meta;
}
async function readReleasedFile() {
  const meta = await loadReleasedMeta();
  if (!meta) return null;
  if (useBlobStorage()) {
    const bytes = await blobReadBytes(`data/released/${meta.storageName}`);
    if (!bytes) return null;
    return { meta, bytes };
  }
  try {
    const bytes = await fs.readFile(path.join(RELEASED_DIR, meta.storageName));
    return { meta, bytes };
  } catch {
    return null;
  }
}
export {
  loadReleasedMeta as a,
  saveReleasedFile as b,
  loadPanaderias as l,
  readReleasedFile as r,
  savePanaderias as s
};
