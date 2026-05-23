import * as XLSX from "xlsx";
import { buildRowFromSheet, NAME_COLUMN } from "@/lib/columns";

const SHEET_CANDIDATES = ["Hoja1", "Panaderías", "Panaderia"];

export function pickSheetName(names: string[]): string {
  for (const c of SHEET_CANDIDATES) if (names.includes(c)) return c;
  const found = names.find((n) => n.toLowerCase().includes("panad"));
  return found ?? names[0];
}

export function parsePanaderiasWorkbook(buffer: ArrayBuffer) {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheetName = pickSheetName(wb.SheetNames);
  const ws = wb.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: null,
    raw: false,
  });
  const rows = json
    .filter(
      (r) =>
        r &&
        (r[NAME_COLUMN] || Object.values(r).some((v) => v != null && v !== "")),
    )
    .map(buildRowFromSheet);
  return { sheetName, rows };
}
