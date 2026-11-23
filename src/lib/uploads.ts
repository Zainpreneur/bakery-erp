import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads");

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export function extensionForMime(mime: string): string | null {
  return ALLOWED[mime] ?? null;
}

export function contentTypeForFilename(filename: string): string | null {
  const extension = path.extname(filename).toLowerCase().slice(1);
  const match = Object.entries(ALLOWED).find(([, ext]) => ext === extension);
  return match?.[0] ?? null;
}

export function isSafeFilename(filename: string): boolean {
  return /^[a-f0-9-]+\.(jpg|png|webp|gif)$/i.test(filename);
}

export async function saveUpload(file: File): Promise<string> {
  const extension = extensionForMime(file.type);
  if (!extension) {
    throw new Error("Only JPG, PNG, WebP and GIF images are supported.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Images must be 5 MB or smaller.");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}.${extension}`;
  await writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(await file.arrayBuffer()));
  return `/api/uploads/${filename}`;
}

export async function readUpload(filename: string): Promise<Buffer | null> {
  if (!isSafeFilename(filename)) return null;
  try {
    return await readFile(path.join(UPLOAD_DIR, filename));
  } catch {
    return null;
  }
}
