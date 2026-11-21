import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiRoute, parseBody, notFound } from "@/lib/http";
import { requireUser } from "@/lib/auth";

// GET /api/products/:id — mirrors Express GET "/:id"
export const GET = apiRoute(async (request, { params }) => {
  await requireUser(request);
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { recipeItems: { include: { ingredient: true } } },
  });
  if (!product) notFound("Product");

  // Compute recipe cost and how many units can currently be made given ingredient stock.
  const recipeCost = product.recipeItems.reduce(
    (sum, item) => sum + item.quantity * item.ingredient.costPerUnit,
    0
  );
  const maxMakeable =
    product.recipeItems.length === 0
      ? null
      : Math.min(
          ...product.recipeItems.map((item) =>
            item.quantity > 0 ? Math.floor(item.ingredient.quantityInStock / item.quantity) : Infinity
          )
        );

  return NextResponse.json({ ...product, recipeCost, maxMakeable });
});

const recipeItemSchema = z.object({
  ingredientId: z.string().min(1),
  quantity: z.number().positive(),
});

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().default("General"),
  price: z.number().nonnegative(),
  isActive: z.boolean().default(true),
  imageUrl: z.string().optional(),
  recipeItems: z.array(recipeItemSchema).default([]),
});

// PUT /api/products/:id — mirrors Express PUT "/:id"
export const PUT = apiRoute(async (request, { params }) => {
  await requireUser(request);
  const { id } = await params;

  const data = await parseBody(request, productSchema.partial());
  const { recipeItems, ...rest } = data;

  const product = await prisma.$transaction(async (tx) => {
    if (recipeItems) {
      await tx.recipeItem.deleteMany({ where: { productId: id } });
      await tx.recipeItem.createMany({
        data: recipeItems.map((r) => ({ ...r, productId: id })),
      });
    }
    return tx.product.update({
      where: { id },
      data: rest,
      include: { recipeItems: { include: { ingredient: true } } },
    });
  });

  return NextResponse.json(product);
});

// DELETE /api/products/:id — mirrors Express DELETE "/:id"
export const DELETE = apiRoute(async (request, { params }) => {
  await requireUser(request);
  const { id } = await params;

  const inUse = await prisma.orderItem.count({ where: { productId: id } });
  if (inUse > 0) {
    // Preserve order history: soft-delete instead of hard delete.
    const product = await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ ...product, softDeleted: true });
  }
  await prisma.recipeItem.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
});
