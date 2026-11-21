import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiRoute, notFound } from "@/lib/http";

export const GET = apiRoute(async (request, { params }) => {
  await requireUser(request);

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true, items: { include: { product: true } }, createdBy: true },
  });
  if (!order) notFound("Order");

  return NextResponse.json(order);
});
