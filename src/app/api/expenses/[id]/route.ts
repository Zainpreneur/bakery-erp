import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiRoute } from "@/lib/http";

export const DELETE = apiRoute(async (request, { params }) => {
  await requireUser(request);

  const { id } = await params;
  await prisma.expense.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
});
