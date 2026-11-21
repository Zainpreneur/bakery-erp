import bcrypt from "bcryptjs";
import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiRoute, parseBody } from "@/lib/http";
import { signToken, TOKEN_COOKIE, sessionCookieOptions, type Role } from "@/lib/auth";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  // Only allowed to self-elevate to ADMIN when no users exist yet (initial setup).
  role: z.enum(["ADMIN", "MANAGER", "STAFF"]).optional(),
});

export const POST = apiRoute(async (request) => {
  const data = await parseBody(request, registerSchema);
  const existingCount = await prisma.user.count();
  const passwordHash = await bcrypt.hash(data.password, 10);

  const role = existingCount === 0 ? "ADMIN" : data.role === "ADMIN" ? "STAFF" : data.role ?? "STAFF";

  const user = await prisma.user.create({
    data: { name: data.name, email: data.email.toLowerCase(), passwordHash, role },
  });

  const token = signToken({ sub: user.id, email: user.email, role: user.role as Role, name: user.name });
  const response = NextResponse.json(
    {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    },
    { status: 201 }
  );
  response.cookies.set(TOKEN_COOKIE, token, sessionCookieOptions);
  return response;
});
