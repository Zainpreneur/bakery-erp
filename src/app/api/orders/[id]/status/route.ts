import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiRoute, notFound, parseBody } from "@/lib/http";

const statusSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "READY", "COMPLETED", "CANCELLED"]),
});

export const PUT = apiRoute(async (request, { params }) => {
  const createdById = (await requireUser(request)).sub;
  const { id } = await params;
  const { status } = await parseBody(request, statusSchema);

  const existing = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: { include: { recipeItems: true } } } } },
  });
  if (!existing) notFound("Order");

  if (status === "CANCELLED" && existing.status !== "CANCELLED") {
    // Restock any ingredients consumed by this order.
    await prisma.$transaction(async (tx) => {
      for (const item of existing.items) {
        for (const recipe of item.product.recipeItems) {
          const restock = recipe.quantity * item.quantity;
          await tx.inventoryTransaction.create({
            data: {
              ingredientId: recipe.ingredientId,
              type: "ADJUSTMENT",
              quantity: restock,
              note: `Restock from cancelled order ${existing.orderNumber}`,
              createdById,
            },
          });
          await tx.ingredient.update({
            where: { id: recipe.ingredientId },
            data: { quantityInStock: { increment: restock } },
          });
        }
      }
      await tx.order.update({ where: { id: existing.id }, data: { status } });
    });
  } else {
    await prisma.order.update({ where: { id: existing.id }, data: { status } });
  }

  const updated = await prisma.order.findUnique({
    where: { id },
    include: { customer: true, items: { include: { product: true } } },
  });

  return NextResponse.json(updated);
});
