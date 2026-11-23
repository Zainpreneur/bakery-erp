import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { apiRoute, parseBody } from "@/lib/http";
import { requireUser } from "@/lib/auth";

export const BATCH_STAGES = ["PLANNED", "MIXING", "BAKING", "COOLING", "READY", "DONE"] as const;
export const BATCH_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

const batchSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  stage: z.enum(BATCH_STAGES).default("PLANNED"),
  priority: z.enum(BATCH_PRIORITIES).default("NORMAL"),
  assignedTo: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

async function generateBatchNumber() {
  const count = await prisma.bakeBatch.count();
  const year = new Date().getFullYear();
  return `BATCH-${year}-${String(count + 1).padStart(4, "0")}`;
}

export const GET = apiRoute(async (request) => {
  await requireUser(request);
  const batches = await prisma.bakeBatch.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { id: true, name: true, category: true, imageUrl: true } },
      assignee: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(batches);
});

export const POST = apiRoute(async (request) => {
  const user = await requireUser(request);
  const data = await parseBody(request, batchSchema);

  const product = await prisma.product.findUnique({ where: { id: data.productId } });
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const batch = await prisma.bakeBatch.create({
    data: {
      batchNumber: await generateBatchNumber(),
      productId: data.productId,
      quantity: data.quantity,
      stage: data.stage,
      priority: data.priority,
      assignedTo: data.assignedTo || user.sub,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      notes: data.notes || null,
    },
    include: {
      product: { select: { id: true, name: true, category: true, imageUrl: true } },
      assignee: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(batch, { status: 201 });
});
