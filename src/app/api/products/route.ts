import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiRoute, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/auth";

// GET /api/products — mirrors Express GET "/" (active-only filter via ?active=true)
export const GET = apiRoute(async (request) => {
  await requireUser(request);

  const activeOnly = new URL(request.url).searchParams.get("active") === "true";
  const products = await prisma.product.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { name: "asc" },
    include: { recipeItems: { include: { ingredient: true } } },
  });
  return NextResponse.json(products);
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

// POST /api/products — mirrors Express POST "/"
export const POST = apiRoute(async (request) => {
  await requireUser(request);

  const data = await parseBody(request, productSchema);
  const product = await prisma.product.create({
    data: {
      name: data.name,
      description: data.description,
      category: data.category,
      price: data.price,
      isActive: data.isActive,
      imageUrl: data.imageUrl,
      recipeItems: { create: data.recipeItems },
    },
    include: { recipeItems: { include: { ingredient: true } } },
  });
  return NextResponse.json(product, { status: 201 });
});
