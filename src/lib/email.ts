type InviteEmailInput = {
  to: string;
  name: string;
  temporaryPassword: string;
};

function appUrl(): string {
  const explicit = process.env.APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:8080";
}

function emailFrom(): string {
  const from = process.env.EMAIL_FROM?.trim();
  if (!from) {
    throw new Error("Falta EMAIL_FROM para enviar invitaciones.");
  }
  return from;
}

function resendKey(): string {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    throw new Error("Falta RESEND_API_KEY para enviar invitaciones.");
  }
  return key;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendInviteEmail(input: InviteEmailInput): Promise<void> {
  const loginUrl = `${appUrl()}/login`;
  const name = input.name || input.to;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
      <h1 style="font-size:22px;margin-bottom:12px">Acceso a ENTREGABLE AB MAURI</h1>
      <p>Hola ${escapeHtml(name)},</p>
      <p>Se creó tu acceso al portal de consulta.</p>
      <div style="background:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:20px 0">
        <p style="margin:0 0 8px"><strong>Correo:</strong> ${escapeHtml(input.to)}</p>
        <p style="margin:0"><strong>Contraseña temporal:</strong> ${escapeHtml(input.temporaryPassword)}</p>
      </div>
      <p>Por seguridad, deberás cambiar tu contraseña al ingresar por primera vez.</p>
      <p>
        <a href="${loginUrl}" style="display:inline-block;background:#111827;color:white;text-decoration:none;padding:10px 16px;border-radius:6px">
          Ingresar al portal
        </a>
      </p>
      <p style="font-size:12px;color:#6b7280;margin-top:24px">
        Si no esperabas este acceso, puedes ignorar este mensaje.
      </p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom(),
      to: [input.to],
      subject: "Acceso a ENTREGABLE AB MAURI",
      html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`No se pudo enviar el correo de invitación. ${detail.slice(0, 200)}`);
  }
}

