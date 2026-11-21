import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiRoute, HttpError, notFound, parseBody } from "@/lib/http";

const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

const orderSchema = z.object({
  customerId: z.string().optional().nullable(),
  orderType: z.enum(["WALK_IN", "PHONE", "ONLINE", "CATERING"]).default("WALK_IN"),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional(),
  paidAmount: z.number().nonnegative().default(0),
  items: z.array(orderItemSchema).min(1),
});

async function generateOrderNumber() {
  const count = await prisma.order.count();
  const year = new Date().getFullYear();
  return `ORD-${year}-${String(count + 1).padStart(5, "0")}`;
}

export const GET = apiRoute(async (request) => {
  await requireUser(request);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const customerId = searchParams.get("customerId") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  const where: Prisma.OrderWhereInput = {
    status: status || undefined,
    customerId: customerId || undefined,
    createdAt:
      from || to
        ? { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined }
        : undefined,
  };

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { customer: true, items: { include: { product: true } } },
  });

  return NextResponse.json(orders);
});

export const POST = apiRoute(async (request) => {
  const createdById = (await requireUser(request)).sub;
  const data = await parseBody(request, orderSchema);

  const products = await prisma.product.findMany({
    where: { id: { in: data.items.map((i) => i.productId) } },
    include: { recipeItems: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Verify every product exists, and aggregate total ingredient consumption across the order.
  const ingredientUsage = new Map<string, number>();
  for (const item of data.items) {
    const product = productMap.get(item.productId);
    if (!product) throw new HttpError(400, `Product ${item.productId} not found`);
    for (const recipe of product.recipeItems) {
      const used = recipe.quantity * item.quantity;
      ingredientUsage.set(recipe.ingredientId, (ingredientUsage.get(recipe.ingredientId) ?? 0) + used);
    }
  }

  const ingredientIds = [...ingredientUsage.keys()];
  const ingredients = await prisma.ingredient.findMany({ where: { id: { in: ingredientIds } } });
  const ingredientMap = new Map(ingredients.map((i) => [i.id, i]));

  const shortages = ingredientIds
    .map((id) => {
      const need = ingredientUsage.get(id)!;
      const have = ingredientMap.get(id)?.quantityInStock ?? 0;
      return { id, name: ingredientMap.get(id)?.name, need, have };
    })
    .filter((s) => s.have < s.need);

  if (shortages.length > 0) {
    throw new HttpError(
      400,
      `Insufficient stock for: ${shortages.map((s) => `${s.name} (need ${s.need}, have ${s.have})`).join(", ")}`
    );
  }

  const orderNumber = await generateOrderNumber();
  const itemsWithPricing = data.items.map((item) => {
    const product = productMap.get(item.productId)!;
    const subtotal = product.price * item.quantity;
    return { productId: item.productId, quantity: item.quantity, unitPrice: product.price, subtotal };
  });
  const totalAmount = itemsWithPricing.reduce((sum, i) => sum + i.subtotal, 0);
  const paymentStatus =
    data.paidAmount >= totalAmount && totalAmount > 0
      ? "PAID"
      : data.paidAmount > 0
        ? "PARTIAL"
        : "UNPAID";

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        customerId: data.customerId || null,
        orderType: data.orderType,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes,
        totalAmount,
        paidAmount: data.paidAmount,
        paymentStatus,
        createdById,
        items: { create: itemsWithPricing },
      },
      include: { items: { include: { product: true } }, customer: true },
    });

    for (const [ingredientId, quantity] of ingredientUsage.entries()) {
      await tx.inventoryTransaction.create({
        data: {
          ingredientId,
          type: "USAGE",
          quantity: -quantity,
          note: `Used for order ${orderNumber}`,
          createdById,
        },
      });
      await tx.ingredient.update({
        where: { id: ingredientId },
        data: { quantityInStock: { decrement: quantity } },
      });
    }

    return created;
  });

  return NextResponse.json(order, { status: 201 });
});
