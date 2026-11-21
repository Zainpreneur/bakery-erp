import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiRoute, notFound, parseBody } from "@/lib/http";

const paymentSchema = z.object({
  paidAmount: z.number().nonnegative(),
});

export const PUT = apiRoute(async (request, { params }) => {
  await requireUser(request);

  const { id } = await params;
  const { paidAmount } = await parseBody(request, paymentSchema);

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) notFound("Order");

  const paymentStatus =
    paidAmount >= existing.totalAmount && existing.totalAmount > 0
      ? "PAID"
      : paidAmount > 0
        ? "PARTIAL"
        : "UNPAID";

  const order = await prisma.order.update({
    where: { id },
    data: { paidAmount, paymentStatus },
  });

  return NextResponse.json(order);
});
