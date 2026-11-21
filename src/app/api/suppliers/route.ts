import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiRoute, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/auth";

const supplierSchema = z.object({
  name: z.string().min(1),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const GET = apiRoute(async (request) => {
  await requireUser(request);

  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { ingredients: true } } },
  });
  return NextResponse.json(suppliers);
});

export const POST = apiRoute(async (request) => {
  await requireUser(request);

  const data = await parseBody(request, supplierSchema);
  const supplier = await prisma.supplier.create({ data: { ...data, email: data.email || null } });
  return NextResponse.json(supplier, { status: 201 });
});
