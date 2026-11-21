import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiRoute, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/auth";

// GET /api/ingredients — mirrors Express GET "/" (low-stock filter via ?lowStock=true)
export const GET = apiRoute(async (request) => {
  await requireUser(request);

  const lowStockOnly = new URL(request.url).searchParams.get("lowStock") === "true";
  const ingredients = await prisma.ingredient.findMany({
    where: undefined,
    orderBy: { name: "asc" },
    include: { supplier: true },
  });
  const result = lowStockOnly
    ? ingredients.filter((i) => i.quantityInStock <= i.reorderThreshold)
    : ingredients;
  return NextResponse.json(result);
});

const ingredientSchema = z.object({
  name: z.string().min(1),
  unit: z.string().min(1),
  costPerUnit: z.number().nonnegative().default(0),
  quantityInStock: z.number().nonnegative().default(0),
  reorderThreshold: z.number().nonnegative().default(0),
  supplierId: z.string().nullable().optional(),
});

// POST /api/ingredients — mirrors Express POST "/"
export const POST = apiRoute(async (request) => {
  await requireUser(request);

  const data = await parseBody(request, ingredientSchema);
  const ingredient = await prisma.ingredient.create({ data });
  return NextResponse.json(ingredient, { status: 201 });
});
