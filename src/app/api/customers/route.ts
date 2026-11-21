import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiRoute, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/auth";

const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const GET = apiRoute(async (request) => {
  await requireUser(request);

  const search = new URL(request.url).searchParams.get("search")?.trim();
  const customers = await prisma.customer.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });
  return NextResponse.json(customers);
});

export const POST = apiRoute(async (request) => {
  await requireUser(request);

  const data = await parseBody(request, customerSchema);
  const customer = await prisma.customer.create({
    data: { ...data, email: data.email || null },
  });
  return NextResponse.json(customer, { status: 201 });
});
