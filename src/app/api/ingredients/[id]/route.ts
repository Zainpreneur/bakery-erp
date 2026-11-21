import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiRoute, parseBody, HttpError, notFound } from "@/lib/http";
import { requireUser } from "@/lib/auth";

// GET /api/ingredients/:id — mirrors Express GET "/:id"
export const GET = apiRoute(async (request, { params }) => {
  await requireUser(request);
  const { id } = await params;

  const ingredient = await prisma.ingredient.findUnique({
    where: { id },
    include: {
      supplier: true,
      transactions: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });
  if (!ingredient) notFound("Ingredient");
  return NextResponse.json(ingredient);
});

const ingredientSchema = z.object({
  name: z.string().min(1),
  unit: z.string().min(1),
  costPerUnit: z.number().nonnegative().default(0),
  quantityInStock: z.number().nonnegative().default(0),
  reorderThreshold: z.number().nonnegative().default(0),
  supplierId: z.string().nullable().optional(),
});

// PUT /api/ingredients/:id — mirrors Express PUT "/:id"
export const PUT = apiRoute(async (request, { params }) => {
  await requireUser(request);
  const { id } = await params;

  const data = await parseBody(request, ingredientSchema.partial());
  const ingredient = await prisma.ingredient.update({ where: { id }, data });
  return NextResponse.json(ingredient);
});

// DELETE /api/ingredients/:id — mirrors Express DELETE "/:id"
export const DELETE = apiRoute(async (request, { params }) => {
  await requireUser(request);
  const { id } = await params;

  const inUse = await prisma.recipeItem.count({ where: { ingredientId: id } });
  if (inUse > 0) throw new HttpError(409, "Cannot delete an ingredient used in recipes");
  await prisma.ingredient.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
});
