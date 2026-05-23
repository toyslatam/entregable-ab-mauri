function normalizeToken(raw: string): string {
  return raw.trim().replace(/^["']|["']$/g, "");
}

function readEnv(key: string): string | undefined {
  const env = globalThis.process?.env ?? process.env;
  const value = env[key];
  if (value?.trim()) return normalizeToken(value);
  return undefined;
}

/** Lee el token de Blob en runtime (evita nombres fijos si Vercel usa prefijo personalizado). */
export function getBlobReadWriteToken(): string | undefined {
  const direct = readEnv("BLOB_READ_WRITE_TOKEN");
  if (direct) return direct;

  const env = globalThis.process?.env ?? process.env;
  for (const [key, value] of Object.entries(env)) {
    if (!value?.trim()) continue;
    if (key === "BLOB_READ_WRITE_TOKEN" || key.endsWith("_BLOB_READ_WRITE_TOKEN")) {
      return normalizeToken(value);
    }
  }
  return undefined;
}

export function getBlobStoreId(): string | undefined {
  return readEnv("BLOB_STORE_ID");
}

/** ¿Hay credenciales para escribir en Blob? */
export function canUseBlobStorage(): boolean {
  return Boolean(getBlobReadWriteToken() || getBlobStoreId());
}

/** En Vercel los datos van a Blob; en local, a carpeta data/ (o Blob si hay token). */
export function shouldPersistWithBlob(): boolean {
  if (process.env.VERCEL) return true;
  return canUseBlobStorage();
}

export function blobStorageConfigured(): boolean {
  return canUseBlobStorage();
}

export function blobCmdOptions(): { token?: string } {
  const token = getBlobReadWriteToken();
  return token ? { token } : {};
}

export function requireBlobReadWriteToken(): string {
  const token = getBlobReadWriteToken();
  if (token) return token;
  throw new Error(
    "Vercel Blob no está configurado (opcional). Solo hace falta para archivos mayores a ~4 MB.",
  );
}

/** Antes de guardar en producción */
export function assertBlobReadyForSave(): void {
  if (!process.env.VERCEL) return;

  if (canUseBlobStorage()) return;

  throw new Error(
    "El servidor no detecta BLOB_READ_WRITE_TOKEN ni BLOB_STORE_ID. " +
      "En Vercel: Storage → Blob → Connect to Project, marca Production, guarda y haz Redeploy. " +
      "No pegues el token a mano salvo que sea el de Read-Write del store conectado.",
  );
}

export function formatBlobSaveError(cause: unknown): string {
  const hasToken = Boolean(getBlobReadWriteToken());
  const hasStore = Boolean(getBlobStoreId());
  const detail =
    cause instanceof Error
      ? cause.message.replace(/vercel_blob_rw_\S+/gi, "[token]").slice(0, 200)
      : "";

  if (!hasToken && !hasStore) {
    return (
      "El servidor no ve las variables de Blob en este deploy. " +
      "Conecta el store al proyecto (Production), guarda y Redeploy sin caché."
    );
  }

  if (detail.includes("Invalid") && detail.includes("token")) {
    return (
      "El BLOB_READ_WRITE_TOKEN no es válido. Borra la variable manual y vuelve a " +
      "Connect to Project en Storage → Blob para que Vercel la cree sola. Luego Redeploy."
    );
  }

  const base =
    "No se pudieron guardar los datos en Blob. Comprueba que el store esté conectado a este proyecto y redeploy.";
  return detail ? `${base} Detalle: ${detail}` : base;
}
