// Helpers to clean Excel cells like "Cantidad:7" or "Cantidad semanal:7,Precio de compra:7500"

const numFromText = (s: string): number | string | null => {
  if (s == null) return null;
  const trimmed = String(s).trim();
  if (!trimmed) return null;
  const match = trimmed.match(/-?\d+(?:[.,]\d+)?/);
  if (!match) return trimmed;
  const n = Number(match[0].replace(",", "."));
  return Number.isFinite(n) ? n : trimmed;
};

// "Cantidad:7" -> 7 ; "Cantidad:2 libras" -> 2
export function parseCantidad(v: unknown): number | string | null {
  if (v == null) return null;
  const str = String(v);
  if (!str) return null;
  // Strip prefix like "Cantidad:" or "Cantidad semanal:" etc.
  const cleaned = str.replace(/^[^:]*:\s*/i, "");
  return numFromText(cleaned);
}

// "Cantidad semanal:7,Precio de compra:7500" -> { cantidad: 7, precio: 7500 }
export function parseCantidadPrecio(v: unknown): {
  cantidad: number | string | null;
  precio: number | string | null;
} {
  if (v == null) return { cantidad: null, precio: null };
  const str = String(v);
  if (!str.trim()) return { cantidad: null, precio: null };
  const parts = str.split(",");
  let cantidad: number | string | null = null;
  let precio: number | string | null = null;
  for (const p of parts) {
    const [k, ...rest] = p.split(":");
    const val = rest.join(":").trim();
    if (!val) continue;
    const low = (k || "").toLowerCase();
    if (low.includes("precio")) precio = numFromText(val);
    else if (low.includes("cantidad")) cantidad = numFromText(val);
  }
  return { cantidad, precio };
}

// Google Drive view URL -> thumbnail URL
export function driveThumbnail(url: string | null | undefined, size = 400): string | null {
  if (!url) return null;
  const s = String(url);
  const m =
    s.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w${size}`;
  return s;
}
