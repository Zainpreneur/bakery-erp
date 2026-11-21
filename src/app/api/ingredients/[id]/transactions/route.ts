import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiRoute, parseBody, HttpError, notFound } from "@/lib/http";
import { requireUser } from "@/lib/auth";

// Record a stock movement (purchase, usage, adjustment, waste) and update the running balance.
const txnSchema = z.object({
  type: z.enum(["PURCHASE", "USAGE", "ADJUSTMENT", "WASTE"]),
  quantity: z.number(),
  note: z.string().optional(),
});

// POST /api/ingredients/:id/transactions — mirrors Express POST "/:id/transactions"
export const POST = apiRoute(async (request, { params }) => {
  const session = await requireUser(request);
  const { id } = await params;

  const data = await parseBody(request, txnSchema);
  const ingredient = await prisma.ingredient.findUnique({ where: { id } });
  if (!ingredient) notFound("Ingredient");

  const delta =
    data.type === "PURCHASE" || data.type === "ADJUSTMENT" ? data.quantity : -Math.abs(data.quantity);

  const newQuantity = ingredient.quantityInStock + delta;
  if (newQuantity < 0) throw new HttpError(400, "Resulting stock cannot be negative");

  const [txn] = await prisma.$transaction([
    prisma.inventoryTransaction.create({
      data: {
        ingredientId: ingredient.id,
        type: data.type,
        quantity: delta,
        note: data.note,
        createdById: session.sub,
      },
    }),
    prisma.ingredient.update({ where: { id: ingredient.id }, data: { quantityInStock: newQuantity } }),
  ]);

  return NextResponse.json(txn, { status: 201 });
});
