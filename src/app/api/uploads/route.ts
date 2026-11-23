import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { apiRoute, HttpError } from "@/lib/http";
import { saveUpload } from "@/lib/uploads";

export const runtime = "nodejs";

export const POST = apiRoute(async (request) => {
  await requireUser(request);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new HttpError(400, "Expected multipart form data.");
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    throw new HttpError(400, "Choose an image to upload.");
  }

  try {
    const url = await saveUpload(file);
    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    throw new HttpError(400, error instanceof Error ? error.message : "Upload failed.");
  }
});
