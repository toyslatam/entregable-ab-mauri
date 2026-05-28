import { createFileRoute } from "@tanstack/react-router";
import { readReleasedFile } from "@/lib/data-store";
import { getSession } from "@/lib/admin-session";
import { findUserByEmail } from "@/lib/users-store";

const MIME: Record<string, string> = {
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel",
  ".csv": "text/csv",
  ".pdf": "application/pdf",
};

export const Route = createFileRoute("/api/released-download")({
  server: {
    handlers: {
      GET: async () => {
        const session = getSession();
        if (!session) {
          return new Response("No autorizado", { status: 401 });
        }
        if (!session.isMaster) {
          const user = await findUserByEmail(session.email);
          if (!user?.active || user.mustChangePassword) {
            return new Response("No autorizado", { status: 401 });
          }
        }
        const file = await readReleasedFile();
        if (!file) {
          return new Response("No hay archivo publicado", { status: 404 });
        }
        const ext = file.meta.filename.includes(".")
          ? file.meta.filename.slice(file.meta.filename.lastIndexOf("."))
          : "";
        const type = MIME[ext.toLowerCase()] ?? "application/octet-stream";
        return new Response(file.bytes, {
          headers: {
            "Content-Type": type,
            "Content-Disposition": `attachment; filename="${file.meta.filename}"`,
          },
        });
      },
    },
  },
});
