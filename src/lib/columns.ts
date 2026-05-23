import { parseCantidad, parseCantidadPrecio, driveThumbnail } from "@/lib/parse-helpers";

export type DisplayColumn = {
  key: string;
  label: string;
  source: string | string[];
  kind?: "text" | "photo" | "cantidad" | "cantidadPrecio.cantidad" | "cantidadPrecio.precio";
  width?: number;
  sticky?: boolean;
};

/** Orden de columnas en Public/ejemplo.xlsx (Hoja1), con Unique ID primero */
const EXCEL_HEADERS = [
  "Added Time",
  "IP Address",
  "Codigo Encuestador",
  "Unique ID",
  "¿Nos autoriza de manera expresa e inequívoca para mantener y manejar toda su información?",
  "¿Podría Usted volver a ser contactado?",
  "1. Tipo de Panadería y Pastelería:",
  "2. ¿Exhibe y vende productos de panadería y pastelería en su local?",
  "3. ¿Actualmente produce pan o pasteles en su establecimiento?",
  "4. ¿Cuenta con horno y hornea pan o pasteles en el punto de venta?",
  "5. El establecimiento es una panadería de cadena",
  "Total de harina corregido (kg)",
  "Elaborar Panadería Corregido (kg)",
  "Elaborar Pastelería Corregido (kg)",
  "Marca Fresca 1",
  "Marca Fresca 2",
  "Marca Fresca 3",
  "Marca Seca 1",
  "Marca Seca 2",
  "11. El abastecimiento de Levadura lo hace principalmente de un:",
  "12. El pan que elaboran es principalmente",
  "Localidad",
  "Nombre del establecimiento de comercio",
  "Dirección completa",
  "Sector / Zona / Fogón",
  "Nombre del Entrevistado",
  "Cargo del Entrevistado",
  "Teléfono del entrevistado",
  "Teléfono del Negocio",
  "NIT / RUT del Negocio",
  "Correo electrónico",
  "Foto de la fachada",
  "Foto de la tarjeta del establecimiento",
  "Submitters Latitude",
  "Submitters Longitude",
  "Persona de contacto del NIT",
  "Barrio",
  "¿Acepta ser encuestado?",
  "6.1. Cuál es la unidad de medida que esta presentado la harina el encuestado?",
  "Foto de la factura",
  "Total Premezcla",
  "Ciudad",
  "Tipo encuesta",
  "Lote",
  "Levapan (kg)",
  "Fleischman (kg)",
  "Levasaf (kg)",
  "Otra Marca (kg)",
  "Angel (kg)",
  "El Panificador (kg)",
  "Fermipan (kg)",
  "Gloripan (kg)",
  "Instaferm (kg)",
  "Instant Success (kg)",
  "Mauripan (kg)",
  "SAF Instant (kg)",
  "Santillana (kg)",
  "Otra Marca (kg)2",
  "Levapan (COP/kg)",
  "Fleischman (COP/kg)",
  "Levasaf (COP/kg)",
  "Otra Marca (COP/kg)",
  "Angel (COP/kg)",
  "El Panificador (COP/kg)",
  "Fermipan (COP/kg)",
  "Gloripan (COP/kg)",
  "Instaferm (COP/kg)",
  "Instant Success (COP/kg)",
  "Mauripan (COP/kg)",
  "SAF Instant (COP/kg)",
  "Santillana (COP/kg)",
  "Otra Marca (COP/kg)3",
  "Unidad Censal",
  "Estandar",
] as const;

export const UNIQUE_ID_COLUMN = "Unique ID";
export const CIUDAD_COLUMN = "Ciudad";

export function getCiudadFromRow(row: Record<string, unknown>): string {
  const v = row[CIUDAD_COLUMN];
  if (v != null && String(v).trim()) return String(v).trim();
  return "";
}
export const NAME_COLUMN = "Nombre del establecimiento de comercio";
export const PHOTO_COLUMN = "Foto de la fachada";

const UNIQUE_ID_HEADER = UNIQUE_ID_COLUMN;

function columnWidth(header: string): number {
  if (header === UNIQUE_ID_HEADER) return 120;
  if (header === PHOTO_COLUMN || header === "Foto de la tarjeta del establecimiento" || header === "Foto de la factura") return 88;
  return Math.min(280, Math.max(96, Math.ceil(header.length * 4.5)));
}

function buildDisplayColumns(): DisplayColumn[] {
  const ordered = [
    UNIQUE_ID_HEADER,
    ...EXCEL_HEADERS.filter((h) => h !== UNIQUE_ID_HEADER),
  ];
  return ordered.map((header, index) => ({
    key: `col_${index}`,
    label: header,
    source: header,
    kind:
      header === PHOTO_COLUMN ||
      header === "Foto de la tarjeta del establecimiento" ||
      header === "Foto de la factura"
        ? "photo"
        : "text",
    width: columnWidth(header),
    sticky: index === 0,
  }));
}

export const DISPLAY_COLUMNS: DisplayColumn[] = buildDisplayColumns();

function pick(row: Record<string, unknown>, src: string | string[]): unknown {
  const list = Array.isArray(src) ? src : [src];
  for (const k of list) if (row[k] != null && row[k] !== "") return row[k];
  return null;
}

export function formatCell(row: Record<string, unknown>, col: DisplayColumn): string {
  const raw = pick(row, col.source);
  if (raw == null || raw === "") return "—";
  switch (col.kind) {
    case "cantidad": {
      const v = parseCantidad(raw);
      return v == null ? "—" : String(v);
    }
    case "cantidadPrecio.cantidad": {
      const { cantidad } = parseCantidadPrecio(raw);
      return cantidad == null ? "—" : String(cantidad);
    }
    case "cantidadPrecio.precio": {
      const { precio } = parseCantidadPrecio(raw);
      if (precio == null) return "—";
      return typeof precio === "number"
        ? precio.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
        : String(precio);
    }
    default:
      return String(raw);
  }
}

export function photoUrlForCell(row: Record<string, unknown>, col: DisplayColumn): string | null {
  if (col.kind !== "photo") return null;
  const raw = pick(row, col.source);
  if (raw == null || raw === "") return null;
  return driveThumbnail(String(raw), 400);
}

export function buildRowFromSheet(row: Record<string, unknown>) {
  const nombre =
    (row[NAME_COLUMN] as string | undefined) ??
    (row["Nombre del establecimiento"] as string | undefined) ??
    null;
  const foto = (row[PHOTO_COLUMN] as string | undefined) ?? null;
  return {
    nombre,
    foto_url: driveThumbnail(foto, 400),
    data: row,
  };
}
