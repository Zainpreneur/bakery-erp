import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { apiRoute, HttpError } from "@/lib/http";
import { contentTypeForFilename, readUpload } from "@/lib/uploads";

export const runtime = "nodejs";

export const GET = apiRoute(async (request, context) => {
  await requireUser(request);
  const { filename } = await context.params;

  const bytes = await readUpload(filename);
  if (!bytes) throw new HttpError(404, "Image not found.");

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": contentTypeForFilename(filename) ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
