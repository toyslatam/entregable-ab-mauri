import { createFileRoute } from "@tanstack/react-router";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { hasAdminSession } from "@/lib/admin-session";

export const Route = createFileRoute("/api/blob-upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!hasAdminSession()) {
          return Response.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = (await request.json()) as HandleUploadBody;
        try {
          const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async () => ({
              allowedContentTypes: [
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-excel",
                "text/csv",
                "application/pdf",
              ],
              maximumSizeInBytes: 20 * 1024 * 1024,
              addRandomSuffix: true,
            }),
          });
          return Response.json(jsonResponse);
        } catch (e) {
          return Response.json({ error: (e as Error).message }, { status: 400 });
        }
      },
    },
  },
});
