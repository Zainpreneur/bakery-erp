import bcrypt from "bcryptjs";
import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiRoute, parseBody, HttpError } from "@/lib/http";
import { signToken, TOKEN_COOKIE, sessionCookieOptions, type Role } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const POST = apiRoute(async (request) => {
  const data = await parseBody(request, loginSchema);
  const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });

  if (!user || !user.active) {
    throw new HttpError(401, "Invalid email or password");
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, "Invalid email or password");
  }

  const token = signToken({ sub: user.id, email: user.email, role: user.role as Role, name: user.name });
  const response = NextResponse.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
  response.cookies.set(TOKEN_COOKIE, token, sessionCookieOptions);
  return response;
});
