import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { get, put } from "@vercel/blob";
import {
  assertBlobReadyForSave,
  blobCmdOptions,
  formatBlobSaveError,
  shouldPersistWithBlob,
} from "@/lib/blob-env";

const scrypt = promisify(scryptCb);

const BLOB_USERS = "data/users.json";
const LOCAL_USERS = path.join(process.cwd(), "data", "users.json");

export type UserRole = "admin" | "viewer";

export type PortalUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  passwordHash: string;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
};

type UsersStore = {
  users: PortalUser[];
};

export type PublicUser = Omit<PortalUser, "passwordHash">;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function publicUser(user: PortalUser): PublicUser {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

async function streamToText(stream: ReadableStream<Uint8Array>): Promise<string> {
  return await new Response(stream).text();
}

async function blobReadText(pathname: string): Promise<string | null> {
  try {
    const result = await get(pathname, {
      access: "private",
      ...blobCmdOptions(),
    });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return streamToText(result.stream);
  } catch {
    return null;
  }
}

async function blobWrite(pathname: string, body: string) {
  assertBlobReadyForSave();
  await put(pathname, body, {
    access: "private",
    contentType: "application/json; charset=utf-8",
    ...blobCmdOptions(),
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

async function readUsersStore(): Promise<UsersStore> {
  if (shouldPersistWithBlob()) {
    const raw = await blobReadText(BLOB_USERS);
    return raw ? (JSON.parse(raw) as UsersStore) : { users: [] };
  }

  try {
    const raw = await fs.readFile(LOCAL_USERS, "utf-8");
    return JSON.parse(raw) as UsersStore;
  } catch {
    return { users: [] };
  }
}

async function writeUsersStore(store: UsersStore): Promise<void> {
  const json = JSON.stringify(store, null, 2);
  if (shouldPersistWithBlob()) {
    try {
      await blobWrite(BLOB_USERS, json);
      return;
    } catch (e) {
      const err = new Error(formatBlobSaveError(e));
      if (e instanceof Error) err.cause = e;
      throw err;
    }
  }

  await fs.mkdir(path.dirname(LOCAL_USERS), { recursive: true });
  await fs.writeFile(LOCAL_USERS, json, "utf-8");
}

export function generateTemporaryPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(12);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64url");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [kind, salt, encoded] = storedHash.split("$");
  if (kind !== "scrypt" || !salt || !encoded) return false;

  const expected = Buffer.from(encoded, "base64url");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export async function listUsers(): Promise<PublicUser[]> {
  const store = await readUsersStore();
  return store.users
    .map(publicUser)
    .sort((a, b) => a.email.localeCompare(b.email, "es"));
}

export async function findUserByEmail(email: string): Promise<PortalUser | null> {
  const target = normalizeEmail(email);
  const store = await readUsersStore();
  return store.users.find((u) => u.email === target) ?? null;
}

export async function createUser(input: {
  email: string;
  name: string;
  role?: UserRole;
  temporaryPassword: string;
}): Promise<PublicUser> {
  const store = await readUsersStore();
  const email = normalizeEmail(input.email);
  if (store.users.some((u) => u.email === email)) {
    throw new Error("Ya existe un usuario con ese correo.");
  }

  const now = new Date().toISOString();
  const user: PortalUser = {
    id: randomBytes(12).toString("base64url"),
    email,
    name: input.name.trim() || email,
    role: input.role ?? "viewer",
    active: true,
    passwordHash: await hashPassword(input.temporaryPassword),
    mustChangePassword: true,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: null,
  };

  store.users.push(user);
  await writeUsersStore(store);
  return publicUser(user);
}

export async function setUserActive(email: string, active: boolean): Promise<PublicUser> {
  const store = await readUsersStore();
  const user = store.users.find((u) => u.email === normalizeEmail(email));
  if (!user) throw new Error("Usuario no encontrado.");
  user.active = active;
  user.updatedAt = new Date().toISOString();
  await writeUsersStore(store);
  return publicUser(user);
}

export async function resetUserPassword(
  email: string,
  temporaryPassword: string,
): Promise<PublicUser> {
  const store = await readUsersStore();
  const user = store.users.find((u) => u.email === normalizeEmail(email));
  if (!user) throw new Error("Usuario no encontrado.");
  user.passwordHash = await hashPassword(temporaryPassword);
  user.mustChangePassword = true;
  user.active = true;
  user.updatedAt = new Date().toISOString();
  await writeUsersStore(store);
  return publicUser(user);
}

export async function changeUserPassword(email: string, newPassword: string): Promise<PublicUser> {
  const store = await readUsersStore();
  const user = store.users.find((u) => u.email === normalizeEmail(email));
  if (!user) throw new Error("Usuario no encontrado.");
  user.passwordHash = await hashPassword(newPassword);
  user.mustChangePassword = false;
  user.updatedAt = new Date().toISOString();
  await writeUsersStore(store);
  return publicUser(user);
}

export async function markUserLogin(email: string): Promise<PublicUser> {
  const store = await readUsersStore();
  const user = store.users.find((u) => u.email === normalizeEmail(email));
  if (!user) throw new Error("Usuario no encontrado.");
  user.lastLoginAt = new Date().toISOString();
  await writeUsersStore(store);
  return publicUser(user);
}

