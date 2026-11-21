import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/http";
import { TOKEN_COOKIE } from "@/lib/auth";

export const POST = apiRoute(async () => {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(TOKEN_COOKIE);
  return response;
});
