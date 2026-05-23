/** Convierte un archivo a base64 en el navegador (para subir el Excel sin expandir a JSON) */
export function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(bin);
}

/** ~4 MB en binario — límite aproximado de Vercel en el body del request */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
