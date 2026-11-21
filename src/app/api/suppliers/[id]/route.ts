import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiRoute, HttpError, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/auth";

const supplierSchema = z.object({
  name: z.string().min(1),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const PUT = apiRoute(async (request, { params }) => {
  await requireUser(request);
  const { id } = await params;

  const data = await parseBody(request, supplierSchema.partial());
  const supplier = await prisma.supplier.update({
    where: { id },
    data: { ...data, email: data.email || undefined },
  });
  return NextResponse.json(supplier);
});

export const DELETE = apiRoute(async (request, { params }) => {
  await requireUser(request);
  const { id } = await params;

  const inUse = await prisma.ingredient.count({ where: { supplierId: id } });
  if (inUse > 0) throw new HttpError(409, "Cannot delete a supplier linked to ingredients");
  await prisma.supplier.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
});
