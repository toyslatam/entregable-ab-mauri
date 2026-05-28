import { createHmac, timingSafeEqual } from "node:crypto";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import type { UserRole } from "@/lib/users-store";

const COOKIE_NAME = "ab_mauri_admin";
const SESSION_HOURS = 8;

export type SessionUser = {
  email: string;
  name: string;
  role: UserRole;
  mustChangePassword: boolean;
  isMaster: boolean;
};

export type SessionPayload = SessionUser & {
  expiresAt: number;
};

function adminSecret(): string {
  const secret = process.env.ADMIN_PASSWORD || "";
  if (!secret) throw new Error("ADMIN_PASSWORD no configurada");
  return secret;
}

export function getMasterAdminEmail(): string {
  return (process.env.ADMIN_EMAIL || "admin@local").trim().toLowerCase();
}

function encodePayload(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function signPayload(encodedPayload: string): string {
  return createHmac("sha256", adminSecret()).update(encodedPayload).digest("base64url");
}

function createSessionToken(user: SessionUser): string {
  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const encoded = encodePayload({ ...user, expiresAt });
  return `${encoded}.${signPayload(encoded)}`;
}

function readSessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;
  try {
    const expected = signPayload(encoded);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8")) as Partial<SessionPayload>;
    if (!payload.email || !payload.name || !payload.role || !payload.expiresAt) return null;
    if (payload.role !== "admin" && payload.role !== "viewer") return null;
    if (!Number.isFinite(payload.expiresAt) || Date.now() > payload.expiresAt) return null;
    return {
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role,
      mustChangePassword: Boolean(payload.mustChangePassword),
      isMaster: Boolean(payload.isMaster),
      expiresAt: payload.expiresAt,
    };
  } catch {
    return null;
  }
}

export function setAdminSessionCookie(user?: Partial<SessionUser>) {
  const token = createSessionToken({
    email: user?.email ?? getMasterAdminEmail(),
    name: user?.name ?? "Administrador",
    role: user?.role ?? "admin",
    mustChangePassword: Boolean(user?.mustChangePassword),
    isMaster: user?.isMaster ?? true,
  });
  setCookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  });
}

export function clearAdminSessionCookie() {
  deleteCookie(COOKIE_NAME, { path: "/" });
}

export function getSession(): SessionPayload | null {
  return readSessionToken(getCookie(COOKIE_NAME));
}

export function assertAdminSession(): SessionPayload {
  const session = getSession();
  if (!session) {
    throw new Error("Sesión no válida. Inicia sesión de nuevo.");
  }
  return session;
}

export function hasAdminSession(): boolean {
  return Boolean(getSession());
}

export function assertAdminRole(): SessionPayload {
  const session = assertAdminSession();
  if (session.role !== "admin") {
    throw new Error("No tienes permisos de administrador.");
  }
  return session;
}

export function checkAdminPassword(pwd: string) {
  const expected = adminSecret();
  const a = Buffer.from(pwd);
  const b = Buffer.from(expected);
  if (a.length !== b.length) throw new Error("Contraseña incorrecta");
  if (!timingSafeEqual(a, b)) throw new Error("Contraseña incorrecta");
}
