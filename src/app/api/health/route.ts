import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/http";

export const GET = apiRoute(async () => {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
});
