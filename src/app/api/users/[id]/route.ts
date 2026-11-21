import bcrypt from "bcryptjs";
import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiRoute, parseBody, HttpError } from "@/lib/http";
import { requireRole } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "MANAGER", "STAFF"]).optional(),
  active: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

export const PUT = apiRoute(async (request, { params }) => {
  await requireRole("ADMIN");
  const { id } = await params;
  const data = await parseBody(request, updateSchema);
  const { password, ...rest } = data;
  const user = await prisma.user.update({
    where: { id },
    data: { ...rest, passwordHash: password ? await bcrypt.hash(password, 10) : undefined },
  });
  return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role, active: user.active });
});

export const DELETE = apiRoute(async (_request, { params }) => {
  const session = await requireRole("ADMIN");
  const { id } = await params;
  if (id === session.sub) throw new HttpError(400, "Cannot delete your own account");
  await prisma.user.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
});
