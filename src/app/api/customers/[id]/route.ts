import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiRoute, parseBody, notFound } from "@/lib/http";
import { requireUser } from "@/lib/auth";

const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const GET = apiRoute(async (request, { params }) => {
  await requireUser(request);
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { orders: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  if (!customer) notFound("Customer");
  return NextResponse.json(customer);
});

export const PUT = apiRoute(async (request, { params }) => {
  await requireUser(request);
  const { id } = await params;

  const data = await parseBody(request, customerSchema.partial());
  const customer = await prisma.customer.update({
    where: { id },
    data: { ...data, email: data.email || undefined },
  });
  return NextResponse.json(customer);
});

export const DELETE = apiRoute(async (request, { params }) => {
  await requireUser(request);
  const { id } = await params;

  await prisma.customer.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
});
