import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { apiRoute, parseBody, notFound } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { BATCH_PRIORITIES, BATCH_STAGES } from "../route";

const updateSchema = z.object({
  stage: z.enum(BATCH_STAGES).optional(),
  priority: z.enum(BATCH_PRIORITIES).optional(),
  quantity: z.number().int().positive().optional(),
  assignedTo: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const PATCH = apiRoute(async (request, context) => {
  await requireUser(request);
  const { id } = await context.params;
  const data = await parseBody(request, updateSchema);

  const existing = await prisma.bakeBatch.findUnique({ where: { id } });
  if (!existing) notFound("Batch");

  const batch = await prisma.bakeBatch.update({
    where: { id },
    data: {
      ...data,
      dueDate: data.dueDate === undefined ? undefined : data.dueDate ? new Date(data.dueDate) : null,
    },
    include: {
      product: { select: { id: true, name: true, category: true, imageUrl: true } },
      assignee: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(batch);
});

export const DELETE = apiRoute(async (request, context) => {
  await requireUser(request);
  const { id } = await context.params;
  await prisma.bakeBatch.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
});
