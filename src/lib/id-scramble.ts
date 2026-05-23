import { UNIQUE_ID_COLUMN } from "@/lib/columns";

/** Hash estable para ordenar filas sin usar el orden del Excel */
export function disorderSortKey(uniqueId: string): string {
  let h = 2166136261;
  const s = uniqueId.trim().toLowerCase();
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** Muestra el Unique ID con segmentos reordenados (mismo valor, distinto orden visual) */
export function scrambleUniqueIdDisplay(raw: string): string {
  const s = raw.trim();
  if (!s) return "—";
  const parts = s.split(/[-_/\\s]+/).filter(Boolean);
  if (parts.length <= 1) {
    return s
      .split("")
      .sort((a, b) => disorderSortKey(a + s).localeCompare(disorderSortKey(b + s)))
      .join("");
  }
  const sorted = [...parts].sort((a, b) =>
    disorderSortKey(a + s).localeCompare(disorderSortKey(b + s)),
  );
  return sorted.join("-");
}

export function getRawUniqueId(data: Record<string, unknown>): string {
  return String(data[UNIQUE_ID_COLUMN] ?? "").trim();
}

export function matchesUniqueIdSearch(data: Record<string, unknown>, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return getRawUniqueId(data).toLowerCase().includes(q);
}
