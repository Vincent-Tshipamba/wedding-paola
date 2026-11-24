import { timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "admin_session";
export type Role = "admin" | "scanner"; // scanner = door staff: can only use /admin/scan

function secret() {
  const s = process.env.AUTH_SECRET ?? "";
  if (s.length < 16)
    throw new Error(
      "AUTH_SECRET must be set (16+ characters). See .env.example",
    );
  return new TextEncoder().encode(s);
}

function same(input: string, expected: string) {
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return expected.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

/** Which role does this password unlock? (SCANNER_PASSWORD is optional.) */
export function roleForPassword(input: string): Role | null {
  if (same(input, process.env.ADMIN_PASSWORD ?? "")) return "admin";
  if (same(input, process.env.SCANNER_PASSWORD ?? "")) return "scanner";
  return null;
}

export async function createSession(role: Role) {
  const token = await new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getRole(): Promise<Role | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.role === "scanner"
      ? "scanner"
      : payload.role === "admin"
        ? "admin"
        : null;
  } catch {
    return null;
  }
}

export async function isAdmin() {
  return (await getRole()) === "admin";
}

/** Admin-only pages and actions. Door staff are sent to the scanner. */
export async function requireAdmin() {
  const role = await getRole();
  if (role === "admin") return;
  redirect(role === "scanner" ? "/admin/scan" : "/admin/login");
}

/** Scanner page and actions: admin or door staff. */
export async function requireStaff(): Promise<Role> {
  const role = await getRole();
  if (!role) redirect("/admin/login");
  return role;
}
