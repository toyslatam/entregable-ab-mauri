import { createHmac, timingSafeEqual } from "node:crypto";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";

const COOKIE_NAME = "ab_mauri_admin";
const SESSION_HOURS = 8;

function adminSecret(): string {
  const secret = process.env.ADMIN_PASSWORD || "";
  if (!secret) throw new Error("ADMIN_PASSWORD no configurada");
  return secret;
}

function signPayload(expiresAt: number): string {
  return createHmac("sha256", adminSecret()).update(String(expiresAt)).digest("base64url");
}

function createSessionToken(): string {
  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  return `${expiresAt}.${signPayload(expiresAt)}`;
}

function isValidSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expRaw, sig] = token.split(".");
  if (!expRaw || !sig) return false;
  const expiresAt = Number(expRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
  try {
    const expected = signPayload(expiresAt);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function setAdminSessionCookie() {
  const token = createSessionToken();
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

export function assertAdminSession() {
  const token = getCookie(COOKIE_NAME);
  if (!isValidSessionToken(token)) {
    throw new Error("Sesión no válida. Inicia sesión de nuevo.");
  }
}

export function hasAdminSession(): boolean {
  return isValidSessionToken(getCookie(COOKIE_NAME));
}

export function checkAdminPassword(pwd: string) {
  const expected = adminSecret();
  const a = Buffer.from(pwd);
  const b = Buffer.from(expected);
  if (a.length !== b.length) throw new Error("Contraseña incorrecta");
  if (!timingSafeEqual(a, b)) throw new Error("Contraseña incorrecta");
}
