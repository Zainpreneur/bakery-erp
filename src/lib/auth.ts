import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { HttpError } from "./http";

export type Role = "ADMIN" | "MANAGER" | "STAFF";

export interface Session {
  sub: string;
  email: string;
  role: Role;
  name: string;
}

export const TOKEN_COOKIE = "bakery_token";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export function signToken(payload: Session): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): Session {
  return jwt.verify(token, JWT_SECRET) as Session;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export async function getSession(request?: Request): Promise<Session | null> {
  let token = (await cookies()).get(TOKEN_COOKIE)?.value;

  if (!token && request) {
    const header = request.headers.get("authorization");
    if (header?.startsWith("Bearer ")) token = header.slice(7);
  }

  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function requireUser(request?: Request): Promise<Session> {
  const session = await getSession(request);
  if (!session) throw new HttpError(401, "Authentication required");
  return session;
}

export async function requireRole(...roles: Role[]): Promise<Session> {
  const session = await requireUser();
  if (!roles.includes(session.role)) throw new HttpError(403, "Insufficient permissions");
  return session;
}
