import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { uploadPanaderias, uploadReleasedFile } from "@/lib/admin.functions";
import { parsePanaderiasWorkbook } from "@/lib/excel-import";

type Props = { onLogout: () => void | Promise<void> };

export function AdminPanel({ onLogout }: Props) {
  const qc = useQueryClient();
  const uploadRows = useServerFn(uploadPanaderias);
  const uploadFile = useServerFn(uploadReleasedFile);

  const [parsing, setParsing] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  const [releaseMsg, setReleaseMsg] = useState<string | null>(null);
  const [releaseErr, setReleaseErr] = useState<string | null>(null);

  async function handlePanaderiasFile(file: File) {
    setUploadErr(null);
    setUploadMsg(null);
    setParsing(true);
    try {
      const buf = await file.arrayBuffer();
      const { sheetName, rows } = parsePanaderiasWorkbook(buf);

      setUploadMsg(`Procesando ${rows.length} filas de "${sheetName}"…`);
      const res = await uploadRows({
        data: { rows, sourceFilename: file.name },
      });
      setUploadMsg(`✓ ${res.inserted} registros cargados. Puedes volver a subir otro archivo cuando quieras.`);
      qc.invalidateQueries({ queryKey: ["pan-page"] });
      qc.invalidateQueries({ queryKey: ["pan-ciudades"] });
    } catch (e) {
      setUploadErr((e as Error).message);
      setUploadMsg(null);
    } finally {
      setParsing(false);
    }
  }

  async function handleReleasedFile(file: File) {
    setReleaseErr(null);
    setReleaseMsg(null);
    try {
      const buf = await file.arrayBuffer();
      let bin = "";
      const bytes = new Uint8Array(buf);
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
      }
      const b64 = btoa(bin);
      await uploadFile({
        data: { filename: file.name, contentBase64: b64 },
      });
      setReleaseMsg("✓ Archivo liberado disponible para descarga.");
      qc.invalidateQueries({ queryKey: ["released"] });
    } catch (e) {
      setReleaseErr((e as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Panel de administración</h2>
        <button
          onClick={onLogout}
          className="px-3 py-1.5 text-sm rounded-md border bg-card hover:bg-muted"
        >
          Cerrar sesión
        </button>
      </div>

      <section className="rounded-lg border bg-card p-6 space-y-3">
        <div>
          <h3 className="font-semibold">1. Datos de panaderías</h3>
          <p className="text-sm text-muted-foreground">
            Sube un Excel con el mismo formato que{" "}
            <a href="/ejemplo.xlsx" className="text-primary underline" download>
              ejemplo.xlsx
            </a>{" "}
            (hoja <code className="px-1 rounded bg-muted">Hoja1</code>, mismas columnas). Cada carga
            reemplaza los datos anteriores en la tabla pública.
          </p>
        </div>
        <input
          type="file"
          accept=".xlsx,.xls"
          disabled={parsing}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handlePanaderiasFile(f);
            e.target.value = "";
          }}
          className="block text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer"
        />
        {parsing && <p className="text-sm text-muted-foreground">Procesando…</p>}
        {uploadMsg && <p className="text-sm text-foreground">{uploadMsg}</p>}
        {uploadErr && <p className="text-sm text-destructive">{uploadErr}</p>}
      </section>

      <section className="rounded-lg border bg-card p-6 space-y-3">
        <div>
          <h3 className="font-semibold">2. Datos liberados (descargables)</h3>
          <p className="text-sm text-muted-foreground">
            Archivo opcional para la sección &quot;Datos liberados&quot; (Excel, CSV o PDF).
          </p>
        </div>
        <input
          type="file"
          accept=".xlsx,.xls,.csv,.pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleReleasedFile(f);
            e.target.value = "";
          }}
          className="block text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer"
        />
        {releaseMsg && <p className="text-sm text-foreground">{releaseMsg}</p>}
        {releaseErr && <p className="text-sm text-destructive">{releaseErr}</p>}
      </section>
    </div>
  );
}
