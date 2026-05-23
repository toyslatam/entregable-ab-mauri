const numFromText = (s) => {
  if (s == null) return null;
  const trimmed = String(s).trim();
  if (!trimmed) return null;
  const match = trimmed.match(/-?\d+(?:[.,]\d+)?/);
  if (!match) return trimmed;
  const n = Number(match[0].replace(",", "."));
  return Number.isFinite(n) ? n : trimmed;
};
function parseCantidad(v) {
  if (v == null) return null;
  const str = String(v);
  if (!str) return null;
  const cleaned = str.replace(/^[^:]*:\s*/i, "");
  return numFromText(cleaned);
}
function parseCantidadPrecio(v) {
  if (v == null) return { cantidad: null, precio: null };
  const str = String(v);
  if (!str.trim()) return { cantidad: null, precio: null };
  const parts = str.split(",");
  let cantidad = null;
  let precio = null;
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
function driveThumbnail(url, size = 400) {
  if (!url) return null;
  const s = String(url);
  const m = s.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w${size}`;
  return s;
}
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
  "Estandar"
];
const UNIQUE_ID_COLUMN = "Unique ID";
const CIUDAD_COLUMN = "Ciudad";
const NAME_COLUMN = "Nombre del establecimiento de comercio";
const PHOTO_COLUMN = "Foto de la fachada";
const UNIQUE_ID_HEADER = UNIQUE_ID_COLUMN;
function columnWidth(header) {
  if (header === UNIQUE_ID_HEADER) return 120;
  if (header === PHOTO_COLUMN || header === "Foto de la tarjeta del establecimiento" || header === "Foto de la factura") return 88;
  return Math.min(280, Math.max(96, Math.ceil(header.length * 4.5)));
}
function buildDisplayColumns() {
  const ordered = [
    UNIQUE_ID_HEADER,
    ...EXCEL_HEADERS.filter((h) => h !== UNIQUE_ID_HEADER)
  ];
  return ordered.map((header, index) => ({
    key: `col_${index}`,
    label: header,
    source: header,
    kind: header === PHOTO_COLUMN || header === "Foto de la tarjeta del establecimiento" || header === "Foto de la factura" ? "photo" : "text",
    width: columnWidth(header),
    sticky: index === 0
  }));
}
const DISPLAY_COLUMNS = buildDisplayColumns();
function pick(row, src) {
  const list = Array.isArray(src) ? src : [src];
  for (const k of list) if (row[k] != null && row[k] !== "") return row[k];
  return null;
}
function formatCell(row, col) {
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
      return typeof precio === "number" ? precio.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }) : String(precio);
    }
    default:
      return String(raw);
  }
}
function photoUrlForCell(row, col) {
  if (col.kind !== "photo") return null;
  const raw = pick(row, col.source);
  if (raw == null || raw === "") return null;
  return driveThumbnail(String(raw), 400);
}
function buildRowFromSheet(row) {
  const nombre = row[NAME_COLUMN] ?? row["Nombre del establecimiento"] ?? null;
  const foto = row[PHOTO_COLUMN] ?? null;
  return {
    nombre,
    foto_url: driveThumbnail(foto, 400),
    data: row
  };
}
export {
  CIUDAD_COLUMN as C,
  DISPLAY_COLUMNS as D,
  NAME_COLUMN as N,
  UNIQUE_ID_COLUMN as U,
  buildRowFromSheet as b,
  formatCell as f,
  photoUrlForCell as p
};
