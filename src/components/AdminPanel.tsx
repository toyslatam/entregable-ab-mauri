import { useState } from "react";
import { put } from "@vercel/blob/client";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import {
  getBlobClientToken,
  processPanaderiasFromBlob,
  processReleasedFromBlob,
  uploadPanaderiasExcel,
  uploadReleasedFile,
} from "@/lib/admin.functions";
import { arrayBufferToBase64, MAX_UPLOAD_BYTES } from "@/lib/file-base64";

type Props = { onLogout: () => void | Promise<void> };

function safePath(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function AdminPanel({ onLogout }: Props) {
  const qc = useQueryClient();
  const fetchBlobToken = useServerFn(getBlobClientToken);
  const uploadExcelLegacy = useServerFn(uploadPanaderiasExcel);
  const processExcel = useServerFn(processPanaderiasFromBlob);
  const uploadFileLegacy = useServerFn(uploadReleasedFile);
  const processReleased = useServerFn(processReleasedFromBlob);

  const [parsing, setParsing] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  const [releaseMsg, setReleaseMsg] = useState<string | null>(null);
  const [releaseErr, setReleaseErr] = useState<string | null>(null);

  async function uploadFileToBlob(file: File, folder: string) {
    const pathname = `uploads/${folder}/${Date.now()}-${safePath(file.name)}`;
    const { clientToken } = await fetchBlobToken({ data: { pathname } });
    return put(pathname, file, {
      access: "private",
      token: clientToken,
      multipart: file.size > 4 * 1024 * 1024,
    });
  }

  async function uploadPanaderiasViaBlob(file: File) {
    setUploadMsg("Subiendo archivo a almacenamiento…");
    const blob = await uploadFileToBlob(file, "panaderias");
    setUploadMsg("Procesando Excel en el servidor…");
    return processExcel({
      data: { blobUrl: blob.url, sourceFilename: file.name },
    });
  }

  async function uploadPanaderiasViaBase64(file: File) {
    const buf = await file.arrayBuffer();
    setUploadMsg("Subiendo Excel al servidor…");
    return uploadExcelLegacy({
      data: {
        contentBase64: arrayBufferToBase64(buf),
        sourceFilename: file.name,
      },
    });
  }

  async function handlePanaderiasFile(file: File) {
    setUploadErr(null);
    setUploadMsg(null);
    setParsing(true);
    try {
      let res: { inserted: number; sheetName: string };
      try {
        res = await uploadPanaderiasViaBlob(file);
      } catch (blobErr) {
        if (!import.meta.env.PROD && file.size <= MAX_UPLOAD_BYTES) {
          res = await uploadPanaderiasViaBase64(file);
        } else {
          throw blobErr;
        }
      }
      setUploadMsg(
        `✓ ${res.inserted} registros cargados (hoja "${res.sheetName}"). Cada nueva carga reemplaza la anterior.`,
      );
      qc.invalidateQueries({ queryKey: ["pan-page"] });
      qc.invalidateQueries({ queryKey: ["pan-ciudades"] });
    } catch (e) {
      const msg = (e as Error).message;
      setUploadErr(
        msg.includes("Too Large") || msg.includes("413")
          ? "Archivo demasiado grande. Conecta Vercel Blob o reduce el tamaño del Excel."
          : msg,
      );
      setUploadMsg(null);
    } finally {
      setParsing(false);
    }
  }

  async function handleReleasedFile(file: File) {
    setReleaseErr(null);
    setReleaseMsg(null);
    try {
      try {
        const blob = await uploadFileToBlob(file, "released");
        await processReleased({
          data: { blobUrl: blob.url, sourceFilename: file.name },
        });
      } catch {
        if (file.size > MAX_UPLOAD_BYTES) throw new Error("Archivo demasiado grande");
        const buf = await file.arrayBuffer();
        await uploadFileLegacy({
          data: { filename: file.name, contentBase64: arrayBufferToBase64(buf) },
        });
      }
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
            Sube un Excel como{" "}
            <a href="/ejemplo.xlsx" className="text-primary underline" download>
              ejemplo.xlsx
            </a>{" "}
            (hoja <code className="px-1 rounded bg-muted">Hoja1</code>). Cada carga{" "}
            <strong>reemplaza</strong> la anterior.
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
            Archivo opcional para &quot;Datos liberados&quot; (Excel, CSV o PDF).
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
