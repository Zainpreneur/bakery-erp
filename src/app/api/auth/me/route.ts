import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiRoute, notFound } from "@/lib/http";
import { requireUser } from "@/lib/auth";

export const GET = apiRoute(async (request) => {
  const session = await requireUser(request);
  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) notFound("User");
  return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});
