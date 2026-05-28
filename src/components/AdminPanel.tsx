import { useEffect, useState } from "react";
import { put } from "@vercel/blob/client";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  blobStorageStatus,
  createPortalUser,
  getBlobClientToken,
  listPortalUsers,
  processPanaderiasFromBlob,
  processReleasedFromBlob,
  resetPortalUserPassword,
  setPortalUserActive,
  uploadPanaderiasExcel,
  uploadReleasedFile,
} from "@/lib/admin.functions";
import { arrayBufferToBase64, MAX_UPLOAD_BYTES } from "@/lib/file-base64";

type Props = { onLogout: () => void | Promise<void> };
type UserRole = "admin" | "viewer";

function safePath(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function AdminPanel({ onLogout }: Props) {
  const qc = useQueryClient();
  const fetchBlobToken = useServerFn(getBlobClientToken);
  const fetchBlobStatus = useServerFn(blobStorageStatus);
  const uploadExcel = useServerFn(uploadPanaderiasExcel);
  const processExcel = useServerFn(processPanaderiasFromBlob);
  const uploadReleasedDirect = useServerFn(uploadReleasedFile);
  const processReleased = useServerFn(processReleasedFromBlob);
  const fetchUsers = useServerFn(listPortalUsers);
  const createUser = useServerFn(createPortalUser);
  const resetPassword = useServerFn(resetPortalUserPassword);
  const setActive = useServerFn(setPortalUserActive);

  const [parsing, setParsing] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  const [releaseMsg, setReleaseMsg] = useState<string | null>(null);
  const [releaseErr, setReleaseErr] = useState<string | null>(null);
  const [blobAvailable, setBlobAvailable] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState<UserRole>("viewer");
  const [sendEmail, setSendEmail] = useState(true);
  const [userMsg, setUserMsg] = useState<string | null>(null);
  const [userErr, setUserErr] = useState<string | null>(null);
  const [userBusy, setUserBusy] = useState(false);

  const usersQ = useQuery({
    queryKey: ["portal-users"],
    queryFn: () => fetchUsers(),
  });

  useEffect(() => {
    fetchBlobStatus()
      .then((s) => setBlobAvailable(s.configured))
      .catch(() => setBlobAvailable(false));
  }, [fetchBlobStatus]);

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
    setUploadMsg("Subiendo archivo (almacenamiento opcional)…");
    const blob = await uploadFileToBlob(file, "panaderias");
    setUploadMsg("Procesando Excel…");
    return processExcel({
      data: { blobUrl: blob.url, sourceFilename: file.name },
    });
  }

  async function uploadPanaderiasDirect(file: File) {
    const buf = await file.arrayBuffer();
    setUploadMsg("Procesando Excel en el servidor…");
    return uploadExcel({
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
      const needsBlob = file.size > MAX_UPLOAD_BYTES;
      if (needsBlob && !blobAvailable) {
        throw new Error(
          `El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. Sin Vercel Blob el límite es ~4 MB. Comprime el Excel o conecta Blob (opcional).`,
        );
      }

      const res =
        needsBlob && blobAvailable
          ? await uploadPanaderiasViaBlob(file)
          : await uploadPanaderiasDirect(file);

      setUploadMsg(
        `✓ ${res.inserted} registros cargados (hoja "${res.sheetName}"). Cada nueva carga reemplaza la anterior.`,
      );
      await qc.invalidateQueries({ queryKey: ["pan-page"] });
      await qc.invalidateQueries({ queryKey: ["pan-ciudades"] });
      await qc.invalidateQueries({ queryKey: ["pan-unidades-censales"] });
      await qc.refetchQueries({ queryKey: ["pan-page"] });
    } catch (e) {
      const msg = (e as Error).message;
      setUploadErr(
        msg.includes("Too Large") || msg.includes("413")
          ? "Archivo demasiado grande para el servidor (~4 MB). Comprime el Excel o activa Vercel Blob (opcional)."
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
      const needsBlob = file.size > MAX_UPLOAD_BYTES;
      if (needsBlob && !blobAvailable) {
        throw new Error("Archivo demasiado grande sin Vercel Blob (máx. ~4 MB).");
      }

      if (needsBlob && blobAvailable) {
        const blob = await uploadFileToBlob(file, "released");
        await processReleased({
          data: { blobUrl: blob.url, sourceFilename: file.name },
        });
      } else {
        const buf = await file.arrayBuffer();
        await uploadReleasedDirect({
          data: { filename: file.name, contentBase64: arrayBufferToBase64(buf) },
        });
      }
      setReleaseMsg("✓ Archivo liberado disponible para descarga.");
      qc.invalidateQueries({ queryKey: ["released"] });
    } catch (e) {
      setReleaseErr((e as Error).message);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setUserErr(null);
    setUserMsg(null);
    setUserBusy(true);
    try {
      const res = await createUser({
        data: {
          name: userName,
          email: userEmail,
          role: userRole,
          sendEmail,
        },
      });
      setUserName("");
      setUserEmail("");
      setUserRole("viewer");
      await qc.invalidateQueries({ queryKey: ["portal-users"] });
      setUserMsg(
        res.emailSent
          ? `✓ Invitación enviada a ${res.user.email}.`
          : `✓ Usuario creado. Contraseña temporal: ${res.temporaryPassword}${
              res.emailError ? ` (correo no enviado: ${res.emailError})` : ""
            }`,
      );
    } catch (e) {
      setUserErr((e as Error).message);
    } finally {
      setUserBusy(false);
    }
  }

  async function handleResetPassword(email: string) {
    setUserErr(null);
    setUserMsg(null);
    setUserBusy(true);
    try {
      const res = await resetPassword({ data: { email, sendEmail } });
      await qc.invalidateQueries({ queryKey: ["portal-users"] });
      setUserMsg(
        res.emailSent
          ? `✓ Nueva contraseña enviada a ${res.user.email}.`
          : `✓ Contraseña temporal para ${res.user.email}: ${res.temporaryPassword}${
              res.emailError ? ` (correo no enviado: ${res.emailError})` : ""
            }`,
      );
    } catch (e) {
      setUserErr((e as Error).message);
    } finally {
      setUserBusy(false);
    }
  }

  async function handleToggleUser(email: string, active: boolean) {
    setUserErr(null);
    setUserMsg(null);
    setUserBusy(true);
    try {
      const res = await setActive({ data: { email, active } });
      await qc.invalidateQueries({ queryKey: ["portal-users"] });
      setUserMsg(`✓ Usuario ${res.user.active ? "activado" : "desactivado"}: ${res.user.email}.`);
    } catch (e) {
      setUserErr((e as Error).message);
    } finally {
      setUserBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {blobAvailable === false && (
        <p className="text-sm rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2">
          Blob no detectado en este deploy. Storage → Blob → <strong>Connect to Project</strong> →
          Production → <strong>Redeploy</strong>. Si pegaste el token a mano, bórralo y deja que
          Vercel lo cree al conectar.
        </p>
      )}

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
            <strong>reemplaza</strong> la anterior. No hace falta Vercel Blob si el archivo es menor
            de ~4 MB.
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

      <section className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <h3 className="font-semibold">3. Usuarios del portal</h3>
          <p className="text-sm text-muted-foreground">
            Crea accesos individuales. Cada usuario recibe una contraseña temporal y debe cambiarla
            al ingresar por primera vez.
          </p>
        </div>

        <form onSubmit={handleCreateUser} className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
          <input
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Nombre"
            className="px-3 py-2 rounded-md border bg-background text-sm"
            required
          />
          <input
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="correo@empresa.com"
            className="px-3 py-2 rounded-md border bg-background text-sm"
            required
          />
          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value as UserRole)}
            className="px-3 py-2 rounded-md border bg-background text-sm"
          >
            <option value="viewer">Consulta</option>
            <option value="admin">Administrador</option>
          </select>
          <button
            type="submit"
            disabled={userBusy}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            Crear usuario
          </button>
        </form>

        <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
          />
          Enviar correo automáticamente
        </label>

        {userMsg && <p className="text-sm text-foreground">{userMsg}</p>}
        {userErr && <p className="text-sm text-destructive">{userErr}</p>}

        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Usuario</th>
                <th className="text-left px-3 py-2 font-medium">Rol</th>
                <th className="text-left px-3 py-2 font-medium">Estado</th>
                <th className="text-right px-3 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usersQ.isLoading && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                    Cargando usuarios…
                  </td>
                </tr>
              )}
              {!usersQ.isLoading && !usersQ.data?.users.length && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                    Aún no hay usuarios creados.
                  </td>
                </tr>
              )}
              {usersQ.data?.users.map((u) => (
                <tr key={u.email} className="border-t">
                  <td className="px-3 py-2">
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="px-3 py-2">
                    {u.role === "admin" ? "Administrador" : "Consulta"}
                  </td>
                  <td className="px-3 py-2">
                    {u.active ? "Activo" : "Desactivado"}
                    {u.mustChangePassword ? " · debe cambiar clave" : ""}
                  </td>
                  <td className="px-3 py-2 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      disabled={userBusy}
                      onClick={() => handleResetPassword(u.email)}
                      className="px-2.5 py-1.5 rounded-md border bg-background hover:bg-muted disabled:opacity-50"
                    >
                      Resetear clave
                    </button>
                    <button
                      type="button"
                      disabled={userBusy}
                      onClick={() => handleToggleUser(u.email, !u.active)}
                      className="px-2.5 py-1.5 rounded-md border bg-background hover:bg-muted disabled:opacity-50"
                    >
                      {u.active ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
