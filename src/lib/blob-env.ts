/** Lee el token de Blob en runtime (evita nombres fijos si Vercel usa prefijo personalizado). */
export function getBlobReadWriteToken(): string | undefined {
  const direct = process.env["BLOB_READ_WRITE_TOKEN"];
  if (direct?.trim()) return direct.trim();

  for (const [key, value] of Object.entries(process.env)) {
    if (!value?.trim()) continue;
    if (key === "BLOB_READ_WRITE_TOKEN" || key.endsWith("_BLOB_READ_WRITE_TOKEN")) {
      return value.trim();
    }
  }
  return undefined;
}

export function requireBlobReadWriteToken(): string {
  const token = getBlobReadWriteToken();
  if (token) return token;
  throw new Error(
    "Vercel Blob no está configurado (opcional). Solo hace falta para archivos mayores a ~4 MB.",
  );
}

export function blobStorageConfigured(): boolean {
  return Boolean(getBlobReadWriteToken());
}
