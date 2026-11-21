import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiRoute, parseBody } from "@/lib/http";

const expenseSchema = z.object({
  category: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().positive(),
  date: z.string().optional(),
});

export const GET = apiRoute(async (request) => {
  await requireUser(request);

  const expenses = await prisma.expense.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json(expenses);
});

export const POST = apiRoute(async (request) => {
  await requireUser(request);

  const data = await parseBody(request, expenseSchema);
  const expense = await prisma.expense.create({
    data: { ...data, date: data.date ? new Date(data.date) : new Date() },
  });
  return NextResponse.json(expense, { status: 201 });
});
